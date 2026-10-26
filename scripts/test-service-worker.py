"""Real Chrome: legacy stale HTML, live worker upgrade, CSS and offline regression."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE = 'http://localhost:4190'
PUBLIC = 'http://localhost:4190'
SCRATCH = Path('C:/Users/PC/AppData/Local/hermes/cache/scratch')
LEGACY = Path('scripts/fixtures/legacy-sw.js').read_text()
with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    context = browser.new_context(viewport={'width':390,'height':844})
    page = context.new_page()
    context.route('**/sw.js', lambda r: r.fulfill(body=LEGACY, content_type='application/javascript'))
    page.goto(BASE, wait_until='networkidle')
    page.evaluate('async()=>{await navigator.serviceWorker.ready; if(!navigator.serviceWorker.controller) await new Promise(r=>navigator.serviceWorker.addEventListener("controllerchange",r,{once:true}));}')
    page.evaluate(r'''async()=>{const c=await caches.open('wedding-planner-v1');const html=await (await fetch('/',{cache:'no-store'})).text();await c.put('/',new Response(html.replace(/\/_next\/static\/css\/[^"\s]+\.css/g,'/_next/static/css/deleted-build.css'),{headers:{'Content-Type':'text/html'}}));await (await caches.open('unrelated-cache')).put('/keep',new Response('keep'));}''')
    page.reload(wait_until='networkidle')
    before = page.evaluate('getComputedStyle(document.querySelector(".everrae")).fontFamily')
    assert 'Times' in before, before
    assert page.request.get(BASE+'/_next/static/css/deleted-build.css').status == 404
    page.screenshot(path=str(SCRATCH/'everrae-sw-stale-mobile.png'), full_page=True)
    print('REPRO: legacy cached homepage -> deleted CSS 404 -> '+before, flush=True)
    context.unroute('**/sw.js')
    page.evaluate('async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();}')
    page.wait_for_timeout(2000)
    page.reload(wait_until='networkidle')
    after = page.evaluate('getComputedStyle(document.querySelector(".everrae")).fontFamily')
    assert 'Arial' in after, 'stale HTML survives update: '+after
    assert page.locator('link[rel="stylesheet"]').evaluate_all('(ls)=>ls.every(l=>!l.href.includes("deleted-build"))')
    keys = page.evaluate('caches.keys()')
    assert 'wedding-planner-v1' not in keys, keys
    assert 'unrelated-cache' in keys, keys
    page.locator('img').evaluate_all('(images)=>images.forEach(i=>i.loading="eager")')
    page.wait_for_function('Array.from(document.images).every(i=>i.complete && i.naturalWidth>0)')
    # Same active worker must reject stale HTML even without a version change.
    page.evaluate("async()=>{const c=await caches.open('everrae-public-v2');await c.put('/',new Response('<html><body>stale-current-build</body></html>',{headers:{'Content-Type':'text/html'}}));}")
    page.reload(wait_until='networkidle')
    assert 'Arial' in page.evaluate('getComputedStyle(document.querySelector(".everrae")).fontFamily')
    assert 'stale-current-build' not in page.content()
    context.set_offline(True)
    page.reload(wait_until='networkidle')
    assert 'Arial' in page.evaluate('getComputedStyle(document.querySelector(".everrae")).fontFamily')
    response = page.goto(BASE+'/uncached-offline-route',wait_until='domcontentloaded')
    assert response is not None and response.status == 503
    context.set_offline(False)
    page.goto(BASE, wait_until='networkidle')
    page.screenshot(path=str(SCRATCH/'everrae-sw-recovered-mobile.png'),full_page=True)
    assert 'Arial' in page.evaluate('getComputedStyle(document.querySelector(".everrae")).fontFamily')
    fresh = browser.new_context(viewport={'width':390,'height':844})
    public = fresh.new_page()
    response = public.goto(PUBLIC,wait_until='networkidle')
    assert response is not None and response.status == 200
    assert 'Arial' in public.evaluate('getComputedStyle(document.querySelector(".everrae")).fontFamily')
    public.locator('img').evaluate_all('(images)=>images.forEach(i=>i.loading="eager")')
    public.wait_for_function('Array.from(document.images).every(i=>i.complete && i.naturalWidth>0)')
    for href in public.locator('link[rel="stylesheet"]').evaluate_all('(ls)=>ls.map(l=>l.href)'):
        assert public.request.get(href).status == 200, href
    public.screenshot(path=str(SCRATCH/'everrae-public-mobile-css-fixed.png'),full_page=True)
    result={'legacy_font':before,'updated_font':after,'offline_home':'styled','uncached_offline':503,'unrelated_cache':'preserved','public_get':200,'public_stylesheets':200}
    Path('docs/SERVICE-WORKER-TEST.json').write_text(json.dumps(result,indent=2))
    print(json.dumps(result,indent=2))
    browser.close()
