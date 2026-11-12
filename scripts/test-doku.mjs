import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import {
  formatUtcIso,
  hmacSha256Base64,
  sha256Base64,
  signDokuRequest,
  validateCheckoutUrl,
  verifyDokuNotification,
  verifyDokuResponse,
} from '../src/worker/doku-crypto.mjs';
import { handleRequest } from '../src/worker/index.mjs';

let passed = 0;
async function test(name, fn) {
  await fn();
  console.log(`PASS ${++passed}: ${name}`);
}

const CLIENT_ID = 'BRN-TEST-CLIENT';
const SECRET = 'SK-TEST-SECRET-KEY-12345';

// ---------------------------------------------------------------------------
// 1. Crypto & signature verification tests
// ---------------------------------------------------------------------------
await test('signDokuRequest + verifyDokuResponse accept valid DOKU Checkout v1 response', async () => {
  const reqId = '11111111-1111-4111-8111-111111111111';
  const reqBody = new TextEncoder().encode(JSON.stringify({ order: { amount: 99900, invoice_number: 'pp-01' } }));
  const reqSig = await signDokuRequest(
    { clientId: CLIENT_ID, requestId: reqId, timestamp: formatUtcIso(), target: '/checkout/v1/payment', rawBody: reqBody },
    SECRET
  );
  assert.match(reqSig, /^HMACSHA256=[A-Za-z0-9+/]{43}=$/);

  const respJson = JSON.stringify({
    response: {
      order: { invoice_number: 'pp-01', amount: 99900 },
      payment: { url: 'https://jokul.doku.com/checkout-link-v2/token-abc123' },
    },
  });
  const respBytes = new TextEncoder().encode(respJson);
  const ts = '2026-11-12T10:00:00Z';
  const digest = await sha256Base64(respBytes);
  const comp = `Client-Id:${CLIENT_ID}\nRequest-Id:${reqId}\nResponse-Timestamp:${ts}\nRequest-Target:/checkout/v1/payment\nDigest:${digest}`;
  const sig = `HMACSHA256=${await hmacSha256Base64(SECRET, comp)}`;

  const res = await verifyDokuResponse(
    {
      clientId: CLIENT_ID,
      requestId: reqId,
      status: 200,
      headers: new Headers({
        'Client-Id': CLIENT_ID,
        'Request-Id': reqId,
        'Response-Timestamp': ts,
        Signature: sig,
      }),
      rawBody: respBytes,
      expectedInvoice: 'pp-01',
      expectedAmountIdr: 99900,
      envMode: 'production',
    },
    SECRET
  );
  assert.equal(res.ok, true);
  assert.equal(res.checkoutUrl, 'https://jokul.doku.com/checkout-link-v2/token-abc123');
});

await test('verifyDokuResponse rejects tampered amount, mismatched signature, and evil checkout URLs', async () => {
  assert.equal(validateCheckoutUrl('https://evil.example/checkout-link-v2/abc', 'production'), null);
  assert.equal(validateCheckoutUrl('https://jokul.doku.com/checkout-link-v2/abc?x=1', 'production'), null);
  assert.equal(validateCheckoutUrl('https://staging.doku.com/checkout-link-v2/abc', 'production'), null);
  assert.equal(
    validateCheckoutUrl('https://staging.doku.com/checkout-link-v2/abc', 'sandbox'),
    'https://staging.doku.com/checkout-link-v2/abc'
  );
  assert.equal(
    validateCheckoutUrl('https://checkout.doku.com/checkout/link/xyz_99', 'production'),
    'https://checkout.doku.com/checkout/link/xyz_99'
  );

  const reqId = '11111111-1111-4111-8111-111111111112';
  const respBytes = new TextEncoder().encode(
    JSON.stringify({
      response: {
        order: { invoice_number: 'pp-01', amount: 1000 },
        payment: { url: 'https://jokul.doku.com/checkout-link-v2/tok' },
      },
    })
  );
  const ts = '2026-11-12T10:00:00Z';
  const digest = await sha256Base64(respBytes);
  const sig = `HMACSHA256=${await hmacSha256Base64(
    SECRET,
    `Client-Id:${CLIENT_ID}\nRequest-Id:${reqId}\nResponse-Timestamp:${ts}\nRequest-Target:/checkout/v1/payment\nDigest:${digest}`
  )}`;

  const mismatch = await verifyDokuResponse(
    {
      clientId: CLIENT_ID,
      requestId: reqId,
      status: 200,
      headers: new Headers({ 'Client-Id': CLIENT_ID, 'Request-Id': reqId, 'Response-Timestamp': ts, Signature: sig }),
      rawBody: respBytes,
      expectedInvoice: 'pp-01',
      expectedAmountIdr: 99900,
    },
    SECRET
  );
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.reasonCode, 'AMOUNT_MISMATCH');

  const badSig = await verifyDokuResponse(
    {
      clientId: CLIENT_ID,
      requestId: reqId,
      status: 200,
      headers: new Headers({
        'Client-Id': CLIENT_ID,
        'Request-Id': reqId,
        'Response-Timestamp': ts,
        Signature: 'HMACSHA256=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      }),
      rawBody: respBytes,
      expectedInvoice: 'pp-01',
      expectedAmountIdr: 1000,
    },
    SECRET
  );
  assert.equal(badSig.ok, false);
  assert.equal(badSig.reasonCode, 'SIGNATURE_MISMATCH');
});

await test('verifyDokuNotification accepts QRIS/VA webhook with numeric or string IDR amount and rejects bad sig', async () => {
  const payload = JSON.stringify({
    order: { invoice_number: 'pp-abcdef012345', amount: '99900', currency: 'IDR' },
    transaction: { status: 'SUCCESS', type: 'SALE' },
    channel: { id: 'QRIS' },
  });
  const bytes = new TextEncoder().encode(payload);
  const ts = formatUtcIso();
  const reqId = 'notif-0001';
  const sig = await signDokuRequest(
    { clientId: CLIENT_ID, requestId: reqId, timestamp: ts, target: '/doku/notifications', rawBody: bytes },
    SECRET
  );
  const headers = new Headers({
    'Client-Id': CLIENT_ID,
    'Request-Id': reqId,
    'Request-Timestamp': ts,
    Signature: sig,
  });

  const ok = await verifyDokuNotification({ clientId: CLIENT_ID, headers, rawBody: bytes }, SECRET);
  assert.equal(ok.ok, true);
  assert.equal(ok.invoice, 'pp-abcdef012345');
  assert.equal(ok.amountIdr, 99900);
  assert.equal(ok.channelId, 'QRIS');
  assert.equal(ok.txStatus, 'SUCCESS');

  const tampered = await verifyDokuNotification(
    { clientId: CLIENT_ID, headers, rawBody: new TextEncoder().encode(payload.replace('99900', '100')) },
    SECRET
  );
  assert.equal(tampered.ok, false);
  assert.equal(tampered.status, 401);
  assert.equal(tampered.reasonCode, 'SIGNATURE_MISMATCH');
});

// ---------------------------------------------------------------------------
// 2. PostgreSQL SQL migration tests on PGlite
// ---------------------------------------------------------------------------
const db = new PGlite();
await db.exec(`
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
    SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
  GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
`);

for (const file of [
  'supabase/migrations/202610120001_secure_foundation.sql',
  'supabase/migrations/202610140001_workspace_entitlements_savings.sql',
  'supabase/migrations/202610140002_admin_manual_purchases.sql',
  'supabase/migrations/202610140004_developer_operator_roles.sql',
  'supabase/migrations/202610220002_tier_pricing.sql',
]) {
  await db.exec(readFileSync(file, 'utf8'));
}

// Seed v2 tier pricing matching Production & keep site_settings Lynk constraint
await db.exec(`
  INSERT INTO public.tier_price_versions (package_id, version, config) VALUES
    ('starter', 2, '{"amount_idr":"49900","promo":null}'::jsonb),
    ('premium', 2, '{"amount_idr":"79900","promo":null}'::jsonb),
    ('wedding_pro', 2, '{"amount_idr":"99900","promo":null}'::jsonb);
  UPDATE public.tier_price_current SET version = 2 WHERE package_id IN ('starter', 'premium', 'wedding_pro');

  -- Match Production site_settings constraint requiring lynk_url if site_settings.sales_enabled=true
  ALTER TABLE public.site_settings DROP CONSTRAINT IF EXISTS site_settings_sales_enabled_check;
  ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_sales_enabled_check
    CHECK ((NOT sales_enabled) OR (price_idr IS NOT NULL AND duration_days IS NOT NULL AND lynk_url IS NOT NULL AND support_email IS NOT NULL));
`);

// Apply new DOKU migration & hardening
await db.exec(readFileSync('supabase/migrations/202611120001_doku_checkout.sql', 'utf8'));
await db.exec(readFileSync('supabase/migrations/202611120002_doku_checkout_hardening.sql', 'utf8'));

// Seed users & workspace
const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const BUYER_ID = '00000000-0000-0000-0000-000000000002';
const STRANGER_ID = '00000000-0000-0000-0000-000000000003';

await db.exec(`
  INSERT INTO auth.users VALUES
    ('${ADMIN_ID}', 'admin@pocketwedding.id', now()),
    ('${BUYER_ID}', 'buyer@example.com', now()),
    ('${STRANGER_ID}', 'stranger@example.com', now());
  INSERT INTO public.site_admins (user_id, role) VALUES ('${ADMIN_ID}', 'developer');
`);

await db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${BUYER_ID}', false);`);
const wsBuyer = (await db.query(`SELECT public.create_workspace('Pernikahan Uji', '2027-06-01') AS id`)).rows[0].id;

await test('SQL: sales disabled fails closed and public_tier_catalog reflects sales_enabled=false', async () => {
  await db.exec(`RESET ROLE`);
  const cat = (await db.query(`SELECT public.public_tier_catalog() AS cat`)).rows[0].cat;
  assert.equal(cat.sales_enabled, false);
  assert.equal(cat.packages.length, 3);
  assert.equal(cat.packages[2].effective_amount_idr, '99900');

  await assert.rejects(
    db.query(`SELECT public.doku_reserve_order($1, $2, 'wedding_pro', 'pp-inv-closed', 'req-closed')`, [wsBuyer, BUYER_ID]),
    /sales_disabled/
  );
});

await test('SQL: admin_set_sales_activation enables sales without touching Lynk site_settings.sales_enabled', async () => {
  await db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${ADMIN_ID}', false);`);
  const res = (
    await db.query(
      `SELECT public.admin_set_sales_activation(true, 'support@pocketwedding.id', 'Aktifkan uji DOKU', true) AS cat`
    )
  ).rows[0].cat;
  assert.equal(res.sales_enabled, true);
  assert.equal(res.support_email, 'support@pocketwedding.id');
});

await test('SQL: doku_reserve_order + reuse + webhook settlement grants core & package_id idempotently', async () => {
  await db.exec(`RESET ROLE`);
  await assert.rejects(
    db.query(`SELECT public.doku_reserve_order($1, $2, 'wedding_pro', 'pp-inv-stranger', 'req-stranger')`, [wsBuyer, STRANGER_ID]),
    /workspace_membership_required/
  );

  const r1 = (
    await db.query(`SELECT public.doku_reserve_order($1, $2, 'wedding_pro', 'pp-inv-001', 'req-001') AS res`, [wsBuyer, BUYER_ID])
  ).rows[0].res;
  assert.equal(r1.outcome, 'reserved');
  assert.equal(r1.order.amount_idr, 99900);

  const saved = (
    await db.query(
      `SELECT public.doku_set_order_result('pp-inv-001', 'checkout_ready', 'https://jokul.doku.com/checkout-link-v2/tok1', 200, null) AS res`
    )
  ).rows[0].res;
  assert.equal(saved.outcome, 'checkout_ready');

  // Re-reserve returns existing active checkout URL instead of creating duplicate order
  const r2 = (
    await db.query(`SELECT public.doku_reserve_order($1, $2, 'wedding_pro', 'pp-inv-002', 'req-002') AS res`, [wsBuyer, BUYER_ID])
  ).rows[0].res;
  assert.equal(r2.outcome, 'existing');
  assert.equal(r2.order.invoice, 'pp-inv-001');

  // Amount mismatch does NOT mark paid or grant entitlement
  const badAmt = (
    await db.query(
      `SELECT public.doku_apply_notification('ev-bad', 'hash-bad', 'pp-inv-001', 1000, 'QRIS', 'SUCCESS', 'SALE') AS res`
    )
  ).rows[0].res;
  assert.equal(badAmt.outcome, 'amount_mismatch');

  // Valid SUCCESS settlement grants both 'core' and 'wedding_pro'
  const paid = (
    await db.query(
      `SELECT public.doku_apply_notification('ev-ok-1', 'hash-ok-1', 'pp-inv-001', 99900, 'QRIS', 'SUCCESS', 'SALE') AS res`
    )
  ).rows[0].res;
  assert.equal(paid.outcome, 'paid');

  // Duplicate delivery is idempotent
  const dup = (
    await db.query(
      `SELECT public.doku_apply_notification('ev-ok-1', 'hash-ok-1', 'pp-inv-001', 99900, 'QRIS', 'SUCCESS', 'SALE') AS res`
    )
  ).rows[0].res;
  assert.equal(dup.outcome, 'duplicate');

  // Verify buyer has active core & wedding_pro entitlements
  await db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${BUYER_ID}', false);`);
  assert.equal((await db.query(`SELECT public.has_workspace_entitlement($1, 'core') AS ok`, [wsBuyer])).rows[0].ok, true);
  assert.equal((await db.query(`SELECT public.has_workspace_entitlement($1, 'wedding_pro') AS ok`, [wsBuyer])).rows[0].ok, true);
});

// ---------------------------------------------------------------------------
// 3. Worker HTTP routing & state transition tests
// ---------------------------------------------------------------------------
await test('Worker: /api/payments/checkout handles fail-closed, existing reuse, transport unknown, and full happy path', async () => {
  const unconfigured = await handleRequest(
    new Request('https://pocketwedding.id/api/payments/checkout', { method: 'POST', body: '{}' }),
    {}
  );
  assert.equal(unconfigured.status, 503);

  const env = {
    DOKU_ENV: 'production',
    DOKU_CLIENT_ID: CLIENT_ID,
    DOKU_SECRET_KEY: SECRET,
    SUPABASE_URL: 'https://supa.example.test',
    SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    ASSETS: {
      fetch: async () => new Response('static-ok', { status: 200 }),
    },
  };

  // Static fallback delegates to ASSETS
  const assetResp = await handleRequest(new Request('https://pocketwedding.id/'), env);
  assert.equal(await assetResp.text(), 'static-ok');

  // Happy path mocked fetch
  const rpcCalls = [];
  const mockFetch = async (url, init = {}) => {
    const u = String(url);
    if (u.endsWith('/auth/v1/user')) {
      return new Response(JSON.stringify({ id: BUYER_ID, email: 'buyer@example.com' }), { status: 200 });
    }
    if (u.includes('/rest/v1/rpc/doku_reserve_order')) {
      const body = JSON.parse(init.body);
      rpcCalls.push(['doku_reserve_order', body]);
      return new Response(
        JSON.stringify({
          outcome: 'reserved',
          order: {
            invoice: body.p_invoice,
            request_id: body.p_request_id,
            package_id: body.p_package_id,
            amount_idr: 99900,
            expires_at: '2026-11-12T11:00:00Z',
          },
        }),
        { status: 200 }
      );
    }
    if (u === 'https://api.doku.com/checkout/v1/payment') {
      const h = new Headers(init.headers);
      const reqId = h.get('Request-Id');
      const reqBody = JSON.parse(new TextDecoder().decode(init.body));
      assert.equal(reqBody.order.amount, 99900);
      assert.equal(reqBody.order.callback_url.startsWith('https://pocketwedding.id/purchase?invoice='), true);
      const respBytes = new TextEncoder().encode(
        JSON.stringify({
          response: {
            order: { invoice_number: reqBody.order.invoice_number, amount: 99900 },
            payment: { url: 'https://jokul.doku.com/checkout-link-v2/live-tok-1' },
          },
        })
      );
      const ts = '2026-11-12T10:10:00Z';
      const digest = await sha256Base64(respBytes);
      const sig = `HMACSHA256=${await hmacSha256Base64(
        SECRET,
        `Client-Id:${CLIENT_ID}\nRequest-Id:${reqId}\nResponse-Timestamp:${ts}\nRequest-Target:/checkout/v1/payment\nDigest:${digest}`
      )}`;
      return new Response(respBytes, {
        status: 200,
        headers: { 'Client-Id': CLIENT_ID, 'Request-Id': reqId, 'Response-Timestamp': ts, Signature: sig },
      });
    }
    if (u.includes('/rest/v1/rpc/doku_set_order_result')) {
      const body = JSON.parse(init.body);
      rpcCalls.push(['doku_set_order_result', body]);
      return new Response(JSON.stringify({ outcome: body.p_status }), { status: 200 });
    }
    throw new Error('Unexpected fetch URL: ' + u);
  };

  const resp = await handleRequest(
    new Request('https://pocketwedding.id/api/payments/checkout', {
      method: 'POST',
      headers: { Authorization: 'Bearer user-jwt-123', 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId: wsBuyer, packageId: 'wedding_pro' }),
    }),
    env,
    mockFetch
  );
  assert.equal(resp.status, 200);
  const data = await resp.json();
  assert.equal(data.status, 'checkout_ready');
  assert.equal(data.checkoutUrl, 'https://jokul.doku.com/checkout-link-v2/live-tok-1');
  assert.equal(rpcCalls[1][0], 'doku_set_order_result');
  assert.equal(rpcCalls[1][1].p_status, 'checkout_ready');
});

await test('Worker: 408/429 mark unknown, 400 marks failed, and bad notification returns headerNames', async () => {
  const env = {
    DOKU_ENV: 'production',
    DOKU_CLIENT_ID: CLIENT_ID,
    DOKU_SECRET_KEY: SECRET,
    SUPABASE_URL: 'https://supa.example.test',
    SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  };

  for (const [dokuCode, expectedDbStatus] of [
    [408, 'unknown'],
    [429, 'unknown'],
    [400, 'failed'],
  ]) {
    const statuses = [];
    const mockFetch = async (url, init = {}) => {
      const u = String(url);
      if (u.endsWith('/auth/v1/user')) {
        return new Response(JSON.stringify({ id: BUYER_ID }), { status: 200 });
      }
      if (u.includes('/rest/v1/rpc/doku_reserve_order')) {
        const body = JSON.parse(init.body);
        return new Response(
          JSON.stringify({
            outcome: 'reserved',
            order: {
              invoice: body.p_invoice,
              request_id: body.p_request_id,
              package_id: body.p_package_id,
              amount_idr: 49900,
              expires_at: '2026-11-12T11:00:00Z',
            },
          }),
          { status: 200 }
        );
      }
      if (u === 'https://api.doku.com/checkout/v1/payment') {
        const payload = dokuCode === 400 ? JSON.stringify({ error: { message: ['Invalid order.amount https://secret.example'] } }) : '{}';
        return new Response(payload, { status: dokuCode });
      }
      if (u.includes('/rest/v1/rpc/doku_set_order_result')) {
        const body = JSON.parse(init.body);
        statuses.push(body.p_status);
        return new Response(JSON.stringify({ outcome: body.p_status }), { status: 200 });
      }
      throw new Error('Unexpected fetch URL: ' + u);
    };

    const resp = await handleRequest(
      new Request('https://pocketwedding.id/api/payments/checkout', {
        method: 'POST',
        headers: { Authorization: 'Bearer user-jwt-123', 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: wsBuyer, packageId: 'starter' }),
      }),
      env,
      mockFetch
    );
    assert.equal(resp.status, 502);
    const body = await resp.json();
    assert.deepEqual(statuses, [expectedDbStatus]);
    if (dokuCode === 400) {
      assert.equal(body.message.includes('[url]'), true);
      assert.equal(body.message.includes('secret.example'), false);
    }
  }

  const badNotify = await handleRequest(
    new Request('https://pocketwedding.id/doku/notifications', {
      method: 'POST',
      headers: {
        'Client-Id': CLIENT_ID,
        'Request-Id': 'req-bad-1',
        'Request-Timestamp': formatUtcIso(),
        Signature: 'HMACSHA256=' + 'A'.repeat(43) + '=',
      },
      body: '{}',
    }),
    env
  );
  assert.equal(badNotify.status, 401);
  const badBody = await badNotify.json();
  assert.equal(badBody.error, 'SIGNATURE_MISMATCH');
  assert.deepEqual(badBody.headerNames, ['client-id', 'content-type', 'request-id', 'request-timestamp', 'signature']);
});

await test('CRYPTO & SQL: verifyDokuNotification accepts .00 decimal IDR amount string and enforces timestamp window', async () => {
  const notifBody = JSON.stringify({
    order: { invoice_number: 'pp-dec-1', amount: '99900.00', currency: 'IDR' },
    transaction: { status: 'SUCCESS', type: 'SALE' },
    channel: { id: 'VIRTUAL_ACCOUNT_BCA' },
  });
  const nowTs = formatUtcIso();
  const sig = await signDokuRequest(
    {
      clientId: CLIENT_ID,
      requestId: 'req-dec-1',
      timestamp: nowTs,
      target: '/doku/notifications',
      rawBody: notifBody,
    },
    SECRET
  );
  const v = await verifyDokuNotification(
    {
      clientId: CLIENT_ID,
      notificationPath: '/doku/notifications',
      headers: new Headers({
        'Client-Id': CLIENT_ID,
        'Request-Id': 'req-dec-1',
        'Request-Timestamp': nowTs,
        Signature: sig,
      }),
      rawBody: notifBody,
    },
    SECRET
  );
  assert.equal(v.ok, true);
  assert.equal(v.amountIdr, 99900);

  // Stale (>24h old) or far-future (>5m ahead) timestamps are rejected
  const staleTs = formatUtcIso(new Date(Date.now() - 25 * 3600 * 1000));
  const staleSig = await signDokuRequest(
    { clientId: CLIENT_ID, requestId: 'req-stale-1', timestamp: staleTs, target: '/doku/notifications', rawBody: notifBody },
    SECRET
  );
  const staleRes = await verifyDokuNotification(
    {
      clientId: CLIENT_ID,
      notificationPath: '/doku/notifications',
      headers: new Headers({ 'Client-Id': CLIENT_ID, 'Request-Id': 'req-stale-1', 'Request-Timestamp': staleTs, Signature: staleSig }),
      rawBody: notifBody,
    },
    SECRET
  );
  assert.equal(staleRes.ok, false);
  assert.equal(staleRes.reasonCode, 'TIMESTAMP_OUT_OF_WINDOW');

  const futureTs = formatUtcIso(new Date(Date.now() + 10 * 60 * 1000));
  const futureSig = await signDokuRequest(
    { clientId: CLIENT_ID, requestId: 'req-fut-1', timestamp: futureTs, target: '/doku/notifications', rawBody: notifBody },
    SECRET
  );
  const futureRes = await verifyDokuNotification(
    {
      clientId: CLIENT_ID,
      notificationPath: '/doku/notifications',
      headers: new Headers({ 'Client-Id': CLIENT_ID, 'Request-Id': 'req-fut-1', 'Request-Timestamp': futureTs, Signature: futureSig }),
      rawBody: notifBody,
    },
    SECRET
  );
  assert.equal(futureRes.ok, false);
  assert.equal(futureRes.reasonCode, 'TIMESTAMP_OUT_OF_WINDOW');
});

await test('SQL: unknown order unblocks via FAILED webhook and audited admin_resolve_doku_order', async () => {
  await db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${STRANGER_ID}', false);`);
  const wsUnblock = (await db.query(`SELECT public.create_workspace('Unblock Test', '2027-07-01') AS id`)).rows[0].id;

  await db.exec(`RESET ROLE`);
  await db.query(`SELECT public.doku_reserve_order($1, $2, 'starter', 'pp-unk-1', 'req-unk-1')`, [wsUnblock, STRANGER_ID]);
  await db.query(`SELECT public.doku_set_order_result('pp-unk-1', 'unknown', null, null, 'DOKU_HTTP_408')`);

  const blocked = (await db.query(`SELECT public.doku_reserve_order($1, $2, 'starter', 'pp-unk-2', 'req-unk-2') AS res`, [wsUnblock, STRANGER_ID])).rows[0].res;
  assert.equal(blocked.outcome, 'unresolved_unknown');

  const failedWebhook = (
    await db.query(`SELECT public.doku_apply_notification('ev-unk-fail-1', 'hash-fail-1', 'pp-unk-1', 49900, 'QRIS', 'FAILED', 'SALE') AS res`)
  ).rows[0].res;
  assert.equal(failedWebhook.outcome, 'ignored');

  const statusAfterFail = (await db.query(`SELECT status FROM public.doku_orders WHERE invoice = 'pp-unk-1'`)).rows[0].status;
  assert.equal(statusAfterFail, 'failed');

  // Now reserve another order, mark it unknown, and verify admin_resolve_doku_order
  await db.query(`SELECT public.doku_reserve_order($1, $2, 'starter', 'pp-unk-3', 'req-unk-3')`, [wsUnblock, STRANGER_ID]);
  await db.query(`SELECT public.doku_set_order_result('pp-unk-3', 'unknown', null, null, 'DOKU_HTTP_429')`);

  await db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${STRANGER_ID}', false);`);
  await assert.rejects(
    db.query(`SELECT public.admin_resolve_doku_order('pp-unk-3', 'failed', 'non admin attempt')`),
    /admin required/
  );

  await db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${ADMIN_ID}', false);`);
  await assert.rejects(
    db.query(`SELECT public.admin_resolve_doku_order('pp-unk-3', 'paid', 'cannot mark paid manually')`),
    /invalid target status/
  );

  const resolved = (
    await db.query(`SELECT public.admin_resolve_doku_order('pp-unk-3', 'expired', 'DOKU timeout confirmed unpaid by admin') AS res`)
  ).rows[0].res;
  assert.equal(resolved.outcome, 'resolved');
  assert.equal(resolved.order.status, 'expired');

  // Concurrent/duplicate event_key safety: second call returns duplicate cleanly without 23505
  await db.exec(`RESET ROLE`);
  const dup = (
    await db.query(`SELECT public.doku_apply_notification('ev-unk-fail-1', 'hash-fail-1', 'pp-unk-1', 49900, 'QRIS', 'FAILED', 'SALE') AS res`)
  ).rows[0].res;
  assert.equal(dup.outcome, 'duplicate');

  // Operator role can read both sales.activation_updated and doku.order_resolved audit rows via RLS
  const OP_ID = '00000000-0000-0000-0000-000000000004';
  await db.exec(`
    INSERT INTO auth.users VALUES ('${OP_ID}', 'op@pocketwedding.id', now());
    INSERT INTO public.site_admins (user_id, role) VALUES ('${OP_ID}', 'operator');
    RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${OP_ID}', false);
  `);
  const opAudit = (
    await db.query(
      `SELECT action FROM public.admin_audit WHERE action IN ('sales.activation_updated', 'doku.order_resolved') ORDER BY action`
    )
  ).rows.map((r) => r.action);
  assert.deepEqual(opAudit, ['doku.order_resolved', 'sales.activation_updated']);
});

await test('Worker: /api/payments/catalog normalizes SQL public_tier_catalog into TierPackage[] with checkout_eligible=true', async () => {
  const env = {
    DOKU_ENV: 'production',
    DOKU_CLIENT_ID: CLIENT_ID,
    DOKU_SECRET_KEY: SECRET,
    SUPABASE_URL: 'https://supa.example.test',
    SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  };
  const mockFetch = async () =>
    new Response(
      JSON.stringify({
        sales_enabled: true,
        support_email: 'support@pocketwedding.id',
        server_now: '2026-11-12T10:00:00Z',
        packages: [
          {
            package_id: 'starter',
            version: '2',
            duration_days: 365,
            base_amount_idr: '49900',
            effective_amount_idr: '49900',
            price_eligible: true,
            checkout_eligible: false,
            promo_active: false,
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  const res = await handleRequest(new Request('https://pocketwedding.id/api/payments/catalog'), env, mockFetch);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.salesEnabled, true);
  assert.equal(body.dokuConfigured, true);
  assert.equal(body.packages.length, 1);
  assert.equal(body.packages[0].id, 'starter');
  assert.equal(body.packages[0].name, 'Starter');
  assert.equal(body.packages[0].price_idr, 49900);
  assert.equal(Array.isArray(body.packages[0].features), true);
  assert.ok(body.packages[0].features.length > 0);
  assert.equal(body.packages[0].checkout_eligible, true);
});

console.log(`ALL ${passed} DOKU TESTS PASSED`);
