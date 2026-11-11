import {verifyPinned} from './signature-pins.mjs';
// LOCAL ONLY publication candidate; finite tuple is supplied later, never selected here.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifyEvidence,canonical} from './signature-finite-evidence.mjs';
// No credential access; evidence provenance still requires independent review.
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',timeout:30000,maxBuffer:1048576}).trim();
const root='sandbox-release/signature-closed/api',marker='.github/sandbox-approvals/signature-finite-api-lease.json';
assert.equal(process.env.GITHUB_REPOSITORY,'rohimgavino/Wedding-Planner');assert.equal(process.env.GITHUB_REF,'refs/heads/sandbox/doku-checkout');assert.equal(process.env.GITHUB_EVENT_NAME,'push');
const e=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH));assert.equal(e.created,false);assert.equal(e.deleted,false);assert.equal(e.forced,false);assert.equal(e.before,git('show','-s','--format=%P','HEAD'));assert.equal(e.after,git('rev-parse','HEAD'));
assert.ok(['A\t'+marker,'M\t'+marker].includes(git('diff','--name-status','HEAD^','HEAD')));
assert.equal(git('rev-parse','HEAD:'+root),'42d6e65f01ca0c5bfaf56f297dd22fca2545f865');
const p=JSON.parse(readFileSync(marker));assert.equal(p.parent,e.before);assert.equal(p.authorization,'APPROVED_EXACT_FINITE_SANDBOX_LEASE');
assert.match(p.leaseId,/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
for(const k of ['salesStart','salesExpires','reconciliationExpires'])assert.equal(new Date(p[k]).toISOString(),p[k]);
const s=Date.parse(p.salesStart),x=Date.parse(p.salesExpires),r=Date.parse(p.reconciliationExpires);assert.ok(s>Date.now()&&x>s&&x-s<=900000&&r>x&&r-x<=86400000);
// Execution gate: separate reviewed DB installation, tuple and supervised closure proof mandatory.
assert.deepEqual(Object.keys(p).sort(),['parent','authorization','leaseId','salesStart','salesExpires','reconciliationExpires','activationSqlSha256','evidence'].sort());
assert.equal(readFileSync(marker,'utf8'),canonical(p),'exact LF canonical marker required');
assert.equal(git('status','--porcelain','--untracked-files=no'),'','pristine publication required');
verifyEvidence(p,path=>readFileSync(path));
for(const path of ['.github/scripts/check-signature-finite.mjs','.github/scripts/signature-finite-evidence.mjs','.github/workflows/signature-finite.yml']){const bytes=Buffer.from(readFileSync(path,'utf8').replace(/\r\n/g,'\n'));assert.equal(createHash('sha256').update(bytes).digest('hex'),createHash('sha256').update(execFileSync('git',['show','HEAD:'+path])).digest('hex'));writeFileSync(path,bytes);}
const file=root+'/services/doku-cf-sandbox/wrangler.simple-sandbox.json',base=JSON.parse(readFileSync(file));
assert.equal(base.name,'pp-doku-sbx-disabled-20261102-bec84f2');assert.equal(base.account_id,'4c9d871a80b70e0c2275773bcd51db84');assert.equal(base.vars.SANDBOX_ENABLED,'false');assert.equal(base.vars.PLANNER_TRANSPORT_VERSION,'disabled');assert.equal(base.vars.SALES_PROTOCOL,'successor-lease-v1');assert.deepEqual(base.routes,[]);assert.equal(base.observability.enabled,false);
verifyPinned();
const config=JSON.parse(readFileSync(file));Object.assign(config.vars,{SANDBOX_ENABLED:'true',SALES_LEASE_ID:p.leaseId,SALES_START:p.salesStart,SALES_EXPIRES:p.salesExpires,RECONCILIATION_EXPIRES:p.reconciliationExpires});
writeFileSync(file,JSON.stringify(config,null,2)+'\n');
console.log('Exact finite config derived from immutable CLOSED package; planner remains disabled.');
