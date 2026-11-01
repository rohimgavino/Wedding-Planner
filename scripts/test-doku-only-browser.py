"""Synthetic transport only: public CTA, old history, entitlement preservation, no writes."""
from pathlib import Path
source=Path('scripts/test-guidance-reset-browser.py').read_text()
prefix=source[:source.index(" page.goto(base+'/onboarding')")]
prefix=prefix.replace("'/onboarding','/dashboard','/login'", "'/onboarding','/dashboard','/login','/purchase','/admin'")
prefix=prefix.replace("calls=[];resets=[];owner=True;failed=False;cleared=False", "calls=[];resets=[];owner=True;failed=False;cleared=False;paid=False;history_error=False")
prefix=prefix.replace("data=[{'workspace_id':ws,'feature':'core','expires_at':None,'revoked_at':None}]", "data=[{'workspace_id':ws,'feature':'core','expires_at':None,'revoked_at':None}] if paid else []")
prefix=prefix.replace("elif '/rest/v1/budgets'", """elif '/rpc/site_role' in r.url:data='operator'
  elif '/rest/v1/purchase_requests' in r.url:
   if history_error:route.fulfill(status=503,content_type='application/json',body=json.dumps({'message':'fixture unavailable'}));return
   data=[{'id':status+'-history','workspace_id':ws,'status':status,'price_idr':99000,'duration_days':365,'lynk_url':'https://lynk.id/fixture/old','review_note':'Historical '+status} for status in ['pending','verified','rejected']]
  elif '/rest/v1/budgets'""")
prefix=prefix.replace("context.route('https://fixture.supabase.co/**',route)", "context.route('**/*',safe_route)")
prefix=prefix.replace('with sync_playwright() as p:', '''def safe_route(r):
 if r.request.url.startswith(base+'/'):r.continue_();return
 assert r.request.url.startswith('https://fixture.supabase.co/'),r.request.url
 assert r.request.method=='GET' or r.request.url.endswith(('/rpc/has_developer_test_access','/rpc/site_role')),'Mutation forbidden: '+r.request.url
 route(r)
with sync_playwright() as p:''')
steps=r'''
 evidence=Path('docs/evidence/doku-only-ui');evidence.mkdir(parents=True,exist_ok=True)
 page.goto(base+'/dashboard')
 page.get_by_role('heading',name='Workspace menunggu aktivasi',exact=True).wait_for()
 assert 'Lynk' not in page.locator('.activation-gate').inner_text()
 page.get_by_role('link',name='Lihat paket & aktivasi',exact=True).click()
 page.get_by_role('heading',name='Pembayaran belum tersedia',exact=True).wait_for()
 page.get_by_text('ID permintaan: pending-history',exact=True).wait_for()
 for status in ['pending','verified','rejected']:assert page.get_by_text('ID permintaan: '+status+'-history',exact=True).is_visible()
 assert page.locator('a[href*="lynk.id"]').count()==0
 assert page.get_by_role('button',name='Buat permintaan pembelian').count()==0
 assert page.get_by_role('button',name='Periksa status aktivasi').count()==0
 for width in [360,390,430,1280]:
  for scale in [1,2]:
   page.set_viewport_size({'width':width,'height':900 if width==1280 else 844})
   page.evaluate('(s)=>document.documentElement.style.fontSize=16*s+"px"',scale)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,scale)
   for a in page.locator('main a').all():
    assert a.bounding_box()['height']>=44
    a.scroll_into_view_if_needed()
   if scale==1 and width in [390,1280]:
    page.evaluate('window.scrollTo(0,0)');page.screenshot(path=str(evidence/f'purchase-{width}.png'),full_page=True)
 history_error=True;page.reload();page.get_by_role('alert').filter(has_text='Riwayat belum dapat dimuat').wait_for()
 assert page.get_by_role('heading',name='Pembayaran belum tersedia',exact=True).is_visible()
 assert page.get_by_text('ID permintaan: pending-history',exact=True).count()==0
 history_error=False;paid=True;page.goto(base+'/dashboard')
 page.locator('.planner-shell').wait_for()
 page.get_by_role('button',name='Budget & Biaya',exact=True).click()
 page.get_by_text('Fixture Venue',exact=True).wait_for()
 assert page.get_by_role('heading',name='Workspace menunggu aktivasi',exact=True).count()==0
 page.goto(base+'/admin');page.get_by_text('Operasional baca-saja',exact=True).wait_for()
 assert page.get_by_role('button',name='Verifikasi',exact=True).count()==0
 # Public explanation without a session and useful landing CTA.
 context.close();context=browser.new_context(viewport={'width':390,'height':844},service_workers='block');context.route('**/*',safe_route);page=context.new_page();page.goto(base+'/purchase')
 page.get_by_role('heading',name='Pembayaran belum tersedia',exact=True).wait_for()
 assert page.get_by_role('link',name='Masuk ke workspace',exact=True).is_visible()
 assert page.get_by_role('heading',name='Riwayat pembelian lama',exact=True).count()==0
 page.goto(base+'/');page.get_by_role('link',name='Lihat status pembayaran',exact=True).click()
 page.get_by_role('heading',name='Pembayaran belum tersedia',exact=True).wait_for()
 assert not any('/rpc/'+name in u for _,u,_ in calls for name in ['request_core_purchase','verify_core_purchase','reject_core_purchase','save_site_settings'])
 (evidence/'summary.json').write_text(json.dumps({'responsive_cases':8,'hosted_requests':0,'mutations':0,'legacy_purchase_rpc_calls':0,'history_statuses':['pending','verified','rejected'],'history_error':'passed','earned_access':'passed','public_cta':'passed','calls':calls},indent=2))
 context.close();browser.close()
server.shutdown()
print('PASS DOKU-only purchase: public CTA, history/error, earned access, readonly admin, 8 responsive cases; zero legacy RPC/mutations/hosted traffic')
'''
exec(compile(prefix+steps,__file__,'exec'))
