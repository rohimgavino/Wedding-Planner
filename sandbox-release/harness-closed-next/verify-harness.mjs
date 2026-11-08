import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const root=new URL('./',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('harness-manifest.json',root)));
assert.equal(sha(readFileSync(new URL('harness-manifest.json',root))),'2a4a979eb5cbdcad23a2a8130b97a77c072c7d6fa0c636b250ffc02bcb2a6251');
for(const f of manifest.files){assert.match(f.path,/^harness-closed\/[a-zA-Z0-9_.-]+$/);assert.equal(sha(readFileSync(new URL(f.path,root))),f.sha256,f.path);}
const config=JSON.parse(readFileSync(new URL('harness-closed/public-config.txt',root)));
assert.deepEqual(Object.keys(config).sort(),['checkoutEnabled','publishableKey']);
assert.equal(config.checkoutEnabled,false);assert.match(config.publishableKey,/^sb_publishable_[a-zA-Z0-9_-]+$/);
const wr=JSON.parse(readFileSync(new URL('harness-closed/wrangler.json',root)));
assert.equal(wr.name,'pp-doku-sbx-harness-20261102');assert.equal(wr.account_id,'4c9d871a80b70e0c2275773bcd51db84');
assert.deepEqual(wr.routes,[]);assert.equal(wr.preview_urls,false);assert.equal(wr.observability.enabled,false);
assert.equal(wr.logpush,false);assert.equal(wr.assets,undefined);
if(process.argv.includes('--public-source')){
 // Explicitly unauthenticated; do not follow redirects or consult any credential store.
 const response=await fetch(manifest.publicSource,{redirect:'error',credentials:'omit',headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});
 assert.equal(response.status,200);const text=await response.text();assert.ok(text.length<=4096);
 assert.equal(sha(text),manifest.publicSourceResponseSha256,'Live public source changed; require review, do not substitute a key');
 const live=JSON.parse(text);assert.deepEqual(Object.keys(live).sort(),['checkoutEnabled','publishableKey']);
 assert.equal(live.publishableKey,config.publishableKey);assert.equal(typeof live.checkoutEnabled,'boolean');
 // Reconstruct using only this exact verified public source, always closed.
 writeFileSync(new URL('harness-closed/public-config.txt',root),JSON.stringify({...live,checkoutEnabled:false})+'\n');
 assert.equal(sha(readFileSync(new URL('harness-closed/public-config.txt',root))),manifest.files.find(f=>f.path==='harness-closed/public-config.txt').sha256);
}
console.log(JSON.stringify({pass:true,files:manifest.files.length,checkoutEnabled:false,publicSourceFetched:process.argv.includes('--public-source'),authRead:false}));
