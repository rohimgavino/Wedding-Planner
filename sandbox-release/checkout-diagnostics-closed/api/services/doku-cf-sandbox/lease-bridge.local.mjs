// LOCAL candidate bridge, not wired into released Worker; no legacy fallback.
export function leaseRpcRequest(env,operation,args){
 const canonical=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 const {SALES_LEASE_ID:id,SALES_START:s,SALES_EXPIRES:e,RECONCILIATION_EXPIRES:r}=env;
 if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)||![s,e,r].every(canonical)||Date.parse(e)<=Date.parse(s)||Date.parse(e)-Date.parse(s)>900000||Date.parse(r)<=Date.parse(e)||Date.parse(r)-Date.parse(e)>86400000)throw Error('lease config rejected');
 if(typeof env.RPC_CAPABILITY!=='string'||env.RPC_CAPABILITY.length<32||env.RPC_CAPABILITY.length>256||!env.SUPABASE_PUBLISHABLE_KEY)throw Error('bridge config rejected');
 return new Request('https://timrseunzsdqdrbyvyfn.supabase.co/rest/v1/rpc/pp_doku_sandbox_lease_rpc',{method:'POST',redirect:'manual',headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_capability:env.RPC_CAPABILITY,p_lease_id:id,p_sales_start:s,p_sales_expires:e,p_reconciliation_expires:r,p_operation:operation,p_args:args})});
}
