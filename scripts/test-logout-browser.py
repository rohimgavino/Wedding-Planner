"""Local transport fixture only. Build with fixture public config; no hosted writes."""
import base64,json,time
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright,expect
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  path=self.path.split('?')[0]
  if path in ['/dashboard','/login','/onboarding','/invite']:self.path=path+'.html'
  super().do_GET()
 def log_message(self,format,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory='out'))
Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
uid='11111111-1111-4111-8111-111111111111';ws='22222222-2222-4222-8222-222222222222'
user={'id':uid,'aud':'authenticated','role':'authenticated','email':'fixture@example.test','app_metadata':{},'user_metadata':{},'created_at':'2026-01-01T00:00:00Z'}
enc=lambda v:base64.urlsafe_b64encode(json.dumps(v).encode()).decode().rstrip('=')
token=enc({'alg':'HS256'})+'.'+enc({'sub':uid,'exp':int(time.time())+3600,'role':'authenticated'})+'.fixture'
session={'access_token':token,'refresh_token':'fixture','expires_at':int(time.time())+3600,'expires_in':3600,'token_type':'bearer','user':user}
workspace={'id':ws,'title':'Fixture Couple','wedding_date':'2027-01-01','target_budget':10000,'target_savings':0}
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge')
 context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
 context.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('sb-fixture-auth-token',"+json.dumps(json.dumps(session))+");localStorage.setItem('everrae_workspace_v1','KEEP-LEGACY');sessionStorage.setItem('seeded','yes');}")
 writes=[];unexpected=[];logout_mode='failure'
 logout_calls=[];held=[]
 def route(route):
  r=route.request
  if r.url.startswith(base+'/'):route.continue_();return
  if not r.url.startswith('https://fixture.supabase.co/'):
   unexpected.append(r.url);route.abort();return
  if '/auth/v1/logout' in r.url:
   assert r.method=='POST' and 'scope=local' in r.url
   logout_calls.append(r.url)
   if logout_mode=='pending':held.append(route);return
   route.fulfill(status=500 if logout_mode=='failure' else 204,content_type='application/json',body=json.dumps({'message':'fixture failure'}) if logout_mode=='failure' else '')
   return
  if r.method not in ['GET','OPTIONS'] and '/rpc/has_developer_test_access' not in r.url:
   writes.append((r.method,r.url));route.abort();return
  if '/auth/v1/user' in r.url:data=user
  elif '/rpc/has_developer_test_access' in r.url:data=False
  elif '/rest/v1/workspaces' in r.url:data=[workspace]
  elif '/rest/v1/workspace_members' in r.url:data=[{'workspace_id':ws,'user_id':uid,'role':'owner'}]
  elif '/rest/v1/workspace_entitlements' in r.url:data=[{'workspace_id':ws,'feature':'core','expires_at':None,'revoked_at':None}]
  elif '/rest/v1/' in r.url:data=[]
  else:unexpected.append(r.url);route.abort();return
  route.fulfill(status=200,content_type='application/json',body=json.dumps(data))
 context.route('**/*',route)
 page=context.new_page();page.goto(base+'/dashboard')
 page.get_by_text('Halo, Fixture Couple.',exact=True).first.wait_for()
 trigger=page.get_by_role('button',name='Keluar',exact=True)
 trigger.click()
 d=page.get_by_role('dialog',name='Keluar dari akun?',exact=True)
 expect(d).to_be_visible()
 expect(d).to_contain_text('Data yang sudah tersimpan di cloud tetap aman')
 d.get_by_role('button',name='Batal',exact=True).click()
 expect(d).not_to_be_visible();expect(trigger).to_be_focused()
 assert writes==[],writes
 assert '/dashboard' in page.url
 assert page.evaluate("localStorage.getItem('everrae_workspace_v1')")=='KEEP-LEGACY'
 assert unexpected==[],unexpected
 trigger.click();d.get_by_role('button',name='Keluar',exact=True).click()
 expect(d.get_by_role('alert')).to_contain_text('Keluar gagal')
 assert '/dashboard' in page.url
 expect(page.get_by_text('Halo, Fixture Couple.',exact=True).first).to_be_visible()
 assert page.evaluate("localStorage.getItem('sb-fixture-auth-token')") is not None
 assert len(logout_calls)==1
 d.get_by_role('button',name='Batal',exact=True).click()
 geometry=[]
 for width in [360,390,430,1280]:
  page.set_viewport_size({'width':width,'height':844})
  b=trigger.bounding_box();assert b and b['height']>=44 and b['width']>=44 and b['x']>=0 and b['x']+b['width']<=width
  assert trigger.locator('svg').count()==1
  trigger.focus();page.keyboard.press('Enter');expect(d).to_be_visible()
  cancel=d.get_by_role('button',name='Batal',exact=True);confirm=d.get_by_role('button',name='Keluar',exact=True)
  expect(cancel).to_be_focused();page.keyboard.press('Shift+Tab');expect(confirm).to_be_focused();page.keyboard.press('Tab');expect(cancel).to_be_focused()
  box=d.bounding_box();assert box and box['x']>=0 and box['x']+box['width']<=width and box['y']>=0 and box['y']+box['height']<=844
  assert d.evaluate('(el)=>el.scrollWidth<=el.clientWidth && getComputedStyle(el).backgroundColor === "rgb(255, 255, 255)"')
  for button in [cancel,confirm]:
   target=button.bounding_box();assert target and target['height']>=44
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  geometry.append({'width':width,'trigger':b,'dialog':box})
  page.keyboard.press('Escape');expect(d).not_to_be_visible();expect(trigger).to_be_focused()
 assert len(logout_calls)==1 and writes==[]
 logout_mode='pending';trigger.click()
 confirm=d.get_by_role('button',name='Keluar',exact=True)
 # Two synchronous click events exercise the ref lock, not Playwright auto-wait.
 confirm.evaluate('(el)=>{el.click();el.click()}')
 expect(d.get_by_role('button',name='Sedang keluar…',exact=True)).to_be_disabled()
 expect(d.get_by_role('button',name='Batal',exact=True)).to_be_disabled()
 page.keyboard.press('Escape');expect(d).to_be_visible()
 page.wait_for_timeout(250)
 assert len(logout_calls)==2 and len(held)==1
 held[0].fulfill(status=204,body='')
 page.wait_for_url('**/login')
 assert page.evaluate("localStorage.getItem('sb-fixture-auth-token')") is None
 assert page.evaluate("localStorage.getItem('everrae_workspace_v1')")=='KEEP-LEGACY'
 assert 'Fixture Couple' not in page.inner_text('body')
 assert writes==[] and unexpected==[]
 print(json.dumps({'geometry':geometry,'cancel_logout_requests':0,'failure_logout_requests':1,'confirmed_logout_requests':1,'planner_writes':0}))
 context.close();browser.close()
server.shutdown()
print('PASS logout: cancel sends zero writes, retains session and legacy data, restores focus')
