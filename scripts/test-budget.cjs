const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const original = Module._resolveFilename;
Module._resolveFilename = function(name, ...args) { return original.call(this, name.startsWith('@/') ? process.cwd()+'/src/'+name.slice(2)+'.ts' : name, ...args); };
require.extensions['.ts'] = (m,p) => m._compile(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,p);
const {CloudWorkspace} = require(process.cwd()+'/src/lib/cloud-workspace.ts');
const calls=[];
const db={auth:{getUser:async()=>({data:{user:{id:'u'}},error:null})},from(table){const q={};for(const method of ['update','insert','eq','select','single'])q[method]=(...args)=>{calls.push([table,method,...args]);return q};q.then=resolve=>resolve({data:{id:'b'},error:null});return q}};
const cloud=new CloudWorkspace(db);
const valid={title:'Fotografer',category:'Dokumentasi',allocated_amount:1000,spent_amount:100,payment_status:'paid',notes:'Invoice disepakati terpisah'};
(async()=>{
 for(const item of [{...valid,spent_amount:0,payment_status:'dp'},{...valid,spent_amount:0},{...valid,payment_status:'unpaid'},...[-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1].flatMap(n=>[{...valid,allocated_amount:n},{...valid,spent_amount:n}]),{...valid,payment_status:'bad'},{...valid,title:' '},{...valid,title:'x'.repeat(201)},{...valid,category:'x'.repeat(101)},{...valid,notes:'x'.repeat(2001)},{spent_amount:10},{payment_status:'paid'}]) {
  calls.length=0;await assert.rejects(()=>cloud.update('budgets','ws','b',item),/./);assert.equal(calls.length,0,'invalid budget must not reach database');
 }
 for(const payment_status of ['dp','paid']) {
  calls.length=0;await cloud.update('budgets','ws','b',{...valid,payment_status,id:'evil',workspace_id:'evil'});
  assert.deepEqual(calls.find(c=>c[1]==='update')[2],{...valid,payment_status});
  assert(calls.some(c=>c[1]==='eq'&&c[2]==='workspace_id'&&c[3]==='ws'));
  assert(calls.some(c=>c[1]==='eq'&&c[2]==='id'&&c[3]==='b'));
 }
 await cloud.insert('budgets','ws',{...valid,allocated_amount:0});
 await cloud.insert('budgets','ws',{...valid,spent_amount:0,payment_status:'unpaid'});
 console.log('PASS budget client: invalid status/money/text rejected before transport; paid below estimate allowed; IDs scoped and allowlisted');
})().catch(e=>{console.error(e);process.exit(1)});
