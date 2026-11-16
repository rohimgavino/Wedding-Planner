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

console.log('--- Testing Wedding Rundown Migration & RLS ---');
const db = new PGlite();

// Load install.sql baseline
const installSql = readFileSync(new URL('../install.sql', import.meta.url), 'utf8');
await db.exec(installSql);

// Load the rundown migration
const rundownSql = readFileSync(new URL('../supabase/migrations/202611170002_wedding_rundown.sql', import.meta.url), 'utf8');
await db.exec(rundownSql);

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
let eventId2;

await test('T1: Owner can create rundown events across sessions', async () => {
  await setSession(db, 'authenticated', id(1));
  const res1 = await db.query(`
    INSERT INTO public.wedding_rundown_events (
      workspace_id, session, time_start, time_end, activity, pic_name, pic_phone, location, notes, sort_order
    ) VALUES (
      $1, 'persiapan', '05:30', '07:00', 'Makeup & Busana Pengantin', 'Mbak Ratna MUA', '08123456789', 'Kamar Pengantin Lt. 2', 'Standby busana akad dan aksesoris siger', 1
    ) RETURNING id, activity;
  `, [wsId]);
  
  assert.equal(res1.rows.length, 1);
  assert.equal(res1.rows[0].activity, 'Makeup & Busana Pengantin');
  eventId1 = res1.rows[0].id;

  const res2 = await db.query(`
    INSERT INTO public.wedding_rundown_events (
      workspace_id, session, time_start, time_end, activity, pic_name, pic_phone, location, notes, sort_order
    ) VALUES (
      $1, 'akad', '08:00', '09:00', 'Ijab Kabul & Doa Pasrah Tampih', 'Bpk. Penghulu KUA & MC Kang Dedi', '08987654321', 'Ruang Utama Masjid Al-Ikhlas', 'Cek kelengkapan berkas N1-N4 & mahar', 2
    ) RETURNING id;
  `, [wsId]);
  
  assert.equal(res2.rows.length, 1);
  eventId2 = res2.rows[0].id;
});

await test('T2: Time format and activity constraints reject invalid input', async () => {
  await setSession(db, 'authenticated', id(1));

  // Invalid time_start
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.wedding_rundown_events (
          workspace_id, session, time_start, activity
        ) VALUES ($1, 'akad', '25:99', 'Acara Salah Jam');
      `, [wsId]);
    },
    /check constraint/i
  );

  // Empty activity
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.wedding_rundown_events (
          workspace_id, session, time_start, activity
        ) VALUES ($1, 'akad', '08:00', '   ');
      `, [wsId]);
    },
    /check constraint/i
  );
});

await test('T3: Partner can read, update and sort rundown events', async () => {
  await setSession(db, 'authenticated', id(2));
  
  // Read
  const selRes = await db.query(
    "SELECT * FROM public.wedding_rundown_events WHERE workspace_id = $1 ORDER BY sort_order ASC",
    [wsId]
  );
  assert.equal(selRes.rows.length, 2);

  // Update
  const updRes = await db.query(`
    UPDATE public.wedding_rundown_events
    SET notes = 'Catatan tambahan: MC ingatkan durasi foto', updated_at = now()
    WHERE id = $1
    RETURNING notes;
  `, [eventId2]);
  assert.equal(updRes.rows.length, 1);
  assert.equal(updRes.rows[0].notes, 'Catatan tambahan: MC ingatkan durasi foto');
});

await test('T4: Stranger cannot read, insert, update or delete rundown events', async () => {
  await setSession(db, 'authenticated', id(99)); // Stranger

  // Stranger read returns 0 rows
  const readRes = await db.query(
    "SELECT * FROM public.wedding_rundown_events WHERE workspace_id = $1",
    [wsId]
  );
  assert.equal(readRes.rows.length, 0);

  // Stranger insert rejected by RLS WITH CHECK
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.wedding_rundown_events (
          workspace_id, session, time_start, activity
        ) VALUES ($1, 'akad', '10:00', 'Stranger Event');
      `, [wsId]);
    },
    /violates row-level security policy/i
  );

  // Stranger update affects 0 rows
  const updRes = await db.query(`
    UPDATE public.wedding_rundown_events
    SET activity = 'Hacked Activity'
    WHERE id = $1;
  `, [eventId1]);
  assert.equal(updRes.rowCount, 0);

  // Stranger delete affects 0 rows
  const delRes = await db.query(`
    DELETE FROM public.wedding_rundown_events
    WHERE id = $1;
  `, [eventId1]);
  assert.equal(delRes.rowCount, 0);
});

await test('T5: Anonymous user has zero access to rundown events', async () => {
  await setSession(db, 'anon');

  await assert.rejects(
    async () => {
      await db.query("SELECT * FROM public.wedding_rundown_events");
    },
    /permission denied/i
  );

  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.wedding_rundown_events (
          workspace_id, session, time_start, activity
        ) VALUES ($1, 'akad', '10:00', 'Anon Event');
      `, [wsId]);
    },
    /permission denied/i
  );
});

console.log('\n========================================================');
console.log('ALL 5 WEDDING RUNDOWN TESTS PASSED 100%!');
console.log('========================================================\n');
