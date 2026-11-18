import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

console.log('================================================================');
console.log('🧪 TESTING 12 DIGITAL INVITATION THEMES & 3D DOOR INTEGRATION');
console.log('================================================================');

let passed = 0;
const test = (name, fn) => {
  fn();
  console.log(`✅ PASS ${++passed}: ${name}`);
};

const BASE_DIR = resolve('.');

// 1. Verify TypeScript types definition
test('T1: src/types/index.ts exports all 12 InvitationTheme options', () => {
  const typesContent = readFileSync(resolve(BASE_DIR, 'src/types/index.ts'), 'utf8');
  const expectedThemes = [
    'classic-ivory',
    'sage-garden',
    'romantic-rose',
    'midnight-gold',
    'jawa-keraton',
    'bugis-pinisi',
    'minang-songket',
    'bali-dewata',
    'sunda-siger',
    'batak-gorga',
    'islamic-arabesque',
    'monochrome-editorial'
  ];

  for (const theme of expectedThemes) {
    assert.ok(
      typesContent.includes(`'${theme}'`),
      `InvitationTheme in src/types/index.ts must include '${theme}'`
    );
  }
  assert.equal(expectedThemes.length, 12, 'Must have exactly 12 themes defined');
});

// 2. Verify Theme Manager UI
test('T2: src/components/everrae/digital-invitation-manager.tsx lists all 12 themes with categories', () => {
  const managerContent = readFileSync(
    resolve(BASE_DIR, 'src/components/everrae/digital-invitation-manager.tsx'),
    'utf8'
  );
  const expectedThemes = [
    'jawa-keraton',
    'bugis-pinisi',
    'minang-songket',
    'bali-dewata',
    'sunda-siger',
    'batak-gorga',
    'classic-ivory',
    'sage-garden',
    'romantic-rose',
    'midnight-gold',
    'islamic-arabesque',
    'monochrome-editorial'
  ];

  for (const theme of expectedThemes) {
    assert.ok(
      managerContent.includes(`id: '${theme}'`),
      `digital-invitation-manager.tsx must contain theme option id '${theme}'`
    );
  }

  // Verify categories: nusantara, modern, luxury
  assert.ok(managerContent.includes("category: 'nusantara'"), 'Must contain nusantara category');
  assert.ok(managerContent.includes("category: 'modern'"), 'Must contain modern category');
  assert.ok(managerContent.includes("category: 'luxury'"), 'Must contain luxury category');
});

// 3. Verify Theme Configuration Generator
test('T3: src/components/everrae/invitation-theme-config.tsx contains visual configs for all 12 themes', () => {
  const configContent = readFileSync(
    resolve(BASE_DIR, 'src/components/everrae/invitation-theme-config.tsx'),
    'utf8'
  );
  const expectedThemes = [
    'jawa-keraton',
    'bugis-pinisi',
    'minang-songket',
    'bali-dewata',
    'sunda-siger',
    'batak-gorga',
    'classic-ivory',
    'sage-garden',
    'romantic-rose',
    'midnight-gold',
    'islamic-arabesque',
    'monochrome-editorial'
  ];

  for (const theme of expectedThemes) {
    assert.ok(
      configContent.includes(`case '${theme}':`),
      `invitation-theme-config.tsx must have a case for '${theme}'`
    );
  }

  // Check required visual attributes
  const requiredFields = [
    'doorBg',
    'doorLabelLeft',
    'doorLabelRight',
    'sealSubtitle',
    'plaqueThemeTag',
    'celebrationTag',
    'archClass',
    'archTag',
    'doorSvg',
    'heroEmblem',
    'cornerTopLeft',
    'cornerTopRight'
  ];
  for (const field of requiredFields) {
    assert.ok(
      configContent.includes(`${field}:`),
      `invitation-theme-config.tsx must provide field '${field}'`
    );
  }
});

// 4. Verify 3D Door CSS Engine
test('T4: src/app/globals.css contains GPU-accelerated 3D door swing rules', () => {
  const cssContent = readFileSync(resolve(BASE_DIR, 'src/app/globals.css'), 'utf8');

  assert.ok(cssContent.includes('.pw-doors-wrapper'), 'Must have .pw-doors-wrapper');
  assert.ok(cssContent.includes('perspective: 1400px'), 'Must set perspective: 1400px for depth');
  assert.ok(cssContent.includes('.pw-door-leaf'), 'Must have .pw-door-leaf');
  assert.ok(cssContent.includes('transform-style: preserve-3d'), 'Must preserve-3d');
  assert.ok(cssContent.includes('.pw-door-left'), 'Must have .pw-door-left');
  assert.ok(cssContent.includes('transform-origin: left center'), 'Left door must swing from left');
  assert.ok(cssContent.includes('.pw-door-right'), 'Must have .pw-door-right');
  assert.ok(cssContent.includes('transform-origin: right center'), 'Right door must swing from right');
  assert.ok(cssContent.includes('rotateY(-115deg)'), 'Left door must rotate outward -115deg');
  assert.ok(cssContent.includes('rotateY(115deg)'), 'Right door must rotate outward +115deg');
  assert.ok(cssContent.includes('.pw-cover-center-badge'), 'Must have center badge/wax seal');
  assert.ok(cssContent.includes('.pw-door-knocker'), 'Must have knocker ring ornament');
});

// 5. Verify Public Invitation View Component
test('T5: src/components/everrae/public-invitation-view.tsx integrates 3D doors, audio, and guest card', () => {
  const viewContent = readFileSync(
    resolve(BASE_DIR, 'src/components/everrae/public-invitation-view.tsx'),
    'utf8'
  );

  assert.ok(
    viewContent.includes('getInvitationThemeConfig'),
    'public-invitation-view.tsx must use getInvitationThemeConfig'
  );
  assert.ok(
    viewContent.includes('pw-doors-wrapper'),
    'public-invitation-view.tsx must render pw-doors-wrapper'
  );
  assert.ok(
    viewContent.includes('pw-door-leaf pw-door-left'),
    'public-invitation-view.tsx must render left door leaf'
  );
  assert.ok(
    viewContent.includes('pw-door-leaf pw-door-right'),
    'public-invitation-view.tsx must render right door leaf'
  );
  assert.ok(
    viewContent.includes('pw-cover-center-badge'),
    'public-invitation-view.tsx must render pw-cover-center-badge'
  );
  assert.ok(
    viewContent.includes('Buka Undangan'),
    'public-invitation-view.tsx must have Buka Undangan CTA button'
  );
  assert.ok(
    viewContent.includes('audioRef'),
    'public-invitation-view.tsx must have audio playback integration'
  );
  assert.ok(
    viewContent.includes('guestName'),
    'public-invitation-view.tsx must handle dynamic guest personalization'
  );
});

// 6. Verify Static Export Build Artifacts and JS Bundle
test('T6: Built static export bundles compiled 3D doors & theme components', () => {
  assert.ok(existsSync(resolve(BASE_DIR, 'out/u/rohim-wiwit.html')), 'out/u/rohim-wiwit.html must exist');
  assert.ok(existsSync(resolve(BASE_DIR, 'out/u/preview.html')), 'out/u/preview.html must exist');
  assert.ok(existsSync(resolve(BASE_DIR, 'out/preview-themes.html')), 'out/preview-themes.html must exist');

  // Verify HTML metadata
  const rohimHtml = readFileSync(resolve(BASE_DIR, 'out/u/rohim-wiwit.html'), 'utf8');
  assert.ok(rohimHtml.includes('viewport'), 'rohim-wiwit.html must contain viewport meta tag');
  assert.ok(rohimHtml.includes('The Wedding of Rohim'), 'rohim-wiwit.html must contain couple title');

  // Check compiled client bundle contains 3D doors & Buka Undangan
  const chunkDir = resolve(BASE_DIR, 'out/_next/static/chunks');
  const chunkFiles = readdirSync(chunkDir).filter(f => f.endsWith('.js'));
  let bundleContains3DDoors = false;
  let bundleContainsBukaUndangan = false;
  let bundleContainsThemes = false;

  for (const chunk of chunkFiles) {
    const chunkContent = readFileSync(join(chunkDir, chunk), 'utf8');
    if (chunkContent.includes('pw-doors-wrapper')) bundleContains3DDoors = true;
    if (chunkContent.includes('Buka Undangan')) bundleContainsBukaUndangan = true;
    if (chunkContent.includes('jawa-keraton') && chunkContent.includes('bugis-pinisi')) bundleContainsThemes = true;
  }

  assert.ok(bundleContains3DDoors, 'Compiled JS chunks must contain pw-doors-wrapper 3D engine');
  assert.ok(bundleContainsBukaUndangan, 'Compiled JS chunks must contain Buka Undangan action');
  assert.ok(bundleContainsThemes, 'Compiled JS chunks must contain theme configurations');

  // Check standalone 3D simulator
  const previewHtml = readFileSync(resolve(BASE_DIR, 'out/preview-themes.html'), 'utf8');
  assert.ok(previewHtml.includes('doors-wrapper'), 'preview-themes.html must contain doors-wrapper');
  assert.ok(previewHtml.includes('door-leaf'), 'preview-themes.html must contain door-leaf');
  const previewProfiles = ['bugis', 'jawa', 'minang', 'bali', 'sunda', 'batak', 'islamic', 'ivory', 'sage', 'rose', 'midnight', 'monochrome'];
  for (const prof of previewProfiles) {
    assert.ok(previewHtml.includes(`${prof}:`), `preview-themes.html must contain profile '${prof}'`);
  }
});

console.log('================================================================');
console.log(`🎉 ALL ${passed} INVITATION & 3D DOOR INTEGRATION TESTS PASSED!`);
console.log('================================================================\n');
