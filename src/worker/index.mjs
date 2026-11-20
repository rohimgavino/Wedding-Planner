import {
  formatUtcIso,
  parseDokuStatusPayload,
  signDokuRequest,
  verifyDokuNotification,
  verifyDokuResponse,
  verifyDokuStatusResponse,
} from './doku-crypto.mjs';
import {
  isMayarConfigured,
  createMayarPayment,
  handleMayarWebhook,
  MAYAR_WEBHOOK_TARGET,
} from './mayar.mjs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_PACKAGES = new Set(['starter', 'premium', 'wedding_pro']);
const PACKAGE_METADATA = {
  starter: {
    name: 'Starter',
    description: 'Solusi esensial untuk merapikan persiapan inti pernikahan berdua.',
    features: [
      '1 workspace kolaborasi berdua',
      'Checklist persiapan & berkas KUA',
      'Alokasi anggaran & status pengeluaran',
      'Buku tamu & RSVP via WhatsApp',
      'Undangan digital web & WhatsApp',
    ],
  },
  premium: {
    name: 'Premium',
    description: 'Ruang komprehensif dengan manajemen tabungan dan moodboard visual.',
    features: [
      'Seluruh fitur paket Starter',
      'Tabungan bersama & target berdua',
      'Moodboard visual & palet warna tema',
      'Preset inspirasi busana & dekorasi',
      'Prioritas pembaruan fitur',
    ],
  },
  wedding_pro: {
    name: 'Wedding Pro',
    description: 'Kapasitas terlengkap dari lamaran hingga bulan madu impian.',
    features: [
      'Seluruh fitur paket Premium & Starter',
      'Engagement / Lamaran planner resmi',
      'Checklist seserahan & angsul-angsul',
      'Honeymoon planner & itinerary harian',
      'Budgeting & tracking biaya honeymoon',
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
      ((env?.DOKU_CLIENT_ID && env?.DOKU_SECRET_KEY) || isMayarConfigured(env))
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
  const mayarConfigured = isMayarConfigured(env);
  const paymentReady = dokuConfigured || mayarConfigured;
  const rawPackages = Array.isArray(rpc.data.packages) ? rpc.data.packages : [];
  return jsonResponse({
    salesEnabled,
    supportEmail: rpc.data.support_email || null,
    serverNow: rpc.data.server_now || null,
    packages: rawPackages.map((pkg) => normalizeCatalogPackage(pkg, salesEnabled, paymentReady)),
    dokuConfigured: paymentReady,
    mayarConfigured,
    activeGateway: (env?.PAYMENT_GATEWAY === 'mayar' || (!dokuConfigured && mayarConfigured)) ? 'mayar' : 'doku',
  });
}

async function readDokuStatusBody(response) {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const buffer = new Uint8Array(65536);
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return buffer.subarray(0, size);
      if (value.byteLength > buffer.byteLength - size) {
        try { await reader.cancel(); } catch { /* ignore cancellation failure */ }
        return null;
      }
      buffer.set(value, size);
      size += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
}

async function syncPendingOrdersWithDoku(orders, env, fetchImpl) {
  if (!hasPaymentSecrets(env) || !Array.isArray(orders) || orders.length === 0) {
    return false;
  }
  const pending = orders
    .filter((o) => o && typeof o.invoice === 'string' && (o.status === 'checkout_ready' || o.status === 'unknown'))
    .slice(0, 3);
  if (pending.length === 0) return false;

  let changed = false;
  for (const ord of pending) {
    const target = `/orders/v1/status/${ord.invoice}`;
    const requestId = crypto.randomUUID();
    const timestamp = formatUtcIso();
    let signature;
    try {
      signature = await signDokuRequest(
        {
          clientId: env.DOKU_CLIENT_ID,
          requestId,
          timestamp,
          target,
        },
        env.DOKU_SECRET_KEY
      );
    } catch {
      continue;
    }

    let dokuResp;
    try {
      dokuResp = await fetchImpl(`${getDokuBaseUrl(env)}${target}`, {
        method: 'GET',
        headers: {
          'Client-Id': env.DOKU_CLIENT_ID,
          'Request-Id': requestId,
          'Request-Timestamp': timestamp,
          Signature: signature,
        },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      continue;
    }

    if (dokuResp.status !== 200) {
      try {
        await dokuResp.body?.cancel?.();
      } catch {
        // ignore cancel error
      }
      continue;
    }

    const authenticated = await verifyDokuStatusResponse({
      clientId: env.DOKU_CLIENT_ID, requestId, target,
      status: dokuResp.status, headers: dokuResp.headers,
    }, env.DOKU_SECRET_KEY);
    if (!authenticated.ok) {
      try { await dokuResp.body?.cancel(); } catch { /* ignore cancellation failure */ }
      continue;
    }
    let respBytes;
    try {
      respBytes = await readDokuStatusBody(dokuResp);
    } catch {
      // A failed/aborted provider stream must not prevent other invoices recovering.
      continue;
    }
    if (!respBytes) continue;
    const parsed = await parseDokuStatusPayload(respBytes, ord.invoice);
    if (!parsed.ok) continue;
    if (parsed.txStatus !== 'SUCCESS' && parsed.txStatus !== 'EXPIRED' && parsed.txStatus !== 'FAILED') {
      continue;
    }

    const applyRpc = await callSupabaseRpc(
      env,
      'doku_apply_notification',
      {
        p_event_key: `status-api:${ord.invoice}:${parsed.txStatus}:${parsed.amountIdr}`,
        p_payload_hash: parsed.payloadHash,
        p_invoice: parsed.invoice,
        p_amount_idr: parsed.amountIdr,
        p_channel_id: parsed.channelId,
        p_tx_status: parsed.txStatus,
        p_tx_type: parsed.txType,
      },
      env.SUPABASE_SERVICE_ROLE_KEY,
      fetchImpl
    );
    if (
      applyRpc.ok &&
      (applyRpc.data?.outcome === 'paid' ||
        applyRpc.data?.outcome === 'expired' ||
        applyRpc.data?.outcome === 'failed' ||
        applyRpc.data?.outcome === 'ignored')
    ) {
      changed = true;
    }
  }
  return changed;
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

  let rpc = await callSupabaseRpc(
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

  let orders = Array.isArray(rpc.data?.orders) ? rpc.data.orders : [];
  let entitlements = Array.isArray(rpc.data?.entitlements) ? rpc.data.entitlements : [];

  const changed = await syncPendingOrdersWithDoku(orders, env, fetchImpl);
  if (changed) {
    const refreshed = await callSupabaseRpc(
      env,
      'doku_workspace_orders',
      { p_workspace_id: workspaceId },
      token,
      fetchImpl
    );
    if (refreshed.ok) {
      orders = Array.isArray(refreshed.data?.orders) ? refreshed.data.orders : orders;
      entitlements = Array.isArray(refreshed.data?.entitlements) ? refreshed.data.entitlements : entitlements;
    }
  }

  return jsonResponse({ orders, entitlements });
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

  const voucherCode = typeof body?.voucherCode === 'string' ? body.voucherCode.trim() : '';
  if (voucherCode) {
    const vRes = await callSupabaseRpc(
      env,
      'apply_voucher_to_order',
      {
        p_invoice: order.invoice,
        p_code: voucherCode,
        p_workspace_id: workspaceId,
        p_package_id: packageId,
      },
      env.SUPABASE_SERVICE_ROLE_KEY,
      fetchImpl
    );
    if (vRes.ok && vRes.data?.valid && Number(vRes.data?.final_price_idr) > 0) {
      order.amount_idr = Number(vRes.data.final_price_idr);
    }
  }

  const origin = new URL(request.url).origin;
  const dokuConfigured = Boolean(env?.DOKU_CLIENT_ID && env?.DOKU_SECRET_KEY);
  const useMayar = env?.PAYMENT_GATEWAY === 'mayar' || (!dokuConfigured && isMayarConfigured(env));

  if (useMayar) {
    const mayarRes = await createMayarPayment({ env, order, user, origin, fetchImpl });
    if (!mayarRes.ok) {
      await callSupabaseRpc(
        env,
        'doku_set_order_result',
        {
          p_invoice: order.invoice,
          p_status: 'failed',
          p_http_status: 502,
          p_error_code: mayarRes.error || 'MAYAR_FAILED',
        },
        env.SUPABASE_SERVICE_ROLE_KEY,
        fetchImpl
      );
      return jsonResponse({ error: mayarRes.error, message: mayarRes.message }, 502);
    }

    const saved = await callSupabaseRpc(
      env,
      'doku_set_order_result',
      {
        p_invoice: order.invoice,
        p_status: 'checkout_ready',
        p_checkout_url: mayarRes.checkoutUrl,
        p_http_status: 200,
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
      checkoutUrl: mayarRes.checkoutUrl,
      expiresAt: order.expires_at,
      reused: false,
      gateway: 'mayar',
    });
  }

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

export function withSecurityHeaders(response) {
  if (!response) return response;
  const newHeaders = new Headers(response.headers);
  if (!newHeaders.has('X-Frame-Options')) {
    newHeaders.set('X-Frame-Options', 'DENY');
  }
  if (!newHeaders.has('X-Content-Type-Options')) {
    newHeaders.set('X-Content-Type-Options', 'nosniff');
  }
  if (!newHeaders.has('Referrer-Policy')) {
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  if (!newHeaders.has('Strict-Transport-Security')) {
    newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  if (!newHeaders.has('Permissions-Policy')) {
    newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export async function handleRequest(request, env, fetchImpl = fetch) {
  const url = new URL(request.url);
  const path = url.pathname;

  let response;
  if (path === '/api/payments/catalog') {
    if (request.method !== 'GET') response = jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
    else response = await handleCatalog(env, fetchImpl);
  } else if (path === '/api/payments/status') {
    if (request.method !== 'GET') response = jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
    else response = await handleStatus(request, env, fetchImpl);
  } else if (path === '/api/payments/checkout') {
    if (request.method !== 'POST') response = jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
    else response = await handleCheckout(request, env, fetchImpl);
  } else if (path === DOKU_NOTIFICATION_TARGET) {
    if (request.method !== 'POST') response = jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
    else response = await handleNotification(request, env, fetchImpl);
  } else if (path === MAYAR_WEBHOOK_TARGET || path === '/mayar/notifications') {
    if (request.method !== 'POST') response = jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
    else response = await handleMayarWebhook(request, env, fetchImpl, callSupabaseRpc);
  } else if (env?.ASSETS) {
    const assetResp = await env.ASSETS.fetch(request);
    if (assetResp.status === 404 && path.startsWith('/u/')) {
      const uResp = await env.ASSETS.fetch(new Request(new URL('/u', request.url), request));
      if (uResp.status === 200) response = uResp;
      else {
        const uHtmlResp = await env.ASSETS.fetch(new Request(new URL('/u.html', request.url), request));
        if (uHtmlResp.status === 200) response = uHtmlResp;
        else response = assetResp;
      }
    } else {
      response = assetResp;
    }
  } else {
    response = new Response('Not found', { status: 404 });
  }

  return withSecurityHeaders(response);
}

export default {
  fetch(request, env) {
    return handleRequest(request, env, fetch);
  },
};
