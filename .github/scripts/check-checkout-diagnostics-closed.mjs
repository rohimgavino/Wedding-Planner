import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const git=(...a)=>execFileSync('git',a,{maxBuffer:10*1024*1024});
const text=(...a)=>git(...a).toString('utf8').trim();
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest="sandbox-release/checkout-diagnostics-closed/publication-manifest.json",review="sandbox-release/checkout-diagnostics-closed/review-manifest.json",checker=".github/scripts/check-checkout-diagnostics-closed.mjs",marker=".github/sandbox-approvals/deploy-checkout-diagnostics-closed.txt";
const manifestHash="3216cedeb38a66db71479c335023ba154bcc713abdfbb319d8c75c17952e1bf0";
const blob=(rev,p)=>git('show',`${rev}:${p}`);
const e=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
assert.equal(process.env.GITHUB_EVENT_NAME,'push');assert.equal(process.env.GITHUB_REPOSITORY,'rohimgavino/Wedding-Planner');
assert.equal(process.env.GITHUB_REF,'refs/heads/sandbox/doku-checkout');
assert.equal(e.ref,process.env.GITHUB_REF);assert.equal(e.repository?.full_name,process.env.GITHUB_REPOSITORY);
for(const k of ['created','deleted','forced'])assert.equal(e[k],false,k);
const head=text('rev-parse','HEAD');assert.equal(e.after,head);assert.equal(process.env.GITHUB_SHA,head);
const parents=text('show','-s','--format=%P',head).split(' ');assert.equal(parents.length,1);assert.equal(parents[0],e.before);
assert.match(e.before,/^[0-9a-f]{40}$/);
assert.equal(text('diff-tree','--no-commit-id','--name-status','-r',e.before,head),`A\t${marker}`);
assert.equal(text('ls-tree',e.before,'--',marker),'');
const mbytes=blob(head,manifest);assert.equal(hash(mbytes),manifestHash);const m=JSON.parse(mbytes);
const pubParents=text('show','-s','--format=%P',e.before).split(' ');assert.deepEqual(pubParents,[m.sourceCommit]);
const delta=text('diff-tree','--no-commit-id','--name-status','-r',m.sourceCommit,e.before).split('\n');
assert.deepEqual(delta.sort(),m.publicationPaths.map(p=>`A\t${p}`).sort());
const expected=`APPROVE CLOSED CHECKOUT DIAGNOSTICS ONLY\nparent=${e.before}\nmanifest=${manifestHash}\napi=${m.api}\nharness=${m.harness}\n`;
assert.equal(blob(head,marker).toString(),expected);assert.equal(readFileSync(marker,'utf8'),expected);
const r=JSON.parse(blob(head,review));assert.equal(r.manifestSha256,manifestHash);
assert.equal(r.checkerSha256,hash(blob(head,checker)));assert.deepEqual(r.publicationPaths,m.publicationPaths);
const pins=[...m.files,{path:manifest,sha256:manifestHash},{path:checker,sha256:r.checkerSha256},{path:review,sha256:hash(blob(head,review))}];
assert.equal(pins.length,47);assert.deepEqual(pins.map(f=>f.path).sort(),m.publicationPaths);
for(const f of pins){
 const b=blob(head,f.path);assert.equal(hash(b),f.sha256,f.path+' Git blob');assert.ok(!b.includes(Buffer.from('\r\n')),f.path+' noncanonical Git bytes');
 const mode=text('ls-tree',head,'--',f.path).split(' ')[0];assert.equal(mode,'100644');
 const working=readFileSync(f.path);
 if(hash(working)!==f.sha256){
  const canonical=Buffer.from(working.toString('utf8').replace(/\r\n/g,'\n'));
  assert.equal(hash(canonical),f.sha256,f.path+' working bytes');writeFileSync(f.path,canonical);
 }
}
assert.equal(text('status','--porcelain','--',...m.publicationPaths,marker),'');
execFileSync(process.execPath,['sandbox-release/checkout-diagnostics-closed/api/verify-closed.mjs'],{stdio:'inherit'});
console.log('PASS: sole parent, added-only approval, exact 47 Git blobs, CLOSED publication');
