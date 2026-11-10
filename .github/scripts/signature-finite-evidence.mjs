// Offline evidence validation. Hash integrity is not proof of hosted execution.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const hash=b=>createHash('sha256').update(b).digest('hex');
export const canonical=x=>JSON.stringify(x,null,2)+'\n';
export function verifyEvidence(p,load){
 const tuple=Object.fromEntries(['leaseId','salesStart','salesExpires','reconciliationExpires'].map(k=>[k,p[k]]));
 const reports={};
 for(const name of ['database','supervision','review']){
  const ref=p.evidence[name];assert.deepEqual(Object.keys(ref).sort(),['path','sha256']);
  assert.equal(ref.path,`sandbox-release/signature-finite-evidence/${name}.json`);assert.match(ref.sha256,/^[a-f0-9]{64}$/);
  const bytes=load(ref.path);assert.equal(hash(bytes),ref.sha256,`${name} evidence hash`);
  const r=JSON.parse(bytes);assert.equal(r.artifactTree,'c497bde8436c7320cc115703036f4bf3a049dc07');assert.deepEqual(r.tuple,tuple);reports[name]=r;
 }
 const d=reports.database;assert.equal(d.project,'timrseunzsdqdrbyvyfn');assert.equal(d.scope,'hosted-rollback-readback');
 assert.deepEqual(d.rows,[{...tuple,enabled:true,closed:false}]);
 assert.equal(d.baselineBeforeSha256,d.baselineAfterSha256);assert.match(d.baselineBeforeSha256,/^[a-f0-9]{64}$/);
 assert.equal(d.sqlSha256,p.activationSqlSha256);assert.match(p.activationSqlSha256,/^[a-f0-9]{64}$/);
 const s=reports.supervision;assert.equal(s.scope,'native-pg-supervisor-rehearsal');
 assert.equal(s.command,'node test-finite-native.mjs');assert.equal(s.exitCode,0);
 assert.match(s.stdoutSha256,/^[a-f0-9]{64}$/);assert.equal(s.closedRows.length,1);assert.deepEqual(s.closedRows,[{closed:true}]);
 const r=reports.review;assert.equal(r.verdict,'PASS');assert.equal(r.artifactTree,'c497bde8436c7320cc115703036f4bf3a049dc07');
 assert.deepEqual(r.findings,[]);assert.ok(r.files.length>=3);
 const seen=new Set();
 for(const f of r.files){assert.match(f.path,/^(?:\.github\/(?:scripts|workflows)\/|sandbox-release\/signature-finite-evidence\/)[A-Za-z0-9_.\/-]+$/);assert.ok(!f.path.includes('..'));assert.ok(!seen.has(f.path));seen.add(f.path);assert.equal(hash(load(f.path)),f.sha256,`reviewed file ${f.path}`);}
 for(const f of ['.github/scripts/check-signature-finite.mjs','.github/scripts/signature-finite-evidence.mjs','.github/workflows/signature-finite.yml'])assert.ok(seen.has(f));
 return reports;
}
