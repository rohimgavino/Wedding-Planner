"""Authenticated empty dashboard transport fixture; no hosted network/writes.
Build first with NEXT_PUBLIC_SUPABASE_URL=https://fixture.supabase.co and
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_fixture npm run build.
"""
import base64
import json
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?')[0] in ['/dashboard', '/onboarding']:
            self.path = self.path.split('?')[0] + '.html'
        super().do_GET()
    def log_message(self, format, *args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory='out'))
Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
uid = '11111111-1111-4111-8111-111111111111'
user = dict(id=uid, aud='authenticated', role='authenticated', email='fixture@example.test', app_metadata={}, user_metadata={}, created_at='2026-01-01T00:00:00Z')
enc = lambda v: base64.urlsafe_b64encode(json.dumps(v).encode()).decode().rstrip('=')
token = enc({'alg': 'HS256'}) + '.' + enc({'sub': uid, 'exp': int(time.time()) + 3600, 'role': 'authenticated'}) + '.fixture'
session = dict(access_token=token, refresh_token='fixture', expires_at=int(time.time()) + 3600, expires_in=3600, token_type='bearer', user=user)
calls = []
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge')
    for banner in ['android', 'ios']:
        context = browser.new_context(service_workers='block', user_agent='iPhone Safari' if banner == 'ios' else None)
        context.add_init_script("localStorage.setItem('sb-fixture-auth-token', " + json.dumps(json.dumps(session)) + ");")
        def transport(route):
            r = route.request
            if r.url.startswith(base):
                route.continue_(); return
            assert r.url.startswith('https://fixture.supabase.co/'), 'Nonfixture network blocked'
            calls.append((r.method, r.url))
            if '/auth/v1/user' in r.url:
                data = user
            elif '/rpc/has_developer_test_access' in r.url:
                data = False
            elif '/rest/v1/' in r.url:
                assert r.method == 'GET', 'Unexpected write'
                data = []
            else:
                raise AssertionError('Unexpected fixture request')
            route.fulfill(status=200, content_type='application/json', body=json.dumps(data))
        context.route('**/*', transport)
        page = context.new_page()
        page.goto(base + '/dashboard')
        cta = page.get_by_role('link', name='Mulai Isi Data Pernikahan', exact=True)
        cta.wait_for()
        assert page.get_by_role('button', name='Keluar', exact=True).is_visible()
        assert any('/auth/v1/user' in url for _, url in calls)
        assert any('/rest/v1/workspaces' in url for _, url in calls)
        if banner == 'android':
            page.evaluate("window.dispatchEvent(new Event('beforeinstallprompt'))")
        page.get_by_text('Pasang Aplikasi di HP' if banner == 'android' else 'Pasang di iPhone / iPad', exact=True).wait_for()
        for width in [360, 390, 430, 1280]:
            page.set_viewport_size({'width': width, 'height': 844})
            for scale in [1, 2]:
                page.evaluate('(s)=>document.documentElement.style.fontSize=(16*s)+"px"', scale)
                metrics = cta.evaluate('''e=>{
                    const r=e.getBoundingClientRect(), p=e.parentElement.getBoundingClientRect();
                    const range=document.createRange();range.selectNodeContents(e);
                    const text=[...range.getClientRects()].filter(t=>t.width>0);
                    const b=[...document.querySelectorAll('body div')].find(x=>x.classList.contains('fixed') && x.textContent.includes('Pasang'));
                    const br=b.getBoundingClientRect();const card=e.parentElement.getBoundingClientRect();
                    return {width:r.width,height:r.height,cardTop:card.top,display:getComputedStyle(e).display,font:getComputedStyle(e).fontSize,
                    textFits:text.every(t=>t.left>=r.left && t.right<=r.right && t.top>=r.top && t.bottom<=r.bottom),
                    centered:Math.abs((r.left+r.right)-(p.left+p.right))<2,
                    noOverlap:br.top>=card.bottom,overflow:document.documentElement.scrollWidth>innerWidth};
                }''')
                results.append(dict(viewport=width, scale=scale, banner=banner, **metrics))
                print(json.dumps(results[-1]))
                assert metrics['width'] >= min(240, width - 80), metrics
                assert metrics['height'] >= 44 and metrics['textFits'] and metrics['centered'], metrics
                assert metrics['cardTop'] <= 100 and metrics['noOverlap'] and not metrics['overflow'], metrics
        # Guidance is read-only and remains usable, when present in the working tree.
        guidance = page.get_by_text('Contoh pengisian', exact=True)
        if guidance.count():
            guidance.click(); page.get_by_text('Raka & Nisa (fiktif)', exact=True).wait_for(); guidance.click()
        assert cta.get_attribute('href') == '/onboarding'
        context.close()
    browser.close()
server.shutdown()
assert not any(method != 'GET' and '/rpc/has_developer_test_access' not in url for method, url in calls)
print('PASS authenticated EMPTY dashboard, CTA bounds/text, 200% root text, Android/iOS PWA spacing, guidance; 16 cases; no hosted calls')
