"""Synthetic transport-only reset modal regression. Never submits a reset.
Build with fixture Supabase public config before running. No hosted traffic.
"""
import json
from pathlib import Path

# Reuse the existing synthetic auth/read fixtures, not its destructive test steps.
source = Path('scripts/test-guidance-reset-browser.py').read_text()
prefix = source[:source.index(" page.goto(base+'/onboarding')")]
prefix = prefix.replace("context.route('https://fixture.supabase.co/**',route)", "context.route('**/*',safe_route)")
prefix = prefix.replace('with sync_playwright() as p:', '''def safe_route(r):
 if r.request.url.startswith(base+'/'):r.continue_();return
 assert r.request.url.startswith('https://fixture.supabase.co/'),r.request.url
 assert r.request.method=='GET' or r.request.url.endswith('/rpc/has_developer_test_access'), 'Mutation forbidden'
 route(r)
with sync_playwright() as p:''')
steps = r'''
 evidence=Path('docs/evidence/reset-dialog');evidence.mkdir(parents=True,exist_ok=True)
 results=[]
 page.goto(base+'/dashboard')
 trigger=page.get_by_role('button',name='Reset rencana dari nol',exact=True);trigger.wait_for()
 for mode in ['app','android','ios','standalone']:
  # Emulate display-mode reporting only; this is not an installed-device test.
  page.evaluate("""mode=>{const original=window.__originalMatchMedia||window.matchMedia.bind(window);window.__originalMatchMedia=original;window.matchMedia=q=>q==='(display-mode: standalone)'?{matches:mode==='standalone',media:q,addEventListener(){},removeEventListener(){}}:original(q)}""",mode)
  page.evaluate("document.querySelector('.pwa-install-banner')?.remove()")
  if mode in ['android','ios']:
   # Synthetic fixed PWA obstacle using the real banner's stacking level.
   page.evaluate("""m=>{const b=document.createElement('aside');b.className='pwa-install-banner';b.textContent=m==='ios'?'Pasang di iPhone / iPad':'Pasang Aplikasi di HP';b.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:999;background:white;padding:20px';document.body.append(b)}""",mode)
  for width,height in [(360,640),(390,844),(430,844),(1280,900),(844,390)]:
   page.set_viewport_size({'width':width,'height':height})
   for scale in [1,2]:
    page.evaluate('(s)=>document.documentElement.style.fontSize=(16*s)+"px"',scale)
    trigger.click();dialog=page.get_by_role('dialog',name='Reset rencana dari nol');dialog.wait_for()
    metrics=dialog.evaluate("""e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e),b=getComputedStyle(e.parentElement);const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height-5);return {background:s.backgroundColor,color:s.color,z:b.zIndex,left:r.left,right:r.right,top:r.top,bottom:r.bottom,centered:Math.abs((r.left+r.right)/2-innerWidth/2)<2,above:e.contains(top)||e===top,overflow:s.overflowY,locked:document.body.style.overflow==='hidden'}}""")
    results.append(dict(mode=mode,viewport=[width,height],scale=scale,**metrics))
    page.screenshot(path=str(evidence/f'{mode}-{width}-{height}-{scale}.png'))
    (evidence/'metrics.json').write_text(json.dumps(results,indent=2))
    assert metrics['background']=='rgb(255, 255, 255)',metrics
    assert int(metrics['z'])>=1000 and metrics['above'],metrics
    assert metrics['left']>=8 and metrics['right']<=width-8 and metrics['top']>=8 and metrics['bottom']<=height-8,metrics
    assert metrics['centered'] and metrics['locked'] and metrics['overflow']=='auto',metrics
    field=dialog.get_by_label('Ketik RESET RENCANA untuk melanjutkan')
    assert field.evaluate('e=>e===document.activeElement')
    delete=dialog.get_by_role('button',name='Hapus isi rencana',exact=True)
    assert delete.is_disabled();field.fill('wrong');assert delete.is_disabled()
    field.fill('RESET RENCANA');assert delete.is_enabled()
    delete.focus();page.keyboard.press('Tab');assert field.evaluate('e=>e===document.activeElement')
    page.keyboard.press('Shift+Tab');assert delete.evaluate('e=>e===document.activeElement')
    cancel=dialog.get_by_role('button',name='Batal',exact=True)
    cancel.scroll_into_view_if_needed()
    assert dialog.evaluate('e=>e.scrollWidth<=e.clientWidth'), 'Dialog horizontal overflow'
    assert cancel.evaluate('e=>{const r=e.getBoundingClientRect(),d=e.closest("[role=dialog]").getBoundingClientRect();return r.top>=d.top && r.bottom<=d.bottom}'), 'Cancel not reachable by scrolling'
    if mode=='app':page.screenshot(path=str(evidence/f'scrolled-{width}-{height}-{scale}.png'))
    cancel.click();assert dialog.count()==0
    assert trigger.evaluate('e=>e===document.activeElement')
    assert page.evaluate('document.body.style.overflow')!='hidden'
    trigger.click();assert field.input_value()=='';page.keyboard.press('Escape');assert dialog.count()==0
    assert trigger.evaluate('e=>e===document.activeElement')
    trigger.click();page.mouse.click(2,2);assert dialog.count()==0
 assert not resets
 assert not any(m!='GET' and '/rpc/has_developer_test_access' not in u for m,u,_ in calls)
 (evidence/'summary.json').write_text(json.dumps(dict(cases=len(results),writes=0,hosted_requests=0),indent=2))
 context.close();browser.close()
server.shutdown()
print('PASS 40 modal geometry/text-scale/PWA obstacle cases; focus, Escape, cancel/backdrop; zero writes and hosted requests')
'''
exec(compile(prefix+steps, __file__, 'exec'))
