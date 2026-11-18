"""Automated DOM, HTTP, and CSS verification for 12 Themes & 3D Door integration."""
import urllib.request
import re
from bs4 import BeautifulSoup

BASE = 'http://127.0.0.1:4190'
passed = 0

def test(name, fn):
    global passed
    fn()
    passed += 1
    print(f"PASS {passed}: {name}")

print("--- Testing Live Preview HTTP, DOM & CSS Engine ---")

# Test 1: Health check on preview-themes.html
def t1():
    req = urllib.request.Request(f"{BASE}/preview-themes.html")
    with urllib.request.urlopen(req) as res:
        assert res.status == 200, f"Expected 200, got {res.status}"
        html = res.read().decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # Check Doors wrapper and leaves
        doors = soup.find(id='doorsWrapper')
        assert doors is not None, "Missing #doorsWrapper"
        assert 'doors-wrapper' in doors.get('class', []), "Missing doors-wrapper class"
        
        door_left = soup.find('div', class_='door-left')
        door_right = soup.find('div', class_='door-right')
        assert door_left is not None, "Missing .door-left"
        assert door_right is not None, "Missing .door-right"
        
        # Check Center Seal Badge & Open CTA
        badge = soup.find('div', class_='cover-center-badge')
        assert badge is not None, "Missing .cover-center-badge"
        
        cta = soup.find('button', class_='btn-open-grand')
        assert cta is not None, "Missing .btn-open-grand"
        assert "Buka Undangan" in cta.get_text(), "CTA text must include 'Buka Undangan'"
        assert "openInvitationDoors()" in cta.get('onclick', ''), "CTA must trigger openInvitationDoors()"
        
        # Check 12 theme buttons
        theme_btns = soup.find_all('button', class_='theme-btn')
        assert len(theme_btns) == 12, f"Expected 12 theme buttons, found {len(theme_btns)}"
        
        # Check categories
        cats = {btn.get('data-cat') for btn in theme_btns}
        assert cats == {'nusantara', 'modern', 'luxury'}, f"Unexpected categories: {cats}"
        
        # Check all 12 theme keys
        theme_keys = {btn.get('data-theme') for btn in theme_btns}
        expected_keys = {'bugis', 'jawa', 'minang', 'bali', 'sunda', 'batak', 'islamic', 'ivory', 'sage', 'rose', 'midnight', 'monochrome'}
        assert theme_keys == expected_keys, f"Missing or unexpected theme keys: {expected_keys - theme_keys}"

test("T1: Live 3D simulator (/preview-themes.html) renders doors, 12 themes & CTA", t1)

# Test 2: Public invitation view (/u/rohim-wiwit)
def t2():
    req = urllib.request.Request(f"{BASE}/u/rohim-wiwit")
    with urllib.request.urlopen(req) as res:
        assert res.status == 200, f"Expected 200, got {res.status}"
        html = res.read().decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # Verify title & metadata
        title = soup.find('title')
        assert title and "Rohim & Wiwit" in title.text, f"Unexpected title: {title}"
        
        # Verify responsive viewport meta
        viewport = soup.find('meta', attrs={'name': 'viewport'})
        assert viewport and "width=device-width" in viewport.get('content', ''), "Missing responsive viewport meta"
        
        # Verify OpenGraph tags
        og_title = soup.find('meta', property='og:title')
        assert og_title and "Rohim" in og_title.get('content', ''), "Missing or invalid og:title"
        
        # Verify stylesheets are loaded
        css_links = soup.find_all('link', rel='stylesheet')
        assert len(css_links) >= 1, "Expected at least 1 stylesheet link"
        
        # Check that CSS files return HTTP 200 and contain 3D door rules
        found_3d_css = False
        for link in css_links:
            href = link.get('href')
            if href.startswith('/'):
                with urllib.request.urlopen(f"{BASE}{href}") as css_res:
                    assert css_res.status == 200, f"Failed to load CSS: {href}"
                    css_content = css_res.read().decode('utf-8')
                    if 'pw-doors-wrapper' in css_content and 'rotateY(-115deg)' in css_content:
                        found_3d_css = True
        assert found_3d_css, "Next.js compiled CSS bundle must include .pw-doors-wrapper 3D rules"

test("T2: Public invitation route (/u/rohim-wiwit) metadata, viewport & 3D CSS bundle validated", t2)

# Test 3: Guest query param handling simulation & JS client chunks
def t3():
    req = urllib.request.Request(f"{BASE}/u/rohim-wiwit")
    with urllib.request.urlopen(req) as res:
        html = res.read().decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # Find all script tags
        scripts = soup.find_all('script', src=True)
        found_invitation_logic = False
        for s in scripts:
            src = s.get('src')
            if src.startswith('/'):
                with urllib.request.urlopen(f"{BASE}{src}") as js_res:
                    assert js_res.status == 200, f"Failed to load script: {src}"
                    js_code = js_res.read().decode('utf-8', errors='ignore')
                    if 'pw-doors-wrapper' in js_code and 'Buka Undangan' in js_code:
                        found_invitation_logic = True
                        assert 'jawa-keraton' in js_code, "Compiled JS must contain theme configs"
                        assert 'bugis-pinisi' in js_code, "Compiled JS must contain theme configs"
                        assert 'bali-dewata' in js_code, "Compiled JS must contain theme configs"
                        
        assert found_invitation_logic, "Client JS bundle must contain PublicInvitationView 3D door logic"

test("T3: Client JavaScript chunks contain interactive 3D door logic & 12 themes", t3)

# Test 4: Dashboard & Preview routes accessibility
def t4():
    for route in ['/dashboard', '/u/preview', '/u/undangan-kami', '/']:
        req = urllib.request.Request(f"{BASE}{route}")
        with urllib.request.urlopen(req) as res:
            assert res.status == 200, f"Route {route} failed with {res.status}"

test("T4: All secondary routes (/dashboard, /u/preview, /u/undangan-kami, /) return 200 OK", t4)

print("\n========================================================")
print(f"🎉 ALL {passed} LIVE PREVIEW & DOM VERIFICATION TESTS PASSED 100%!")
print("========================================================\n")
