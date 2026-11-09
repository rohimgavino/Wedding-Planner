import {prepareCheckout,verifyCheckoutResponse} from './checkout.mjs';
// store.authorized MUST obtain a server-verified identity, then check payer/current membership.
// claim MUST COMMIT before transport; completion MUST COMMIT before returning URL.
// No automatic resend: ambiguous network outcomes remain reserved for reconciliation.
export class CheckoutDiagnosticError extends Error {
 constructor(stage,outcome,details={}){super('checkout diagnostic');this.stage=['preparation','status_read','claim','transport','response_verification','completion'].includes(stage)?stage:'preparation';this.outcome=outcome==='not_dispatched'?'not_dispatched':'unknown';const codes=['DB_HTTP_ERROR','DB_RESULT_REJECTED','DB_BODY_INVALID','DB_UNAVAILABLE','PROVIDER_HTTP_REJECTED','PROVIDER_TIMEOUT','PROVIDER_NETWORK_ERROR','PROVIDER_BODY_INVALID','CHECKOUT_FAILED'];this.errorCode=codes.includes(details.errorCode)?details.errorCode:'CHECKOUT_FAILED';if(Number.isInteger(details.httpStatus)&&details.httpStatus>=100&&details.httpStatus<=599)this.httpStatus=details.httpStatus;}
}
export async function checkoutInvoice(config,store,time,transport){
 let stage='preparation',httpStatus;
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
  httpStatus=response?.status;
  stage='response_verification';
  const result=verifyCheckoutResponse(config,order,response);
  stage='completion';
  if(await store.complete(result)!==true)throw Error();
  return result;
 }catch(error){
  // Never retain upstream error messages, causes, headers, bodies or URLs.
  // not_dispatched describes this invocation only, not historical invoice state.
  const errorCode=stage==='response_verification'&&Number.isInteger(httpStatus)&&httpStatus>=100&&httpStatus<=599&&httpStatus!==200?'PROVIDER_HTTP_REJECTED':stage==='transport'?(error?.name==='TimeoutError'||error?.name==='AbortError'?'PROVIDER_TIMEOUT':error?.errorCode??'PROVIDER_NETWORK_ERROR'):error?.errorCode;
  throw new CheckoutDiagnosticError(stage,stage==='preparation'?'not_dispatched':'unknown',{errorCode,httpStatus:error?.httpStatus??httpStatus});
 }
}
