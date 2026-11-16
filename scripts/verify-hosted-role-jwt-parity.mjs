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

console.log('--- Running Hosted Role & JWT Parity Verification Suite ---');
const db = new PGlite();

const installSql = readFileSync(new URL('../install.sql', import.meta.url), 'utf8');
await db.exec(installSql);

const setSession = async (role, userId = null) => {
  await db.exec('RESET ROLE;');
  if (role === 'anon') {
    await db.exec('SET ROLE anon;');
    await db.query("SELECT set_config('request.jwt.claim.sub', '', false);");
  } else if (role === 'authenticated') {
    await db.exec('SET ROLE authenticated;');
    await db.query("SELECT set_config('request.jwt.claim.sub', $1, false);", [userId || '']);
  } else if (role === 'service_role') {
    await db.exec('SET ROLE service_role;');
  }
};

await test('P1: anon role has NULL auth.uid() and zero access to private workspace tables', async () => {
  await setSession('anon');
  const uid = (await db.query('SELECT auth.uid() as uid')).rows[0].uid;
  assert.equal(uid, null, 'anon role must yield null auth.uid()');

  await assert.rejects(
    db.query("SELECT * FROM public.tasks"),
    /permission denied|row-level security/i
  );
  await assert.rejects(
    db.query("SELECT * FROM public.savings_accounts"),
    /permission denied|row-level security/i
  );
  await db.exec('RESET ROLE;');
});

await test('P2: anon, authenticated, and service_role cannot do direct DML on S2 settlement tables', async () => {
  for (const role of ['anon', 'authenticated', 'service_role']) {
    await setSession(role, id(1));
    await assert.rejects(
      db.query("SELECT * FROM public.package_order_terms"),
      /permission denied/i,
      `direct SELECT on package_order_terms must be denied to ${role}`
    );
    await assert.rejects(
      db.query("SELECT * FROM public.package_settlements"),
      /permission denied/i,
      `direct SELECT on package_settlements must be denied to ${role}`
    );
  }
  await db.exec('RESET ROLE;');
});

await test('P3: authenticated user isolated by workspace membership in RLS', async () => {
  // User 1 creates workspace
  await setSession('authenticated', id(1));
  const ws1 = (await db.query("SELECT public.create_workspace('User 1 WS', '2027-01-01') as id")).rows[0].id;

  // User 2 tries to read or write User 1 workspace
  await setSession('authenticated', id(2));
  const user2Tasks = (await db.query("SELECT * FROM public.tasks WHERE workspace_id = $1", [ws1])).rows;
  assert.equal(user2Tasks.length, 0, 'user 2 must not see tasks in user 1 workspace');

  await assert.rejects(
    db.query("INSERT INTO public.tasks(workspace_id, title, phase) VALUES($1, 'Hacked Task', 'Hari H')", [ws1]),
    /row-level security|permission denied/i,
    'user 2 must not be able to insert tasks into user 1 workspace'
  );
  await db.exec('RESET ROLE;');
});

await test('P4: developer bootstrap, site_role(), and protect_last_developer guard', async () => {
  // Bootstrap user 1 as developer
  await db.exec('RESET ROLE;');
  await db.query("INSERT INTO public.site_admins(user_id, role) VALUES($1, 'developer') ON CONFLICT (user_id) DO UPDATE SET role = 'developer'", [id(1)]);

  // Verify user 1 has developer role
  await setSession('authenticated', id(1));
  const role1 = (await db.query('SELECT public.site_role() as role')).rows[0].role;
  assert.equal(role1, 'developer', 'user 1 should be developer');

  // Developer adds user 2 as operator
  await db.query("SELECT public.set_site_admin($1, 'operator', 'added as operator')", [id(2)]);

  // Verify user 2 has operator role
  await setSession('authenticated', id(2));
  const role2 = (await db.query('SELECT public.site_role() as role')).rows[0].role;
  assert.equal(role2, 'operator', 'user 2 should be operator');

  // Attempting to delete the last developer (user 1) is blocked by protect_last_developer trigger
  await setSession('authenticated', id(1));
  await assert.rejects(
    db.query("SELECT public.set_site_admin($1, NULL, 'attempting removal of sole developer')", [id(1)]),
    /cannot remove last developer/i
  );

  await db.exec('RESET ROLE;');
});

await db.close();
console.log(`\n========================================================`);
console.log(`ALL ${passed} HOSTED ROLE & JWT PARITY TESTS PASSED!`);
console.log(`========================================================\n`);
