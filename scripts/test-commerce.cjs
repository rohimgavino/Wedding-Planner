const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

const m = new Module('commerce', module);
m._compile(
  ts.transpileModule(fs.readFileSync('src/lib/commerce.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  'commerce'
);

const {
  isValidSupportEmail,
  parsePositiveInt,
  parseSalesActivation,
  formatOrderStatus,
  isOrderCheckoutActive,
  Commerce,
} = m.exports;

assert.equal(isValidSupportEmail('help@pocketwedding.id'), true);
assert.equal(isValidSupportEmail('bad email'), false);
assert.equal(parsePositiveInt('30', 30), 30);
assert.throws(() => parsePositiveInt('0', 30));
assert.throws(() => parsePositiveInt('31', 30));

assert.deepEqual(
  parseSalesActivation(true, ' help@pocketwedding.id ', ' Buka penjualan DOKU ', true),
  {
    p_enabled: true,
    p_support_email: 'help@pocketwedding.id',
    p_reason: 'Buka penjualan DOKU',
    p_confirmed: true,
  }
);
assert.deepEqual(
  parseSalesActivation(false, '', 'Tutup sementara', true),
  {
    p_enabled: false,
    p_support_email: null,
    p_reason: 'Tutup sementara',
    p_confirmed: true,
  }
);
assert.throws(() => parseSalesActivation(true, 'help@pocketwedding.id', 'Alasan', false));
assert.throws(() => parseSalesActivation(true, 'help@pocketwedding.id', '   ', true));
assert.throws(() => parseSalesActivation(true, 'invalid-email', 'Alasan', true));

assert.deepEqual(formatOrderStatus('paid'), { label: 'Lunas', tone: 'green' });
assert.deepEqual(formatOrderStatus('checkout_ready'), { label: 'Menunggu pembayaran', tone: 'amber' });
assert.deepEqual(formatOrderStatus('unknown'), { label: 'Menunggu konfirmasi gateway', tone: 'amber' });
assert.deepEqual(formatOrderStatus('failed'), { label: 'Gagal', tone: 'rose' });

const now = Date.parse('2026-11-12T10:00:00Z');
assert.equal(
  isOrderCheckoutActive(
    { status: 'checkout_ready', checkout_url: 'https://checkout.doku.com/checkout/abc', expires_at: '2026-11-12T11:00:00Z' },
    now
  ),
  true
);
assert.equal(
  isOrderCheckoutActive(
    { status: 'checkout_ready', checkout_url: 'https://checkout.doku.com/checkout/abc', expires_at: '2026-11-12T09:59:00Z' },
    now
  ),
  false
);
assert.equal(
  isOrderCheckoutActive(
    { status: 'paid', checkout_url: 'https://checkout.doku.com/checkout/abc', expires_at: '2026-11-12T11:00:00Z' },
    now
  ),
  false
);

const calls = [];
const client = {
  rpc: async (name, args) => {
    calls.push([name, args]);
    if (name === 'admin_doku_orders') return { data: [{ invoice: 'pp-001', status: 'paid' }], error: null };
    return { data: null, error: null };
  },
};

(async () => {
  const c = new Commerce(client);
  await c.setSalesActivation(true, 'help@pocketwedding.id', 'Aktifkan tahap C', true);
  const orders = await c.dokuOrders();
  assert.equal(orders.length, 1);
  assert.equal(orders[0].invoice, 'pp-001');
  assert.deepEqual(calls, [
    [
      'admin_set_sales_activation',
      {
        p_enabled: true,
        p_support_email: 'help@pocketwedding.id',
        p_reason: 'Aktifkan tahap C',
        p_confirmed: true,
      },
    ],
    ['admin_doku_orders', undefined],
  ]);
  await assert.rejects(c.setSalesActivation(true, 'help@pocketwedding.id', 'Alasan', false));
  console.log('PASS commerce DOKU Checkout validation and RPC contracts');
})();
