const assert = require('node:assert/strict');
const fs = require('node:fs');

const purchase = fs.readFileSync('src/app/purchase/page.tsx', 'utf8');
const activation = fs.readFileSync('src/components/everrae/workspace-activation.tsx', 'utf8');
const landing = fs.readFileSync('src/components/everrae/landing-sections.tsx', 'utf8');
const commerce = fs.readFileSync('src/lib/commerce.ts', 'utf8');
const adminPanel = fs.readFileSync('src/components/admin-release-panel.tsx', 'utf8');

assert(purchase.includes('DOKU'), 'Purchase page must integrate DOKU Checkout');
assert(purchase.includes('startDokuCheckout'), 'Purchase page must use startDokuCheckout');
assert(!purchase.includes('AuthGate'), 'Public purchase explanation must remain visible without AuthGate');
assert(!/validLynkURL|\.request\(|\.verify\(|\.settings\(|href=\{p\.lynk_url\}|lynk\.id/i.test(purchase), 'No legacy Lynk or settings path in purchase page');

assert(!/Lynk|verifikasi manual|diverifikasi manual/i.test(activation), 'Activation must not offer manual or Lynk payment');
assert(activation.includes('DOKU'), 'Activation must mention DOKU');

assert(!/Lynk|lynk/i.test(landing), 'Public landing copy must not mention Lynk');
assert(landing.includes('DOKU Checkout'), 'Public landing pricing/FAQ must mention DOKU Checkout');

assert(!/Lynk|lynk|request_core_purchase|verify_core_purchase|reject_core_purchase|save_site_settings/i.test(commerce), 'Commerce client must only expose DOKU checkout & admin controls');
assert(!/Pembayaran belum tersedia|DOKU belum terintegrasi|verify_core_purchase|reject_core_purchase|lynk/i.test(adminPanel), 'Admin panel must not have legacy placeholders or manual purchase approval');

console.log('PASS DOKU-only Checkout contract across purchase, activation, landing, commerce, and admin panel');
