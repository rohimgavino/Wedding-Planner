"""Transport fixture only; no hosted auth/payment/database operations."""
import json,base64,time
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
assert Path('out/admin.html').exists(), 'Admin static route missing'
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  path=self.path.split('?')[0]
  if path in ['/admin','/purchase','/login']:self.path=path+'.html'
  super().do_GET()
 def log_message(self,format,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory='out'));Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}'
uid='11111111-1111-4111-8111-111111111111';ws='22222222-2222-4222-8222-222222222222'
user={'id':uid,'aud':'authenticated','role':'authenticated','email':'fixture@example.test','app_metadata':{},'user_metadata':{},'created_at':'2026-01-01T00:00:00Z'}
enc=lambda value:base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip('=')
token=enc({'alg':'HS256'})+'.'+enc({'sub':uid,'exp':int(time.time())+3600,'role':'authenticated'})+'.fixture'
session={'access_token':token,'refresh_token':'fixture','expires_at':int(time.time())+3600,'expires_in':3600,'token_type':'bearer','user':user}
settings={'support_email':None,'price_idr':None,'duration_days':None,'lynk_url':None,'sales_enabled':False};purchases=[];calls=[];is_admin=False;site_role=None
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge');context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
 context.add_init_script("localStorage.setItem('sb-fixture-auth-token',"+json.dumps(json.dumps(session))+");")
 def route(route):
  global purchases,settings
  r=route.request;payload=json.loads(r.post_data) if r.post_data else None;calls.append((r.url,payload))
  if '/auth/v1/user' in r.url:data=user
  elif '/rpc/is_site_admin' in r.url:data=is_admin
  elif '/rpc/site_role' in r.url:data=site_role
  elif '/rpc/has_developer_test_access' in r.url:data=False
  elif '/rpc/list_site_admins' in r.url:data=[{'user_id':uid,'role':'developer','created_at':'2026-01-01'}]
  elif '/rpc/set_site_admin' in r.url:
   assert payload=={'p_user_id':uid,'p_role':'operator','p_reason':'fixture approved'};data=None
  elif '/rpc/grant_developer_test_access' in r.url:
   assert payload=={'p_workspace_id':ws,'p_days':7,'p_reason':'fixture own test'};data=None
  elif '/rpc/save_site_settings' in r.url:
   assert payload is not None
   settings={'support_email':payload['email'],'price_idr':payload['price'],'duration_days':payload['days'],'lynk_url':payload['url'],'sales_enabled':payload['enabled']};data=None
  elif '/rpc/request_core_purchase' in r.url:
   assert payload=={'ws_id':ws};purchases=[{'id':'request-fixture','workspace_id':ws,'requested_by':uid,'price_idr':100,'duration_days':30,'lynk_url':'https://lynk.id/shop/product','status':'pending','transaction_reference':None,'review_note':None,'created_at':'2026-10-14'}];data='request-fixture'
  elif '/rpc/verify_core_purchase' in r.url:
   assert payload=={'request_id':'request-fixture','reference':'TX-ONE','paid_amount':100,'dashboard_confirmed':True,'note':'Cocok dashboard'};purchases[0]['status']='verified';data=None
  elif '/rest/v1/site_settings' in r.url:data=settings
  elif '/rest/v1/purchase_requests' in r.url:data=purchases
  elif '/rest/v1/admin_audit' in r.url:data=[]
  elif '/rest/v1/workspaces' in r.url:data=[{'id':ws,'title':'Fixture Couple','wedding_date':'2027-01-01','target_budget':0,'target_savings':0,'created_at':'2026-01-01'}]
  elif '/rest/v1/workspace_members' in r.url:data=[{'workspace_id':ws,'user_id':uid,'role':'owner','display_name':'Fixture'}]
  elif '/rest/v1/' in r.url:data=[]
  else:raise AssertionError('Unexpected fixture '+r.url)
  route.fulfill(status=200,content_type='application/json',body=json.dumps(data))
 context.route('https://fixture.supabase.co/**',route);page=context.new_page()
 page.goto(base+'/admin');page.get_by_text('Akses admin ditolak.',exact=True).wait_for();assert page.locator('form').count()==0
 is_admin=True;site_role='operator';page.reload();page.get_by_text('Penjualan belum dikonfigurasi.',exact=True).wait_for();assert page.get_by_role('heading',name='Hak admin — developer saja').count()==0;assert page.get_by_role('heading',name='Akses uji nonpembayaran').count()==0
 page.get_by_label('Email dukungan').fill('help@example.com');page.get_by_label('Harga paket inti (IDR)').fill('100');page.get_by_label('Durasi akses (hari)').fill('30');page.get_by_label('URL produk Lynk.id').fill('https://lynk.id/shop/product');page.get_by_label('Buka penjualan paket inti').check();page.get_by_role('button',name='Simpan pengaturan').click();page.get_by_text('Pengaturan tersimpan.',exact=True).wait_for()
 page.goto(base+'/purchase');page.get_by_role('button',name='Buat permintaan pembelian').click();page.get_by_text('pending',exact=True).wait_for();assert page.get_by_role('link',name='Bayar di Lynk.id').get_attribute('href')=='https://lynk.id/shop/product'
 page.goto(base+'/admin');page.get_by_role('button',name='Periksa permintaan request-fixture').click();page.get_by_label('Referensi transaksi resmi').fill('tx-one');page.get_by_label('Nominal lunas di dashboard (IDR)').fill('100');page.get_by_label('Catatan pemeriksaan').fill('Cocok dashboard');page.get_by_label('Saya telah memeriksa dashboard Lynk.id: lunas, produk, nominal, pembeli dan workspace cocok.').check();page.get_by_role('button',name='Verifikasi & aktifkan').click();page.get_by_text('verified',exact=True).wait_for()
 site_role='developer';page.reload();page.get_by_role('heading',name='Hak admin — developer saja').wait_for();page.get_by_label('UUID Auth terverifikasi').fill(uid);page.get_by_label('Alasan / tiket persetujuan').fill('fixture approved');page.get_by_role('button',name='Perbarui hak admin').click();page.get_by_text('Hak admin diperbarui dan diaudit.',exact=True).wait_for();page.get_by_label('Durasi uji (1–30 hari)').fill('7');page.get_by_label('Alasan uji',exact=True).fill('fixture own test');page.get_by_role('button',name='Aktifkan akses uji sendiri').click();page.get_by_text('Grant uji dicatat; muat ulang workspace.',exact=True).wait_for()
 for width in [360,390,430,1280]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
  for path in ['/admin','/purchase']:
   page.goto(base+path);page.get_by_role('heading',level=1).wait_for();assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(path,width)
 assert not any('service_role' in str(c) for c in calls)
 context.close();browser.close()
server.shutdown();print('PASS admin deny/setup/settings/manual verification, workspace purchase and responsive 360/390/430/1280 — transport fixture only')
