const TOKEN_RE = /^[A-Za-z0-9._-]{1,128}$/;
const INVOICE_RE = /^[A-Za-z0-9._-]{1,30}$/;
const UTC_ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const SIG_RE = /^HMACSHA256=[A-Za-z0-9+/]{43}=$/;
const CHECKOUT_PATH_RE = /^\/checkout(?:-link(?:-v2)?|\/link)\/[A-Za-z0-9_-]+$/;

const PROD_CHECKOUT_HOSTS = new Set(['jokul.doku.com', 'checkout.doku.com', 'pay.doku.com']);
const SANDBOX_CHECKOUT_HOSTS = new Set(['staging.doku.com', 'sandbox.doku.com']);

const encoder = new TextEncoder();

function toBytes(input) {
  if (input instanceof Uint8Array) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }
  if (typeof input === 'string') {
    return encoder.encode(input);
  }
  throw new TypeError('Expected Uint8Array, ArrayBuffer, or string');
}

function bytesToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function bytesToHex(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

export async function sha256Base64(input) {
  const hash = await crypto.subtle.digest('SHA-256', toBytes(input));
  return bytesToBase64(new Uint8Array(hash));
}

export async function sha256Hex(input) {
  const hash = await crypto.subtle.digest('SHA-256', toBytes(input));
  return bytesToHex(new Uint8Array(hash));
}

export async function hmacSha256Base64(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return bytesToBase64(new Uint8Array(sig));
}

export function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i += 1) {
    diff |= ab[i] ^ bb[i];
  }
  return diff === 0;
}

export function formatUtcIso(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function isValidUtcIso(value) {
  if (typeof value !== 'string' || !UTC_ISO_RE.test(value)) return false;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === value.replace('Z', '.000Z');
}

export function getHeaderValue(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === 'function') {
    const val = headers.get(name);
    return typeof val === 'string' && val.trim().length > 0 ? val.trim() : null;
  }
  const target = name.toLowerCase();
  const matches = Object.entries(headers).filter(([k]) => k.toLowerCase() === target);
  if (matches.length !== 1) return null;
  const val = matches[0][1];
  return typeof val === 'string' && val.trim().length > 0 ? val.trim() : null;
}

export function listSafeHeaderNames(headers) {
  const allowed = new Set([
    'client-id',
    'request-id',
    'request-timestamp',
    'response-timestamp',
    'signature',
    'content-type',
  ]);
  const names = [];
  if (!headers) return names;
  const iter = typeof headers.keys === 'function' ? headers.keys() : Object.keys(headers);
  for (const key of iter) {
    const lower = String(key).toLowerCase();
    if (allowed.has(lower)) names.push(lower);
  }
  return names.sort();
}

export async function signDokuRequest({ clientId, requestId, timestamp, target, rawBody }, secret) {
  if (!TOKEN_RE.test(clientId || '') || !TOKEN_RE.test(requestId || '')) {
    throw new Error('INVALID_SIGNING_IDS');
  }
  if (!isValidUtcIso(timestamp)) {
    throw new Error('INVALID_TIMESTAMP');
  }
  if (typeof target !== 'string' || !/^\/[A-Za-z0-9/_-]+$/.test(target)) {
    throw new Error('INVALID_TARGET');
  }
  if (typeof secret !== 'string' || secret.length === 0) {
    throw new Error('SECRET_REQUIRED');
  }

  const lines = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${timestamp}`,
    `Request-Target:${target}`,
  ];
  if (rawBody !== undefined) {
    lines.push(`Digest:${await sha256Base64(rawBody)}`);
  }
  const mac = await hmacSha256Base64(secret, lines.join('\n'));
  return `HMACSHA256=${mac}`;
}

export function validateCheckoutUrl(rawUrl, envMode = 'production') {
  if (typeof rawUrl !== 'string' || rawUrl.length === 0) return null;
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || parsed.port !== '' || parsed.username !== '' || parsed.password !== '') {
    return null;
  }
  if (parsed.search !== '' || parsed.hash !== '') {
    return null;
  }
  const hosts = envMode === 'sandbox' ? SANDBOX_CHECKOUT_HOSTS : PROD_CHECKOUT_HOSTS;
  if (!hosts.has(parsed.hostname)) {
    return null;
  }
  if (!CHECKOUT_PATH_RE.test(parsed.pathname)) {
    return null;
  }
  return parsed.href;
}

export async function verifyDokuResponse(
  { clientId, requestId, target = '/checkout/v1/payment', status, headers, rawBody, expectedInvoice, expectedAmountIdr, envMode = 'production' },
  secret
) {
  const headerNames = listSafeHeaderNames(headers);
  if (status !== 200) {
    return { ok: false, reasonCode: 'HTTP_STATUS_NOT_200', headerNames };
  }
  const bytes = toBytes(rawBody);
  if (bytes.byteLength === 0 || bytes.byteLength > 65536) {
    return { ok: false, reasonCode: 'RESPONSE_BODY_SIZE_INVALID', headerNames };
  }

  const resClientId = getHeaderValue(headers, 'Client-Id');
  const resRequestId = getHeaderValue(headers, 'Request-Id');
  const resTimestamp = getHeaderValue(headers, 'Response-Timestamp');
  const resSignature = getHeaderValue(headers, 'Signature');

  if (!resClientId || !resRequestId || !resTimestamp || !resSignature) {
    return { ok: false, reasonCode: 'MISSING_RESPONSE_HEADERS', headerNames };
  }
  if (resClientId !== clientId) {
    return { ok: false, reasonCode: 'CLIENT_ID_MISMATCH', headerNames };
  }
  if (resRequestId !== requestId) {
    return { ok: false, reasonCode: 'REQUEST_ID_MISMATCH', headerNames };
  }
  if (!isValidUtcIso(resTimestamp)) {
    return { ok: false, reasonCode: 'INVALID_RESPONSE_TIMESTAMP', headerNames };
  }
  if (!SIG_RE.test(resSignature)) {
    return { ok: false, reasonCode: 'SIGNATURE_FORMAT_INVALID', headerNames };
  }

  const digest = await sha256Base64(bytes);
  const component = [
    `Client-Id:${resClientId}`,
    `Request-Id:${resRequestId}`,
    `Response-Timestamp:${resTimestamp}`,
    `Request-Target:${target}`,
    `Digest:${digest}`,
  ].join('\n');

  const expectedSig = `HMACSHA256=${await hmacSha256Base64(secret, component)}`;
  if (!timingSafeEqualStr(resSignature, expectedSig)) {
    return { ok: false, reasonCode: 'SIGNATURE_MISMATCH', headerNames };
  }

  let parsed;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reasonCode: 'INVALID_JSON', headerNames };
  }

  const data = parsed?.response ?? parsed;
  if (data?.order?.invoice_number !== expectedInvoice) {
    return { ok: false, reasonCode: 'INVOICE_MISMATCH', headerNames };
  }
  const amountVal = Number(data?.order?.amount);
  if (!Number.isSafeInteger(amountVal) || amountVal !== expectedAmountIdr) {
    return { ok: false, reasonCode: 'AMOUNT_MISMATCH', headerNames };
  }

  const rawPaymentUrl = data?.payment?.url ?? data?.paymentUrl ?? data?.checkout_url;
  if (typeof rawPaymentUrl !== 'string') {
    return { ok: false, reasonCode: 'PAYMENT_URL_MISSING', headerNames };
  }
  const safeUrl = validateCheckoutUrl(rawPaymentUrl, envMode);
  if (!safeUrl) {
    return { ok: false, reasonCode: 'PAYMENT_URL_INVALID', headerNames };
  }

  return { ok: true, checkoutUrl: safeUrl, headerNames };
}

export function parsePositiveIntAmount(val) {
  if (typeof val === 'number') {
    return Number.isSafeInteger(val) && val > 0 ? val : null;
  }
  if (typeof val === 'string' && /^[1-9][0-9]{0,11}(?:\.0+)?$/.test(val.trim())) {
    const n = Number(val.trim());
    return Number.isSafeInteger(n) && n > 0 ? n : null;
  }
  return null;
}

export async function verifyDokuNotification(
  {
    clientId,
    notificationPath = '/doku/notifications',
    headers,
    rawBody,
    nowMs = Date.now(),
    maxAgeSeconds = 86400,
    maxFutureSkewSeconds = 300,
  },
  secret
) {
  const headerNames = listSafeHeaderNames(headers);
  const bytes = toBytes(rawBody);
  if (bytes.byteLength === 0 || bytes.byteLength > 65536) {
    return { ok: false, status: 400, reasonCode: 'INVALID_BODY_SIZE', headerNames };
  }

  const reqClientId = getHeaderValue(headers, 'Client-Id');
  const reqId = getHeaderValue(headers, 'Request-Id');
  const reqTimestamp = getHeaderValue(headers, 'Request-Timestamp');
  const reqSignature = getHeaderValue(headers, 'Signature');

  if (!reqClientId || !reqId || !reqTimestamp || !reqSignature) {
    return { ok: false, status: 401, reasonCode: 'MISSING_HEADERS', headerNames };
  }
  if (reqClientId !== clientId) {
    return { ok: false, status: 401, reasonCode: 'CLIENT_ID_MISMATCH', headerNames };
  }
  if (!TOKEN_RE.test(reqId) || !isValidUtcIso(reqTimestamp) || !SIG_RE.test(reqSignature)) {
    return { ok: false, status: 401, reasonCode: 'INVALID_AUTH_HEADER_FORMAT', headerNames };
  }
  const tsMs = Date.parse(reqTimestamp);
  if (tsMs - nowMs > maxFutureSkewSeconds * 1000 || nowMs - tsMs > maxAgeSeconds * 1000) {
    return { ok: false, status: 401, reasonCode: 'TIMESTAMP_OUT_OF_WINDOW', headerNames };
  }

  const expectedSig = await signDokuRequest(
    { clientId: reqClientId, requestId: reqId, timestamp: reqTimestamp, target: notificationPath, rawBody: bytes },
    secret
  );

  if (!timingSafeEqualStr(reqSignature, expectedSig)) {
    return { ok: false, status: 401, reasonCode: 'SIGNATURE_MISMATCH', headerNames };
  }

  let payload;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    payload = JSON.parse(text);
  } catch {
    return { ok: false, status: 400, reasonCode: 'INVALID_JSON', headerNames };
  }

  const invoice = payload?.order?.invoice_number;
  if (typeof invoice !== 'string' || !INVOICE_RE.test(invoice)) {
    return { ok: false, status: 400, reasonCode: 'INVALID_INVOICE', headerNames };
  }

  const currency = payload?.order?.currency;
  if (currency !== undefined && currency !== 'IDR') {
    return { ok: false, status: 400, reasonCode: 'INVALID_CURRENCY', headerNames };
  }

  const amountIdr = parsePositiveIntAmount(payload?.order?.amount);
  if (amountIdr === null) {
    return { ok: false, status: 400, reasonCode: 'INVALID_AMOUNT', headerNames };
  }

  const txStatus = typeof payload?.transaction?.status === 'string' ? payload.transaction.status.trim().toUpperCase() : '';
  if (!txStatus) {
    return { ok: false, status: 400, reasonCode: 'MISSING_TRANSACTION_STATUS', headerNames };
  }

  const txType = typeof payload?.transaction?.type === 'string' ? payload.transaction.type.trim().toUpperCase() : null;
  const channelId =
    (typeof payload?.channel?.id === 'string' && payload.channel.id.trim()) ||
    (typeof payload?.acquirer?.id === 'string' && payload.acquirer.id.trim()) ||
    (typeof payload?.service?.id === 'string' && payload.service.id.trim()) ||
    'DOKU';

  const payloadHash = await sha256Hex(bytes);
  const eventKey = `doku:${reqClientId}:${reqId}`;

  return {
    ok: true,
    eventKey,
    payloadHash,
    invoice,
    amountIdr,
    channelId: channelId.slice(0, 64),
    txStatus: txStatus.slice(0, 32),
    txType: txType ? txType.slice(0, 32) : null,
  };
}

export async function parseDokuStatusPayload(rawBody, expectedInvoice) {
  const bytes = toBytes(rawBody);
  if (bytes.byteLength === 0 || bytes.byteLength > 65536) {
    return { ok: false, reasonCode: 'RESPONSE_BODY_SIZE_INVALID' };
  }
  let payload;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    payload = JSON.parse(text);
  } catch {
    return { ok: false, reasonCode: 'INVALID_JSON' };
  }

  const invoice = payload?.order?.invoice_number;
  if (typeof invoice !== 'string' || !INVOICE_RE.test(invoice) || (expectedInvoice && invoice !== expectedInvoice)) {
    return { ok: false, reasonCode: 'INVALID_INVOICE' };
  }

  const currency = payload?.order?.currency;
  if (currency !== undefined && currency !== 'IDR') {
    return { ok: false, reasonCode: 'INVALID_CURRENCY' };
  }

  const amountIdr = parsePositiveIntAmount(payload?.order?.amount);
  if (amountIdr === null) {
    return { ok: false, reasonCode: 'INVALID_AMOUNT' };
  }

  const txStatus = typeof payload?.transaction?.status === 'string' ? payload.transaction.status.trim().toUpperCase() : '';
  if (!txStatus) {
    return { ok: false, reasonCode: 'MISSING_TRANSACTION_STATUS' };
  }

  const txType = typeof payload?.transaction?.type === 'string' ? payload.transaction.type.trim().toUpperCase() : null;
  const channelId =
    (typeof payload?.channel?.id === 'string' && payload.channel.id.trim()) ||
    (typeof payload?.acquirer?.id === 'string' && payload.acquirer.id.trim()) ||
    (typeof payload?.service?.id === 'string' && payload.service.id.trim()) ||
    'DOKU';

  return {
    ok: true,
    payloadHash: await sha256Hex(bytes),
    invoice,
    amountIdr,
    channelId: channelId.slice(0, 64),
    txStatus: txStatus.slice(0, 32),
    txType: txType ? txType.slice(0, 32) : null,
  };
}
