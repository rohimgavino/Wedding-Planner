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
calls=[];resets=[];samples=[];owner=True;failed=False;cleared=False
creation=False;created=False;creates=[];empty_existing=False;sampled=False
workspace={'id':ws,'title':'Fixture Couple','wedding_date':'2027-01-01','target_budget':100,'target_savings':50,'created_at':'2026-01-01'}
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge');context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
 context.add_init_script("localStorage.setItem('sb-fixture-auth-token',"+json.dumps(json.dumps(session))+");")
 def route(route):
  global cleared,created,sampled
  r=route.request;payload=json.loads(r.post_data) if r.post_data else None;calls.append((r.method,r.url,payload))
  if '/rpc/reset_planning_content' in r.url:
   assert payload=={'p_workspace_id':ws,'p_confirmation':'RESET RENCANA'};resets.append(payload)
   if failed:route.fulfill(status=403,content_type='application/json',body=json.dumps({'message':'owner required'}));return
   time.sleep(.25);cleared=True;data={'budgets':1,'tasks':0,'guests':0,'savings_contributions':0}
  elif '/rpc/create_starter_workspace' in r.url:
   creates.append(payload);created=True;workspace.update(groom_name=payload['p_groom_name'],bride_name=payload['p_bride_name'],wedding_date=payload['p_wedding_date'],target_budget=payload['p_target_budget'],target_savings=payload['p_target_savings']);data=ws
  elif '/rpc/use_starter_template' in r.url:
   assert payload=={'p_workspace_id':ws};samples.append(payload);sampled=True;data=ws
  elif '/rpc/has_developer_test_access' in r.url:data=False
  elif '/auth/v1/user' in r.url:data=user
  elif '/rest/v1/workspaces' in r.url:data=[] if creation and not created else [workspace]
  elif '/rest/v1/workspace_members' in r.url:data=[{'workspace_id':ws,'user_id':uid,'role':'owner' if owner else 'partner','display_name':'Fixture'}]
  elif '/rest/v1/workspace_entitlements' in r.url:data=[{'workspace_id':ws,'feature':'core','expires_at':None,'revoked_at':None}]
  elif '/rest/v1/budgets' in r.url:data=[] if cleared or (empty_existing and not sampled) else [{'id':'budget','workspace_id':ws,'category':'Venue','title':'Fixture Venue','allocated_amount':100,'spent_amount':0,'payment_status':'unpaid'}]
  elif '/rest/v1/guests' in r.url:data=[{'id':'guest','workspace_id':ws,'name':'Tamu Uji','category':'sahabat','pax':1,'phone':'081234567890','rsvp_status':'uncontacted'}]
  elif '/rest/v1/' in r.url:data=[]
  else:raise AssertionError('Unexpected request '+r.url)
  route.fulfill(status=200,content_type='application/json',body=json.dumps(data))
 context.route('https://fixture.supabase.co/**',route);page=context.new_page()
 page.goto(base+'/dashboard');page.get_by_role('button',name='Tamu',exact=True).click()
 page.get_by_role('button',name='Atur template WA utama',exact=True).click()
 main=page.get_by_role('dialog');main.get_by_label('Gaya undangan',exact=True).select_option('islami')
 main.get_by_label('Waktu acara',exact=True).fill('10.00');main.get_by_label('Nama tempat',exact=True).fill('Tempat Bersama');main.get_by_label('Alamat lengkap',exact=True).fill('Alamat Bersama')
 main.get_by_label('Pratinjau teks undangan').fill('Halo {nama_tamu}, undangan {pasangan} pada {tanggal}. Acara 10.00 di Tempat Bersama, Alamat Bersama.')
 main.get_by_role('button',name='Simpan template utama',exact=True).click();main.get_by_text('Template utama tersimpan di browser ini.',exact=True).wait_for();main.get_by_role('button',name='Batal',exact=True).click()
 page.reload();page.get_by_role('button',name='Tamu',exact=True).click()
 page.get_by_role('button',name='Susun undangan WhatsApp Tamu Uji').click()
 assert page.get_by_role('dialog').get_by_label('Waktu acara',exact=True).input_value()=='10.00'
 assert 'Halo Tamu Uji' in page.get_by_role('dialog').get_by_label('Pratinjau teks undangan').input_value()
 page.once('dialog',lambda dialog:dialog.accept());page.get_by_role('dialog').get_by_role('button',name='Gunakan teks rekomendasi').click()
 d=page.get_by_role('dialog');text=d.get_by_label('Pratinjau teks undangan')
 assert 'Assalamu' in text.input_value();assert d.get_by_role('link',name='Buka WhatsApp',exact=True).is_visible()
 d.get_by_label('Gaya undangan',exact=True).select_option('islami');assert 'Assalamu' in text.input_value()
 d.get_by_label('Waktu acara',exact=True).fill('09.00–12.00');d.get_by_label('Nama tempat',exact=True).fill('Gedung Uji');d.get_by_label('Alamat lengkap',exact=True).fill('Alamat Uji')
 d.get_by_label('Tautan Google Maps',exact=True).fill('https://maps.app.goo.gl/example')
 from urllib.parse import urlparse,parse_qs
 link=d.get_by_role('link',name='Buka WhatsApp');assert parse_qs(urlparse(link.get_attribute('href')).query)['text'][0]==text.input_value()
 text.fill('Pesan saya sendiri');assert parse_qs(urlparse(link.get_attribute('href')).query)['text']==['Pesan saya sendiri']
 page.once('dialog',lambda dialog:dialog.dismiss());d.get_by_label('Gaya undangan',exact=True).select_option('santai');assert text.input_value()=='Pesan saya sendiri'
 page.once('dialog',lambda dialog:dialog.accept());d.get_by_role('button',name='Gunakan teks rekomendasi').click()
 for width in [360,390,430,1280]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 d.get_by_role('button',name='Batal',exact=True).click()
 assert not any(c[0]!='GET' and '/rpc/has_developer_test_access' not in c[1] for c in calls),calls
 browser.close()
server.shutdown();print('PASS WA templates auto text, missing detail guard, Maps, exact encoded editable draft, manual-edit confirmation, responsive360/390/430/1280 and ZERO mutations')
