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

console.log('--- Testing Wedding Engagement Planner Migration & RLS ---');
const db = new PGlite();

// Load install.sql baseline
const installSql = readFileSync(new URL('../install.sql', import.meta.url), 'utf8');
await db.exec(installSql);

// Load the engagement migration
const engagementSql = readFileSync(new URL('../supabase/migrations/202611170005_wedding_engagement.sql', import.meta.url), 'utf8');
await db.exec(engagementSql);

// Setup workspace
await setSession(db, 'authenticated', id(1));
const wsRes = await db.query("SELECT public.create_workspace('Pernikahan Rohim & Wiwit', '2027-01-29') as id");
const wsId = wsRes.rows[0].id;

// Add partner (user 2)
const invTokenRes = await db.query("SELECT public.create_partner_invitation($1::uuid) as token", [wsId]);
const token = invTokenRes.rows[0].token;
await setSession(db, 'authenticated', id(2));
await db.query("SELECT public.accept_partner_invitation($1)", [token]);

let eventId1;
let giftId1;
let rundownId1;

await test('T1: Owner can set engagement event info and constraints validate positive budget', async () => {
  await setSession(db, 'authenticated', id(1));
  const eventRes = await db.query(`
    INSERT INTO public.wedding_engagement_events (
      workspace_id, event_date, event_time, venue_name, venue_address, spokesperson_groom, spokesperson_bride, target_budget, guest_count, notes
    ) VALUES (
      $1, '2026-12-20', '09:30 - 12:30 WIB', 'Kediaman Keluarga Wiwit', 'Jl. Kaliurang KM 9, Sleman, Yogyakarta', 'Bpk. H. Bambang (Paman)', 'Bpk. Drs. H. Subagyo (Ayah)', 10000000, 35, 'Dresscode: Sage & Cream'
    ) RETURNING id, venue_name, target_budget;
  `, [wsId]);

  assert.equal(eventRes.rows.length, 1);
  assert.equal(eventRes.rows[0].venue_name, 'Kediaman Keluarga Wiwit');
  assert.equal(Number(eventRes.rows[0].target_budget), 10000000);
  eventId1 = eventRes.rows[0].id;

  // Negative budget should be rejected
  await assert.rejects(
    async () => {
      await db.query(`
        UPDATE public.wedding_engagement_events
        SET target_budget = -1000
        WHERE workspace_id = $1;
      `, [wsId]);
    },
    /check constraint/i
  );
});

await test('T2: Partner can insert and manage seserahan/hantaran boxes', async () => {
  await setSession(db, 'authenticated', id(2));
  const giftRes = await db.query(`
    INSERT INTO public.wedding_engagement_gifts (
      workspace_id, direction, box_number, title, category, status, estimated_cost, notes
    ) VALUES (
      $1, 'groom_to_bride', 1, 'Set Cincin Tunangan Solitaire', 'cincin', 'ready', 4500000, 'Kotak perhiasan beludru emerald'
    ) RETURNING id, title, category;
  `, [wsId]);

  assert.equal(giftRes.rows.length, 1);
  assert.equal(giftRes.rows[0].title, 'Set Cincin Tunangan Solitaire');
  assert.equal(giftRes.rows[0].category, 'cincin');
  giftId1 = giftRes.rows[0].id;

  // Invalid category should be rejected
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.wedding_engagement_gifts (
          workspace_id, direction, box_number, title, category, status, estimated_cost
        ) VALUES (
          $1, 'groom_to_bride', 2, 'Mobil Baru', 'kendaraan_mewah', 'planned', 250000000
        );
      `, [wsId]);
    },
    /check constraint/i
  );
});

await test('T3: Partner can insert engagement rundown items and time regex validates', async () => {
  await setSession(db, 'authenticated', id(2));
  const rundownRes = await db.query(`
    INSERT INTO public.wedding_engagement_rundowns (
      workspace_id, time_start, time_end, activity, pic_name, notes, sort_order
    ) VALUES (
      $1, '09:30', '10:00', 'Penyambutan Keluarga Calon Mempelai Pria', 'MC & Keluarga Wanita', 'Kalungan selendang melati', 1
    ) RETURNING id, activity;
  `, [wsId]);

  assert.equal(rundownRes.rows.length, 1);
  assert.equal(rundownRes.rows[0].activity, 'Penyambutan Keluarga Calon Mempelai Pria');
  rundownId1 = rundownRes.rows[0].id;

  // Invalid time regex should be rejected
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.wedding_engagement_rundowns (
          workspace_id, time_start, activity
        ) VALUES (
          $1, 'pagi-pagi', 'Acara santai'
        );
      `, [wsId]);
    },
    /check constraint/i
  );
});

await test('T4: Stranger (User 3) is blocked by RLS on all engagement tables', async () => {
  await setSession(db, 'authenticated', id(3));

  // Cannot see event
  const eventRes = await db.query(`SELECT * FROM public.wedding_engagement_events WHERE workspace_id = $1;`, [wsId]);
  assert.equal(eventRes.rows.length, 0);

  // Cannot see gifts
  const giftRes = await db.query(`SELECT * FROM public.wedding_engagement_gifts WHERE workspace_id = $1;`, [wsId]);
  assert.equal(giftRes.rows.length, 0);

  // Cannot see rundown
  const rundownRes = await db.query(`SELECT * FROM public.wedding_engagement_rundowns WHERE workspace_id = $1;`, [wsId]);
  assert.equal(rundownRes.rows.length, 0);

  // Cannot update gift
  const updateRes = await db.query(`
    UPDATE public.wedding_engagement_gifts
    SET status = 'purchased'
    WHERE id = $1;
  `, [giftId1]);
  assert.equal(updateRes.rowCount, 0);
});

await test('T5: Anonymous has zero access to engagement tables', async () => {
  await setSession(db, 'anon');

  await assert.rejects(
    async () => {
      await db.query(`SELECT * FROM public.wedding_engagement_events WHERE workspace_id = $1;`, [wsId]);
    },
    /permission denied/i
  );

  await assert.rejects(
    async () => {
      await db.query(`SELECT * FROM public.wedding_engagement_gifts WHERE workspace_id = $1;`, [wsId]);
    },
    /permission denied/i
  );

  await assert.rejects(
    async () => {
      await db.query(`SELECT * FROM public.wedding_engagement_rundowns WHERE workspace_id = $1;`, [wsId]);
    },
    /permission denied/i
  );
});

console.log('--- ALL 5 ENGAGEMENT TESTS PASSED! ---');
