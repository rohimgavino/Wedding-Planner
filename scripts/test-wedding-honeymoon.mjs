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

console.log('--- Testing Wedding Honeymoon Planner Migration & RLS ---');
const db = new PGlite();

// Load install.sql baseline
const installSql = readFileSync(new URL('../install.sql', import.meta.url), 'utf8');
await db.exec(installSql);

// Load the honeymoon migration
const honeymoonSql = readFileSync(new URL('../supabase/migrations/202611170004_wedding_honeymoon.sql', import.meta.url), 'utf8');
await db.exec(honeymoonSql);

// Setup workspace
await setSession(db, 'authenticated', id(1));
const wsRes = await db.query("SELECT public.create_workspace('Pernikahan Rohim & Wiwit', '2027-01-29') as id");
const wsId = wsRes.rows[0].id;

// Add partner (user 2)
const invTokenRes = await db.query("SELECT public.create_partner_invitation($1::uuid) as token", [wsId]);
const token = invTokenRes.rows[0].token;
await setSession(db, 'authenticated', id(2));
await db.query("SELECT public.accept_partner_invitation($1)", [token]);

let expenseId1;
let itinId1;

await test('T1: Owner can set honeymoon trip info and constraints validate positive budget', async () => {
  await setSession(db, 'authenticated', id(1));
  const tripRes = await db.query(`
    INSERT INTO public.wedding_honeymoon_trips (
      workspace_id, destination, start_date, end_date, target_budget, hotel_name, booking_code, notes
    ) VALUES (
      $1, 'Ubud & Seminyak, Bali', '2027-02-05', '2027-02-10', 15000000, 'Kayon Jungle Resort', 'BOOK-BALI-123', 'Private pool villa'
    ) RETURNING id, destination, target_budget;
  `, [wsId]);

  assert.equal(tripRes.rows.length, 1);
  assert.equal(tripRes.rows[0].destination, 'Ubud & Seminyak, Bali');
  assert.equal(Number(tripRes.rows[0].target_budget), 15000000);

  // Negative budget should be rejected
  await assert.rejects(
    async () => {
      await db.query(`
        UPDATE public.wedding_honeymoon_trips
        SET target_budget = -5000
        WHERE workspace_id = $1;
      `, [wsId]);
    },
    /check constraint/i
  );
});

await test('T2: Partner can insert and manage honeymoon expenses', async () => {
  await setSession(db, 'authenticated', id(2));
  const expRes = await db.query(`
    INSERT INTO public.wedding_honeymoon_expenses (
      workspace_id, category, title, allocated_amount, spent_amount, payment_status, booking_reference
    ) VALUES (
      $1, 'hotel_resort', 'Vila Ubud 3 Malam Private Pool', 7500000, 7500000, 'paid', 'INV-HOTEL-789'
    ) RETURNING id, title;
  `, [wsId]);

  assert.equal(expRes.rows.length, 1);
  assert.equal(expRes.rows[0].title, 'Vila Ubud 3 Malam Private Pool');
  expenseId1 = expRes.rows[0].id;
});

await test('T3: Partner can insert day-by-day itineraries and validate day range', async () => {
  await setSession(db, 'authenticated', id(2));
  const itinRes = await db.query(`
    INSERT INTO public.wedding_honeymoon_itineraries (
      workspace_id, day_number, time_start, activity, location, notes, sort_order
    ) VALUES (
      $1, 1, '18:00', 'Romantic Candlelight Dinner by the Cliff', 'Alila Uluwatu', 'Dress code semi-formal', 1
    ) RETURNING id, activity;
  `, [wsId]);

  assert.equal(itinRes.rows.length, 1);
  itinId1 = itinRes.rows[0].id;

  // Invalid day number (<1 or >30) should be rejected
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.wedding_honeymoon_itineraries (
          workspace_id, day_number, activity
        ) VALUES ($1, 0, 'Hari Salah');
      `, [wsId]);
    },
    /check constraint/i
  );
});

await test('T4: Stranger cannot read, insert, update or delete honeymoon data', async () => {
  await setSession(db, 'authenticated', id(99)); // Stranger

  const readTrip = await db.query("SELECT * FROM public.wedding_honeymoon_trips WHERE workspace_id = $1", [wsId]);
  assert.equal(readTrip.rows.length, 0);

  const readExp = await db.query("SELECT * FROM public.wedding_honeymoon_expenses WHERE workspace_id = $1", [wsId]);
  assert.equal(readExp.rows.length, 0);

  const readItin = await db.query("SELECT * FROM public.wedding_honeymoon_itineraries WHERE workspace_id = $1", [wsId]);
  assert.equal(readItin.rows.length, 0);

  // Stranger insert rejected by RLS
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.wedding_honeymoon_expenses (
          workspace_id, category, title, allocated_amount
        ) VALUES ($1, 'kuliner', 'Hacked Dinner', 1000000);
      `, [wsId]);
    },
    /violates row-level security policy/i
  );

  // Stranger update affects 0 rows
  const updRes = await db.query("UPDATE public.wedding_honeymoon_expenses SET title = 'Hacked' WHERE id = $1", [expenseId1]);
  assert.equal(updRes.rowCount, 0);

  // Stranger delete affects 0 rows
  const delRes = await db.query("DELETE FROM public.wedding_honeymoon_expenses WHERE id = $1", [expenseId1]);
  assert.equal(delRes.rowCount, 0);
});

await test('T5: Anonymous user has zero access to honeymoon tables', async () => {
  await setSession(db, 'anon');

  await assert.rejects(
    async () => {
      await db.query("SELECT * FROM public.wedding_honeymoon_trips");
    },
    /permission denied/i
  );

  await assert.rejects(
    async () => {
      await db.query("SELECT * FROM public.wedding_honeymoon_expenses");
    },
    /permission denied/i
  );

  await assert.rejects(
    async () => {
      await db.query("SELECT * FROM public.wedding_honeymoon_itineraries");
    },
    /permission denied/i
  );
});

console.log('\n========================================================');
console.log('ALL 5 HONEYMOON PLANNER TESTS PASSED 100%!');
console.log('========================================================\n');
