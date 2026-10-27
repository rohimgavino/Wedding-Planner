// Node-only, intentionally outside src/ and the Next static export.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}
function token(value, max = 128) {
  return typeof value === 'string' && value.length > 0 && value.length <= max && /^[A-Za-z0-9._-]+$/.test(value);
}
function timestamp(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value.replace('Z', '.000Z');
}
function target(value) {
  return typeof value === 'string' && /^\/[A-Za-z0-9/_-]+$/.test(value);
}
export function signRequest(metadata, rawBody, secret) {
  requireValue(token(metadata.clientId) && token(metadata.requestId) && timestamp(metadata.timestamp) && target(metadata.target), 'invalid signing metadata');
  requireValue(typeof secret === 'string' && secret.length > 0, 'secret required');
  requireValue(rawBody === undefined || Buffer.isBuffer(rawBody), 'raw body must be Buffer');
  const lines = [`Client-Id:${metadata.clientId}`, `Request-Id:${metadata.requestId}`, `Request-Timestamp:${metadata.timestamp}`, `Request-Target:${metadata.target}`];
  if (rawBody !== undefined) lines.push(`Digest:${createHash('sha256').update(rawBody).digest('base64')}`);
  return `HMACSHA256=${createHmac('sha256', secret).update(lines.join('\n'), 'utf8').digest('base64')}`;
}
function sandbox(config) {
  requireValue(config?.enabled === true && config.environment === 'sandbox', 'sandbox explicitly enabled required');
  requireValue(token(config.clientId) && typeof config.secret === 'string' && config.secret.length > 0 && target(config.notificationPath), 'invalid sandbox config');
  requireValue(config.baseUrl === undefined && config.production === undefined, 'endpoint overrides forbidden');
}
function orderSnapshot(order) {
  requireValue(order?.environment === 'sandbox' && token(order.invoice, 30) && token(order.requestId) && token(order.workspaceId) && Number.isSafeInteger(order.amount) && order.amount > 0 && order.currency === 'IDR' && typeof order.packageVersion === 'string' && /^[1-9][0-9]{0,17}$/.test(order.packageVersion) && typeof order.packageAmountIdr === 'string' && /^[1-9][0-9]{0,15}$/.test(order.packageAmountIdr) && order.packageAmountIdr === String(order.amount) && order.durationUnit === 'calendar_year' && order.durationCount === 1 && order.workspaceCount === 1, 'invalid trusted order snapshot');
}
function header(headers, name) {
  const matches = Object.entries(headers ?? {}).filter(([key]) => key.toLowerCase() === name.toLowerCase());
  requireValue(matches.length === 1 && typeof matches[0][1] === 'string', 'missing or duplicate header');
  return matches[0][1];
}
// Pure decision only: caller MUST hold transaction locks and enforce unique constraints.
export function classifyReceipt(event, { receipt, paymentExists }) {
  if (receipt) return receipt.payloadHash === event.payloadHash ? 'duplicate-event' : 'conflict';
  if (event.action !== 'sandbox-payment-candidate') return 'record-ignored';
  return paymentExists ? 'duplicate-payment' : 'record-candidate';
}
export async function sendSandboxCheckout(config, order, time, transport) {
  sandbox(config);
  orderSnapshot(order);
  requireValue(typeof transport === 'function', 'explicit transport required');
  const rawBody = Buffer.from(JSON.stringify({ order: { amount: order.amount, invoice_number: order.invoice, currency: 'IDR', auto_redirect: false }, payment: { payment_due_date: 60, type: 'SALE', payment_method_types: ['VIRTUAL_ACCOUNT_BCA'] } }));
  const metadata = { clientId: config.clientId, requestId: order.requestId, timestamp: time, target: '/checkout/v1/payment' };
  const response = await transport({ url: 'https://api-sandbox.doku.com/checkout/v1/payment', method: 'POST', rawBody,
    headers: { 'Client-Id': config.clientId, 'Request-Id': order.requestId, 'Request-Timestamp': time, 'Content-Type': 'application/json', Signature: signRequest(metadata, rawBody, config.secret) } });
  requireValue(Number.isInteger(response?.status) && response.status >= 100 && response.status <= 599, 'invalid transport response');
  // No URL/token/body is returned or trusted; signed response verification is a future gate.
  return { outcome: 'unverified-sandbox-response', httpStatus: response.status, grantsAccess: false };
}
export function inspectNotification(config, request, expectedOrder) {
  sandbox(config);
  orderSnapshot(expectedOrder);
  requireValue(request.method === 'POST' && request.path === config.notificationPath, 'wrong notification route');
  requireValue(Buffer.isBuffer(request.rawBody) && request.rawBody.length > 0 && request.rawBody.length <= 65536, 'invalid raw payload');
  const clientId = header(request.headers, 'Client-Id');
  const requestId = header(request.headers, 'Request-Id');
  const time = header(request.headers, 'Request-Timestamp');
  requireValue(clientId === config.clientId, 'merchant mismatch');
  const received = header(request.headers, 'Signature');
  requireValue(/^HMACSHA256=[A-Za-z0-9+/]{43}=$/.test(received), 'invalid signature format');
  const expected = signRequest({ clientId, requestId, timestamp: time, target: config.notificationPath }, request.rawBody, config.secret);
  requireValue(timingSafeEqual(Buffer.from(received), Buffer.from(expected)), 'signature mismatch');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(request.rawBody);
  const payload = JSON.parse(text);
  requireValue(payload?.order?.invoice_number === expectedOrder.invoice, 'invoice mismatch');
  // DOKU channel examples use both integer JSON numbers and canonical digit strings.
  const amount = payload.order.amount;
  requireValue((typeof amount === 'number' && Number.isSafeInteger(amount) && amount === expectedOrder.amount) || amount === String(expectedOrder.amount), 'amount mismatch');
  requireValue(payload.order.currency === undefined || payload.order.currency === 'IDR', 'currency mismatch');
  requireValue(payload.transaction?.original_request_id === expectedOrder.requestId, 'original request mismatch');
  requireValue(timestamp(payload.transaction.date), 'invalid transaction date');
  const status = payload.transaction.status;
  const action = status === 'SUCCESS' && (payload.transaction.type === undefined || payload.transaction.type === 'SALE') ? 'sandbox-payment-candidate' : 'ignore';
  return Object.freeze({ action, grantsAccess: false, invoice: expectedOrder.invoice, workspaceId: expectedOrder.workspaceId,
    receiptKey: `sandbox:${clientId}:${requestId}`, paymentKey: `sandbox:${clientId}:${expectedOrder.invoice}`,
    payloadHash: createHash('sha256').update(request.rawBody).digest('hex') });
}
