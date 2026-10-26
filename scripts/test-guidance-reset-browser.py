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
calls=[];resets=[];owner=True;failed=False;cleared=False
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge');context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
 context.add_init_script("localStorage.setItem('sb-fixture-auth-token',"+json.dumps(json.dumps(session))+");")
 def route(route):
  global cleared
  r=route.request;payload=json.loads(r.post_data) if r.post_data else None;calls.append((r.method,r.url,payload))
  if '/rpc/reset_planning_content' in r.url:
   assert payload=={'p_workspace_id':ws,'p_confirmation':'RESET RENCANA'};resets.append(payload)
   if failed:route.fulfill(status=403,content_type='application/json',body=json.dumps({'message':'owner required'}));return
   time.sleep(.25);cleared=True;data={'budgets':1,'tasks':0,'guests':0,'savings_contributions':0}
  elif '/rpc/has_developer_test_access' in r.url:data=False
  elif '/auth/v1/user' in r.url:data=user
  elif '/rest/v1/workspaces' in r.url:data=[{'id':ws,'title':'Fixture Couple','wedding_date':'2027-01-01','target_budget':100,'target_savings':50,'created_at':'2026-01-01'}]
  elif '/rest/v1/workspace_members' in r.url:data=[{'workspace_id':ws,'user_id':uid,'role':'owner' if owner else 'partner','display_name':'Fixture'}]
  elif '/rest/v1/workspace_entitlements' in r.url:data=[{'workspace_id':ws,'feature':'core','expires_at':None,'revoked_at':None}]
  elif '/rest/v1/budgets' in r.url:data=[] if cleared else [{'id':'budget','workspace_id':ws,'category':'Venue','title':'Fixture Venue','allocated_amount':100,'spent_amount':0,'payment_status':'unpaid'}]
  elif '/rest/v1/' in r.url:data=[]
  else:raise AssertionError('Unexpected request '+r.url)
  route.fulfill(status=200,content_type='application/json',body=json.dumps(data))
 context.route('https://fixture.supabase.co/**',route);page=context.new_page()
 page.goto(base+'/onboarding');page.get_by_text('Contoh pengisian',exact=True).wait_for(timeout=10000)
 for width in [360,390,430,1280]:
  page.set_viewport_size({'width':width,'height':844});page.get_by_text('Contoh pengisian',exact=True).click();page.get_by_text('Raka & Nisa (fiktif)',exact=True).wait_for();assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
  assert all(v=='' for v in page.locator('form input').evaluate_all('(els)=>els.map(e=>e.value)'));page.get_by_text('Contoh pengisian',exact=True).click()
 assert not any(c[0]!='GET' and '/rpc/has_developer_test_access' not in c[1] for c in calls),calls  # read-only STABLE RPC uses POST transport
 page.goto(base+'/dashboard');page.get_by_role('button',name='Reset rencana dari nol',exact=True).wait_for()
 page.get_by_role('button',name='Reset rencana dari nol',exact=True).click();dialog=page.get_by_role('dialog',name='Reset rencana dari nol');dialog.wait_for();assert dialog.get_by_role('button',name='Hapus isi rencana',exact=True).is_disabled()
 page.get_by_label('Ketik RESET RENCANA untuk melanjutkan').fill('wrong');assert dialog.get_by_role('button',name='Hapus isi rencana',exact=True).is_disabled();dialog.get_by_role('button',name='Batal',exact=True).click();assert len(resets)==0
 page.get_by_role('button',name='Reset rencana dari nol',exact=True).click();page.keyboard.press('Escape');assert page.get_by_role('dialog').count()==0;assert len(resets)==0
 failed=True;page.get_by_role('button',name='Reset rencana dari nol',exact=True).click();page.get_by_label('Ketik RESET RENCANA untuk melanjutkan').fill('RESET RENCANA');page.get_by_role('button',name='Hapus isi rencana',exact=True).click();page.get_by_role('dialog').get_by_role('alert').filter(has_text='Reset belum berhasil').wait_for();assert not cleared;page.get_by_role('dialog').get_by_role('button',name='Batal',exact=True).click()
 failed=False;page.get_by_role('button',name='Reset rencana dari nol',exact=True).click()
 for width in [360,390,430,1280]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
 page.get_by_label('Ketik RESET RENCANA untuk melanjutkan').fill('RESET RENCANA');page.get_by_role('button',name='Hapus isi rencana',exact=True).click();page.get_by_role('status').filter(has_text='Rencana berhasil dikosongkan').wait_for();assert cleared;assert page.get_by_role('dialog').count()==0
 assert sum('/rest/v1/budgets' in c[1] for c in calls)>=2
 owner=False;page.reload();page.get_by_text('Hanya owner workspace yang dapat mereset rencana.',exact=True).wait_for();assert page.get_by_role('button',name='Reset rencana dari nol',exact=True).count()==0
 assert len(resets)==2;assert not any(c[0]=='DELETE' for c in calls)
 context.close();browser.close()
server.shutdown();print('PASS read-only example, empty onboarding inputs, cancellation/Escape, exact confirmation, error/success reload, partner guard, 360/390/430/1280; fixture only')
