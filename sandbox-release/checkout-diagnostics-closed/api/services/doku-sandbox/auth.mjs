// Official asymmetric JWKS seam. No global fetch, shared-secret fallback or request identity.
import {createLocalJWKSet,jwtVerify} from 'jose';
export function createJwtVerifier({issuer,audience,transport,now=()=>Date.now()/1000}){
 if(typeof issuer!=='string'||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/auth\/v1$/.test(issuer)||audience!=='authenticated'||typeof transport!=='function'||typeof now!=='function')throw Error('invalid JWT verifier configuration');
 return async token=>{
  if(typeof token!=='string'||token.length>8192)throw Error('invalid JWT');
  // Deliberately no application cache; managed deployment must bound transport and rotation.
  const response=await transport(issuer+'/.well-known/jwks.json',{method:'GET',redirect:'error'});
  if(response.status!==200)throw Error('JWKS unavailable');
  const text=await response.text();if(text.length>65536)throw Error('JWKS too large');
  const jwks=JSON.parse(text);if(!Array.isArray(jwks.keys)||jwks.keys.length<1||jwks.keys.length>20)throw Error('invalid JWKS');
  const seconds=now();if(!Number.isFinite(seconds))throw Error('invalid server time');
  const {payload}=await jwtVerify(token,createLocalJWKSet(jwks),{issuer,audience,algorithms:['ES256','RS256'],requiredClaims:['sub','exp','iss','aud'],currentDate:new Date(seconds*1000),clockTolerance:0});
  if(payload.role!=='authenticated'||typeof payload.sub!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(payload.sub))throw Error('invalid user identity');
  return Object.freeze({userId:payload.sub});
 };
}
export function createAuthBinding(verify){
 if(typeof verify!=='function')throw Error('verifier required');
 return {async fetch(url,init){try{const req=typeof url==='object'&&url.headers?url:new Request(url,init),auth=req.headers.get('authorization');if(req.method!=='GET'||!/^Bearer [^\s,]{1,8192}$/.test(auth??''))throw Error();return Response.json(await verify(auth.slice(7)),{headers:{'Cache-Control':'no-store'}});}catch{return new Response(null,{status:401});}}};
}
