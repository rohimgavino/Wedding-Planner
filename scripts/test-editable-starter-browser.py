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
from urllib.parse import urlparse,parse_qs
budgets=[{'id':'budget','workspace_id':ws,'category':'Custom Venue','title':'Fixture Venue','allocated_amount':100,'spent_amount':20,'payment_status':'dp','notes':'Keep real notes'}]
tasks=[{'id':'task','workspace_id':ws,'title':'Fixture Task','phase':'H-3 Bulan','pic':'both','is_completed':True,'due_date':'2027-02-03','notes':'Keep task notes'}]
calls=[];resets=[];owner=True;failed=False;cleared=False;patch_failed=False
pending=[];hold_mutation=False

def change_identity(page,new_uid=None,new_ws=None):
 global uid,ws,user,session
 if new_uid:uid=new_uid;user=dict(user,id=uid);session=dict(session,user=user)
 if new_ws:ws=new_ws
 # A genuine Supabase cross-tab auth notification refreshes the mounted providers.
 page.evaluate("s=>{const c=new BroadcastChannel('sb-fixture-auth-token');c.postMessage({event:'SIGNED_IN',session:s});setTimeout(()=>c.close(),100);}",session)
 page.wait_for_timeout(700)

def release_pending():
 global hold_mutation
 hold_mutation=False
 for route,body in pending:
  route.fulfill(status=200,content_type='application/json',body=json.dumps(body))
 pending.clear()

def persistent(route,rows):
 r=route.request
 if r.method=='PATCH':
  if patch_failed:
   route.fulfill(status=403,content_type='application/json',body=json.dumps({'message':'fixture save denied'}));return
  query=parse_qs(urlparse(r.url).query)
  matches=[row for row in rows if all(k=='select' or all(v=='eq.'+str(row.get(k)) or (v=='is.null' and row.get(k) is None) for v in vs) for k,vs in query.items())]
  for row in matches:row.update(json.loads(r.post_data))
  data=matches[0] if matches else None
  if hold_mutation:
   assert data is not None;pending.append((route,dict(data)));return
  route.fulfill(status=200 if matches else 406,content_type='application/json',body=json.dumps(data if matches else {'message':'No matching row'}));return
 route.fulfill(status=200,content_type='application/json',body=json.dumps(rows))
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge');context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
 context.add_init_script("localStorage.setItem('sb-fixture-auth-token',"+json.dumps(json.dumps(session))+");")
 def route(route):
  global cleared
  r=route.request;payload=json.loads(r.post_data) if r.post_data else None;calls.append((r.method,r.url,payload))
  if '/rpc/apply_editable_starter_v1' in r.url:
   assert payload=={'p_workspace_id':ws,'p_confirmation':'TAMBAH TEMPLATE'};resets.append(payload)
   if failed:route.fulfill(status=403,content_type='application/json',body=json.dumps({'message':'owner required'}));return
   cleared=True;data={'already_applied':False}
   if hold_mutation:pending.append((route,data));return
   time.sleep(.25)
  elif '/rpc/has_developer_test_access' in r.url:data=False
  elif '/auth/v1/user' in r.url:data=user
  elif '/rest/v1/workspaces' in r.url:data=[{'id':ws,'title':'Fixture Couple','wedding_date':'2027-01-01','target_budget':100,'target_savings':50,'created_at':'2026-01-01'}]
  elif '/rest/v1/workspace_members' in r.url:data=[{'workspace_id':ws,'user_id':uid,'role':'owner' if owner else 'partner','display_name':'Fixture'}]
  elif '/rest/v1/workspace_entitlements' in r.url:data=[{'workspace_id':ws,'feature':'core','expires_at':None,'revoked_at':None}]
  elif '/rest/v1/tasks' in r.url:persistent(route,tasks);return
  elif '/rest/v1/budgets' in r.url:persistent(route,budgets);return
  elif '/rest/v1/' in r.url:data=[]
  else:raise AssertionError('Unexpected request '+r.url)
  route.fulfill(status=200,content_type='application/json',body=json.dumps(data))
 context.route('https://fixture.supabase.co/**',route);page=context.new_page()
 page.goto(base+'/dashboard')
 page.get_by_role('button',name='Pengaturan',exact=True).click()
 page.get_by_role('heading',name='Template awal',exact=True).wait_for(timeout=5000)
 page.get_by_role('button',name='Budget',exact=True).click()
 page.get_by_role('button',name='Edit pos Fixture Venue',exact=True).click()
 edit=page.get_by_role('dialog',name='Edit Pos Anggaran');edit.wait_for()
 assert edit.get_by_label('Nama / Keterangan Pos').input_value()=='Fixture Venue'
 budgets[0].update(spent_amount=100,payment_status='paid')
 edit.get_by_label('Nama / Keterangan Pos').fill('Renamed Venue')
 edit.get_by_role('button',name='Simpan Pos',exact=True).click()
 page.get_by_role('button',name='Edit pos Renamed Venue',exact=True).wait_for()
 assert budgets[0]['spent_amount']==100 and budgets[0]['payment_status']=='paid',budgets
 assert budgets[0]['category']=='Custom Venue' and budgets[0]['notes']=='Keep real notes'
 assert [c[2] for c in calls if c[0]=='PATCH'][-1]=={'title':'Renamed Venue'}
 page.reload();page.get_by_role('button',name='Budget',exact=True).click()
 page.get_by_role('button',name='Edit pos Renamed Venue',exact=True).click()
 edit.get_by_label('Nama / Keterangan Pos').fill('Retained Input')
 patch_failed=True
 edit.get_by_role('button',name='Simpan Pos',exact=True).click()
 edit.get_by_role('alert').wait_for()
 assert edit.get_by_label('Nama / Keterangan Pos').input_value()=='Retained Input'
 patch_failed=False
 budgets[0]['title']='Partner title'
 edit.get_by_role('button',name='Simpan Pos',exact=True).click()
 edit.get_by_role('alert').filter(has_text='berubah').wait_for()
 assert budgets[0]['title']=='Partner title'
 assert edit.get_by_label('Nama / Keterangan Pos').input_value()=='Retained Input'
 edit.get_by_role('button',name='Batal',exact=True).click()
 page.reload();page.get_by_role('button',name='Budget',exact=True).click()
 page.get_by_role('button',name='Edit pos Partner title',exact=True).click()
 edit.get_by_label('Plafon Alokasi (Rp)').fill('200')
 edit.get_by_label('Status Pembayaran').select_option('dp')
 # Coupled amount/status guard must compare every original finance field atomically.
 budgets[0].update(spent_amount=150,payment_status='dp')
 edit.get_by_role('button',name='Simpan Pos',exact=True).click()
 edit.get_by_role('alert').filter(has_text='berubah').wait_for()
 assert budgets[0]['allocated_amount']==100 and budgets[0]['spent_amount']==150
 ws='33333333-3333-4333-8333-333333333333'
 page.evaluate("window.dispatchEvent(new Event('focus'))");page.wait_for_timeout(500)
 assert edit.count()==0
 ws='22222222-2222-4222-8222-222222222222'
 page.evaluate("window.dispatchEvent(new Event('focus'))");page.wait_for_timeout(500)
 assert edit.count()==0
 page.get_by_role('button',name='Timeline',exact=True).click()
 page.get_by_role('button',name='Edit tugas Fixture Task',exact=True).click()
 taskedit=page.get_by_role('dialog',name='Edit Tugas');taskedit.wait_for()
 taskedit.get_by_label('Nama Tugas').fill('Renamed Task')
 taskedit.get_by_role('button',name='Simpan Tugas',exact=True).click()
 page.get_by_role('button',name='Edit tugas Renamed Task',exact=True).wait_for()
 assert tasks[0]['is_completed'] and tasks[0]['due_date']=='2027-02-03' and tasks[0]['notes']=='Keep task notes'
 page.reload();page.get_by_role('button',name='Timeline',exact=True).click()
 page.get_by_role('button',name='Edit tugas Renamed Task',exact=True).click()
 taskedit.get_by_label('Nama Tugas').fill('Failed Task Input')
 patch_failed=True
 taskedit.get_by_role('button',name='Simpan Tugas',exact=True).click()
 taskedit.get_by_role('alert').wait_for()
 assert taskedit.get_by_label('Nama Tugas').input_value()=='Failed Task Input'
 patch_failed=False
 # Refresh context in the mounted provider, without a navigation/remount.
 ws='33333333-3333-4333-8333-333333333333'
 page.evaluate("window.dispatchEvent(new Event('focus'))")
 page.wait_for_timeout(500)
 assert taskedit.count()==0
 ws='22222222-2222-4222-8222-222222222222'
 page.evaluate("window.dispatchEvent(new Event('focus'))")
 page.wait_for_timeout(500)
 assert taskedit.count()==0,'editor must remain closed when original workspace returns'
 page.get_by_role('button',name='Pengaturan',exact=True).click()
 page.get_by_role('button',name='Pratinjau template',exact=True).click()
 dialog=page.get_by_role('dialog',name='Template awal')
 page.get_by_label('Saya setuju menambahkan template tanpa mengubah data yang ada').check()
 ws='33333333-3333-4333-8333-333333333333'
 page.evaluate("window.dispatchEvent(new Event('focus'))");page.wait_for_timeout(500)
 assert dialog.count()==0,'stale workspace confirmation must close'
 assert len(resets)==0
 ws='22222222-2222-4222-8222-222222222222'
 page.evaluate("window.dispatchEvent(new Event('focus'))");page.wait_for_timeout(500)
 page.get_by_role('button',name='Pratinjau template',exact=True).click()
 for width in [360,390,430,1280]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
 assert dialog.get_by_role('button',name='Tambahkan template',exact=True).is_disabled()
 page.get_by_label('Saya setuju menambahkan template tanpa mengubah data yang ada').check()
 failed=True
 dialog.get_by_role('button',name='Tambahkan template',exact=True).click()
 dialog.get_by_role('alert').wait_for();assert not cleared
 dialog.get_by_role('button',name='Batal',exact=True).click()
 failed=False
 page.get_by_role('button',name='Pratinjau template',exact=True).click()
 page.get_by_label('Saya setuju menambahkan template tanpa mengubah data yang ada').check()
 dialog.get_by_role('button',name='Tambahkan template',exact=True).dblclick()
 page.get_by_role('status').filter(has_text='Template sudah diproses').wait_for()
 assert len(resets)==2
 page.set_viewport_size({'width':390,'height':844})
 page.reload();page.get_by_role('button',name='Pengaturan',exact=True).click()
 assert len(resets)==2
 # Identity-only invalidation, then response-held mutations across identity/workspace changes.
 original_uid=uid;original_ws=ws;other_uid='44444444-4444-4444-8444-444444444444';other_ws='33333333-3333-4333-8333-333333333333'
 for section,button,dialogname in [('Budget','Edit pos Partner title','Edit Pos Anggaran'),('Timeline','Edit tugas Renamed Task','Edit Tugas'),('Pengaturan','Pratinjau template','Template awal')]:
  page.get_by_role('button',name=section,exact=True).click();page.get_by_role('button',name=button,exact=True).click()
  opened=page.get_by_role('dialog',name=dialogname);opened.wait_for()
  before=len(calls)
  change_identity(page,new_uid=other_uid)
  assert opened.count()==0,'user change must invalidate '+dialogname
  assert not any(c[0]=='PATCH' or '/rpc/apply_editable_starter_v1' in c[1] for c in calls[before:])
  change_identity(page,new_uid=original_uid)
  assert opened.count()==0,'returning user must not resurrect dialog'
 for kind in ['budget','task','starter']:
  for switch in ['user','workspace']:
   rows=budgets if kind=='budget' else tasks
   page.get_by_role('button',name={'budget':'Budget','task':'Timeline','starter':'Pengaturan'}[kind],exact=True).click()
   if kind=='starter':
    page.get_by_role('button',name='Pratinjau template',exact=True).click();opened=page.get_by_role('dialog',name='Template awal')
    page.get_by_label('Saya setuju menambahkan template tanpa mengubah data yang ada').check();save='Tambahkan template'
   else:
    rows=budgets if kind=='budget' else tasks
    page.get_by_role('button',name=('Edit pos ' if kind=='budget' else 'Edit tugas ')+rows[0]['title'],exact=True).click()
    opened=page.get_by_role('dialog',name='Edit Pos Anggaran' if kind=='budget' else 'Edit Tugas')
    opened.get_by_label('Nama / Keterangan Pos' if kind=='budget' else 'Nama Tugas').fill('Dispatched '+kind+' '+switch);save='Simpan Pos' if kind=='budget' else 'Simpan Tugas'
   hold_mutation=True;before=len(calls)
   opened.get_by_role('button',name=save,exact=True).click()
   page.wait_for_timeout(150);assert len(pending)==1,'request must already be dispatched'
   dispatched=[c for c in calls[before:] if c[0]=='PATCH' or '/rpc/apply_editable_starter_v1' in c[1]]
   assert len(dispatched)==1
   # Auth notification also refreshes workspace while ordinary focus refresh is locked during saves.
   change_identity(page,new_uid=other_uid if switch=='user' else None,new_ws=other_ws if switch=='workspace' else None)
   assert opened.count()==0,'pending dialog must invalidate'
   release_pending();page.wait_for_timeout(600)
   assert opened.count()==0
   assert page.get_by_role('status').filter(has_text='Template sudah diproses').count()==0,'stale success must not surface'
   assert len([c for c in calls[before:] if c[0]=='PATCH' or '/rpc/apply_editable_starter_v1' in c[1]])==1,'no retargeted retry'
   # Fixture commit happened at dispatch: UI invalidation does not promise transactional cancellation.
   if kind!='starter':assert rows[0]['title']=='Dispatched '+kind+' '+switch
   change_identity(page,new_uid=original_uid,new_ws=original_ws)
   assert opened.count()==0
 owner=False;page.reload();page.get_by_role('button',name='Pengaturan',exact=True).click()
 page.get_by_text('Hanya owner workspace yang dapat menambahkan template.',exact=True).wait_for()
 context.close();browser.close()
server.shutdown();print('PASS mounted persistent PATCH budget/task save+reload/error retained input; disjoint partner spending preserved; same-field and coupled-finance CAS conflict; workspace invalidation preview/both editors; user-only invalidation of all three dialogs; six held-response user/workspace switches invalidate dialogs, suppress stale success and never retry/retarget while dispatched commits remain acknowledged; Settings confirmation/error/dedupe/partner/mobile. Mock transport only, not JWT/database concurrency.')
