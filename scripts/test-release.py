import os,json,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('EVER RAE_URL'.replace(' ',''),'http://localhost:4190')
result={'url':BASE,'routes':{},'browser':[]}
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True)
 c=b.new_context(viewport={'width':1440,'height':1000});page=c.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 for route in ['/','/dashboard','/onboarding','/login','/demo','/legal','/invite','/templates/template-tamu.csv','/sw.js','/manifest.json','/images/landscape-lake.jpg','/images/wedding-flowers.jpg','/icons/icon-192.png','/icons/icon-512.png','/apple-touch-icon.png','/favicon.ico']:
  r=c.request.get(BASE+route);assert r.status==200,(route,r.status);result['routes'][route]={'status':r.status,'type':r.headers.get('content-type'),'cache':r.headers.get('cache-control')}
 for path in ['/.env','/.git/config','/src/context/WorkspaceContext.tsx','/package.json','/AGENTS.md']:
  assert c.request.get(BASE+path).status==404,path
 for width in [360,390,430,1440]:
  page.set_viewport_size({'width':width,'height':844});page.goto(BASE,wait_until='networkidle')
  assert 'EverRae' in page.title()
  assert 'Arial' in page.locator('.everrae').evaluate('(e)=>getComputedStyle(e).fontFamily')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.locator('img').evaluate_all('(images)=>images.forEach(i=>i.loading="eager")')
  page.wait_for_function('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)')
  for href in page.locator('link[rel="stylesheet"]').evaluate_all('(ls)=>ls.map(l=>l.href)'):assert c.request.get(href).status==200
  result['browser'].append({'width':width,'styled':True,'images':True,'overflow':False})
 fixture={'workspace':{'id':'migration-test','title':'Pernikahan Migration Test','wedding_date':'2027-06-12','target_budget':100,'target_savings':0,'created_at':'2026-10-12'},'budgets':[],'tasks':[],'guests':[{'id':'saved-guest','workspace_id':'migration-test','name':'Preserved Guest','category':'sahabat','pax':2,'phone':'08123456789','rsvp_status':'attending'}],'inviteToken':'TEST'}
 c2=b.new_context();q=c2.new_page();q.goto(BASE+'/dashboard',wait_until='networkidle');q.evaluate('(d)=>{localStorage.removeItem("everrae_workspace_v1");localStorage.setItem("wedding_planner_workspace_clean_v2",JSON.stringify(d))}',fixture);q.reload(wait_until='networkidle')
 assert q.evaluate('JSON.parse(localStorage.everrae_workspace_v1).guests[0].id')=='saved-guest'
 assert q.evaluate('localStorage.everrae_workspace_v1===localStorage.wedding_planner_workspace_clean_v2')
 q.reload(wait_until='networkidle');assert q.evaluate('JSON.parse(localStorage.everrae_workspace_v1).guests[0].name')=='Preserved Guest'
 result['migration']='same-origin legacy data copied, retained and persisted'
 assert not errors,errors;result['errors']=errors
 b.close()
Path('C:/Users/PC/AppData/Local/hermes/cache/scratch/everrae-release-verification.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
