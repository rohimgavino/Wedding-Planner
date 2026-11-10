// LOCAL protocol module only: intentionally not imported by the live locked UI.
// rpc(name,args) must unwrap authenticated RPC data and throw on transport/RPC error.
// Create one instance per authenticated account/session. Persist no sessions/tokens.
export class WorkspaceIntentClient {
 #rpc; #intent=null; #busy=false;
 constructor(rpc){this.#rpc=rpc;}
 async #exclusive(action){
  if(this.#busy)throw Error('reconcile already in progress');
  this.#busy=true;
  try{return await action();}finally{this.#busy=false;}
 }
 async #status(intent){
  const rows=await this.#rpc('workspace_intent_status_v2',{p_intent:intent});
  const value=rows?.[0];
  if(!value||value.intent_id!==intent||!['pending','completed','expired','deleted'].includes(value.state))throw Error('invalid reconciliation response');
  return value;
 }
 resume(){return this.#exclusive(async()=>{
  this.#intent=null;
  const intent=await this.#rpc('begin_workspace_intent_v2',{p_previous:null});
  const status=await this.#status(intent);
  this.#intent=intent;
  return status;
 });}
 submit({title,weddingDate}){return this.#exclusive(async()=>{
  if(!this.#intent)throw Error('reconcile before submitting');
  const status=await this.#status(this.#intent);
  if(['expired','deleted'].includes(status.state))throw Error('explicit new intent required');
  // Resubmit exactly the observed intent; the server validates payload equality.
  // Never rotate on error, timeout, reload, or a changed payload.
  return this.#rpc('create_workspace_intent_v2',{p_intent:this.#intent,p_title:title,p_wedding_date:weddingDate});
 });}
 newWorkspace(confirmed=false){return this.#exclusive(async()=>{
  if(confirmed!==true)throw Error('explicit confirmation required');
  if(!this.#intent)throw Error('reconcile before new workspace');
  const previous=this.#intent;
  const status=await this.#status(previous);
  if(status.state==='pending')throw Error('unfinished intent; reconcile before new creation');
  // UI must bind this action to the last observed intent, not resume first.
  const intent=await this.#rpc('begin_workspace_intent_v2',{p_previous:previous});
  this.#intent=null;
  const current=await this.#status(intent);
  this.#intent=intent;
  return current;
 });}
}
