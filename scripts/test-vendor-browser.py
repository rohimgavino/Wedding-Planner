"""Local transport fixture; every Supabase request intercepted, no hosted writes."""
import json,base64,time
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  path=self.path.split('?')[0]
  if path in ['/onboarding','/dashboard','/login']:self.path=path+'.html'
  super().do_GET()
 def log_message(self,format,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory='out'));Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}'
uid='11111111-1111-4111-8111-111111111111';ws='22222222-2222-4222-8222-222222222222'
user={'id':uid,'aud':'authenticated','role':'authenticated','email':'fixture@example.test','app_metadata':{},'user_metadata':{},'created_at':'2026-01-01T00:00:00Z'}
enc=lambda v:base64.urlsafe_b64encode(json.dumps(v).encode()).decode().rstrip('=')
token=enc({'alg':'HS256'})+'.'+enc({'sub':uid,'exp':int(time.time())+3600,'role':'authenticated'})+'.fixture'
session={'access_token':token,'refresh_token':'fixture','expires_at':int(time.time())+3600,'expires_in':3600,'token_type':'bearer','user':user}
from datetime import datetime,timedelta,timezone
from urllib.parse import urlparse,parse_qs
today=datetime.now(timezone(timedelta(hours=7))).date().isoformat()
workspace={'id':ws,'title':'Fixture Couple','wedding_date':'2027-01-01','target_budget':100,'target_savings':50,'created_at':'2026-01-01'}
rows={'vendors':[],'vendor_installments':[],'vendor_payments':[],'tasks':[{'id':'task','workspace_id':ws,'title':'Real deadline','due_date':today,'is_completed':False,'phase':'Hari H','pic':'both'}]}
calls=[]
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge');context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
 context.add_init_script("localStorage.setItem('sb-fixture-auth-token',"+json.dumps(json.dumps(session))+");")
 def route(route):
  r=route.request;payload=json.loads(r.post_data) if r.post_data else None;calls.append((r.method,r.url,payload))
  table=urlparse(r.url).path.split('/')[-1];query=parse_qs(urlparse(r.url).query)
  if '/auth/v1/user' in r.url:data=user
  elif table=='has_developer_test_access':data=False
  elif table=='workspaces':data=[workspace]
  elif table=='workspace_members':data=[{'workspace_id':ws,'user_id':uid,'role':'owner','display_name':'Fixture'}]
  elif table=='workspace_entitlements':data=[{'workspace_id':ws,'feature':'core','expires_at':None,'revoked_at':None}]
  elif table in rows:
   if r.method=='POST':
    assert payload['workspace_id']==ws;assert table!='tasks';row={**payload,'id':str(len(rows[table])+1)};rows[table].append(row);data=row
   elif r.method in ['PATCH','DELETE']:
    assert query['workspace_id']==['eq.'+ws];key=query['id'][0][3:];row=next(x for x in rows[table] if x['id']==key)
    if r.method=='PATCH':assert 'workspace_id' not in payload;row.update(payload);data=row
    else:rows[table].remove(row);data=[{'id':key}]
   else:data=rows[table]
  elif '/rest/v1/' in r.url:
   assert r.method=='GET',r.url;data=[]
  else:raise AssertionError(r.url)
  route.fulfill(status=200,content_type='application/json',body=json.dumps(data))
 context.route('https://**.supabase.co/**',route);page=context.new_page();page.goto(base+'/dashboard')
 page.get_by_role('heading',name='Prioritas minggu ini',exact=True).wait_for();page.get_by_text('Real deadline',exact=True).first.wait_for()
 page.get_by_role('button',name='Tambah tugas',exact=True).first.click();page.get_by_label('Tenggat tugas (opsional, WIB)',exact=True).wait_for();page.get_by_role('dialog').get_by_role('button',name='Batal',exact=True).click()
 page.get_by_role('button',name='Vendor & Pembayaran',exact=True).click()
 page.get_by_role('button',name='Tambah vendor',exact=True).click()
 page.get_by_label('Nama vendor',exact=True).fill('Venue nyata');page.get_by_label('Total kontrak (Rp)',exact=True).fill('1000');page.get_by_label('Kontak vendor',exact=True).fill('PIC');page.get_by_label('Catatan kontrak',exact=True).fill('Catatan nyata')
 page.get_by_role('button',name='Simpan catatan',exact=True).click();page.get_by_role('heading',name='Venue nyata',exact=True).wait_for()
 page.get_by_role('button',name='Edit vendor',exact=True).click();page.get_by_label('Nama vendor',exact=True).fill('Venue revisi');page.get_by_role('button',name='Simpan catatan',exact=True).click();page.get_by_role('heading',name='Venue revisi',exact=True).wait_for()
 page.get_by_role('button',name='Tambah termin',exact=True).click();page.get_by_label('Judul termin',exact=True).fill('DP nyata');page.get_by_label('Jumlah (Rp)',exact=True).fill('600');page.get_by_label('Jatuh tempo',exact=True).fill(today);page.get_by_role('button',name='Simpan catatan',exact=True).click();page.get_by_text('DP nyata',exact=True).wait_for()
 page.get_by_role('button',name='Catat pembayaran',exact=True).click();page.get_by_label('Jumlah (Rp)',exact=True).fill('200');page.get_by_label('Tanggal pembayaran',exact=True).fill(today);page.get_by_role('button',name='Simpan catatan',exact=True).click();page.get_by_text('Sisa termin: Rp 400',exact=True).wait_for()
 for width in [360,390,430,1280]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
 page.set_viewport_size({'width':390,'height':844});page.reload();page.get_by_role('button',name='Vendor & Pembayaran',exact=True).click();page.get_by_role('heading',name='Venue revisi',exact=True).wait_for();page.get_by_text('Sisa termin: Rp 400',exact=True).wait_for()
 rows['tasks']=[]
 page.reload();page.get_by_role('button',name='Pengaturan',exact=True).wait_for()
 page.get_by_role('button',name='Pengaturan',exact=True).click()
 assert page.get_by_role('button',name='Gunakan template contoh',exact=True).count()==0,'vendor-only workspace is not empty'
 page.get_by_role('button',name='Reset rencana dari nol',exact=True).click();page.get_by_role('dialog').get_by_text('Semua vendor, kontak, kontrak, termin dan catatan pembayaran manual.',exact=True).wait_for();page.get_by_role('dialog').get_by_role('button',name='Batal',exact=True).click()
 page.get_by_role('button',name='Vendor & Pembayaran',exact=True).click()
 dialogs=[]
 def cancel_payment(dialog):
  dialogs.append(dialog.message);dialog.dismiss()
 page.on('dialog',cancel_payment)
 before=len([c for c in calls if c[0]=='DELETE'])
 page.get_by_role('button',name='Hapus pembayaran',exact=True).click();page.wait_for_timeout(200)
 assert len(dialogs)==1,'payment deletion must require confirmation'
 assert len([c for c in calls if c[0]=='DELETE'])==before,'cancel must not delete'
 page.get_by_text('Sisa termin: Rp 400',exact=True).wait_for()
 page.remove_listener('dialog',cancel_payment)
 page.once('dialog',lambda d:d.accept())
 page.get_by_role('button',name='Hapus pembayaran',exact=True).click();page.get_by_text('Sisa termin: Rp 600',exact=True).wait_for()
 page.on('dialog',lambda d:d.accept());page.get_by_role('button',name='Hapus vendor',exact=True).click();page.get_by_role('heading',name='Venue revisi',exact=True).wait_for(state='hidden')
 assert not any(c[0]!='GET' and any('/'+t in c[1] for t in ['budgets','tasks','savings_contributions','workspaces']) for c in calls)
 browser.close()
server.shutdown();print('PASS intercepted vendor CRUD/reload, partial payment/remove, actual priorities, reset scope, mobile360/390/430/1280; no hosted writes')
