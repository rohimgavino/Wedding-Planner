"""Synthetic transport only, private ephemeral server, never parent preview."""
import base64,json,time
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path.split('?')[0] in ['/admin','/login']:self.path=self.path.split('?')[0]+'.html'
  super().do_GET()
 def log_message(self,format,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory='out'));Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}'
uid='11111111-1111-4111-8111-111111111111'
user={'id':uid,'aud':'authenticated','role':'authenticated','email':'fixture@example.test','app_metadata':{},'user_metadata':{},'created_at':'2026-01-01T00:00:00Z'}
enc=lambda v:base64.urlsafe_b64encode(json.dumps(v).encode()).decode().rstrip('=')
token=enc({'alg':'HS256'})+'.'+enc({'sub':uid,'exp':int(time.time())+3600,'role':'authenticated'})+'.fixture'
session={'access_token':token,'refresh_token':'fixture','expires_at':int(time.time())+3600,'expires_in':3600,'token_type':'bearer','user':user}
role='operator';calls=[];fail=False;save_fail=False
snapshot={'version':'1','amount_idr':'250000','currency':'IDR','duration_unit':'calendar_year','duration_count':1,'workspace_count':1,'created_at':'2026-10-22T00:00:00Z'}
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge');context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
 context.add_init_script("localStorage.setItem('sb-fixture-auth-token',"+json.dumps(json.dumps(session))+");")
 def route(r):
  req=r.request
  if req.url.startswith(base):return r.continue_()
  assert req.url.startswith('https://fixture.supabase.co/'),'External request blocked'
  payload=json.loads(req.post_data) if req.post_data else None;calls.append((req.url,payload));code=200
  if '/auth/v1/user' in req.url:data=user
  elif '/rpc/site_role' in req.url:data=role
  elif '/rpc/admin_package_pricing' in req.url:
   if fail:code=404;data={'message':'missing function'}
   else:data=snapshot.copy()
  elif '/rpc/admin_update_package_price' in req.url:
   assert payload=={'p_amount_idr':'300000','p_expected_version':'1','p_reason':'Approved synthetic change','p_confirmed':True}
   if save_fail:code=409;data={'message':'version conflict; reload'}
   else:snapshot.update(version='2',amount_idr='300000');data=snapshot.copy()
  elif '/rpc/' in req.url or '/rest/v1/' in req.url:data=[]
  else:raise AssertionError('Unexpected API '+req.url)
  r.fulfill(status=code,content_type='application/json',body=json.dumps(data))
 context.route('**/*',route);page=context.new_page();page.goto(base+'/admin');page.get_by_role('heading',name='Ringkasan',exact=True).wait_for();page.get_by_role('button',name='Buka menu admin').click();page.get_by_role('button',name='Paket & Harga',exact=True).click()
 page.get_by_test_id('current-package-price').filter(has_text='250.000').wait_for()
 for width in [360,390,430,1280]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  page.screenshot(path=f'docs/pricing-evidence/pricing-{width}.png',full_page=True)
 page.get_by_label('Harga baru (Rupiah bulat)').fill('2.5e5');page.get_by_label('Alasan perubahan').fill('Approved synthetic change');page.get_by_role('button',name='Tinjau perubahan').click();page.get_by_role('alert').filter(has_text='Harga harus').wait_for()
 assert not any('/admin_update_package_price' in c[0] for c in calls)
 page.get_by_label('Harga baru (Rupiah bulat)').fill('300000');page.get_by_role('button',name='Tinjau perubahan').click();page.get_by_role('button',name='Batal perubahan').click();assert not any('/admin_update_package_price' in c[0] for c in calls)
 page.get_by_role('button',name='Tinjau perubahan').click();save_fail=True;page.get_by_role('button',name='Konfirmasi harga baru').click();page.get_by_role('alert').filter(has_text='version conflict').wait_for();assert page.get_by_test_id('current-package-price').count()==0
 save_fail=False;page.get_by_role('button',name='Muat ulang harga').click();page.get_by_test_id('current-package-price').wait_for();page.get_by_label('Harga baru (Rupiah bulat)').fill('300000');page.get_by_role('button',name='Tinjau perubahan').click();page.get_by_role('button',name='Konfirmasi harga baru').click();page.get_by_role('status').filter(has_text='Harga tersimpan').wait_for();page.get_by_test_id('current-package-price').filter(has_text='300.000').wait_for()
 fail=True;page.get_by_role('button',name='Muat ulang harga').click();page.get_by_role('alert').filter(has_text='migration').wait_for();assert page.get_by_test_id('current-package-price').count()==0;assert page.get_by_role('button',name='Tinjau perubahan').count()==0
 role=None;page.reload();page.get_by_text('Akses admin ditolak.',exact=True).wait_for()
 assert not any('/save_site_settings' in c[0] or '/verify_core_purchase' in c[0] for c in calls)
 context.close();browser.close()
server.shutdown();print('PASS synthetic pricing UI operator, validation zero writes, cancel zero writes, CAS failure hides stale, confirmed save/reload, unavailable closed, revoked, geometry 360/390/430/1280; no hosted traffic')
