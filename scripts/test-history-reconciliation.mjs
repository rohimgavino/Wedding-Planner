import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Dynamic PGlite import supporting both local and container environments
let PGlite;
try {
  ({ PGlite } = await import('@electric-sql/pglite'));
} catch {
  ({ PGlite } = await import('file:///C:/Users/MSI/program/Wedding-Planner/node_modules/@electric-sql/pglite/dist/index.js'));
}

import { plan } from './history-plan.mjs';
import { validateManifest, reconcileEntry, reconcileManifest } from './reconcile-historical-plan.mjs';

const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
let passed = 0;
const test = async (name, fn) => {
  await fn();
  console.log(`PASS ${++passed}: ${name}`);
};

const user = async (db, n) => {
  await db.exec('RESET ROLE; SET ROLE authenticated;');
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [n ? id(n) : '']);
};

console.log('--- Initializing S2 Historical Reconciliation Integration Test ---');
const db = new PGlite();

// Load the integrated candidate schema (install.sql)
const installSql = readFileSync(new URL('../install.sql', import.meta.url), 'utf8');
await db.exec(installSql);

// Setup workspaces
await user(db, 1);
const wsActive = (await db.query("SELECT public.create_workspace('Legacy Active WS', '2027-01-01') as id")).rows[0].id;
const wsRevoked = (await db.query("SELECT public.create_workspace('Legacy Revoked WS', '2027-01-01') as id")).rows[0].id;
const wsControl = (await db.query("SELECT public.create_workspace('Unentitled WS', '2027-01-01') as id")).rows[0].id;
await db.exec('RESET ROLE;');

const now = new Date();
const pastPaidActive = new Date(now.getTime() - 30 * 86400000).toISOString();
const futureExpActive = new Date(now.getTime() + 335 * 86400000).toISOString();

const pastPaidRevoked = new Date(now.getTime() - 60 * 86400000).toISOString();
const futureExpRevoked = new Date(now.getTime() + 305 * 86400000).toISOString();
const pastRevokedAt = new Date(now.getTime() - 10 * 86400000).toISOString();

const coreBenefits = [
  'collaboration',
  'budget_expenses',
  'checklist',
  'shared_savings',
  'budgets',
  'tasks',
  'guests',
  'savings_accounts',
  'savings_contributions',
  'vendors',
  'vendor_installments',
  'vendor_payments'
];

// Seed historical orders into doku_orders without S2 records (disabling insert trigger to simulate pre-S2 insertion)
await db.exec('ALTER TABLE public.doku_orders DISABLE TRIGGER s2_reservation;');
await db.query(`
  INSERT INTO public.doku_orders(invoice, workspace_id, payer_id, package_id, price_version, amount_idr, duration_days, request_id, status, paid_at)
  VALUES
    ('HIST-ACT-01', $1, $3, 'starter', 1, 79000, 365, 'HIST-ACT-01', 'paid', $4),
    ('HIST-REV-01', $2, $3, 'starter', 1, 79000, 365, 'HIST-REV-01', 'paid', $5)
`, [wsActive, wsRevoked, id(1), pastPaidActive, pastPaidRevoked]);
await db.exec('ALTER TABLE public.doku_orders ENABLE TRIGGER s2_reservation;');

await test('T1: Pre-reconciliation baseline confirms zero S2 records and capability denied', async () => {
  const termsCount = (await db.query("SELECT count(1)::int as c FROM public.package_order_terms WHERE invoice IN ('HIST-ACT-01', 'HIST-REV-01')")).rows[0].c;
  const settCount = (await db.query("SELECT count(1)::int as c FROM public.package_settlements WHERE invoice IN ('HIST-ACT-01', 'HIST-REV-01')")).rows[0].c;
  assert.equal(termsCount, 0, 'terms should not exist before reconciliation');
  assert.equal(settCount, 0, 'settlements should not exist before reconciliation');

  await user(db, 1);
  const capActiveBefore = (await db.query("SELECT public.has_workspace_capability_v1($1, 'shared_savings') as ok", [wsActive])).rows[0].ok;
  const capRevokedBefore = (await db.query("SELECT public.has_workspace_capability_v1($1, 'shared_savings') as ok", [wsRevoked])).rows[0].ok;
  assert.equal(capActiveBefore, false, 'active workspace should not have capability before reconciliation');
  assert.equal(capRevokedBefore, false, 'revoked workspace should not have capability before reconciliation');
  await db.exec('RESET ROLE;');
});

await test('T2: Manifest validator rejects unapproved or tampered manifests', async () => {
  const rawRows = [
    {
      invoice: 'HIST-ACT-01',
      workspace_id: wsActive,
      status: 'paid',
      amount_idr: 79000,
      paid_at: pastPaidActive,
      expires_at: futureExpActive,
      duration_days: 365,
      benefits: coreBenefits,
      revoked_at: null,
      evidence: 'evidence-historical-active-01'
    }
  ];

  // 1. Unapproved plan rejected
  const unapproved = plan(rawRows, { operator: 'lead-auditor', approved: false });
  assert.throws(() => validateManifest(unapproved), /operator-approved/);

  // 2. Approved plan with altered payload rejected by sha256 mismatch
  const approved = plan(rawRows, { operator: 'lead-auditor', approved: true });
  const tampered = { ...approved, entries: [{ ...approved.entries[0], amount_idr: 1000 }] };
  assert.throws(() => validateManifest(tampered), /sha256 checksum mismatch/);
});

await test('T3: Reconcile single entry rejects mismatching order data', async () => {
  const badWorkspaceEntry = {
    invoice: 'HIST-ACT-01',
    workspace_id: id(999), // wrong workspace
    amount_idr: 79000,
    paid_at: pastPaidActive,
    expires_at: futureExpActive,
    duration_days: 365,
    benefits: coreBenefits,
    revoked_at: null,
    evidence: 'evidence-bad-workspace'
  };
  await assert.rejects(reconcileEntry(db, badWorkspaceEntry), /workspace mismatch/);
});

// Prepare the official approved manifest
const historicalRows = [
  {
    invoice: 'HIST-ACT-01',
    workspace_id: wsActive,
    status: 'paid',
    amount_idr: 79000,
    paid_at: pastPaidActive,
    expires_at: futureExpActive,
    duration_days: 365,
    benefits: coreBenefits,
    revoked_at: null,
    evidence: 'evidence-historical-active-01'
  },
  {
    invoice: 'HIST-REV-01',
    workspace_id: wsRevoked,
    status: 'paid',
    amount_idr: 79000,
    paid_at: pastPaidRevoked,
    expires_at: futureExpRevoked,
    duration_days: 365,
    benefits: coreBenefits,
    revoked_at: pastRevokedAt,
    evidence: 'evidence-historical-revoked-01'
  }
];

const approvedManifest = plan(historicalRows, { operator: 'system-reconciliation-operator', approved: true });

await test('T4: Reconcile manifest executes 1-invoice-per-commit successfully', async () => {
  const result = await reconcileManifest(db, approvedManifest);
  assert.equal(result.total, 2);
  assert.equal(result.reconciled, 2);

  const termsCount = (await db.query("SELECT count(1)::int as c FROM public.package_order_terms WHERE invoice IN ('HIST-ACT-01', 'HIST-REV-01')")).rows[0].c;
  const settCount = (await db.query("SELECT count(1)::int as c FROM public.package_settlements WHERE invoice IN ('HIST-ACT-01', 'HIST-REV-01')")).rows[0].c;
  const revCount = (await db.query("SELECT count(1)::int as c FROM public.package_settlement_revocations WHERE invoice = 'HIST-REV-01'")).rows[0].c;

  assert.equal(termsCount, 2, 'both terms created');
  assert.equal(settCount, 2, 'both settlements created');
  assert.equal(revCount, 1, 'revocation created for HIST-REV-01');
});

await test('T5: Historical invariant fidelity in database records', async () => {
  const tAct = (await db.query("SELECT * FROM public.package_order_terms WHERE invoice = 'HIST-ACT-01'")).rows[0];
  assert.equal(tAct.contract_version, 0, 'contract_version must be 0 for legacy terms');
  assert.equal(tAct.duration_days, 365);
  assert.equal(tAct.duration_months, null);
  assert.deepEqual(tAct.benefits, coreBenefits);

  const sAct = (await db.query("SELECT * FROM public.package_settlements WHERE invoice = 'HIST-ACT-01'")).rows[0];
  assert.equal(sAct.evidence_hash, 'evidence-historical-active-01');
  assert.equal(new Date(sAct.verified_at).toISOString(), pastPaidActive);
  assert.equal(new Date(sAct.expires_at).toISOString(), futureExpActive);

  const sRev = (await db.query("SELECT * FROM public.package_settlements WHERE invoice = 'HIST-REV-01'")).rows[0];
  assert.equal(new Date(sRev.verified_at).toISOString(), pastPaidRevoked);
  assert.equal(new Date(sRev.expires_at).toISOString(), futureExpRevoked);

  const rRow = (await db.query("SELECT * FROM public.package_settlement_revocations WHERE invoice = 'HIST-REV-01'")).rows[0];
  assert.equal(new Date(rRow.revoked_at).toISOString(), pastRevokedAt);
});

await test('T6: Capability resolution and RLS enforcement post-reconciliation', async () => {
  await user(db, 1);

  // Active workspace should have capabilities
  const capActive = (await db.query("SELECT public.has_workspace_capability_v1($1, 'shared_savings') as ok", [wsActive])).rows[0].ok;
  assert.equal(capActive, true, 'reconciled active order must grant shared_savings capability');

  const entActive = (await db.query("SELECT public.has_workspace_entitlement($1, 'core') as ok", [wsActive])).rows[0].ok;
  assert.equal(entActive, true, 'reconciled active order must grant core entitlement');

  // Insert paid records successfully into tasks and savings_accounts
  await db.query("INSERT INTO public.tasks(workspace_id, title, phase) VALUES($1, 'Active Reconciled Task', 'Hari H')", [wsActive]);
  await db.query("INSERT INTO public.savings_accounts(workspace_id, account_name) VALUES($1, 'Active Reconciled Savings')", [wsActive]);

  // Revoked workspace must be denied
  const capRevoked = (await db.query("SELECT public.has_workspace_capability_v1($1, 'shared_savings') as ok", [wsRevoked])).rows[0].ok;
  assert.equal(capRevoked, false, 'revoked order must deny shared_savings capability');

  await assert.rejects(
    db.query("INSERT INTO public.savings_accounts(workspace_id, account_name) VALUES($1, 'Denied Savings')", [wsRevoked]),
    /row-level security/
  );

  // Control workspace without order must be denied
  const capControl = (await db.query("SELECT public.has_workspace_capability_v1($1, 'shared_savings') as ok", [wsControl])).rows[0].ok;
  assert.equal(capControl, false, 'unentitled workspace must be denied');

  await db.exec('RESET ROLE;');
});

await test('T7: Idempotence — repeated execution succeeds without duplicate or immutable trigger errors', async () => {
  const result2 = await reconcileManifest(db, approvedManifest);
  assert.equal(result2.total, 2);
  assert.equal(result2.reconciled, 2);

  const termsCount = (await db.query("SELECT count(1)::int as c FROM public.package_order_terms WHERE invoice IN ('HIST-ACT-01', 'HIST-REV-01')")).rows[0].c;
  const settCount = (await db.query("SELECT count(1)::int as c FROM public.package_settlements WHERE invoice IN ('HIST-ACT-01', 'HIST-REV-01')")).rows[0].c;
  const revCount = (await db.query("SELECT count(1)::int as c FROM public.package_settlement_revocations WHERE invoice = 'HIST-REV-01'")).rows[0].c;

  assert.equal(termsCount, 2, 'terms count must remain exactly 2');
  assert.equal(settCount, 2, 'settlements count must remain exactly 2');
  assert.equal(revCount, 1, 'revocations count must remain exactly 1');

  // Capabilities still work seamlessly
  await user(db, 1);
  const capActiveAfter = (await db.query("SELECT public.has_workspace_capability_v1($1, 'shared_savings') as ok", [wsActive])).rows[0].ok;
  assert.equal(capActiveAfter, true);
  await db.exec('RESET ROLE;');
});

await db.close();
console.log(`\n========================================================`);
console.log(`ALL ${passed} INTEGRATION TESTS PASSED: Historical Reconciliation Engine Verified!`);
console.log(`========================================================\n`);
