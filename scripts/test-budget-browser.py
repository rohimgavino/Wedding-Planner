"""Intercepted local-only budget edit contract; no hosted requests/writes."""
import json,base64,time
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from urllib.parse import urlsplit,parse_qs
from playwright.sync_api import sync_playwright
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path.split('?')[0] in ['/dashboard','/login']:self.path=self.path.split('?')[0]+'.html'
  super().do_GET()
 def log_message(self,format,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory='out'));Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}'
uid='11111111-1111-4111-8111-111111111111';ws='22222222-2222-4222-8222-222222222222'
user={'id':uid,'aud':'authenticated','role':'authenticated','email':'fixture@example.test','app_metadata':{},'user_metadata':{},'created_at':'2026-01-01T00:00:00Z'}
enc=lambda v:base64.urlsafe_b64encode(json.dumps(v).encode()).decode().rstrip('=')
token=enc({'alg':'HS256'})+'.'+enc({'sub':uid,'exp':int(time.time())+3600,'role':'authenticated'})+'.fixture'
session={'access_token':token,'refresh_token':'fixture','expires_at':int(time.time())+3600,'expires_in':3600,'token_type':'bearer','user':user}
workspace={'id':ws,'title':'Fixture Couple','wedding_date':'2027-01-01','target_budget':10000,'target_savings':0}
row={'id':'budget','workspace_id':ws,'title':'Fotografer','category':'Kategori lama khusus','allocated_amount':1000,'spent_amount':0,'payment_status':'dp','notes':'Catatan lama'}
writes=[];failed=False;reads=0
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge');context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
 context.add_init_script("localStorage.setItem('sb-fixture-auth-token',"+json.dumps(json.dumps(session))+");")
 def route(route):
  global reads
  r=route.request;payload=json.loads(r.post_data) if r.post_data else None
  if r.method not in ['GET','OPTIONS'] and '/rpc/has_developer_test_access' not in r.url:
   writes.append((r.method,r.url,payload));assert r.method=='PATCH' and '/rest/v1/budgets?' in r.url
  if '/auth/v1/user' in r.url:data=user
  elif '/rpc/has_developer_test_access' in r.url:data=False
  elif '/rest/v1/workspaces' in r.url:data=[workspace]
  elif '/rest/v1/workspace_members' in r.url:data=[{'workspace_id':ws,'user_id':uid,'role':'owner'}]
  elif '/rest/v1/workspace_entitlements' in r.url:data=[{'workspace_id':ws,'feature':'core','expires_at':None,'revoked_at':None}]
  elif '/rest/v1/budgets' in r.url:
   query=parse_qs(urlsplit(r.url).query);assert query['workspace_id']==['eq.'+ws]
   if r.method=='PATCH':
    assert isinstance(payload,dict)
    assert query['id']==['eq.budget'];assert set(payload)=={'title','category','allocated_amount','spent_amount','payment_status','notes'}
    if failed:route.fulfill(status=500,content_type='application/json',body=json.dumps({'message':'fixture failure'}));return
    row.update(payload);data=row
   else:reads+=1;data=[row]
  elif '/rest/v1/' in r.url:data=[]
  else:raise AssertionError('Unexpected '+r.url)
  route.fulfill(status=200,content_type='application/json',body=json.dumps(data))
 context.route('https://fixture.supabase.co/**',route);page=context.new_page()
 def open_edit():
  page.get_by_role('button',name='Edit '+row['title'],exact=True).click();return page.get_by_role('dialog',name='Edit Pos Anggaran')
 def save():page.get_by_role('dialog').get_by_role('button',name='Simpan Perubahan',exact=True).click()
 page.goto(base+'/dashboard');page.get_by_role('button',name='Budget',exact=True).click()
 d=open_edit()
 for label,value in [('Nama / Keterangan Pos','Fotografer'),('Kategori Pos','Kategori lama khusus'),('Plafon Alokasi (Rp)','1000'),('Pengeluaran Riil (Rp)','0'),('Status Pembayaran','dp'),('Catatan','Catatan lama')]:assert d.get_by_label(label,exact=True).input_value()==value
 assert writes==[] and row['spent_amount']==0
 d.get_by_label('Nama / Keterangan Pos',exact=True).fill('Dibatalkan');d.get_by_role('button',name='Batal',exact=True).click();assert writes==[]
 d=open_edit();save();d.get_by_role('alert').wait_for();assert writes==[]
 d.get_by_label('Status Pembayaran',exact=True).select_option('paid');save();d.get_by_role('alert').wait_for();assert writes==[]
 d.get_by_label('Pengeluaran Riil (Rp)',exact=True).fill('100');d.get_by_label('Status Pembayaran',exact=True).select_option('unpaid');save();assert writes==[]
 for value in ['-1','1.5','9007199254740992']:
  d.get_by_label('Pengeluaran Riil (Rp)',exact=True).fill(value);save();assert writes==[]
 d.get_by_label('Status Pembayaran',exact=True).select_option('paid');d.get_by_label('Pengeluaran Riil (Rp)',exact=True).fill('100');d.get_by_label('Nama / Keterangan Pos',exact=True).fill('Foto selesai');d.get_by_label('Kategori Pos',exact=True).fill('Dokumentasi');d.get_by_label('Catatan',exact=True).fill('Harga final di bawah plafon')
 failed=True;save();d.get_by_role('alert').filter(has_text='belum berhasil').wait_for();assert d.get_by_label('Nama / Keterangan Pos',exact=True).input_value()=='Foto selesai';assert d.get_by_label('Pengeluaran Riil (Rp)',exact=True).input_value()=='100'
 failed=False;save();d.wait_for(state='hidden');assert row['payment_status']=='paid' and row['spent_amount']==100 and row['allocated_amount']==1000
 page.reload();page.get_by_role('button',name='Budget',exact=True).click();d=open_edit();assert d.get_by_label('Catatan',exact=True).input_value()=='Harga final di bawah plafon'
 for width in [360,390,430,1280]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
  box=d.bounding_box();assert box is not None;assert box['x']>=0 and box['x']+box['width']<=width and box['y']>=0 and box['height']<=844
  assert d.evaluate('(el)=>el.scrollWidth<=el.clientWidth')
  d.get_by_role('button',name='Simpan Perubahan',exact=True).scroll_into_view_if_needed();b=d.get_by_role('button',name='Simpan Perubahan',exact=True).bounding_box();assert b is not None;assert b['height']>=44
 d.get_by_role('button',name='Batal',exact=True).click();assert len(writes)==2 and reads>=3
 context.close();browser.close()
server.shutdown();print('PASS budget browser: legacy dp0 untouched, six-field prefill, cancel zero writes, validation zero writes, paid below estimate, failure preserves values, scoped PATCH+reload, 360/390/430/1280 geometry')
