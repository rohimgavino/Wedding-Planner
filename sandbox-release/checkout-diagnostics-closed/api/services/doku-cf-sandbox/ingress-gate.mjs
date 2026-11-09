// One named Durable Object serializes durable admissions, independent of IP trust.
// Never forward a request body, JWT, signature or credential to this object.
export class SandboxIngressGate {
 constructor(state){this.state=state;}
 async fetch(request){
  const url=new URL(request.url),lane=url.pathname.slice(1);
  if(request.method!=='POST'||!['customer','notification'].includes(lane)||url.search)return new Response(null,{status:403});
  const minute=Math.floor(Date.now()/60000),limit=lane==='customer'?12:24;
  const allowed=await this.state.storage.transaction(async txn=>{
   const old=await txn.get(lane)??{minute,count:0,total:0};
   const count=old.minute===minute?old.count:0;
   if(count>=limit||old.total>=120)return false;
   await txn.put(lane,{minute,count:count+1,total:old.total+1});return true;
  });
  return new Response(null,{status:allowed?204:429,headers:{'Cache-Control':'no-store'}});
 }
}
