import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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

console.log('--- Testing Wedding Moodboard & Color Palette Migration & RLS ---');
const db = new PGlite();

// Load install.sql baseline
const installSql = readFileSync(new URL('../install.sql', import.meta.url), 'utf8');
await db.exec(installSql);

// Load the moodboard migration
const moodboardSql = readFileSync(new URL('../supabase/migrations/202611170003_wedding_moodboard.sql', import.meta.url), 'utf8');
await db.exec(moodboardSql);

// Setup workspace
await setSession(db, 'authenticated', id(1));
const wsRes = await db.query("SELECT public.create_workspace('Pernikahan Rohim & Wiwit', '2027-01-29') as id");
const wsId = wsRes.rows[0].id;

// Add partner (user 2)
const invTokenRes = await db.query("SELECT public.create_partner_invitation($1::uuid) as token", [wsId]);
const token = invTokenRes.rows[0].token;
await setSession(db, 'authenticated', id(2));
await db.query("SELECT public.accept_partner_invitation($1)", [token]);

let itemId1;

await test('T1: Owner can set workspace color palette and validate hex constraints', async () => {
  await setSession(db, 'authenticated', id(1));
  const palRes = await db.query(`
    INSERT INTO public.wedding_color_palettes (
      workspace_id, name, primary_color, secondary_color, accent_color, neutral_color, notes
    ) VALUES (
      $1, 'Earthy Terracotta & Sage', '#C86D51', '#7D8D78', '#E6D5B8', '#FDFBF7', 'Tema outdoor rustic'
    ) RETURNING id, primary_color;
  `, [wsId]);

  assert.equal(palRes.rows.length, 1);
  assert.equal(palRes.rows[0].primary_color, '#C86D51');

  // Invalid hex color should be rejected
  await assert.rejects(
    async () => {
      await db.query(`
        UPDATE public.wedding_color_palettes
        SET primary_color = 'invalid-hex'
        WHERE workspace_id = $1;
      `, [wsId]);
    },
    /check constraint/i
  );
});

await test('T2: Partner can insert and manage moodboard items', async () => {
  await setSession(db, 'authenticated', id(2));
  const itemRes = await db.query(`
    INSERT INTO public.wedding_moodboard_items (
      workspace_id, category, title, image_url, color_hex, notes, source_link, sort_order
    ) VALUES (
      $1, 'dekorasi', 'Pelaminan Minimalis Kayu Jati', 'https://images.unsplash.com/photo-1519741497674-611481863552', '#C86D51', 'Rangka kayu jati dengan juntaian bunga baby breath', 'https://pinterest.com/pin/123', 1
    ) RETURNING id, title;
  `, [wsId]);

  assert.equal(itemRes.rows.length, 1);
  assert.equal(itemRes.rows[0].title, 'Pelaminan Minimalis Kayu Jati');
  itemId1 = itemRes.rows[0].id;

  // Invalid image url should be rejected
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.wedding_moodboard_items (
          workspace_id, category, title, image_url
        ) VALUES ($1, 'dekorasi', 'Item Foto Rusak', 'ftp://invalid-protocol');
      `, [wsId]);
    },
    /check constraint/i
  );
});

await test('T3: Partner can read and update moodboard items', async () => {
  await setSession(db, 'authenticated', id(2));
  const selRes = await db.query(
    "SELECT * FROM public.wedding_moodboard_items WHERE workspace_id = $1 ORDER BY sort_order ASC",
    [wsId]
  );
  assert.equal(selRes.rows.length, 1);

  const updRes = await db.query(`
    UPDATE public.wedding_moodboard_items
    SET notes = 'Catatan baru: Minta vendor tambah lampu gantung warm white'
    WHERE id = $1
    RETURNING notes;
  `, [itemId1]);
  assert.equal(updRes.rows[0].notes, 'Catatan baru: Minta vendor tambah lampu gantung warm white');
});

await test('T4: Stranger cannot read, insert, update or delete moodboard or palette', async () => {
  await setSession(db, 'authenticated', id(99)); // Stranger

  // Stranger reads 0 rows
  const readPal = await db.query("SELECT * FROM public.wedding_color_palettes WHERE workspace_id = $1", [wsId]);
  assert.equal(readPal.rows.length, 0);

  const readItems = await db.query("SELECT * FROM public.wedding_moodboard_items WHERE workspace_id = $1", [wsId]);
  assert.equal(readItems.rows.length, 0);

  // Stranger insert rejected by RLS
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.wedding_moodboard_items (
          workspace_id, category, title, image_url
        ) VALUES ($1, 'dekorasi', 'Hacked Item', 'https://evil.com/pic.jpg');
      `, [wsId]);
    },
    /violates row-level security policy/i
  );

  // Stranger update affects 0 rows
  const updRes = await db.query("UPDATE public.wedding_moodboard_items SET title = 'Hacked' WHERE id = $1", [itemId1]);
  assert.equal(updRes.rowCount, 0);

  // Stranger delete affects 0 rows
  const delRes = await db.query("DELETE FROM public.wedding_moodboard_items WHERE id = $1", [itemId1]);
  assert.equal(delRes.rowCount, 0);
});

await test('T5: Anonymous user has zero access to moodboard tables', async () => {
  await setSession(db, 'anon');

  await assert.rejects(
    async () => {
      await db.query("SELECT * FROM public.wedding_color_palettes");
    },
    /permission denied/i
  );

  await assert.rejects(
    async () => {
      await db.query("SELECT * FROM public.wedding_moodboard_items");
    },
    /permission denied/i
  );
});

console.log('\n========================================================');
console.log('ALL 5 WEDDING MOODBOARD TESTS PASSED 100%!');
console.log('========================================================\n');
