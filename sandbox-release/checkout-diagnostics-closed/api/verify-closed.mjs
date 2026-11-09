import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('./',import.meta.url);
const read=p=>JSON.parse(readFileSync(new URL(p,root),'utf8'));
const api=read('services/doku-cf-sandbox/wrangler.simple-sandbox.json');
const ui=read('../harness/wrangler.json');
assert.equal(api.name,'pp-doku-sbx-disabled-20261102-bec84f2');
assert.equal(ui.name,'pp-doku-sbx-harness-20261102');
for(const c of [api,ui,read('services/doku-sbx-harness/wrangler.json')]){
 assert.equal(c.account_id,'4c9d871a80b70e0c2275773bcd51db84');
 assert.equal(c.preview_urls,false);assert.deepEqual(c.routes,[]);assert.equal(c.assets,undefined);
 assert.equal(c.logpush,false);assert.equal(c.send_metrics,false);
 assert.equal(c.observability.enabled,false);assert.equal(c.observability.logs.enabled,false);
 assert.equal(c.observability.traces.enabled,false);assert.equal(c.observability.issues.enabled,false);
 assert.deepEqual(c.tail_consumers,[]);assert.deepEqual(c.streaming_tail_consumers,[]);
}
assert.equal(api.vars.SANDBOX_ENABLED,'false');assert.equal(api.vars.PLANNER_TRANSPORT_VERSION,'disabled');
assert.equal(api.vars.SALES_PROTOCOL,'successor-lease-v1');
const config=read('../harness/public-config.txt');
assert.equal(config.checkoutEnabled,false);assert.equal(typeof config.publishableKey,'string');
assert.ok(config.publishableKey.startsWith('sb_publishable_'));assert.equal(config.offlinePackaging,undefined);
for(const f of read('package-provenance.json').files){
 assert.equal(createHash('sha256').update(readFileSync(new URL(f.path,root))).digest('hex'),f.sha256,f.path);
}
console.log('CLOSED targets/configs and exact provenance PASS');
