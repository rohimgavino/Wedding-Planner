"""Admin-only isolated build, intercepted transport, never hosted writes."""
import json,base64,time,sys
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
from playwright.sync_api import sync_playwright
root=Path(sys.argv[1]);assert (root/'out/admin.html').exists();assert not (root/'out/purchase.html').exists()
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path in ['/admin','/dashboard','/login']:self.path+='.html'
  super().do_GET()
 def log_message(self,format,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(root/'out')));Thread(target=server.serve_forever,daemon=True).start()
uid='11111111-1111-4111-8111-111111111111';ws='22222222-2222-4222-8222-222222222222'
user={'id':uid,'aud':'authenticated','role':'authenticated','email':'fixture@example.test','app_metadata':{},'user_metadata':{},'created_at':'2026-01-01T00:00:00Z'}
enc=lambda x:base64.urlsafe_b64encode(json.dumps(x).encode()).decode().rstrip('=')
token=enc({'alg':'HS256'})+'.'+enc({'sub':uid,'exp':int(time.time())+3600,'role':'authenticated'})+'.fixture'
session={'access_token':token,'refresh_token':'fixture','expires_at':int(time.time())+3600,'expires_in':3600,'token_type':'bearer','user':user}
role=None;calls=[]
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge');context=browser.new_context(viewport={'width':390,'height':844},service_workers='block');context.add_init_script("localStorage.setItem('sb-fixture-auth-token',"+json.dumps(json.dumps(session))+");")
 def intercept(route):
  r=route.request;payload=json.loads(r.post_data) if r.post_data else None;calls.append(r.url)
  if '/auth/v1/user' in r.url:data=user
  elif '/rpc/site_role' in r.url:data=role
  elif '/rpc/list_site_admins' in r.url:data=[{'user_id':uid,'role':'developer','created_at':'2026-01-01'}]
  elif '/rpc/save_site_settings' in r.url:
   assert payload is not None and payload['enabled'] is False;data=None
  elif '/rpc/set_site_admin' in r.url:
   assert payload=={'p_user_id':uid,'p_role':'operator','p_reason':'fixture approved'};data=None
  elif '/rest/v1/site_settings' in r.url:data={'support_email':None,'price_idr':None,'duration_days':None,'lynk_url':None,'sales_enabled':False}
  elif '/rest/v1/workspaces' in r.url:data=[{'id':ws,'title':'Own','wedding_date':'2027-01-01','target_budget':0,'target_savings':0,'created_at':'2026-01-01'}]
  elif '/rest/v1/workspace_members' in r.url:data=[{'workspace_id':ws,'user_id':uid,'role':'owner','display_name':'Fixture'}]
  elif '/rest/v1/' in r.url:data=[]
  else:raise AssertionError(r.url)
  route.fulfill(status=200,content_type='application/json',body=json.dumps(data))
 context.route('https://fixture.supabase.co/**',intercept);page=context.new_page();base=f'http://127.0.0.1:{server.server_port}'
 page.goto(base+'/admin');page.get_by_text('Akses admin ditolak.',exact=True).wait_for();assert page.locator('form').count()==0
 role='operator';page.reload();page.get_by_role('heading',name='Operator situs',exact=True).wait_for();assert page.get_by_role('heading',name='Hak admin — developer saja').count()==0
 assert page.get_by_label('Penjualan dinonaktifkan pada tahap admin').is_disabled();page.get_by_role('button',name='Simpan pengaturan').click();page.get_by_text('Pengaturan tersimpan.',exact=True).wait_for()
 role='developer';page.reload();page.get_by_role('heading',name='Hak admin — developer saja').wait_for();page.get_by_label('UUID Auth terverifikasi').fill(uid);page.get_by_label('Alasan / tiket persetujuan').fill('fixture approved');page.get_by_role('button',name='Perbarui hak admin').click();page.get_by_text('Hak admin diperbarui dan diaudit.',exact=True).wait_for()
 for width in [360,390,430,1280]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.goto(base+'/dashboard');page.get_by_text('Memuat workspace cloud…',exact=True).wait_for(state='hidden');assert not page.get_by_text('Aktifkan workspace',exact=True).count()
 assert not any(any(s in url for s in ['workspace_entitlements','savings_contributions','has_developer_test_access','reset_planning_content','request_core_purchase']) for url in calls)
 context.close();browser.close()
server.shutdown();print('PASS admin-only deny/operator/developer, disabled sales POST, baseline planner loads without pending dependencies, responsive 360/390/430/1280; fixture only')
