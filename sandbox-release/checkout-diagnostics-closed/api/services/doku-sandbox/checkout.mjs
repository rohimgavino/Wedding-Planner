import {Buffer} from 'node:buffer';
import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {signRequest} from './protocol.mjs';
import {validateTierSnapshot} from './tier-snapshot.mjs';
const target='/checkout/v1/payment';
function check(ok){if(!ok)throw Error('sandbox checkout rejected');}
export function prepareCheckout(config,order,time){
 check(config?.enabled===true&&config.environment==='sandbox'&&config.baseUrl===undefined&&config.production===undefined);
 check(order.merchant===config.clientId&&order.environment==='sandbox'&&order.currency==='IDR'&&Number.isSafeInteger(order.amount)&&order.amount>0&&order.amount<=999999999999&&String(order.amount)===order.packageAmountIdr&&/^[A-Za-z0-9._-]{1,30}$/.test(order.invoice));
 if(order.packageId!==undefined)validateTierSnapshot(order);
 const rawBody=Buffer.from(JSON.stringify({order:{invoice_number:order.invoice,amount:order.amount,currency:'IDR',auto_redirect:false},payment:{payment_due_date:60,payment_method_types:['VIRTUAL_ACCOUNT_BCA']}}));
 return {url:'https://api-sandbox.doku.com'+target,method:'POST',rawBody,headers:{'Client-Id':config.clientId,'Request-Id':order.requestId,'Request-Timestamp':time,'Content-Type':'application/json',Signature:signRequest({clientId:config.clientId,requestId:order.requestId,timestamp:time,target},rawBody,config.secret)}};
}
export function verifyCheckoutResponse(config,order,response){
 check(config?.enabled===true&&config.environment==='sandbox'&&response?.status===200&&Buffer.isBuffer(response.rawBody)&&response.rawBody.length>0&&response.rawBody.length<=65536);
 const get=name=>{const values=Object.entries(response.headers??{}).filter(([k])=>k.toLowerCase()===name.toLowerCase());check(values.length===1&&typeof values[0][1]==='string');return values[0][1];};
 check(get('Client-Id')===config.clientId&&get('Request-Id')===order.requestId);
 const time=get('Response-Timestamp');check(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(time)&&Number.isFinite(Date.parse(time))&&new Date(time).toISOString()===time.replace('Z','.000Z'));
 const text=`Client-Id:${config.clientId}\nRequest-Id:${order.requestId}\nResponse-Timestamp:${time}\nRequest-Target:${target}\nDigest:${createHash('sha256').update(response.rawBody).digest('base64')}`;
 const expected='HMACSHA256='+createHmac('sha256',config.secret).update(text).digest('base64');const received=get('Signature');check(/^HMACSHA256=[A-Za-z0-9+/]{43}=$/.test(received)&&timingSafeEqual(Buffer.from(received),Buffer.from(expected)));
 const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(response.rawBody)).response;
 check(data?.order?.invoice_number===order.invoice&&(data.order.amount===order.amount||data.order.amount===String(order.amount)));
 const url=new URL(data.payment.url);check(url.protocol==='https:'&&url.hostname==='sandbox.doku.com'&&!url.port&&!url.username&&!url.password&&!url.hash&&!url.search&&/^\/checkout-link(?:-v2)?\/[A-Za-z0-9_-]+$/.test(url.pathname));
 return {checkoutUrl:url.href,grantsAccess:false};
}
