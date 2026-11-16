import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const targetUrl = new URL('./history-plan.mjs', import.meta.url);
let source;
try {
  source = readFileSync(targetUrl, 'utf8');
} catch {
  try {
    source = readFileSync('/review/history-plan.mjs', 'utf8');
  } catch {
    assert.fail('offline historical reconciliation planner missing');
  }
}
const {plan} = await import(targetUrl.href);
const row={invoice:'H-1',workspace_id:'fixture',status:'paid',amount_idr:79000,paid_at:'2020-01-31T00:00:00Z',expires_at:'2021-01-30T00:00:00Z',duration_days:365,benefits:['collaboration','shared_savings'],revoked_at:'2020-06-01T00:00:00Z',evidence:'operator-supplied-immutable-export'};
const manifest=plan([row],{operator:'fixture-reviewer',approved:false});
assert.deepEqual(manifest,plan([row],{operator:'fixture-reviewer',approved:false}));
assert.equal(manifest.entries[0].paid_at,row.paid_at);assert.equal(manifest.entries[0].expires_at,row.expires_at);assert.equal(manifest.entries[0].amount_idr,79000);assert.deepEqual(manifest.entries[0].benefits,row.benefits);assert.equal(manifest.entries[0].revoked_at,row.revoked_at);
for(const key of ['paid_at','expires_at','benefits','evidence']){const bad={...row};delete bad[key];assert.throws(()=>plan([bad],{operator:'reviewer'}),/missing|invalid/)}
assert.throws(()=>plan([row,row],{operator:'reviewer'}),/duplicate/);
assert.equal(manifest.mode,'offline-plan-only');assert.equal(manifest.executable,false);
assert.throws(()=>plan([{...row,expires_at:'2019-01-01T00:00:00Z'}],{operator:'reviewer'}),/expiry/);
console.log('PASS deterministic history plan preserves historical dates amount benefits revocation; rejects incomplete duplicate invalid evidence; no apply');
