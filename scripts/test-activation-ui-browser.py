"""Fully intercepted inactive-workspace UI; zero hosted requests or mutations."""
from pathlib import Path
source = Path('scripts/test-guidance-reset-browser.py').read_text()
prefix = source[:source.index(" page.goto(base+'/onboarding')")]
prefix = prefix.replace("data=[{'workspace_id':ws,'feature':'core','expires_at':None,'revoked_at':None}]", 'data=[]')
prefix = prefix.replace("context.route('https://fixture.supabase.co/**',route)", "context.route('**/*',safe_route)")
prefix = prefix.replace('with sync_playwright() as p:', '''def safe_route(r):
 if r.request.url.startswith(base+'/'):r.continue_();return
 assert r.request.url.startswith('https://fixture.supabase.co/'),r.request.url
 assert r.request.method=='GET' or r.request.url.endswith('/rpc/has_developer_test_access'),'Mutation forbidden'
 route(r)
with sync_playwright() as p:''')
steps = r'''
 evidence=Path('docs/evidence/activation-ui');evidence.mkdir(parents=True,exist_ok=True)
 page.goto(base+'/dashboard')
 page.get_by_role('heading',name='Workspace menunggu aktivasi',exact=True).wait_for()
 primary=page.get_by_role('link',name='Lihat paket & aktivasi',exact=True)
 assert primary.get_attribute('href')=='/purchase'
 assert page.locator('.activation-primary').count()==1
 assert not page.get_by_role('button',name='Reset rencana dari nol',exact=True).is_visible()
 assert page.locator('.activation-payment').evaluate('e=>!e.open')
 for width in [360,390,430,1280]:
  for scale in [1,2]:
   page.set_viewport_size({'width':width,'height':900 if width==1280 else 844})
   page.evaluate('(s)=>document.documentElement.style.fontSize=16*s+"px"',scale)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,scale)
   for control in page.locator('.activation-gate a,.activation-gate button,.activation-gate summary').all():
    if control.is_visible():assert control.bounding_box()['height']>=44,(width,scale,control.inner_text())
   primary.scroll_into_view_if_needed()
   assert primary.evaluate('e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e}'),'Primary obscured'
   if scale==1 and width in [390,1280]:
    page.evaluate('window.scrollTo(0,0)');page.screenshot(path=str(evidence/f'activation-{width}.png'),full_page=True)
 # Use the actual banner class with a fixed synthetic obstacle: scoped CSS must put it in flow.
 page.evaluate("""()=>{const b=document.createElement('aside');b.className='pwa-install-banner';b.textContent='Pasang aplikasi (fixture)';document.body.append(b)}""")
 assert page.locator('.pwa-install-banner').evaluate('e=>getComputedStyle(e).position')=='static'
 primary.scroll_into_view_if_needed()
 assert primary.evaluate('e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e}')
 page.locator('.pwa-install-banner').evaluate('e=>e.remove()')
 page.locator('.activation-payment summary').click()
 assert page.get_by_text('Tidak ada aktivasi otomatis dari redirect pembayaran.',exact=False).is_visible()
 page.locator('.activation-maintenance summary').click()
 trigger=page.get_by_role('button',name='Reset rencana dari nol',exact=True);trigger.click()
 dialog=page.get_by_role('dialog',name='Reset rencana dari nol');dialog.wait_for()
 field=dialog.get_by_label('Ketik RESET RENCANA untuk melanjutkan')
 delete=dialog.get_by_role('button',name='Hapus isi rencana',exact=True)
 assert delete.is_disabled();field.fill('reset rencana');assert delete.is_disabled()
 field.fill('RESET RENCANA');assert delete.is_enabled()
 dialog.get_by_role('button',name='Batal',exact=True).click();assert not resets
 page.get_by_role('button',name='Pengaturan & pasangan',exact=True).click()
 assert page.locator('.planner-shell').is_visible()
 assert not any(m!='GET' and '/rpc/has_developer_test_access' not in u for m,u,_ in calls)
 (evidence/'summary.json').write_text(json.dumps({'responsive_cases':8,'writes':0,'hosted_requests':0,'exact_confirmation':'passed','settings':'passed'},indent=2))
 context.close();browser.close()
server.shutdown()
print('PASS activation hierarchy, 8 responsive/text200% cases, payment/reset disclosure, exact confirmation/cancel, settings; zero writes/hosted requests')
'''
exec(compile(prefix+steps,__file__,'exec'))
