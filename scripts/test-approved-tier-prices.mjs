// Synthetic in-memory PostgreSQL only. No env, credentials or external connections.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const activationPath = 'supabase/activation/approved-tier-prices.sql';
// A missing artifact is a no-op so RED reports the missing price behavior, not ENOENT.
const activation = existsSync(activationPath) ? readFileSync(activationPath, 'utf8') : 'BEGIN; COMMIT;';
const approved = [['starter', '75000'], ['premium', '155000'], ['wedding_pro', '255000']];
const db = new PGlite();
const operator = '00000000-0000-0000-0000-000000000002';
const catalog = async () => (await db.query('SELECT public.admin_tier_catalog() AS r')).rows[0].r.packages;
const actor = async (id = operator) => db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${id}',false)`);
const rows = async table => (await db.query(`SELECT to_jsonb(t) AS r FROM public.${table} t ORDER BY to_jsonb(t)::text`)).rows;
const state = async () => {
  await db.exec('RESET ROLE');
  const result = {};
  for (const table of ['tier_price_versions', 'tier_price_current', 'admin_audit']) result[table] = await rows(table);
  return result;
};
const protectedState = async () => {
  const result = {};
  for (const table of ['site_admins', 'site_settings', 'release_controls', 'workspace_entitlements', 'developer_test_grants', 'purchase_requests', 'verified_transactions', 'package_price_versions', 'package_price_current', 'package_invoice_snapshots', 'tier_invoice_snapshots']) result[table] = await rows(table);
  result.security = (await db.query(`SELECT c.relname, c.relacl::text, c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' ORDER BY c.relname`)).rows;
  result.functions = (await db.query(`SELECT p.oid::regprocedure::text AS name, p.proacl::text, pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' ORDER BY p.oid::regprocedure::text`)).rows;
  return result;
};
const attemptFailure = async (sql, pattern) => {
  await assert.rejects(db.exec(sql), pattern);
  // Explicit rollback after a failed operator batch, just as the runbook requires.
  await db.exec('ROLLBACK; RESET ROLE');
};
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    GRANT USAGE ON SCHEMA public,auth TO anon,authenticated;
    GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;
    INSERT INTO auth.users VALUES('00000000-0000-0000-0000-000000000001'),('${operator}');`);
  for (const file of ['202610120001_secure_foundation.sql', '202610140001_workspace_entitlements_savings.sql', '202610140002_admin_manual_purchases.sql', '202610140004_developer_operator_roles.sql', '202610220001_admin_package_pricing.sql', '202610220002_tier_pricing.sql']) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
  }
  // Test-only identity fixture; the operator artifact must never bootstrap roles.
  await db.query("INSERT INTO public.site_admins(user_id,role) VALUES($1,'operator')", [operator]);
  await actor('00000000-0000-0000-0000-000000000001');
  const workspace = (await db.query("SELECT public.create_workspace('Synthetic approved-price test','2027-01-01') AS id")).rows[0].id;
  await db.exec('RESET ROLE');
  await db.query(`INSERT INTO public.package_invoice_snapshots(invoice,environment,request_id,workspace_id,version,amount_idr) VALUES('historical-250k','sandbox','synthetic-history',$1,1,250000)`, [workspace]);
  const protectedBefore = await protectedState();
  await actor();
  const drafts = await catalog();
  assert.deepEqual(drafts.map(p => [p.package_id, p.version, p.config, p.price_eligible, p.checkout_eligible]), approved.map(([id]) => [id, '1', { amount_idr: null, promo: null }, false, false]));
  console.log('PASS migration retains all three unpriced draft seeds before explicit activation');

  const mode = process.argv[2];
  if (mode?.startsWith('--conflict=')) {
    const tier = mode.split('=')[1];
    assert(approved.some(([id]) => id === tier));
    await db.query('SELECT public.admin_update_tier_price($1,$2,$3,$4,$5)', [tier, '1', { amount_idr: '99000', promo: null }, 'Synthetic intervening update', true]);
    const beforeConflict = await state();
    const protectedConflict = await protectedState();
    await actor();
    await attemptFailure(activation, /version conflict/);
    assert.deepEqual(await state(), beforeConflict);
    assert.deepEqual(await protectedState(), protectedConflict);
    console.log(`PASS ${tier} conflict rolls back the entire three-tier batch, including earlier updates/audits`);
  } else if (mode === '--late-audit-failure') {
    await db.exec('RESET ROLE');
    await db.exec(`CREATE FUNCTION public.synthetic_fail_last_audit() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN IF NEW.details->>'package_id'='wedding_pro' THEN RAISE EXCEPTION 'synthetic final audit failure'; END IF; RETURN NEW; END$$;
      CREATE TRIGGER synthetic_fail_last_audit BEFORE INSERT ON public.admin_audit FOR EACH ROW EXECUTE FUNCTION public.synthetic_fail_last_audit()`);
    const beforeFailure = await state();
    await actor();
    await attemptFailure(activation, /synthetic final audit failure/);
    assert.deepEqual(await state(), beforeFailure);
    console.log('PASS final-tier audit failure rolls back all prices, pointers and audits');
  } else {
  await db.exec(activation);
  const priced = await catalog();
  assert.deepEqual(priced.map(p => [p.package_id, p.version, p.config.amount_idr, p.effective_amount_idr]), approved.map(([id, amount]) => [id, '2', amount, amount]), 'operator artifact must configure the three business-approved prices through CAS');
  assert(priced.every(p => p.config.promo === null && !p.promo_active && p.price_eligible && !p.checkout_eligible));
  await db.exec('RESET ROLE');
  assert.deepEqual(await protectedState(), protectedBefore, 'no roles/settings/gates/entitlements/purchases/invoices/schema/grants/functions may change');
  assert.deepEqual((await rows('tier_price_versions')).filter(x => x.r.version === 1).map(x => x.r), drafts.map(p => ({ package_id: p.package_id, version: 1, config: p.config, created_at: p.created_at })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
  const audits = (await db.query("SELECT actor_id, action, details FROM public.admin_audit WHERE details->>'kind'='package.tier_price' ORDER BY details->>'package_id'")).rows;
  assert.equal(audits.length, 3);
  for (const audit of audits) {
    assert.equal(audit.actor_id, operator);
    assert.equal(audit.action, 'settings.updated');
    assert.equal(audit.details.previous_version, '1');
    assert.equal(audit.details.version, '2');
    assert.deepEqual(audit.details.previous_config, { amount_idr: null, promo: null });
    assert.deepEqual(audit.details.config, { amount_idr: approved.find(([id]) => id === audit.details.package_id)[1], promo: null });
    assert.equal(audit.details.sales_activation, false);
    assert.match(audit.details.reason, /approved/i);
  }
  console.log('PASS audited confirmed CAS configures Starter=75000 Premium=155000 Wedding Pro=255000 IDR');
  console.log('PASS immutable drafts and historical Rp250000 invoice preserved; no promo/entitlement/checkout/role/settings activation');

  const committed = await state();
  await actor();
  await attemptFailure(activation, /version conflict/);
  assert.deepEqual(await state(), committed);
  console.log('PASS replay rejected by explicit expected version 1 without additional versions or audit');

  }
} finally {
  await db.close();
}
if (!process.argv[2]) {
  for (const mode of [...approved.map(([id]) => `--conflict=${id}`), '--late-audit-failure']) {
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), mode], { encoding: 'utf8' });
    process.stdout.write(child.stdout ?? '');
    process.stderr.write(child.stderr ?? '');
    assert.equal(child.status, 0, `isolated scenario ${mode}`);
  }
  console.log('PASS approved tier price operator artifact: all synthetic SQL scenarios');
}
