import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

let PGlite;
try {
  ({ PGlite } = await import('@electric-sql/pglite'));
} catch {
  ({ PGlite } = await import('file:///C:/Users/MSI/program/Wedding-Planner/node_modules/@electric-sql/pglite/dist/index.js'));
}

const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
let passed = 0;
const test = async (name, fn) => {
  await fn();
  console.log(`PASS ${++passed}: ${name}`);
};

const setSession = async (db, role, userId = null) => {
  await db.exec('RESET ROLE;');
  if (role === 'anon') {
    await db.exec('SET ROLE anon;');
    await db.query("SELECT set_config('request.jwt.claim.sub', '', false);");
  } else if (role === 'authenticated') {
    await db.exec('SET ROLE authenticated;');
    await db.query("SELECT set_config('request.jwt.claim.sub', $1, false);", [userId || '']);
  }
};

console.log('--- Testing Wedding Invitations Migration & RLS ---');
const db = new PGlite();

// Load install.sql baseline
const installSql = readFileSync(new URL('../install.sql', import.meta.url), 'utf8');
await db.exec(installSql);

// Load the new invitations migration
const invSql = readFileSync(new URL('../supabase/migrations/202611170001_wedding_invitations.sql', import.meta.url), 'utf8');
await db.exec(invSql);

// Setup workspace
await setSession(db, 'authenticated', id(1));
const wsRes = await db.query("SELECT public.create_workspace('Pernikahan Rohim & Wiwit', '2027-01-29') as id");
const wsId = wsRes.rows[0].id;

let invId;

await test('T1: Owner can create a draft digital invitation', async () => {
  await setSession(db, 'authenticated', id(1));
  const res = await db.query(`
    INSERT INTO public.wedding_invitations (
      workspace_id, slug, is_published, theme,
      groom_full_name, groom_nickname, groom_parents,
      bride_full_name, bride_nickname, bride_parents,
      akad_date, akad_time, akad_venue, akad_address,
      resepsi_date, resepsi_time, resepsi_venue, resepsi_address,
      gift_bank_name, gift_account_number, gift_account_holder
    ) VALUES (
      $1, 'rohim-wiwit', false, 'classic-ivory',
      'Ahmad Nur Rochim', 'Rohim', 'Bpk. Fulan & Ibu Fulanah',
      'Wiwit Lestari', 'Wiwit', 'Bpk. H. Fulan & Ibu Hj. Fulanah',
      '2027-01-29', '08:00 - 10:00 WIB', 'Masjid Agung', 'Jl. Malioboro No. 1, Yogyakarta',
      '2027-01-29', '11:00 - 14:00 WIB', 'Grand Ballroom', 'Jl. Solo Km. 9, Yogyakarta',
      'BCA', '1234567890', 'Ahmad Nur Rochim'
    ) RETURNING id
  `, [wsId]);

  invId = res.rows[0].id;
  assert.ok(invId, 'invitation id created');
});

await test('T2: Draft invitation is private and hidden from anon', async () => {
  await setSession(db, 'anon');
  const rows = (await db.query("SELECT * FROM public.wedding_invitations WHERE slug = 'rohim-wiwit'")).rows;
  assert.equal(rows.length, 0, 'draft invitation must not be visible to anon');

  // Submit wish on draft fails
  await assert.rejects(
    db.query("SELECT public.submit_invitation_wish('rohim-wiwit', 'Tamu Fulan', 'attending', 2, 'Selamat ya!')"),
    /invitation_not_found_or_unpublished/
  );
});

await test('T3: Slug constraints reject invalid formats', async () => {
  await setSession(db, 'authenticated', id(1));
  // Create second workspace
  const ws2 = (await db.query("SELECT public.create_workspace('WS 2', '2027-02-01') as id")).rows[0].id;

  // Invalid: uppercase, spaces, special chars
  await assert.rejects(
    db.query("INSERT INTO public.wedding_invitations(workspace_id, slug) VALUES($1, 'Rohim & Wiwit')", [ws2]),
    /chk_invitation_slug_format/
  );
  await assert.rejects(
    db.query("INSERT INTO public.wedding_invitations(workspace_id, slug) VALUES($1, 'ab')", [ws2]), // too short
    /chk_invitation_slug_format/
  );
});

await test('T4: Publishing invitation allows public view and wish submission', async () => {
  // Owner publishes
  await setSession(db, 'authenticated', id(1));
  await db.query("UPDATE public.wedding_invitations SET is_published = true WHERE id = $1", [invId]);

  // Anon reads
  await setSession(db, 'anon');
  const pub = (await db.query("SELECT * FROM public.wedding_invitations WHERE slug = 'rohim-wiwit'")).rows[0];
  assert.equal(pub.groom_nickname, 'Rohim');
  assert.equal(pub.bride_nickname, 'Wiwit');

  // Anon submits wish
  const wish = (await db.query(`
    SELECT public.submit_invitation_wish('rohim-wiwit', 'Budi Santoso & Partner', 'attending', 2, 'Barakallahu lakum wa baraka alaikum!') as r
  `)).rows[0].r;

  assert.equal(wish.guest_name, 'Budi Santoso & Partner');
  assert.equal(wish.attendance, 'attending');
  assert.equal(wish.pax, 2);

  // Anon sees wish in list
  const wishes = (await db.query("SELECT * FROM public.wedding_invitation_wishes WHERE invitation_id = $1", [invId])).rows;
  assert.equal(wishes.length, 1);
  assert.equal(wishes[0].message, 'Barakallahu lakum wa baraka alaikum!');
});

await test('T5: Stranger user cannot edit or delete workspace invitation', async () => {
  await setSession(db, 'authenticated', id(2)); // Stranger
  
  // Update on existing invitation affects 0 rows
  const updRes = await db.query("UPDATE public.wedding_invitations SET groom_nickname = 'Hacked' WHERE id = $1", [invId]);
  assert.equal(updRes.rowCount, 0, 'stranger must not be able to update invitation');

  // Verify it wasn't modified
  await setSession(db, 'authenticated', id(1));
  const check = (await db.query("SELECT groom_nickname FROM public.wedding_invitations WHERE id = $1", [invId])).rows[0];
  assert.equal(check.groom_nickname, 'Rohim', 'groom_nickname remained untouched');

  // Insert with another workspace fails WITH CHECK
  await setSession(db, 'authenticated', id(2));
  await assert.rejects(
    db.query("INSERT INTO public.wedding_invitations(workspace_id, slug) VALUES($1, 'stranger-hijack')", [wsId]),
    /row-level security/i
  );
});

await db.close();
console.log(`\n========================================================`);
console.log(`ALL ${passed} WEDDING INVITATION TESTS PASSED 100%!`);
console.log(`========================================================\n`);
