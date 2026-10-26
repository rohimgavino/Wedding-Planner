"""Local-only auth transport fixture; NOT real Google/Supabase evidence.
Run against a static export built with URL https://fixture.supabase.co and
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_fixture. No hosted writes.
"""
import json, base64, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path=self.path.split('?')[0]
        if path in ['/login','/dashboard','/onboarding','/invite','/auth/callback']: self.path=path+'.html'
        super().do_GET()
    def log_message(self, format, *args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory='out'))
Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
uid='11111111-1111-4111-8111-111111111111'
ws='22222222-2222-4222-8222-222222222222'
user={'id':uid,'aud':'authenticated','role':'authenticated','email':'fixture@example.test','app_metadata':{},'user_metadata':{},'created_at':'2026-01-01T00:00:00Z'}
workspace={'id':ws,'title':'Fixture Couple','wedding_date':'2027-01-01','target_budget':100,'target_savings':0,'created_at':'2026-01-01T00:00:00Z'}
enc=lambda value:base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip('=')
token=enc({'alg':'HS256'})+'.'+enc({'sub':uid,'exp':int(time.time())+3600,'role':'authenticated'})+'.fixture'
session={'access_token':token,'refresh_token':'fixture','expires_at':int(time.time())+3600,'expires_in':3600,'token_type':'bearer','user':user}
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge')
    context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
    page=context.new_page()
    requests=[]
    def route(request):
        url=request.request.url
        requests.append((request.request.method,url,request.request.post_data))
        if '/auth/v1/authorize' in url:
            request.fulfill(status=200,content_type='text/plain',body='Local OAuth transport fixture')
        else:
            request.fulfill(status=401,content_type='application/json',body=json.dumps({'message':'no session'}))
    context.route('https://fixture.supabase.co/**',route)
    page.goto(base+'/dashboard')
    page.wait_for_url('**/login?next=*')
    assert page.locator('form').count()==0
    page.get_by_role('button',name='Lanjutkan dengan Google').click()
    page.wait_for_url('https://fixture.supabase.co/auth/v1/authorize*')
    assert 'provider=google' in page.url and 'code_challenge=' in page.url
    assert '%2Fauth%2Fcallback' in page.url
    context.close()
    context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
    context.add_init_script("localStorage.setItem('sb-fixture-auth-token',"+json.dumps(json.dumps(session))+ ");localStorage.setItem('everrae_workspace_v1','KEEP-LEGACY');")
    guests=[]
    savings=[]
    entitled=True
    def authenticated_route(route):
        r=route.request
        requests.append((r.method,r.url,r.post_data))
        if '/auth/v1/user' in r.url: data=user
        elif '/auth/v1/logout' in r.url: data={}
        elif '/rpc/has_developer_test_access' in r.url: data=False
        elif '/rpc/create_partner_invitation' in r.url: data='a'*64
        elif '/rpc/accept_partner_invitation' in r.url: data=ws
        elif '/rest/v1/workspaces' in r.url: data=[workspace]
        elif '/rest/v1/workspace_members' in r.url: data=[{'id':'member','workspace_id':ws,'user_id':uid,'role':'owner','display_name':'Fixture','created_at':'2026-01-01T00:00:00Z'}]
        elif '/rest/v1/guests' in r.url:
            if r.method=='POST':
                payload=json.loads(r.post_data)
                assert payload['workspace_id']==ws
                row={**payload,'id':'guest-fixture'};guests.append(row);data=row
            else: data=guests
        elif '/rest/v1/workspace_entitlements' in r.url: data=[{'workspace_id':ws,'feature':'core','verified_at':'2026-10-14','expires_at':None,'revoked_at':None}] if entitled else []
        elif '/rest/v1/savings_contributions' in r.url:
            if r.method=='POST':
                payload=json.loads(r.post_data);assert payload['workspace_id']==ws
                row={**payload,'id':'saving-fixture'};savings.append(row);data=row
            elif r.method=='PATCH':
                payload=json.loads(r.post_data);savings[0].update(payload);data=savings[0]
            elif r.method=='DELETE': savings.clear();data=[{'id':'saving-fixture'}]
            else: data=savings
        elif '/rest/v1/budgets' in r.url or '/rest/v1/tasks' in r.url: data=[]
        else: raise AssertionError('Unexpected fixture request '+r.url)
        route.fulfill(status=200,content_type='application/json',body=json.dumps(data))
    context.route('https://fixture.supabase.co/**',authenticated_route)
    page=context.new_page()
    page.goto(base+'/dashboard')
    page.get_by_text('Halo, Fixture Couple.',exact=True).first.wait_for()
    assert page.evaluate("localStorage.getItem('everrae_workspace_v1')")=='KEEP-LEGACY'
    assert 'tidak diunggah otomatis' in page.inner_text('body')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.reload()
    page.get_by_text('Halo, Fixture Couple.',exact=True).first.wait_for()
    page.get_by_role('button',name='Tabungan',exact=True).click()
    page.get_by_label('Kontributor',exact=True).select_option(uid)
    page.get_by_label('Nominal (Rp)',exact=True).fill('100')
    page.get_by_label('Tanggal kontribusi',exact=True).fill('2026-10-14')
    page.get_by_role('button',name='Catat kontribusi',exact=True).click()
    page.get_by_role('button',name='Edit kontribusi',exact=True).wait_for()
    page.get_by_role('button',name='Edit kontribusi',exact=True).click()
    page.get_by_label('Nominal (Rp)',exact=True).fill('200')
    page.get_by_role('button',name='Simpan perubahan',exact=True).click()
    page.wait_for_timeout(500)
    assert savings[0]['amount']==200
    for width in [360,390,430,1280]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
    page.set_viewport_size({'width':390,'height':844})
    page.reload();page.get_by_text('Halo, Fixture Couple.',exact=True).first.wait_for()
    page.get_by_role('button',name='Tabungan',exact=True).click()
    page.get_by_role('button',name='Edit kontribusi',exact=True).wait_for()
    page.on('dialog',lambda dialog:dialog.accept())
    page.get_by_role('button',name='Hapus kontribusi',exact=True).click()
    page.get_by_text('Belum ada kontribusi. Mulai dengan catatan pertama.').wait_for()
    entitled=False;page.reload()
    page.get_by_role('heading',name='Workspace menunggu aktivasi').wait_for()
    assert page.get_by_role('button',name='Catat kontribusi').count()==0
    entitled=True
    page.goto(base+'/invite?token='+'a'*64)
    page.get_by_role('button',name='Terima Undangan Pasangan').click()
    page.wait_for_url('**/dashboard')
    assert any('/rpc/accept_partner_invitation' in url and json.loads(body)=={'p_token':'a'*64} for method,url,body in requests if body)
    page.get_by_role('button',name='Keluar',exact=True).click()
    page.wait_for_url('**/login')
    assert 'Fixture Couple' not in page.inner_text('body')
    assert page.evaluate("localStorage.getItem('everrae_workspace_v1')")=='KEEP-LEGACY'
    context.close();browser.close()
server.shutdown()
print('PASS configured browser (mock transport only): auth guard/PKCE, savings CRUD/reload, entitlement lock, invite/logout, retained legacy, 360/390/430/1280px geometry')
