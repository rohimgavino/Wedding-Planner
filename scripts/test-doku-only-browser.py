"""Synthetic transport only: DOKU-only purchase page, catalog, checkout flow, entitlement preservation, no legacy RPCs."""
from pathlib import Path
import json

source = Path('scripts/test-guidance-reset-browser.py').read_text()
prefix = source[:source.index(" page.goto(base+'/onboarding')")]
prefix = prefix.replace("'/onboarding','/dashboard','/login'", "'/onboarding','/dashboard','/login','/purchase','/admin'")
prefix = prefix.replace("calls=[];resets=[];owner=True;failed=False;cleared=False", "calls=[];resets=[];owner=True;failed=False;cleared=False;paid=False;catalog_error=False")
prefix = prefix.replace("data=[{'workspace_id':ws,'feature':'core','expires_at':None,'revoked_at':None}]", "data=[{'workspace_id':ws,'feature':'core','expires_at':None,'revoked_at':None}] if paid else []")
prefix = prefix.replace("elif '/rest/v1/budgets'", """elif '/rpc/site_role' in r.url:data='operator'
  elif '/rpc/admin_doku_orders' in r.url:data=[]
  elif '/rest/v1/admin_audit' in r.url:data=[]
  elif '/rest/v1/budgets'""")
prefix = prefix.replace("context.route('https://fixture.supabase.co/**',route)", "context.route('**/*',safe_route)")
prefix = prefix.replace('with sync_playwright() as p:', '''def safe_route(r):
 url=r.request.url
 if url.startswith(base+'/api/payments/catalog'):
  if catalog_error:
   r.fulfill(status=503,content_type='application/json',body=json.dumps({'error':'fixture catalog unavailable'}));return
  r.fulfill(status=200,content_type='application/json',body=json.dumps({
   'salesEnabled':True,'supportEmail':'support@pocketwedding.id','serverNow':'2026-11-12T10:00:00Z','dokuConfigured':True,
   'packages':[
    {'id':'starter','name':'Starter','description':'Paket inti 365 hari.','base_amount_idr':49900,'price_idr':49900,'duration_days':365,'features':['Anggaran','Checklist'],'checkout_eligible':True},
    {'id':'premium','name':'Premium','description':'Paket lengkap.','base_amount_idr':79900,'price_idr':79900,'duration_days':365,'features':['Tamu','Tabungan'],'checkout_eligible':True},
    {'id':'wedding_pro','name':'Wedding Pro','description':'Paket pro.','base_amount_idr':99900,'price_idr':99900,'duration_days':365,'features':['Semua fitur'],'checkout_eligible':True},
   ]
  }));return
 if url.startswith(base+'/api/payments/status'):
  r.fulfill(status=200,content_type='application/json',body=json.dumps({
   'orders':[{'invoice':'pp-001','workspace_id':ws,'payer_id':uid,'package_id':'starter','amount_idr':49900,'duration_days':365,'status':'checkout_ready','checkout_url':'https://checkout.doku.com/fixture-001','payment_channel':None,'doku_http_status':200,'error_code':None,'expires_at':'2026-11-12T11:00:00Z','created_at':'2026-11-12T10:00:00Z','paid_at':None}],
   'entitlements':[{'workspace_id':ws,'feature':'core','expires_at':None,'revoked_at':None}] if paid else []
  }));return
 if url.startswith(base+'/'):r.continue_();return
 assert url.startswith('https://fixture.supabase.co/'),url
 assert r.request.method=='GET' or url.endswith(('/rpc/has_developer_test_access','/rpc/site_role','/rpc/admin_doku_orders')),'Mutation forbidden: '+url
 route(r)
with sync_playwright() as p:''')

steps = r'''
 page.goto(base+'/dashboard')
 page.get_by_role('heading',name='Workspace menunggu aktivasi',exact=True).wait_for()
 assert 'Lynk' not in page.locator('.activation-gate').inner_text()
 page.get_by_role('link',name='Lihat paket & aktivasi',exact=True).click()
 page.get_by_role('heading',name='Aktivasi paket workspace',exact=True).wait_for()
 page.get_by_role('heading',name='Starter',exact=True).wait_for()
 page.get_by_text('pp-001',exact=True).wait_for()
 assert page.locator('a[href*="lynk.id"]').count()==0
 for width in [360,390,430,1280]:
  for scale in [1,2]:
   page.set_viewport_size({'width':width,'height':900 if width==1280 else 844})
   page.evaluate('(s)=>document.documentElement.style.fontSize=16*s+"px"',scale)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,scale)
   for a in page.locator('main a').all():
    assert a.bounding_box()['height']>=44
 catalog_error=True;page.reload();page.get_by_role('alert').filter(has_text='fixture catalog unavailable').wait_for()
 catalog_error=False;paid=True;page.goto(base+'/dashboard')
 page.locator('.planner-shell').wait_for()
 page.get_by_role('button',name='Budget & Biaya',exact=True).click()
 page.get_by_text('Fixture Venue',exact=True).wait_for()
 assert page.get_by_role('heading',name='Workspace menunggu aktivasi',exact=True).count()==0
 page.goto(base+'/admin');page.get_by_role('heading',name='Kontrol penjualan DOKU Checkout',exact=True).wait_for()
 context.close();browser.close()
server.shutdown()
print('PASS DOKU-only Checkout UI: activation gate, catalog/orders, error banner, earned access, admin view, 8 responsive cases')
'''
exec(compile(prefix+steps, __file__, 'exec'))
