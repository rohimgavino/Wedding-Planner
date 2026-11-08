import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('./',import.meta.url);
const read=p=>JSON.parse(readFileSync(new URL(p,root),'utf8'));
const api=read('services/doku-cf-sandbox/wrangler.simple-sandbox.json');
const ui=read('services/doku-sbx-harness/wrangler.json');
assert.equal(api.name,'pp-doku-sbx-disabled-20261102-bec84f2');
assert.equal(ui.name,'pp-doku-sbx-harness-20261102');
for(const c of [api,ui]){
 assert.equal(c.account_id,'4c9d871a80b70e0c2275773bcd51db84');
 assert.equal(c.preview_urls,false); assert.deepEqual(c.routes,[]);
 assert.equal(c.logpush,false); assert.equal(c.observability.enabled,false);
 assert.equal(c.observability.logs.enabled,false); assert.equal(c.observability.traces.enabled,false);
 assert.deepEqual(c.tail_consumers,[]); assert.deepEqual(c.streaming_tail_consumers,[]);
 assert.equal(c.assets,undefined);
}
assert.equal(api.vars.SANDBOX_ENABLED,'false');
assert.equal(api.vars.PLANNER_TRANSPORT_VERSION,'disabled');
assert.equal(api.vars.SALES_PROTOCOL,'successor-lease-v1');
assert.deepEqual(read('services/doku-sbx-harness/public-config.txt'),{publishableKey:null,checkoutEnabled:false,offlinePackaging:true});
const provenance=read('package-provenance.json');
for(const f of provenance.files){
 const hash=createHash('sha256').update(readFileSync(new URL(f.path,root))).digest('hex');
 assert.equal(hash,f.sha256,f.path);
}
console.log(`CLOSED invariants PASS; ${provenance.files.length} provenance hashes PASS; configuration-required harness, no public key`);
