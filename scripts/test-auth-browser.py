"""Exercise real static export in Chromium, without hosted writes."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?')[0]
        if path in ['/login','/dashboard','/onboarding','/invite','/auth/callback','/demo']:
            self.path = path + '.html'
        super().do_GET()
    def log_message(self, format, *args): pass
server = ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory='out'))
Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge')
    for width in [360,390,430]:
        context=browser.new_context(viewport={'width':width,'height':844})
        page=context.new_page()
        page.goto(base)
        page.wait_for_timeout(400)
        assert page.locator('a[href="/onboarding"]').count()==0
        assert page.locator('.er-nav-actions a').count()==1
        assert page.locator('.er-nav-actions a').inner_text()=='Log In'
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'overflow home {width}'
        page.evaluate("localStorage.setItem('everrae_workspace_v1','KEEP-LEGACY')")
        for route in ['/dashboard','/onboarding','/invite?token='+'a'*64]:
            page.goto(base+route)
            page.locator('[role="alert"]:not(#__next-route-announcer__)').wait_for()
            assert 'belum dikonfigurasi' in page.locator('[role="alert"]:not(#__next-route-announcer__)').inner_text()
            assert page.locator('form').count()==0
            assert page.evaluate("localStorage.getItem('everrae_workspace_v1')")=='KEEP-LEGACY'
        page.goto(base+'/login')
        page.get_by_role('button',name='Google OAuth belum tersedia').wait_for()
        assert page.get_by_role('button',name='Google OAuth belum tersedia').is_disabled()
        assert page.locator('a[href="/onboarding"]').count()==0
        assert page.locator('input[type="email"]').count()==0
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.goto(base+'/auth/callback?error=access_denied')
        page.locator('[role="alert"]:not(#__next-route-announcer__)').wait_for()
        assert page.url==base+'/auth/callback'
        context.close()
    browser.close()
server.shutdown()
print('PASS browser: exported pages, fail-closed protected routes/login/callback, public login-only CTA, legacy retained, mobile 360/390/430px')
