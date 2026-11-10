// No token persistence, console output, retries, client deadline or business RPCs.
const TARGET='6c41fa48-13fe-4d39-91d4-cf70eece9c03';
const CODES=new Set(['57014','42501','55P03','22023']);
export class TimeoutProbe {
 constructor({getSession,request,nonce=()=>crypto.randomUUID(),now=()=>performance.now()}){Object.assign(this,{getSession,request,nonce,now});this.used=false;}
 async run(){
  if(this.used)return null;this.used=true;
  const nonce=this.nonce(),session=this.getSession();let start=this.now();
  const result=(http,code)=>({http,code,durationMs:Math.max(0,Math.round(this.now()-start)),nonce});
  if(!session||session.userId!==TARGET)return result(0,'DENIED');
  try{
   const verified=await this.request('/auth/v1/user',undefined,session),u=verified.body;
   if(verified.status!==200||u?.id!==TARGET||!u.email_confirmed_at||u.is_anonymous!==false||this.getSession()!==session)return result(0,'DENIED');
   start=this.now();
   const response=await this.request('/rest/v1/rpc/workspace_timeout_probe_v1',{p_nonce:nonce},session);
   if(this.getSession()!==session)return result(0,'DENIED');
   const code=response.status===200&&response.body===nonce?'COMPLETED':CODES.has(response.body?.code)?response.body.code:'UNEXPECTED';
   return result(response.status,code);
  }catch{return result(0,'NETWORK');}
 }
}
