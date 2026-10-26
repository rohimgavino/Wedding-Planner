"""Real Chrome regression checks against the built static export."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE='http://localhost:4190'
SCRATCH=Path('C:/Users/PC/AppData/Local/hermes/cache/scratch')
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1000})
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    for route in ['/', '/demo', '/legal', '/login', '/onboarding', '/dashboard', '/invite']:
        response=page.goto(BASE+route,wait_until='networkidle')
        assert response is not None
        assert response.status==200, (route,response.status)
        results.append({'route':route,'status':response.status})
    page.goto(BASE,wait_until='networkidle')
    assert page.locator('h1').count()==1
    assert 'EverRae' in page.title()
    page.locator('img').evaluate_all('(images)=>images.forEach(i=>i.loading="eager")')
    page.wait_for_function('Array.from(document.images).every(i=>i.complete && i.naturalWidth>0)')
    assert page.locator('img').evaluate_all('(images)=>images.every(i=>i.complete && i.naturalWidth>0)')
    assert set(page.locator('img').evaluate_all('(images)=>images.map(i=>new URL(i.src).pathname)')) == {'/images/landscape-lake.jpg', '/images/wedding-flowers.jpg'}
    page.evaluate('scrollTo(0,0)')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert page.locator('a[href^="#"]').evaluate_all('(links)=>links.every(a=>!!document.querySelector(a.getAttribute("href")))')
    page.locator('summary').first.click()
    assert page.locator('details').first.get_attribute('open') is not None
    page.screenshot(path=str(SCRATCH/'everrae-guidelines-desktop.png'),full_page=True)
    for width in [360,390,430,768,1440]:
        page.set_viewport_size({'width':width,'height':844})
        page.goto(BASE,wait_until='networkidle')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'overflow at {width}'
        assert 'Arial' in page.locator('.everrae').evaluate('(el)=>getComputedStyle(el).fontFamily'),f'missing homepage CSS at {width}'
        assert page.locator('.everrae').evaluate('(el)=>getComputedStyle(el).backgroundColor') != 'rgba(0, 0, 0, 0)',f'missing homepage background at {width}'
        if width<760:
            button=page.get_by_role('button',name='Open menu')
            box=button.bounding_box()
            assert box is not None and box['height']>=44
            button.click()
            assert page.locator('#mobile-navigation').is_visible()
            page.locator('#mobile-navigation').get_by_role('link',name='Paket',exact=True).click()
            assert page.locator('#mobile-navigation').count()==0
            assert page.url.endswith('#pricing')
        results.append({'viewport':width,'overflow':False})
    page.set_viewport_size({'width':390,'height':844})
    page.goto(BASE,wait_until='networkidle')
    page.screenshot(path=str(SCRATCH/'everrae-guidelines-mobile.png'),full_page=True)
    page.goto(BASE+'/demo',wait_until='networkidle')
    storage_before=page.evaluate('JSON.stringify(localStorage)')
    page.get_by_role('button',name='Budget',exact=True).click()
    assert page.get_by_text('Rincian anggaran',exact=True).is_visible()
    page.get_by_role('button',name='Guest List',exact=True).click()
    assert page.get_by_text('Keluarga · 120 tamu',exact=True).is_visible()
    page.get_by_role('button',name='Timeline',exact=True).click()
    page.get_by_role('checkbox').nth(2).check()
    assert page.get_by_text('3 dari 4 tugas selesai',exact=True).is_visible()
    assert page.evaluate('JSON.stringify(localStorage)')==storage_before
    page.reload(wait_until='networkidle')
    assert page.get_by_text('2 dari 4 tugas selesai',exact=True).is_visible()
    page.screenshot(path=str(SCRATCH/'everrae-demo-mobile.png'),full_page=True)
    page.goto(BASE+'/login',wait_until='networkidle')
    assert page.get_by_role('button',name='Google OAuth belum tersedia').is_disabled()
    assert 'maximum-scale=1' not in (page.locator('meta[name="viewport"]').get_attribute('content') or '')
    page.emulate_media(reduced_motion='reduce')
    page.goto(BASE,wait_until='networkidle')
    assert page.evaluate('getComputedStyle(document.documentElement).scrollBehavior')=='auto'
    assert errors==[],errors
    results.append({'demo_tabs':'passed','demo_checklist':'passed','demo_storage_unchanged':True,'runtime_errors':errors,'reduced_motion':'passed','zoom':'enabled'})
    browser.close()
Path('docs').mkdir(exist_ok=True)
Path('docs/TEST-RESULTS.json').write_text(json.dumps(results,indent=2),encoding='utf8')
print(json.dumps(results,indent=2))
