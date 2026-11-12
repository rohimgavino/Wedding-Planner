"""Transport fixture only; no hosted auth/payment/database operations."""
import json
import base64
import time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright

assert Path('out/admin.html').exists(), 'Admin static route missing'


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?')[0]
        if path in ['/admin', '/purchase', '/login']:
            self.path = path + '.html'
        super().do_GET()

    def log_message(self, format, *args):
        pass


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory='out'))
Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'

uid = '11111111-1111-4111-8111-111111111111'
ws = '22222222-2222-4222-8222-222222222222'
user = {
    'id': uid,
    'aud': 'authenticated',
    'role': 'authenticated',
    'email': 'fixture@example.test',
    'app_metadata': {},
    'user_metadata': {},
    'created_at': '2026-01-01T00:00:00Z',
}
enc = lambda value: base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip('=')
token = enc({'alg': 'HS256'}) + '.' + enc({'sub': uid, 'exp': int(time.time()) + 3600, 'role': 'authenticated'}) + '.fixture'
session = {
    'access_token': token,
    'refresh_token': 'fixture',
    'expires_at': int(time.time()) + 3600,
    'expires_in': 3600,
    'token_type': 'bearer',
    'user': user,
}

sales_enabled = False
support_email = None
orders = []
calls = []
site_role = None

PACKAGES = [
    {
        'id': 'starter',
        'name': 'Starter',
        'description': 'Paket inti 365 hari.',
        'base_amount_idr': 49900,
        'price_idr': 49900,
        'duration_days': 365,
        'features': ['Anggaran', 'Checklist'],
        'checkout_eligible': True,
    },
    {
        'id': 'premium',
        'name': 'Premium',
        'description': 'Paket lengkap.',
        'base_amount_idr': 79900,
        'price_idr': 79900,
        'duration_days': 365,
        'features': ['Tamu', 'Tabungan'],
        'checkout_eligible': True,
    },
    {
        'id': 'wedding_pro',
        'name': 'Wedding Pro',
        'description': 'Paket pro.',
        'base_amount_idr': 99900,
        'price_idr': 99900,
        'duration_days': 365,
        'features': ['Semua fitur'],
        'checkout_eligible': True,
    },
]

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge')
    context = browser.new_context(viewport={'width': 390, 'height': 844}, service_workers='block')
    context.add_init_script("localStorage.setItem('sb-fixture-auth-token'," + json.dumps(json.dumps(session)) + ');')

    def route_supabase(route):
        global sales_enabled, support_email
        r = route.request
        payload = json.loads(r.post_data) if r.post_data else None
        calls.append((r.url, payload))
        if '/auth/v1/user' in r.url:
            data = user
        elif '/rpc/site_role' in r.url:
            data = site_role
        elif '/rpc/has_developer_test_access' in r.url:
            data = False
        elif '/rpc/list_site_admins' in r.url:
            data = [{'user_id': uid, 'role': 'developer', 'created_at': '2026-01-01'}]
        elif '/rpc/set_site_admin' in r.url:
            assert payload == {'p_user_id': uid, 'p_role': 'operator', 'p_reason': 'fixture approved'}
            data = None
        elif '/rpc/grant_developer_test_access' in r.url:
            assert payload == {'p_workspace_id': ws, 'p_days': 7, 'p_reason': 'fixture own test'}
            data = None
        elif '/rpc/admin_set_sales_activation' in r.url:
            assert payload is not None
            sales_enabled = bool(payload['p_enabled'])
            support_email = payload['p_support_email']
            data = {'sales_activation': sales_enabled, 'support_email': support_email}
        elif '/rpc/admin_doku_orders' in r.url:
            data = orders
        elif '/rest/v1/admin_audit' in r.url:
            data = []
        elif '/rest/v1/workspaces' in r.url:
            data = [{'id': ws, 'title': 'Fixture Couple', 'wedding_date': '2027-01-01', 'target_budget': 0, 'target_savings': 0, 'created_at': '2026-01-01'}]
        elif '/rest/v1/workspace_members' in r.url:
            data = [{'workspace_id': ws, 'user_id': uid, 'role': 'owner', 'display_name': 'Fixture'}]
        elif '/rest/v1/' in r.url:
            data = []
        else:
            raise AssertionError('Unexpected fixture ' + r.url)
        route.fulfill(status=200, content_type='application/json', body=json.dumps(data))

    def route_payments(route):
        r = route.request
        payload = json.loads(r.post_data) if r.post_data else None
        calls.append((r.url, payload))
        if '/api/payments/catalog' in r.url:
            route.fulfill(
                status=200,
                content_type='application/json',
                body=json.dumps({
                    'salesEnabled': sales_enabled,
                    'supportEmail': support_email,
                    'serverNow': '2026-11-12T10:00:00Z',
                    'packages': PACKAGES,
                    'dokuConfigured': True,
                }),
            )
            return
        if '/api/payments/status' in r.url:
            route.fulfill(
                status=200,
                content_type='application/json',
                body=json.dumps({'orders': orders, 'entitlements': []}),
            )
            return
        if '/api/payments/checkout' in r.url:
            assert payload == {'workspaceId': ws, 'packageId': 'starter'}
            order = {
                'invoice': 'pp-fixture-001',
                'workspace_id': ws,
                'payer_id': uid,
                'package_id': 'starter',
                'amount_idr': 49900,
                'duration_days': 365,
                'status': 'checkout_ready',
                'checkout_url': 'https://checkout.doku.com/checkout/fixture',
                'payment_channel': None,
                'doku_http_status': 200,
                'error_code': None,
                'expires_at': '2026-11-12T11:00:00Z',
                'created_at': '2026-11-12T10:00:00Z',
                'paid_at': None,
            }
            orders.clear()
            orders.append(order)
            route.fulfill(
                status=200,
                content_type='application/json',
                body=json.dumps({
                    'status': 'checkout_ready',
                    'invoice': 'pp-fixture-001',
                    'packageId': 'starter',
                    'amountIdr': 49900,
                    'checkoutUrl': 'https://checkout.doku.com/checkout/fixture',
                    'expiresAt': '2026-11-12T11:00:00Z',
                }),
            )
            return
        raise AssertionError('Unexpected API route ' + r.url)

    context.route('https://fixture.supabase.co/**', route_supabase)
    context.route(f'{base}/api/payments/**', route_payments)
    context.route('https://checkout.doku.com/**', lambda r: r.fulfill(status=200, content_type='text/html', body='<h1>DOKU Fixture</h1>'))

    page = context.new_page()
    page.goto(base + '/admin')
    page.get_by_text('Akses admin ditolak.', exact=True).wait_for()
    assert page.locator('form').count() == 0

    site_role = 'operator'
    page.reload()
    page.get_by_role('heading', name='Kontrol penjualan DOKU Checkout', exact=True).wait_for()
    assert page.get_by_role('button', name='Akses Admin').count() == 0

    page.get_by_label('Email dukungan pelanggan').fill('help@pocketwedding.id')
    page.get_by_label('Alasan perubahan').fill('Buka penjualan DOKU')
    page.get_by_label('Aktifkan penjualan paket melalui DOKU Checkout').check()
    page.get_by_label('Saya mengonfirmasi perubahan status penjualan ini akan diaudit.').check()
    page.get_by_role('button', name='Simpan kontrol penjualan').click()
    page.get_by_text('Kontrol penjualan DOKU diperbarui dan diaudit.', exact=True).wait_for()

    page.goto(base + '/purchase')
    page.get_by_role('heading', name='Starter', exact=True).wait_for()
    page.get_by_role('button', name='Bayar via DOKU').first.click()
    page.get_by_role('heading', name='DOKU Fixture').wait_for()

    def open_tab(name):
        toggle = page.get_by_role('button', name='Buka menu admin')
        if toggle.is_visible():
            toggle.click()
        page.locator('#admin-navigation').get_by_role('button', name=name, exact=True).click()

    page.goto(base + '/admin')
    page.get_by_role('heading', name='Kontrol penjualan DOKU Checkout', exact=True).wait_for()
    open_tab('Penjualan')
    page.get_by_text('pp-fixture-001', exact=False).wait_for()

    site_role = 'developer'
    page.reload()
    page.get_by_role('heading', name='Kontrol penjualan DOKU Checkout', exact=True).wait_for()
    open_tab('Akses Admin')
    page.get_by_role('heading', name='Hak admin — developer saja').wait_for()
    page.get_by_label('UUID Auth terverifikasi').fill(uid)
    page.get_by_label('Alasan / tiket persetujuan').fill('fixture approved')
    page.get_by_role('button', name='Perbarui hak admin').click()
    page.get_by_text('Hak admin diperbarui dan diaudit.', exact=True).wait_for()

    open_tab('Workspace')
    page.get_by_label('UUID workspace uji').fill(ws)
    page.get_by_label('Durasi (hari, 1–30)').fill('7')
    page.get_by_label('Alasan akses uji').fill('fixture own test')
    page.get_by_role('button', name='Beri akses uji sementara').click()
    page.get_by_text('Akses uji sementara diberikan dan diaudit.', exact=True).wait_for()

    for width in [360, 390, 430, 1280]:
        page.set_viewport_size({'width': width, 'height': 844})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
        for path in ['/admin', '/purchase']:
            page.goto(base + path)
            page.get_by_role('heading', level=1).wait_for()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (path, width)

    assert not any('service_role' in str(c) for c in calls)
    context.close()
    browser.close()

server.shutdown()
print('PASS admin deny/DOKU sales activation/order view/checkout and responsive 360/390/430/1280 — transport fixture only')
