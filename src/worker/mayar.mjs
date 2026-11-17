/**
 * Mayar.id Payment Gateway Integration for Pocket Planner.
 * Supports:
 * 1. Dynamic Checkout Link Creation via Mayar API (QRIS, VA, e-Wallet)
 * 2. Webhook Notification handling with automated Supabase entitlement activation
 */

export const MAYAR_PRODUCTION_API = 'https://api.mayar.id/hl/v1';
export const MAYAR_SANDBOX_API = 'https://api-sandbox.mayar.id/hl/v1';
export const MAYAR_WEBHOOK_TARGET = '/api/mayar/webhook';

export function isMayarConfigured(env) {
  return Boolean(env?.MAYAR_API_KEY);
}

export function getMayarBaseUrl(env) {
  return env?.MAYAR_ENV === 'sandbox' ? MAYAR_SANDBOX_API : MAYAR_PRODUCTION_API;
}

/**
 * Creates a dynamic Mayar payment link for an order.
 */
export async function createMayarPayment({ env, order, user, origin, fetchImpl = fetch }) {
  if (!env?.MAYAR_API_KEY) {
    return { ok: false, error: 'MAYAR_KEY_MISSING', message: 'API Key Mayar belum dikonfigurasi.' };
  }

  const baseUrl = getMayarBaseUrl(env);
  const redirectUrl = `${origin}/purchase?invoice=${encodeURIComponent(order.invoice)}&gateway=mayar`;

  const payload = {
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pelanggan Pocket Planner',
    email: user?.email || 'customer@pocketwedding.id',
    amount: Number(order.amount_idr),
    description: `Aktivasi Pocket Planner - Paket ${order.package_id || 'Wedding'} (Invoice: ${order.invoice})`,
    mobile: user?.phone || '081234567890',
    redirectUrl,
    extraData: {
      invoice: order.invoice,
      workspaceId: order.workspace_id,
      packageId: order.package_id,
      userId: user?.id,
    },
  };

  try {
    const res = await fetchImpl(`${baseUrl}/payment/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.MAYAR_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    const resJson = await res.json().catch(() => null);

    if (!res.ok || !resJson?.data?.link) {
      return {
        ok: false,
        error: 'MAYAR_API_ERROR',
        message: resJson?.messages || resJson?.message || 'Gagal membuat tautan pembayaran Mayar.',
      };
    }

    return {
      ok: true,
      checkoutUrl: resJson.data.link,
      mayarPaymentId: resJson.data.id || null,
    };
  } catch (err) {
    return {
      ok: false,
      error: 'MAYAR_NETWORK_ERROR',
      message: err instanceof Error ? err.message : 'Koneksi ke gateway Mayar gagal.',
    };
  }
}

/**
 * Verifies and applies Mayar webhook notification to activate workspace in Supabase.
 */
export async function handleMayarWebhook(request, env, fetchImpl = fetch, callSupabaseRpcFn) {
  if (!env?.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'CONFIG_MISSING' }), { status: 503 });
  }

  // Verify webhook secret if configured
  if (env?.MAYAR_WEBHOOK_SECRET) {
    const signature = request.headers.get('x-mayar-signature') || request.headers.get('authorization');
    if (!signature || (signature !== env.MAYAR_WEBHOOK_SECRET && signature !== `Bearer ${env.MAYAR_WEBHOOK_SECRET}`)) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED_WEBHOOK' }), { status: 401 });
    }
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'INVALID_JSON' }), { status: 400 });
  }

  // Mayar webhook event matching
  const event = payload?.event || payload?.type || '';
  const data = payload?.data || payload;
  const status = (data?.status || '').toUpperCase();
  const isPaid = status === 'PAID' || status === 'SUCCESS' || event.includes('success');

  if (!isPaid) {
    return new Response(JSON.stringify({ status: 'ignored', reason: 'non_success_event' }), { status: 200 });
  }

  const invoice = data?.extraData?.invoice || data?.invoice || data?.orderId || null;
  const amount = Number(data?.amount || 0);
  const paymentMethod = data?.paymentMethod || data?.channel || 'QRIS';
  const eventKey = `mayar_${data?.id || data?.paymentId || invoice}_${Date.now()}`;
  const payloadHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)))))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  if (!invoice) {
    return new Response(JSON.stringify({ error: 'INVOICE_MISSING_IN_METADATA' }), { status: 400 });
  }

  // Activate workspace entitlement in Supabase
  const applied = await callSupabaseRpcFn(
    env,
    'doku_apply_notification',
    {
      p_event_key: eventKey,
      p_payload_hash: payloadHash,
      p_invoice: invoice,
      p_amount_idr: amount,
      p_channel_id: String(paymentMethod).toUpperCase(),
      p_tx_status: 'SUCCESS',
      p_tx_type: 'SALE',
    },
    env.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl
  );

  if (!applied.ok) {
    return new Response(JSON.stringify({ error: 'SETTLEMENT_FAILED' }), { status: 500 });
  }

  return new Response(JSON.stringify({ status: 'ok', outcome: applied.data?.outcome || 'activated' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
