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
  elif '/rest/v1/' in r.url:data=[]
  else:raise AssertionError('Unexpected request '+r.url)
  route.fulfill(status=200,content_type='application/json',body=json.dumps(data))
 context.route('https://fixture.supabase.co/**',route);page=context.new_page()
 page.goto(base+'/dashboard');page.get_by_role('button',name='Pengaturan',exact=True).click();page.get_by_role('button',name='Reset rencana dari nol',exact=True).wait_for()
 page.get_by_role('button',name='Reset rencana dari nol',exact=True).click();dialog=page.get_by_role('dialog',name='Reset rencana dari nol');dialog.wait_for();assert dialog.get_by_role('button',name='Hapus isi rencana',exact=True).is_disabled()
 page.get_by_label('Ketik RESET RENCANA untuk melanjutkan').fill('wrong');assert dialog.get_by_role('button',name='Hapus isi rencana',exact=True).is_disabled();dialog.get_by_role('button',name='Batal',exact=True).click();assert len(resets)==0
 page.get_by_role('button',name='Reset rencana dari nol',exact=True).click();page.keyboard.press('Escape');assert page.get_by_role('dialog').count()==0;assert len(resets)==0
 failed=True;page.get_by_role('button',name='Reset rencana dari nol',exact=True).click();page.get_by_label('Ketik RESET RENCANA untuk melanjutkan').fill('RESET RENCANA');page.get_by_role('button',name='Hapus isi rencana',exact=True).click();page.get_by_role('dialog').get_by_role('alert').filter(has_text='Reset belum berhasil').wait_for();assert not cleared;page.get_by_role('dialog').get_by_role('button',name='Batal',exact=True).click()
 failed=False;page.get_by_role('button',name='Reset rencana dari nol',exact=True).click()
 for width in [360,390,430,1280]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
  assert dialog.evaluate('(el)=>getComputedStyle(el).backgroundColor')=='rgb(255, 255, 255)'
  assert dialog.evaluate('(el)=>el.parentElement.parentElement===document.body')
 page.get_by_label('Ketik RESET RENCANA untuk melanjutkan').fill('RESET RENCANA');page.get_by_role('button',name='Hapus isi rencana',exact=True).click();page.get_by_role('status').filter(has_text='Rencana berhasil dikosongkan').wait_for();assert cleared;assert page.get_by_role('dialog').count()==0
 assert sum('/rest/v1/budgets' in c[1] for c in calls)>=2
 owner=False;page.set_viewport_size({'width':390,'height':844});page.reload();page.get_by_role('button',name='Pengaturan',exact=True).click();page.get_by_text('Hanya owner workspace yang dapat mereset rencana.',exact=True).wait_for();assert page.get_by_role('button',name='Reset rencana dari nol',exact=True).count()==0
 assert len(resets)==2;assert not any(c[0]=='DELETE' for c in calls)
 owner=True;empty_existing=True;cleared=False;page.reload();page.get_by_role('button',name='Pengaturan',exact=True).click()
 page.get_by_role('button',name='Gunakan template contoh',exact=True).click();page.get_by_role('dialog').get_by_role('button',name='Batal',exact=True).click();assert not samples
 page.get_by_role('button',name='Gunakan template contoh',exact=True).click();page.get_by_role('button',name='Ya, gunakan contoh fiktif',exact=True).click();page.get_by_role('dialog').wait_for(state='hidden');assert len(samples)==1
 creation=True;created=False;empty_existing=False;cleared=False;page.goto(base+'/onboarding')
 page.locator('form input').first.wait_for();assert all(v=='' for v in page.locator('form input').evaluate_all('(els)=>els.map(e=>e.value)'))
 page.locator('form input').nth(0).fill('Nama Asli');page.locator('form input').nth(1).fill('Pasangan Asli');page.locator('form button[type=submit]').click()
 page.locator('input[type=date]').fill('2027-10-01');page.locator('form button[type=submit]').click()
 page.locator('input[type=number]').nth(0).fill('50000000');page.locator('input[type=number]').nth(1).fill('20000000');page.locator('form button[type=submit]').click()
 page.wait_for_url('**/dashboard');assert len(creates)==1;assert creates[0]['p_target_budget']==50000000;assert creates[0]['p_groom_name']=='Nama Asli'
 page.reload();page.get_by_role('button',name='Pengaturan',exact=True).click();assert len(creates)==1
 assert not any(c[0]!='GET' and '/rest/v1/' in c[1] and '/rpc/' not in c[1] for c in calls)
 context.close();browser.close()
server.shutdown();print('PASS reset cancellation/Escape, exact confirmation, error/success reload, partner guard, opaque body-portal dialog, 360/390/430/1280; transport fixture only')
