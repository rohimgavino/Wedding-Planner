import assert from 'node:assert/strict';
import {
  isMayarConfigured,
  createMayarPayment,
  handleMayarWebhook,
  MAYAR_WEBHOOK_TARGET,
} from '../src/worker/mayar.mjs';
import { handleRequest } from '../src/worker/index.mjs';

console.log('Testing Mayar Integration...');

// 1. isMayarConfigured
assert.equal(isMayarConfigured({}), false);
assert.equal(isMayarConfigured({ MAYAR_API_KEY: 'test_key_123' }), true);
console.log('PASS 1: isMayarConfigured correctly detects API key presence');

// 2. createMayarPayment
{
  const mockFetch = async (url, init) => {
    assert.equal(url, 'https://api.mayar.id/hl/v1/payment/create');
    assert.equal(init.headers['Authorization'], 'Bearer test_mayar_key');
    const body = JSON.parse(init.body);
    assert.equal(body.amount, 79900);
    assert.equal(body.extraData.invoice, 'INV-TEST-001');
    return new Response(JSON.stringify({
      statusCode: 200,
      messages: 'Success',
      data: {
        id: 'pay_mayar_123',
        link: 'https://mayar.link/pay/pay_mayar_123',
      },
    }), { status: 200 });
  };

  const res = await createMayarPayment({
    env: { MAYAR_API_KEY: 'test_mayar_key' },
    order: { invoice: 'INV-TEST-001', amount_idr: 79900, workspace_id: 'ws-123', package_id: 'premium' },
    user: { id: 'u-123', email: 'user@test.com' },
    origin: 'https://pocketwedding.id',
    fetchImpl: mockFetch,
  });

  assert.equal(res.ok, true);
  assert.equal(res.checkoutUrl, 'https://mayar.link/pay/pay_mayar_123');
  console.log('PASS 2: createMayarPayment generates correct payload and returns checkoutUrl');
}

// 3. handleMayarWebhook
{
  let appliedRpc = null;
  const mockCallRpc = async (env, rpcName, params) => {
    appliedRpc = { rpcName, params };
    return { ok: true, data: { outcome: 'ok' } };
  };

  const webhookReq = new Request('https://pocketwedding.id/api/mayar/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-mayar-signature': 'my_secret_token',
    },
    body: JSON.stringify({
      event: 'payment.success',
      data: {
        id: 'pay_mayar_123',
        status: 'PAID',
        amount: 79900,
        paymentMethod: 'QRIS',
        extraData: {
          invoice: 'INV-TEST-001',
        },
      },
    }),
  });

  const res = await handleMayarWebhook(
    webhookReq,
    {
      SUPABASE_SERVICE_ROLE_KEY: 'srv_key',
      MAYAR_WEBHOOK_SECRET: 'my_secret_token',
    },
    fetch,
    mockCallRpc
  );

  assert.equal(res.status, 200);
  assert.equal(appliedRpc?.rpcName, 'doku_apply_notification');
  assert.equal(appliedRpc?.params?.p_invoice, 'INV-TEST-001');
  assert.equal(appliedRpc?.params?.p_amount_idr, 79900);
  assert.equal(appliedRpc?.params?.p_channel_id, 'QRIS');
  assert.equal(appliedRpc?.params?.p_tx_status, 'SUCCESS');
  console.log('PASS 3: handleMayarWebhook validates secret and triggers workspace activation');
}

// 4. Worker routing for Mayar webhook
{
  const req = new Request('https://pocketwedding.id/api/mayar/webhook', {
    method: 'GET',
  });
  const res = await handleRequest(req, {});
  assert.equal(res.status, 405);
  assert.equal(res.headers.get('X-Frame-Options'), 'DENY');
  console.log('PASS 4: Worker routing rejects non-POST to Mayar webhook with security headers');
}

console.log('ALL MAYAR INTEGRATION TESTS PASSED!');
