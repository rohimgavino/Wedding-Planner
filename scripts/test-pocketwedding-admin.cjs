const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('module');
const source = fs.readFileSync('src/lib/commerce.ts','utf8');
const mod = new Module('commerce'); mod._compile(ts.transpile(source,{module:ts.ModuleKind.CommonJS}),'commerce.js');
const calls=[]; const c=new mod.exports.Commerce({rpc:async (...args)=>{calls.push(args);return {data:null,error:null};}});
(async()=>{
 // Admin-first must never open the historical Lynk sales/activation path.
 await assert.rejects(c.save('help@example.test','250000','365','https://lynk.id/shop/product',true),/DOKU/);
 assert.equal(calls.length,0);
 await assert.rejects(c.verify('request','TX','250000',true,'confirmed'),/DOKU/);
 assert.equal(calls.length,0);
 const ui=fs.readFileSync('src/app/admin/page.tsx','utf8');
 assert.match(ui,/DOKU belum terintegrasi/); assert.doesNotMatch(ui,/c\.verify\(|c\.save\(/);
 assert.match(ui,/window\.confirm/);
 console.log('PASS admin-first blocks legacy payment activation and sales RPC before network; DOKU pending and confirmation contract');
})().catch(e=>{console.error(e);process.exitCode=1;});
