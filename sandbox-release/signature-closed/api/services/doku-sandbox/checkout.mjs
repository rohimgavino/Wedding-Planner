import {Buffer} from 'node:buffer';
import {signRequest,verifyResponseSignature} from './protocol.mjs';
import {validateTierSnapshot} from './tier-snapshot.mjs';
const target='/checkout/v1/payment';
function check(ok,code){if(!ok)throw Object.assign(Error('sandbox checkout rejected'),code?{messages:[code]}:{});}
export function prepareCheckout(config,order,time){
 check(config?.enabled===true&&config.environment==='sandbox'&&config.baseUrl===undefined&&config.production===undefined);
 check(order.merchant===config.clientId&&order.environment==='sandbox'&&order.currency==='IDR'&&Number.isSafeInteger(order.amount)&&order.amount>0&&order.amount<=999999999999&&String(order.amount)===order.packageAmountIdr&&/^[A-Za-z0-9._-]{1,30}$/.test(order.invoice));
 if(order.packageId!==undefined)validateTierSnapshot(order);
 const orderPayload={invoice_number:order.invoice,amount:order.amount,currency:order.currency||'IDR'};
 const callbackUrl=order.callback_url??order.callbackUrl??config.callbackUrl;
 if(typeof callbackUrl==='string'&&/^https?:\/\//.test(callbackUrl)){
  orderPayload.callback_url=callbackUrl;
  if(order.auto_redirect!==undefined||order.autoRedirect!==undefined){
   orderPayload.auto_redirect=Boolean(order.auto_redirect??order.autoRedirect);
  }
 }
 const paymentPayload={payment_due_date:Number.isInteger(order.paymentDueDate)?order.paymentDueDate:60};
 if(Array.isArray(order.payment_method_types??order.paymentMethodTypes)){
  paymentPayload.payment_method_types=order.payment_method_types??order.paymentMethodTypes;
 }
 const rawBody=Buffer.from(JSON.stringify({order:orderPayload,payment:paymentPayload}));
 return {url:'https://api-sandbox.doku.com'+target,method:'POST',rawBody,headers:{'Client-Id':config.clientId,'Request-Id':order.requestId,'Request-Timestamp':time,'Content-Type':'application/json',Signature:signRequest({clientId:config.clientId,requestId:order.requestId,timestamp:time,target},rawBody,config.secret)}};
}
export function verifyCheckoutResponse(config,order,response){
 check(config?.enabled===true&&config.environment==='sandbox'&&response?.status===200&&response.rawBody instanceof Uint8Array&&response.rawBody.byteLength>0&&response.rawBody.byteLength<=65536,'RESPONSE_ENVELOPE_INVALID');
 // Copy only the supplied view, not its backing allocation (Buffer is a Uint8Array).
 const rawBody=Buffer.from(response.rawBody);
 verifyResponseSignature(config,order.requestId,target,response.headers,rawBody);
 const parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(rawBody));
 const data=parsed?.response??parsed;
 check(data?.order?.invoice_number===order.invoice&&(data.order.amount===order.amount||data.order.amount===String(order.amount)),'ORDER_MISMATCH');
 const headers=data?.headers??parsed?.headers;
 if(headers&&typeof headers==='object'){
  const entries=Object.entries(headers);
  const getHeader=(key)=>{
   const norm=key.toLowerCase().replace(/[-_]/g,'');
   const found=entries.find(([k])=>k.toLowerCase().replace(/[-_]/g,'')===norm);
   return found?found[1]:undefined;
  };
  const clientId=getHeader('client_id');
  if(clientId!==undefined)check(clientId===config.clientId,'BODY_CLIENT_ID_MISMATCH');
  const requestId=getHeader('request_id');
  if(requestId!==undefined)check(requestId===order.requestId,'BODY_REQUEST_ID_MISMATCH');
 }
 const paymentUrl=data?.payment?.url??data?.paymentUrl??data?.checkout_url;
 check(typeof paymentUrl==='string','PAYMENT_URL_MISSING');
 const url=new URL(paymentUrl);
 check(url.protocol==='https:'&&(url.hostname==='staging.doku.com'||url.hostname==='sandbox.doku.com')&&!url.port&&!url.username&&!url.password&&!url.hash&&!url.search&&/^\/checkout-link(?:-v2)?\/[A-Za-z0-9_-]+$/.test(url.pathname),'PAYMENT_URL_INVALID');
 return {checkoutUrl:url.href,grantsAccess:false};
}
