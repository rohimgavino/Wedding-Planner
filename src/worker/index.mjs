import {
  formatUtcIso,
  signDokuRequest,
  verifyDokuNotification,
  verifyDokuResponse,
} from './doku-crypto.mjs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_PACKAGES = new Set(['starter', 'premium', 'wedding_pro']);
const PACKAGE_METADATA = {
  starter: {
    name: 'Starter',
    description: 'Awal yang lebih terarah untuk merapikan rencana inti berdua.',
    features: [
      '1 wedding workspace berdua',
      'Checklist persiapan & timeline',
      'Anggaran, tabungan & daftar tamu',
    ],
  },
  premium: {
    name: 'Premium',
    description: 'Ruang lengkap untuk setiap detail acara bersama pasangan.',
    features: [
      'Seluruh fitur Starter',
      'Kolaborasi pasangan real-time',
      'Prioritas pembaruan fitur undangan',
    ],
  },
  wedding_pro: {
    name: 'Wedding Pro',
    description: 'Kapasitas penuh untuk persiapan menyeluruh hingga hari H.',
    features: [
      'Seluruh fitur Premium',
      'Dukungan perencanaan menyeluruh',
      'Akses penuh selama 365 hari',
    ],
  },
};

function normalizeCatalogPackage(raw, salesEnabled, dokuConfigured) {
  const id = String(raw?.id || raw?.package_id || '');
  const meta = PACKAGE_METADATA[id] || {
    name: id || 'Paket',
    description: 'Paket aktivasi workspace Pocket Planner.',
    features: [],
  };
  const baseNum = raw?.base_amount_idr != null ? Number(raw.base_amount_idr) : null;
  const priceNum = Number(raw?.price_idr ?? raw?.effective_amount_idr ?? raw?.base_amount_idr ?? 0);
  const durationDays = Number(raw?.duration_days ?? 365);
  const priceEligible = raw?.price_eligible !== false && Number.isFinite(priceNum) && priceNum > 0;
  return {
    id,
    name: typeof raw?.name === 'string' && raw.name ? raw.name : meta.name,
    description: typeof raw?.description === 'string' && raw.description ? raw.description : meta.description,
    base_amount_idr: Number.isFinite(baseNum) ? baseNum : null,
    price_idr: Number.isFinite(priceNum) ? priceNum : 0,
    duration_days: Number.isFinite(durationDays) && durationDays > 0 ? durationDays : 365,
    features: Array.isArray(raw?.features) ? raw.features : meta.features,
    promo_active: Boolean(raw?.promo_active),
    checkout_eligible: Boolean(salesEnabled && dokuConfigured && priceEligible),
  };
}
const DOKU_CHECKOUT_TARGET = '/checkout/v1/payment';
const DOKU_NOTIFICATION_TARGET = '/doku/notifications';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function getDokuBaseUrl(env) {
  return env?.DOKU_ENV === 'sandbox'
    ? 'https://api-sandbox.doku.com'
    : 'https://api.doku.com';
}

function randomInvoice() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return `pp-${hex}`;
}

function getBearerToken(request) {
  const auth = request.headers.get('Authorization') || '';
  const m = /^Bearer\s+([A-Za-z0-9._-]+)$/.exec(auth.trim());
  return m ? m[1] : null;
}

async function fetchSupabaseUser(env, accessToken, fetchImpl = fetch) {
  const res = await fetchImpl(`${env.SUPABASE_URL}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) return null;
  const user = await res.json().catch(() => null);
  if (!user || typeof user.id !== 'string' || !UUID_RE.test(user.id)) return null;
  return user;
}

async function callSupabaseRpc(env, fnName, params, bearerKey, fetchImpl = fetch) {
  const res = await fetchImpl(`${env.SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_ANON_KEY || bearerKey,
      Authorization: `Bearer ${bearerKey}`,
    },
    body: JSON.stringify(params ?? {}),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }
  return { ok: res.ok, status: res.status, data };
}

function hasSupabaseConfig(env) {
  return Boolean(env?.SUPABASE_URL && env?.SUPABASE_ANON_KEY);
}

function hasPaymentSecrets(env) {
  return Boolean(
    hasSupabaseConfig(env) &&
      env?.SUPABASE_SERVICE_ROLE_KEY &&
      env?.DOKU_CLIENT_ID &&
      env?.DOKU_SECRET_KEY
  );
}

async function handleCatalog(env, fetchImpl) {
  if (!hasSupabaseConfig(env)) {
    return jsonResponse({ error: 'CONFIG_MISSING' }, 503);
  }
  const rpc = await callSupabaseRpc(env, 'public_tier_catalog', {}, env.SUPABASE_ANON_KEY, fetchImpl);
  if (!rpc.ok || !rpc.data) {
    return jsonResponse({ error: 'CATALOG_UNAVAILABLE' }, 502);
  }
  const salesEnabled = Boolean(rpc.data.sales_enabled);
  const dokuConfigured = Boolean(env?.DOKU_CLIENT_ID && env?.DOKU_SECRET_KEY && env?.SUPABASE_SERVICE_ROLE_KEY);
  const rawPackages = Array.isArray(rpc.data.packages) ? rpc.data.packages : [];
  return jsonResponse({
    salesEnabled,
    supportEmail: rpc.data.support_email || null,
    serverNow: rpc.data.server_now || null,
    packages: rawPackages.map((pkg) => normalizeCatalogPackage(pkg, salesEnabled, dokuConfigured)),
    dokuConfigured,
  });
}

async function handleStatus(request, env, fetchImpl) {
  if (!hasSupabaseConfig(env)) {
    return jsonResponse({ error: 'CONFIG_MISSING' }, 503);
  }
  const token = getBearerToken(request);
  if (!token) {
    return jsonResponse({ error: 'UNAUTHORIZED' }, 401);
  }
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get('workspace_id') || '';
  if (!UUID_RE.test(workspaceId)) {
    return jsonResponse({ error: 'INVALID_WORKSPACE_ID' }, 400);
  }

  const user = await fetchSupabaseUser(env, token, fetchImpl);
  if (!user) {
    return jsonResponse({ error: 'UNAUTHORIZED' }, 401);
  }

  const rpc = await callSupabaseRpc(
    env,
    'doku_workspace_orders',
    { p_workspace_id: workspaceId },
    token,
    fetchImpl
  );
  if (!rpc.ok) {
    const msg = rpc.data?.message || '';
    if (msg.includes('workspace_membership_required')) {
      return jsonResponse({ error: 'FORBIDDEN' }, 403);
    }
    return jsonResponse({ error: 'STATUS_QUERY_FAILED' }, 502);
  }
  return jsonResponse({
    orders: Array.isArray(rpc.data?.orders) ? rpc.data.orders : [],
    entitlements: Array.isArray(rpc.data?.entitlements) ? rpc.data.entitlements : [],
  });
}

async function handleCheckout(request, env, fetchImpl) {
  if (!hasPaymentSecrets(env)) {
    return jsonResponse(
      { error: 'PAYMENT_NOT_CONFIGURED', message: 'Konfigurasi pembayaran belum aktif.' },
      503
    );
  }

  const token = getBearerToken(request);
  if (!token) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Silakan login terlebih dahulu.' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'INVALID_JSON' }, 400);
  }

  const workspaceId = typeof body?.workspaceId === 'string' ? body.workspaceId.trim() : '';
  const packageId = typeof body?.packageId === 'string' ? body.packageId.trim() : '';
  if (!UUID_RE.test(workspaceId) || !VALID_PACKAGES.has(packageId)) {
    return jsonResponse({ error: 'INVALID_REQUEST', message: 'Workspace atau paket tidak valid.' }, 400);
  }

  const user = await fetchSupabaseUser(env, token, fetchImpl);
  if (!user) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Sesi login tidak valid.' }, 401);
  }

  const invoice = randomInvoice();
  const requestId = crypto.randomUUID();
  const reserve = await callSupabaseRpc(
    env,
    'doku_reserve_order',
    {
      p_workspace_id: workspaceId,
      p_payer_id: user.id,
      p_package_id: packageId,
      p_invoice: invoice,
      p_request_id: requestId,
    },
    env.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl
  );

  if (!reserve.ok) {
    const msg = reserve.data?.message || '';
    if (msg.includes('sales_disabled')) {
      return jsonResponse({ error: 'SALES_DISABLED', message: 'Penjualan saat ini belum dibuka.' }, 503);
    }
    if (msg.includes('workspace_membership_required')) {
      return jsonResponse({ error: 'FORBIDDEN', message: 'Anda bukan anggota workspace ini.' }, 403);
    }
    return jsonResponse({ error: 'RESERVE_FAILED', message: 'Gagal membuat pesanan.' }, 502);
  }

  const outcome = reserve.data?.outcome;
  const order = reserve.data?.order;

  if (outcome === 'already_active') {
    return jsonResponse({ status: 'already_active', message: 'Paket ini sudah aktif di workspace Anda.' });
  }
  if (outcome === 'unresolved_unknown') {
    return jsonResponse(
      {
        error: 'UNRESOLVED_ORDER',
        invoice: order?.invoice || null,
        message: 'Ada transaksi sebelumnya yang sedang menunggu konfirmasi. Muat ulang status atau hubungi dukungan.',
      },
      409
    );
  }
  if (outcome === 'existing' && order?.checkout_url) {
    return jsonResponse({
      status: 'checkout_ready',
      invoice: order.invoice,
      packageId: order.package_id,
      amountIdr: order.amount_idr,
      checkoutUrl: order.checkout_url,
      expiresAt: order.expires_at,
      reused: true,
    });
  }
  if (outcome !== 'reserved' || !order?.invoice) {
    return jsonResponse({ error: 'RESERVE_UNEXPECTED' }, 502);
  }

  const origin = new URL(request.url).origin;
  const dokuPayload = {
    order: {
      amount: order.amount_idr,
      invoice_number: order.invoice,
      callback_url: `${origin}/purchase?invoice=${encodeURIComponent(order.invoice)}`,
      callback_url_cancel: `${origin}/purchase?invoice=${encodeURIComponent(order.invoice)}&canceled=1`,
      auto_redirect: true,
    },
    payment: {
      payment_due_date: 60,
    },
    customer: {
      id: user.id,
      ...(typeof user.email === 'string' && user.email ? { email: user.email } : {}),
    },
  };

  const rawBody = new TextEncoder().encode(JSON.stringify(dokuPayload));
  const timestamp = formatUtcIso();
  const signature = await signDokuRequest(
    {
      clientId: env.DOKU_CLIENT_ID,
      requestId: order.request_id,
      timestamp,
      target: DOKU_CHECKOUT_TARGET,
      rawBody,
    },
    env.DOKU_SECRET_KEY
  );

  let dokuResp;
  try {
    dokuResp = await fetchImpl(`${getDokuBaseUrl(env)}${DOKU_CHECKOUT_TARGET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': env.DOKU_CLIENT_ID,
        'Request-Id': order.request_id,
        'Request-Timestamp': timestamp,
        Signature: signature,
      },
      body: rawBody,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    await callSupabaseRpc(
      env,
      'doku_set_order_result',
      {
        p_invoice: order.invoice,
        p_status: 'unknown',
        p_http_status: null,
        p_error_code: 'TRANSPORT_ERROR',
      },
      env.SUPABASE_SERVICE_ROLE_KEY,
      fetchImpl
    );
    return jsonResponse(
      {
        error: 'CHECKOUT_TRANSPORT_ERROR',
        invoice: order.invoice,
        message: 'Koneksi ke gateway pembayaran terputus. Mohon cek status pesanan sebelum mencoba ulang.',
      },
      502
    );
  }

  const respBytes = new Uint8Array(await dokuResp.arrayBuffer());
  if (dokuResp.status >= 400 && dokuResp.status < 500 && dokuResp.status !== 408 && dokuResp.status !== 429) {
    let safeDetail = null;
    try {
      const errJson = JSON.parse(new TextDecoder().decode(respBytes));
      const msgs = Array.isArray(errJson?.error?.message)
        ? errJson.error.message
        : Array.isArray(errJson?.message)
          ? errJson.message
          : typeof errJson?.error_description === 'string'
            ? [errJson.error_description]
            : null;
      if (msgs) {
        safeDetail = msgs
          .slice(0, 3)
          .map((m) => String(m).replace(/https?:\/\/\S+/gi, '[url]').slice(0, 120))
          .join('; ');
      }
    } catch {
      // Abaikan body non-JSON
    }
    await callSupabaseRpc(
      env,
      'doku_set_order_result',
      {
        p_invoice: order.invoice,
        p_status: 'failed',
        p_http_status: dokuResp.status,
        p_error_code: `DOKU_HTTP_${dokuResp.status}`,
      },
      env.SUPABASE_SERVICE_ROLE_KEY,
      fetchImpl
    );
    return jsonResponse(
      {
        error: 'DOKU_REQUEST_REJECTED',
        invoice: order.invoice,
        httpStatus: dokuResp.status,
        message: safeDetail
          ? `Gateway pembayaran menolak permintaan checkout: ${safeDetail}`
          : 'Gateway pembayaran menolak permintaan checkout.',
      },
      502
    );
  }

  if (dokuResp.status >= 500 || dokuResp.status === 408 || dokuResp.status === 429) {
    await callSupabaseRpc(
      env,
      'doku_set_order_result',
      {
        p_invoice: order.invoice,
        p_status: 'unknown',
        p_http_status: dokuResp.status,
        p_error_code: `DOKU_HTTP_${dokuResp.status}`,
      },
      env.SUPABASE_SERVICE_ROLE_KEY,
      fetchImpl
    );
    return jsonResponse(
      {
        error: 'DOKU_UPSTREAM_ERROR',
        invoice: order.invoice,
        httpStatus: dokuResp.status,
        message: 'Gateway pembayaran sedang bermasalah. Mohon cek status pesanan sebelum mencoba ulang.',
      },
      502
    );
  }

  const envMode = env?.DOKU_ENV === 'sandbox' ? 'sandbox' : 'production';
  const verified = await verifyDokuResponse(
    {
      clientId: env.DOKU_CLIENT_ID,
      requestId: order.request_id,
      target: DOKU_CHECKOUT_TARGET,
      status: dokuResp.status,
      headers: dokuResp.headers,
      rawBody: respBytes,
      expectedInvoice: order.invoice,
      expectedAmountIdr: order.amount_idr,
      envMode,
    },
    env.DOKU_SECRET_KEY
  );

  if (!verified.ok) {
    await callSupabaseRpc(
      env,
      'doku_set_order_result',
      {
        p_invoice: order.invoice,
        p_status: 'unknown',
        p_http_status: dokuResp.status,
        p_error_code: verified.reasonCode,
      },
      env.SUPABASE_SERVICE_ROLE_KEY,
      fetchImpl
    );
    return jsonResponse(
      {
        error: verified.reasonCode,
        headerNames: verified.headerNames,
        invoice: order.invoice,
        message: 'Respons gateway pembayaran tidak lolos verifikasi keamanan.',
      },
      502
    );
  }

  const saved = await callSupabaseRpc(
    env,
    'doku_set_order_result',
    {
      p_invoice: order.invoice,
      p_status: 'checkout_ready',
      p_checkout_url: verified.checkoutUrl,
      p_http_status: dokuResp.status,
      p_error_code: null,
    },
    env.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl
  );

  if (!saved.ok) {
    return jsonResponse({ error: 'ORDER_SAVE_FAILED', invoice: order.invoice }, 502);
  }

  return jsonResponse({
    status: 'checkout_ready',
    invoice: order.invoice,
    packageId: order.package_id,
    amountIdr: order.amount_idr,
    checkoutUrl: verified.checkoutUrl,
    expiresAt: order.expires_at,
    reused: false,
  });
}

async function handleNotification(request, env, fetchImpl) {
  if (!hasPaymentSecrets(env)) {
    return jsonResponse({ error: 'PAYMENT_NOT_CONFIGURED' }, 503);
  }

  const rawBody = new Uint8Array(await request.arrayBuffer());
  const verified = await verifyDokuNotification(
    {
      clientId: env.DOKU_CLIENT_ID,
      notificationPath: DOKU_NOTIFICATION_TARGET,
      headers: request.headers,
      rawBody,
    },
    env.DOKU_SECRET_KEY
  );

  if (!verified.ok) {
    console.warn('DOKU notification rejected', {
      status: verified.status,
      reason: verified.reasonCode,
      headerNames: verified.headerNames,
    });
    return jsonResponse(
      { ok: false, error: verified.reasonCode, headerNames: verified.headerNames },
      verified.status || 401
    );
  }

  const applied = await callSupabaseRpc(
    env,
    'doku_apply_notification',
    {
      p_event_key: verified.eventKey,
      p_payload_hash: verified.payloadHash,
      p_invoice: verified.invoice,
      p_amount_idr: verified.amountIdr,
      p_channel_id: verified.channelId,
      p_tx_status: verified.txStatus,
      p_tx_type: verified.txType,
    },
    env.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl
  );

  if (!applied.ok) {
    return jsonResponse({ error: 'SETTLEMENT_FAILED' }, 500);
  }

  const outcome = applied.data?.outcome || 'ok';
  if (outcome === 'conflict') {
    return jsonResponse({ error: 'EVENT_CONFLICT' }, 409);
  }
  return jsonResponse({ status: 'ok', outcome });
}

export async function handleRequest(request, env, fetchImpl = fetch) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/payments/catalog') {
    if (request.method !== 'GET') return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
    return handleCatalog(env, fetchImpl);
  }

  if (path === '/api/payments/status') {
    if (request.method !== 'GET') return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
    return handleStatus(request, env, fetchImpl);
  }

  if (path === '/api/payments/checkout') {
    if (request.method !== 'POST') return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
    return handleCheckout(request, env, fetchImpl);
  }

  if (path === DOKU_NOTIFICATION_TARGET) {
    if (request.method !== 'POST') return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
    return handleNotification(request, env, fetchImpl);
  }

  if (env?.ASSETS) {
    return env.ASSETS.fetch(request);
  }
  return new Response('Not found', { status: 404 });
}

export default {
  fetch(request, env) {
    return handleRequest(request, env, fetch);
  },
};
