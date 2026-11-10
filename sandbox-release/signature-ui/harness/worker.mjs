import html from './index.html';
import checkoutClient from './checkout-client.mjs';
import app from './app.mjs';
import intentClient from './workspace-intent-client.mjs';
import inventory from './workspace-inventory.mjs';
import timeoutProbe from './timeout-probe.mjs';
import css from './style.css';
import catalog from './catalog.json';
// Public browser-safe key only; deployment wrapper supplies this Text module.
import config from './public-config.txt';
export default {fetch(request){
 const u=new URL(request.url);
 const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self' https://timrseunzsdqdrbyvyfn.supabase.co https://pp-doku-sbx-disabled-20261102-bec84f2.taarufplanner12.workers.dev; form-action 'none'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'"};
 if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers});
 if(u.search)return new Response(null,{status:404,headers});
 const entry={'/checkout-client.mjs':[checkoutClient,'text/javascript; charset=utf-8'],'/':[html,'text/html; charset=utf-8'],'/timeout-probe.mjs':[timeoutProbe,'text/javascript; charset=utf-8'],'/app.mjs':[app,'text/javascript; charset=utf-8'],'/workspace-intent-client.mjs':[intentClient,'text/javascript; charset=utf-8'],'/workspace-inventory.mjs':[inventory,'text/javascript; charset=utf-8'],'/style.css':[css,'text/css; charset=utf-8'],'/config.json':[config,'application/json'],'/catalog.json':[catalog,'application/json']}[u.pathname];
 if(!entry)return new Response(null,{status:404,headers});
 return new Response(request.method==='HEAD'?null:entry[0],{headers:{...headers,'Content-Type':entry[1]}});
}};
