const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
const m=new Module('storage'); m._compile(ts.transpileModule(fs.readFileSync('src/lib/workspace-storage.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,'storage.js');
const {loadWorkspace,STORAGE_KEY,LEGACY_KEY}=m.exports;
const valid={workspace:{id:'w',title:'Saved couple',wedding_date:'2027-01-01',created_at:'2026-01-01',target_budget:10,target_savings:0},budgets:[],tasks:[],guests:[],inviteToken:'TOKEN'};
function store(values={}){return {values,getItem(k){return this.values[k]??null},setItem(k,v){this.values[k]=v}}}
let s=store({[LEGACY_KEY]:JSON.stringify(valid)}); assert.deepEqual(loadWorkspace(s).data,valid); assert.equal(s.values[LEGACY_KEY],s.values[STORAGE_KEY]);
s=store({[LEGACY_KEY]:JSON.stringify(valid),[STORAGE_KEY]:'broken'}); assert.equal(loadWorkspace(s).canSave,false); assert.equal(s.values[STORAGE_KEY],'broken');
s=store({[LEGACY_KEY]:'broken'}); assert.equal(loadWorkspace(s).canSave,false); assert.equal(s.values[STORAGE_KEY],undefined);
for(const bad of [{...valid,guests:[{id:'g'}]},{...valid,workspace:{...valid.workspace,target_budget:-1}},{...valid,tasks:{}}, {...valid,guests:Array(10001).fill({})}]){s=store({[LEGACY_KEY]:JSON.stringify(bad)});assert.equal(loadWorkspace(s).canSave,false);assert.equal(s.values[STORAGE_KEY],undefined)}
s=store({[LEGACY_KEY]:JSON.stringify(valid),[STORAGE_KEY]:JSON.stringify({...valid,workspace:null})});assert.equal(loadWorkspace(s).data.workspace,null);
s=store();assert.equal(loadWorkspace(s).data.workspace,null); assert.equal(loadWorkspace(s).canSave,true);
console.log('PASS storage: migration, legacy retained, current wins, invalid/malformed preserved, fresh empty');
