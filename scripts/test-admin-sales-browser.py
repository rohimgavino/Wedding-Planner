"""Local intercepted admin UI, no external traffic or hosted writes."""
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
uid='11111111-1111-4111-8111-111111111111';ws='22222222-2222-4222-8222-222222222222'
user={'id':uid,'aud':'authenticated','role':'authenticated','email':'fixture@example.test','app_metadata':{},'user_metadata':{},'created_at':'2026-01-01T00:00:00Z'}
enc=lambda v:base64.urlsafe_b64encode(json.dumps(v).encode()).decode().rstrip('=')
token=enc({'alg':'HS256'})+'.'+enc({'sub':uid,'exp':int(time.time())+3600,'role':'authenticated'})+'.fixture'
session={'access_token':token,'refresh_token':'fixture','expires_at':int(time.time())+3600,'expires_in':3600,'token_type':'bearer','user':user}
role=None;calls=[];status='pending';fail=False;sales_fail=False;empty=False
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge');context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
 context.add_init_script("localStorage.setItem('sb-fixture-auth-token',"+json.dumps(json.dumps(session))+");")
 def route(r):
  global status
  req=r.request
  if req.url.startswith(base):return r.continue_()
  assert req.url.startswith('https://fixture.supabase.co/'),'External request blocked: '+req.url
  payload=json.loads(req.post_data) if req.post_data else None;calls.append((req.url,payload));code=200
  if '/auth/v1/user' in req.url:data=user
  elif '/rpc/site_role' in req.url:data=role
  elif '/rpc/admin_sales_report' in req.url:
   if sales_fail:code=403;data={'message':'admin required'}
   else:data={'gross_idr':'0' if empty else '500000','sale_count':0 if empty else 2,'excluded_verified':0,'rows':[],'generated_at':'2026-10-21T00:00:00Z'}
  elif '/rpc/admin_workspace_overview' in req.url:data=[{'workspace_id':ws,'member_count':2,'access_status':'expired','expires_at':'2026-10-01T00:00:00Z'}]
  elif '/rpc/list_site_admins' in req.url:data=[{'user_id':uid,'role':'developer','created_at':'2026-01-01'}]
  elif '/rpc/has_developer_test_access' in req.url:data=False
  elif '/rpc/reject_core_purchase' in req.url:
   assert payload=={'request_id':'request-fixture','note':'Duplicate historical request'}
   if fail:code=400;data={'message':'Fixture rejection failed'}
   else:status='rejected';data=None
  elif '/rest/v1/purchase_requests' in req.url:data=[{'id':'request-fixture','workspace_id':ws,'requested_by':uid,'price_idr':250000,'duration_days':365,'status':status,'transaction_reference':None,'review_note':None,'created_at':'2026-10-01'}]
  elif '/rest/v1/workspaces' in req.url:data=[]
  elif '/rest/v1/' in req.url:data=[]
  else:raise AssertionError('Unexpected API '+req.url)
  r.fulfill(status=code,content_type='application/json',body=json.dumps(data))
 context.route('**/*',route);page=context.new_page();page.goto(base+'/admin');page.get_by_text('Akses admin ditolak.',exact=True).wait_for();assert page.locator('form').count()==0
 role='operator';page.reload();page.get_by_role('heading',name='Ringkasan',exact=True).wait_for();page.get_by_role('button',name='Buka menu admin').click()
 assert page.get_by_role('button',name='Akses Admin',exact=True).count()==0
 page.get_by_role('button',name='Penjualan',exact=True).click()
 page.get_by_role('heading',name='Hasil penjualan historis',exact=True).wait_for()
 page.get_by_test_id('gross-sales').filter(has_text='500.000').wait_for()
 page.get_by_text('Gross tercatat, bukan bukti dana bank.',exact=False).wait_for()
 for width in [360,390,430,1280]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  page.screenshot(path=f'docs/admin-evidence/sales-{width}.png',full_page=True)
 page.get_by_label('Dari tanggal verifikasi (WIB)').fill('2026-10-22');page.get_by_label('Sampai tanggal verifikasi (WIB)').fill('2026-10-21')
 count=len([c for c in calls if '/admin_sales_report' in c[0]])
 page.get_by_role('button',name='Terapkan filter').click();page.get_by_role('alert').filter(has_text='Tanggal awal').wait_for()
 assert count==len([c for c in calls if '/admin_sales_report' in c[0]])
 page.get_by_label('Dari tanggal verifikasi (WIB)').fill('2026-10-01')
 sales_fail=True;page.get_by_role('button',name='Terapkan filter').click();page.get_by_role('alert').filter(has_text='Data lama').wait_for()
 assert page.get_by_test_id('gross-sales').count()==0
 sales_fail=False;empty=True;page.get_by_role('button',name='Terapkan filter').click();page.get_by_text('Belum ada penjualan tercatat untuk filter ini.',exact=True).wait_for()
 page.get_by_role('button',name='Workspace',exact=True).click();page.get_by_role('heading',name='Workspace & masa akses',level=2).wait_for()
 page.get_by_role('button',name='Audit',exact=True).click();page.get_by_role('heading',name='Audit append-only').wait_for()
 role='developer';page.reload();page.get_by_role('heading',name='Ringkasan',exact=True).wait_for();page.get_by_role('button',name='Akses Admin',exact=True).click();page.get_by_role('heading',name='Hak admin — developer saja').wait_for()
 assert not any('/verify_core_purchase' in c[0] or '/save_site_settings' in c[0] or '/set_site_admin' in c[0] for c in calls)
 role=None;page.reload();page.get_by_text('Akses admin ditolak.',exact=True).wait_for();assert page.locator('form').count()==0
 context.close();browser.close()
server.shutdown();print('PASS sales navigation, role visibility, exact RPC filters, invalid date/no request, error hides stale totals, empty, geometry 360/390/430/1280; all external traffic intercepted; zero mutations')
