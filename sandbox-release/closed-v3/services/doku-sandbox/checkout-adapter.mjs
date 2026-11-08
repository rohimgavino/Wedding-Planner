import {prepareCheckout,verifyCheckoutResponse} from './checkout.mjs';
// store.authorized MUST obtain a server-verified identity, then check payer/current membership.
// claim MUST COMMIT before transport; completion MUST COMMIT before returning URL.
// No automatic resend: ambiguous network outcomes remain reserved for reconciliation.
export class CheckoutDiagnosticError extends Error {
 constructor(stage,outcome){super('checkout diagnostic: '+stage);this.stage=stage;this.outcome=outcome;}
}
export async function checkoutInvoice(config,store,time,transport){
 let stage='preparation';
 try{
  if(typeof transport!=='function')throw Error();
  const order=await store.authorized();
  if(order.state==='paid'||order.state==='closed')throw Error();
  const request=prepareCheckout(config,order,time);
  // A failed/uncertain claim can correspond to an earlier attempt. Do not label
  // its invoice not-dispatched or make it eligible for automatic resend.
  stage='claim';
  if(!await store.claim(request))throw Error();
  stage='transport';
  const response=await transport(request);
  stage='response_verification';
  const result=verifyCheckoutResponse(config,order,response);
  stage='completion';
  if(await store.complete(result)!==true)throw Error();
  return result;
 }catch{
  // Never retain upstream error messages, causes, headers, bodies or URLs.
  // not_dispatched describes this invocation only, not historical invoice state.
  throw new CheckoutDiagnosticError(stage,stage==='preparation'?'not_dispatched':'unknown');
 }
}
