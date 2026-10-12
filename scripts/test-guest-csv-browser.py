"""CSV workflow against production export in isolated Chrome storage."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
HEADER='Nama Tamu,Kategori Circle,Jumlah Pax,Nomor WhatsApp,Status RSVP\r\n'
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True)
    page=browser.new_page(viewport={'width':390,'height':844},accept_downloads=True)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://localhost:4190/dashboard',wait_until='networkidle')
    old={'id':'old','workspace_id':'test','name':'Existing Guest','category':'vip','pax':3,'phone':'081234567890','rsvp_status':'attending','notes':'Keep my notes'}
    fixture={'workspace':{'id':'test','title':'Pernikahan CSV Test','wedding_date':'2027-06-12','target_budget':1000,'target_savings':0,'created_at':'2026-10-12'},'tasks':[],'budgets':[],'guests':[old],'inviteToken':'TEST'}
    page.evaluate('(d)=>localStorage.setItem("everrae_workspace_v1",JSON.stringify(d))',fixture)
    page.reload(wait_until='networkidle')
    page.locator('.planner-shortcuts').get_by_role('button',name='Tamu',exact=True).click()
    with page.expect_download() as dl:
        page.get_by_role('link',name='Unduh Template CSV',exact=True).click()
    assert dl.value.suggested_filename=='template-tamu.csv'
    template=Path(dl.value.path()).read_text(encoding='utf-8-sig')
    assert template.startswith(HEADER.replace('\r\n','\n')) and 'CONTOH' in template
    def upload(body):
        page.get_by_label('Unggah CSV',exact=True).set_input_files({'name':'guests.csv','mimeType':'text/csv','buffer':('\ufeff'+HEADER+body).encode('utf-8')})
    def data(): return page.evaluate('JSON.parse(localStorage.everrae_workspace_v1)')
    body='"New Guest, Jakarta",sahabat,2,081111111111,sent\r\nSecond Guest,lainnya,1,,uncontacted\r\n'
    upload(body)
    page.get_by_role('heading',name='Pratinjau: 2 tamu akan ditambahkan').wait_for()
    assert data()==fixture
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.get_by_role('button',name='Batal Impor').click()
    assert data()==fixture
    upload('Broken,sahabat,0,,sent')
    page.locator('section[aria-label="Impor tamu CSV"]').get_by_role('alert').wait_for()
    assert data()==fixture and not page.get_by_role('button',name='Tambahkan 1 Tamu').count()
    upload('Other,sahabat,1,+6281234567890,sent')
    page.locator('section[aria-label="Impor tamu CSV"]').get_by_role('alert').wait_for()
    assert 'Duplikat' in page.locator('section[aria-label="Impor tamu CSV"]').get_by_role('alert').inner_text() and data()==fixture
    upload('Same,sahabat,1,,sent\nSame,sahabat,1,,sent')
    page.locator('section[aria-label="Impor tamu CSV"]').get_by_role('alert').wait_for()
    assert data()==fixture
    upload(body)
    page.get_by_role('button',name='Tambahkan 2 Tamu',exact=True).click()
    page.get_by_text('2 tamu ditambahkan. Data lama tetap tersimpan.',exact=True).wait_for()
    saved=data()
    assert len(saved['guests'])==3 and next(g for g in saved['guests'] if g['id']=='old')==old
    assert len({g['id'] for g in saved['guests']})==3
    assert saved['workspace']==fixture['workspace'] and saved['tasks']==[] and saved['budgets']==[]
    page.reload(wait_until='networkidle')
    assert data()==saved
    page.locator('.planner-shortcuts').get_by_role('button',name='Tamu',exact=True).click()
    with page.expect_download() as dl: page.get_by_role('button',name='Export CSV',exact=True).click()
    exported=Path(dl.value.path()).read_text(encoding='utf-8-sig')
    assert '"New Guest, Jakarta"' in exported and '"081111111111"' in exported
    for width in [360,390,430,1440]:
        page.set_viewport_size({'width':width,'height':844})
        upload(body.replace('New Guest, Jakarta','Another, Jakarta').replace('081111111111','082222222222').replace('Second Guest','Third Guest'))
        page.get_by_role('heading',name='Pratinjau: 2 tamu akan ditambahkan').wait_for()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
        page.get_by_role('button',name='Batal Impor').click()
    assert not errors,errors
    browser.close()
print(json.dumps({'result':'PASS','checks':['template download','UTF-8 BOM upload and preview','no mutation before confirmation/cancel','malformed and duplicate rejection','confirmed append preserves old guest including notes and IDs','unique UUIDs','reload persistence','export quoted phone/comma','360/390/430/1440px no overflow','no page errors']}))
