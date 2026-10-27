import test from 'node:test';
import assert from 'node:assert/strict';
import { signRequest, inspectNotification, sendSandboxCheckout, classifyReceipt } from '../services/doku-sandbox/protocol.mjs';
const config = { enabled: true, environment: 'sandbox', clientId: 'MCH-TEST', secret: 'synthetic-only', notificationPath: '/payments/doku/notifications' };
const order = { packageVersion: '1', packageAmountIdr: '250000', durationUnit: 'calendar_year', durationCount: 1, workspaceCount: 1, environment: 'sandbox', workspaceId: 'test-workspace', invoice: 'PWTEST1', requestId: 'original-1', amount: 250000, currency: 'IDR' };
const time = '2026-10-22T00:00:00Z';
const meta = { clientId: config.clientId, requestId: 'event-1', timestamp: time, target: config.notificationPath };
const payload = () => ({ order: { invoice_number: order.invoice, amount: 250000 }, transaction: { status: 'SUCCESS', original_request_id: order.requestId, date: time } });
function request(data = payload(), raw) {
  const rawBody = raw ?? Buffer.from(JSON.stringify(data));
  return { method: 'POST', path: config.notificationPath, rawBody, headers: { 'client-id': config.clientId, 'request-id': meta.requestId, 'request-timestamp': time, signature: signRequest(meta, rawBody, config.secret) } };
}
for (const [name, change] of Object.entries({ disabled: c => ({ ...c, enabled: false }), implicit: c => ({ ...c, enabled: undefined }), production: c => ({ ...c, environment: 'production' }), missingSecret: c => ({ ...c, secret: '' }), override: c => ({ ...c, baseUrl: 'https://api.doku.com' }), missingPath: c => ({ ...c, notificationPath: '' }) })) {
  test(`fail closed config ${name} before any transport`, async () => {
    let calls = 0;
    await assert.rejects(sendSandboxCheckout(change(config), order, time, () => { calls++; }));
    assert.equal(calls, 0);
    assert.throws(() => inspectNotification(change(config), request(), order));
  });
}
for (const [name, mutate] of Object.entries({ wrongMethod: r => { r.method = 'GET'; }, wrongPath: r => { r.path += '/'; }, query: r => { r.path += '?x=1'; }, tamper: r => { r.rawBody = Buffer.concat([r.rawBody, Buffer.from(' ')]); }, missingSignature: r => { delete r.headers.signature; }, wrongAlgorithm: r => { r.headers.signature = r.headers.signature.replace('HMACSHA256', 'HMACSHA512'); }, invalidBase64: r => { r.headers.signature = 'HMACSHA256=invalid'; }, duplicateHeader: r => { r.headers['Client-Id'] = config.clientId; }, arrayHeader: r => { r.headers['request-id'] = ['event-1']; }, commaHeader: r => { r.headers['request-id'] = 'event-1,event-2'; }, merchant: r => { r.headers['client-id'] = 'OTHER'; }, changedTimestamp: r => { r.headers['request-timestamp'] = '2026-10-23T00:00:00Z'; }, changedEventId: r => { r.headers['request-id'] = 'event-2'; }, parsedBody: r => { r.rawBody = {}; }, oversized: r => { r.rawBody = Buffer.alloc(65537); }, empty: r => { r.rawBody = Buffer.alloc(0); } })) {
  test(`reject notification ${name}`, () => { const r = request(); mutate(r); assert.throws(() => inspectNotification(config, r, order)); });
}
for (const value of [0, -250000, 249999, 250001, 250000.01, Number.MAX_SAFE_INTEGER + 1, '250000.00', '0250000', '2.5e5', '250000 ', null, true, {}, []]) {
  test(`reject nonexact amount ${JSON.stringify(value)}`, () => { const p = payload(); p.order.amount = value; assert.throws(() => inspectNotification(config, request(p), order)); });
}
for (const [name, mutate] of Object.entries({ invoice: p => { p.order.invoice_number = 'OTHER'; }, currency: p => { p.order.currency = 'USD'; }, original: p => { p.transaction.original_request_id = 'OTHER'; }, noOriginal: p => { delete p.transaction.original_request_id; }, date: p => { p.transaction.date = '2026-02-30T00:00:00Z'; }, noOrder: p => { delete p.order; }, noTransaction: p => { delete p.transaction; } })) {
  test(`reject signed mismatched payload ${name}`, () => { const p = payload(); mutate(p); assert.throws(() => inspectNotification(config, request(p), order)); });
}
for (const status of ['FAILED', 'PENDING', 'EXPIRED', 'REFUNDED', 'REDIRECT', 'ORDER_RECOVERED', 'success', '', null]) {
  test(`status ${status} never grants or terminates Checkout`, () => { const p = payload(); p.transaction.status = status; const event = inspectNotification(config, request(p), order); assert.equal(event.action, 'ignore'); assert.equal(event.grantsAccess, false); });
}
for (const type of ['AUTHORIZE', 'REFUND', 'VOID', 'CAPTURE', 'INSTALLMENT']) {
  test(`SUCCESS type ${type} is not a SALE candidate`, () => { const p = payload(); p.transaction.type = type; assert.equal(inspectNotification(config, request(p), order).action, 'ignore'); });
}
test('canonical string Rupiah and additional future fields accepted without leaking content', () => {
  const p = payload(); p.order.amount = '250000'; p.future = { customer: 'private' }; p.transaction.type = 'SALE';
  const e = inspectNotification(config, request(p), order);
  assert.equal(e.action, 'sandbox-payment-candidate'); assert.ok(!JSON.stringify(e).includes('private'));
});
test('signed invalid JSON and invalid UTF8 rejected', () => {
  for (const raw of [Buffer.from('{'), Buffer.from([0xff])]) assert.throws(() => inspectNotification(config, request(null, raw), order));
});
test('old signed delivery remains processable: durable replay, not an invented five-minute expiry', () => {
  const e = inspectNotification(config, request(), order);
  assert.equal(classifyReceipt(e, { receipt: { payloadHash: e.payloadHash }, paymentExists: true }), 'duplicate-event');
});
test('new event ID for same invoice remains duplicate payment', () => {
  const r = request(); r.headers['request-id'] = 'event-2'; r.headers.signature = signRequest({ ...meta, requestId: 'event-2' }, r.rawBody, config.secret);
  const e = inspectNotification(config, r, order);
  assert.equal(classifyReceipt(e, { receipt: null, paymentExists: true }), 'duplicate-payment');
});
test('GET omits Digest but empty POST bytes include Digest; injection and invalid date fail', () => {
  assert.notEqual(signRequest(meta, undefined, config.secret), signRequest(meta, Buffer.alloc(0), config.secret));
  for (const invalid of [{ requestId: 'x\nDigest:evil' }, { timestamp: '2026-02-30T00:00:00Z' }, { timestamp: '2026-10-22T07:00:00+07:00' }, { target: 'https://evil.example/path' }]) assert.throws(() => signRequest({ ...meta, ...invalid }, Buffer.alloc(0), config.secret));
});
test('HTTP failures, conflicts, network errors are not retried or treated as verified success', async () => {
  for (const status of [200, 400, 401, 409, 429, 500]) {
    let calls = 0;
    const result = await sendSandboxCheckout(config, order, time, async () => { calls++; return { status }; });
    assert.equal(calls, 1); assert.equal(result.outcome, 'unverified-sandbox-response'); assert.equal(result.grantsAccess, false);
  }
  await assert.rejects(sendSandboxCheckout(config, order, time, async () => { throw new Error('timeout'); }), /timeout/);
  await assert.rejects(sendSandboxCheckout(config, order, time));
});
test('invalid trusted snapshots cannot select price, tenant or production', async () => {
  for (const patch of [{ amount: 1 }, { currency: 'USD' }, { environment: 'production' }, { workspaceId: '' }, { invoice: 'a'.repeat(31) }, { requestId: '' }]) {
    await assert.rejects(sendSandboxCheckout(config, { ...order, ...patch }, time, async () => assert.fail('must not send')));
    assert.throws(() => inspectNotification(config, request(), { ...order, ...patch }));
  }
});
