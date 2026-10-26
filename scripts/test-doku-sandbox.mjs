import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
const api = await import('../services/doku-sandbox/protocol.mjs').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});
const metadata = { clientId: 'MCH-SYNTHETIC', requestId: 'request-1', timestamp: '2026-10-22T00:00:00Z', target: '/checkout/v1/payment' };
const secret = 'synthetic-test-key-not-a-credential';
const config = { enabled: true, environment: 'sandbox', clientId: metadata.clientId, secret, notificationPath: '/payments/doku/notifications' };
const expectedOrder = { packageVersion: '1', packageAmountIdr: '250000', durationUnit: 'calendar_year', durationCount: 1, workspaceCount: 1, invoice: 'PWTEST1', amount: 250000, currency: 'IDR', requestId: 'request-1', workspaceId: 'synthetic-workspace', environment: 'sandbox' };
function notification(overrides = {}, headerOverrides = {}) {
  const payload = { order: { invoice_number: 'PWTEST1', amount: 250000 }, transaction: { status: 'SUCCESS', original_request_id: 'request-1', date: metadata.timestamp }, channel: { id: 'VIRTUAL_ACCOUNT_BCA' }, ...overrides };
  const rawBody = Buffer.from(JSON.stringify(payload));
  const headers = { 'Client-Id': metadata.clientId, 'Request-Id': 'event-1', 'Request-Timestamp': metadata.timestamp };
  headers.Signature = api.signRequest({ ...metadata, requestId: 'event-1', target: config.notificationPath }, rawBody, secret);
  return { method: 'POST', path: config.notificationPath, headers: { ...headers, ...headerOverrides }, rawBody };
}
const body = Buffer.from('{"order":{"amount":250000,"invoice_number":"PWTEST1"},"note":"berdua ♥"}');
test('non-SNAP signature hashes exact UTF-8 bytes and ordered components without trailing newline', () => {
  assert.equal(typeof api.signRequest, 'function', 'protocol signing is not implemented');
  const digest = createHash('sha256').update(body).digest('base64');
  const components = `Client-Id:MCH-SYNTHETIC\nRequest-Id:request-1\nRequest-Timestamp:2026-10-22T00:00:00Z\nRequest-Target:/checkout/v1/payment\nDigest:${digest}`;
  const expected = `HMACSHA256=${createHmac('sha256', secret).update(components).digest('base64')}`;
  assert.equal(api.signRequest(metadata, body, secret), expected);
  assert.notEqual(api.signRequest(metadata, Buffer.concat([body, Buffer.from('\n')]), secret), expected);
});
test('authenticated matching SUCCESS is only a sandbox candidate, never an entitlement grant', () => {
  assert.equal(typeof api.inspectNotification, 'function', 'notification inspection is not implemented');
  const result = api.inspectNotification(config, notification(), expectedOrder);
  assert.equal(result.action, 'sandbox-payment-candidate');
  assert.equal(result.invoice, expectedOrder.invoice);
  assert.equal(result.grantsAccess, false);
  assert.equal(result.receiptKey, 'sandbox:MCH-SYNTHETIC:event-1');
  assert.equal(result.paymentKey, 'sandbox:MCH-SYNTHETIC:PWTEST1');
});
test('sandbox transport sends one exact signed request and never interprets fixture response as payment', async () => {
  assert.equal(typeof api.sendSandboxCheckout, 'function', 'sandbox adapter missing');
  let calls = 0;
  const result = await api.sendSandboxCheckout(config, expectedOrder, metadata.timestamp, async request => {
    calls++;
    assert.equal(request.url, 'https://api-sandbox.doku.com/checkout/v1/payment');
    assert.equal(request.method, 'POST');
    assert.equal(request.headers.Signature, api.signRequest(metadata, request.rawBody, secret));
    const payload = JSON.parse(request.rawBody.toString());
    assert.equal(payload.order.amount, 250000);
    assert.equal(payload.order.currency, 'IDR');
    assert.equal(payload.order.invoice_number, 'PWTEST1');
    assert.deepEqual(payload.payment.payment_method_types, ['VIRTUAL_ACCOUNT_BCA']);
    return { status: 200, rawBody: Buffer.from('{"fixture":true}') };
  });
  assert.equal(calls, 1);
  assert.deepEqual(result, { outcome: 'unverified-sandbox-response', httpStatus: 200, grantsAccess: false });
});
test('replay contract requires both permanent event and invoice uniqueness', () => {
  assert.equal(typeof api.classifyReceipt, 'function', 'replay contract missing');
  const event = api.inspectNotification(config, notification(), expectedOrder);
  assert.equal(api.classifyReceipt(event, { receipt: null, paymentExists: false }), 'record-candidate');
  assert.equal(api.classifyReceipt(event, { receipt: { payloadHash: event.payloadHash }, paymentExists: true }), 'duplicate-event');
  assert.equal(api.classifyReceipt(event, { receipt: { payloadHash: 'different' }, paymentExists: true }), 'conflict');
  assert.equal(api.classifyReceipt(event, { receipt: null, paymentExists: true }), 'duplicate-payment');
  assert.equal(api.classifyReceipt({ ...event, action: 'ignore' }, { receipt: null, paymentExists: false }), 'record-ignored');
});
