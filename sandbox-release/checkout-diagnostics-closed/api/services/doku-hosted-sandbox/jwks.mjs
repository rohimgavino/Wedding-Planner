// Bounded, coalesced JWKS cache. Unknown keys refresh at most once per cooldown.
import {boundedBody} from './bounded-body.mjs';
export function createJwksTransport(fetchImpl,{now=Date.now,ttl=300000,cooldown=30000}={}){
 let cached,expires=0,last=-Infinity,pending;
 return async (url,options)=>{
  const time=now();
  // The verifier calls once per token. A short refresh cadence permits rotation
  // without letting arbitrary unknown kids cause upstream amplification.
  if(time-last<cooldown&&!pending){
   if(cached&&now()<expires)return Response.json(cached);
   throw Error('JWKS unavailable');
  }
  if(!pending)pending=(async()=>{
   last=time;
   const response=await fetchImpl(url,{...options,signal:AbortSignal.timeout(5000)});
   if(response.status!==200){void response.body?.cancel().catch(()=>{});throw Error('JWKS unavailable');}
   const body=JSON.parse((await boundedBody(response)).toString('utf8'));
   if(!Array.isArray(body.keys)||body.keys.length<1||body.keys.length>20)throw Error('invalid JWKS');
   cached=body;expires=time+ttl;
   return body;
  })().finally(()=>{pending=undefined;});
  try{const keys=await pending;if(now()>=expires)throw Error('JWKS expired');return Response.json(keys);}catch{
   // Never serve expired keys on error; bounded last-known keys may survive a
   // transient upstream failure only inside the explicit cache lifetime.
   if(cached&&now()<expires)return Response.json(cached);
   throw Error('JWKS unavailable');
  }
 };
}
