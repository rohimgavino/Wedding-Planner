import {SandboxCheckoutClient,safeCheckoutUrl,diagnosticText} from './checkout-client.mjs';
import {loadOwnedInventory} from './workspace-inventory.mjs';
import {WorkspaceIntentClient} from './workspace-intent-client.mjs';
// Compile-time lock; open only after hosted runtime gates and independent review.
const WORKSPACE_CREATE_REVIEWED=true;
let intentClient=null,intentStatus=null;
const PROBE_ONLY=location.pathname==='/timeout-probe';
let timeoutProbe=null,probeBusy=false;
const SB='https://timrseunzsdqdrbyvyfn.supabase.co';
const $=id=>document.getElementById(id);
let key,session=null,busy=false,workspaceBusy=false,creationAttempted=false,owned=[],selected=null,epoch=0;
const workspacePackages=new Map(),packageNames={starter:'Starter',premium:'Premium',wedding_pro:'Wedding Pro'};
const workspacePlannerState=new Map();
let paymentEnabled=false,paymentBusy=false;
const versions=new Map();
const payment=new SandboxCheckoutClient({getSession:()=>session});
function paymentControls(){
 const ready=paymentEnabled&&!!session&&inventoryReady&&owned.some(r=>r.workspace_id===selected)&&!!workspacePackages.get(selected)&&!workspaceBusy&&!paymentBusy;
 $('checkout').disabled=!ready;$('paymentCheck').disabled=!paymentEnabled||!session||!selected||paymentBusy;
 $('paymentOpen').hidden=!ready||!payment.view.checkoutUrl||payment.current?.w!==selected||payment.current?.p!==workspacePackages.get(selected);
}
async function paymentAction(start){
 if(paymentBusy||!session||!selected||!paymentEnabled)return;
 const w=selected,p=workspacePackages.get(w),generation=epoch;
 if(start&&(!inventoryReady||!owned.some(r=>r.workspace_id===w)||!versions.has(p)))return;
 paymentBusy=true;paymentControls();$('paymentStatus').textContent='Memeriksa server sandbox…';
 try{const value=await(start?payment.start(w,p,versions.get(p)):payment.check(w));if(generation!==epoch||selected!==w)return;
 $('paymentStatus').textContent=value.sandboxAccess?'Akses sandbox terkonfirmasi server. Planner tetap pratinjau lokal.':value.state==='ready'?'Checkout sandbox siap. Pembayaran belum mengaktifkan akses; setelah kembali atau batal, Periksa status.':'Pembayaran belum terkonfirmasi. Periksa status; jangan ulangi pembayaran.';
 }catch{if(generation===epoch&&selected===w)$('paymentStatus').textContent=payment.view.diagnostic?diagnosticText(payment.view.diagnostic):'Hasil belum pasti. Periksa status; jangan ulangi pembayaran.';}
 finally{if(generation===epoch){paymentBusy=false;paymentControls();}}
}
function defaultPlannerState(){
 return {
  activeTab:'budget',
  taskFilter:'all',
  guestFilter:'all',
  budgets:[
   {id:'b1',title:'Katering Akad & Resepsi',category:'Katering',allocated:15000000,spent:10000000,status:'dp'},
   {id:'b2',title:'Sewa Venue & Gedung',category:'Venue & Gedung',allocated:8000000,spent:8000000,status:'paid'},
   {id:'b3',title:'MUA & Busana Pengantin',category:'Rias & Busana',allocated:5000000,spent:2500000,status:'dp'}
  ],
  tasks:[
   {id:'t1',title:'Urus Berkas N1-N4 Kelurahan',phase:'Dokumen KUA',pic:'both',is_completed:true},
   {id:'t2',title:'Pendaftaran SIMKAH & Bimwin KUA',phase:'Dokumen KUA',pic:'groom',is_completed:true},
   {id:'t3',title:'Booking Venue & Katering',phase:'H-6 Bulan',pic:'both',is_completed:true},
   {id:'t4',title:'Fitting Busana Pengantin',phase:'H-3 Bulan',pic:'bride',is_completed:false},
   {id:'t5',title:'Konfirmasi Final Vendor & Rundown',phase:'H-1 Bulan',pic:'both',is_completed:false}
  ],
  guests:[
   {id:'g1',name:'Bpk. Bambang & Ibu',category:'keluarga_pria',pax:2,rsvp_status:'attending',phone:'081234567890'},
   {id:'g2',name:'Rekan Divisi Engineering',category:'teman_kantor',pax:5,rsvp_status:'sent',phone:'081987654321'},
   {id:'g3',name:'Sahabat Kuliah',category:'sahabat',pax:3,rsvp_status:'uncontacted',phone:''}
  ]
 };
}
function getPlannerData(wsId){
 const key=wsId||'__unselected__';
 if(!workspacePlannerState.has(key)){
  workspacePlannerState.set(key,defaultPlannerState());
 }
 return workspacePlannerState.get(key);
}
const fmtRupiah=n=>'Rp '+Number(n||0).toLocaleString('id-ID');
function renderPlanner(){
 if(PROBE_ONLY)return;
 const currentWorkspace=owned.find(r=>r.workspace_id===selected);
 const currentTitle=currentWorkspace?.workspaces?.title||null;
 const pText=$('plannerPostureText');
 if(currentTitle){
  pText.textContent='Workspace '+currentTitle+' aktif · Mode Pratinjau Planner (Belum Aktif). Di sandbox tanpa paket berbayar, Anda dapat meninjau struktur data pos anggaran, checklist persiapan, dan buku tamu.';
 }else{
  pText.textContent='Pilih rencana di atas untuk meninjau modul planner. Di sandbox tanpa paket berbayar, Anda dapat meninjau struktur pos anggaran, checklist persiapan, dan buku tamu berdua.';
 }
 const pData=getPlannerData(selected);
 const tabs=['budget','tasks','guests'];
 for(const t of tabs){
  const isAct=pData.activeTab===t;
  const btn=$('tabBtn'+t.charAt(0).toUpperCase()+t.slice(1));
  const panel=$('tabContent'+t.charAt(0).toUpperCase()+t.slice(1));
  if(btn){
   btn.classList.toggle('active',isAct);
   btn.setAttribute('aria-selected',String(isAct));
  }
  if(panel){
   panel.hidden=!isAct;
  }
 }
 let totAlloc=0,totSpent=0;
 for(const b of pData.budgets){
  totAlloc+=Number(b.allocated)||0;
  totSpent+=Number(b.spent)||0;
 }
 $('budgetTotalAllocated').textContent=fmtRupiah(totAlloc);
 $('budgetTotalSpent').textContent=fmtRupiah(totSpent);
 $('budgetRemaining').textContent=fmtRupiah(totAlloc-totSpent);
 const budgetList=$('budgetItems');
 budgetList.replaceChildren();
 for(const b of pData.budgets){
  const card=document.createElement('div');
  card.className='planner-item';
  const row1=document.createElement('div');
  row1.className='planner-item-row';
  const title=document.createElement('strong');
  title.textContent=b.title;
  const badge=document.createElement('span');
  badge.className='status-badge '+b.status;
  badge.textContent=b.status==='paid'?'Lunas':b.status==='dp'?'Sudah DP':'Belum DP';
  row1.append(title,badge);
  const row2=document.createElement('div');
  row2.className='planner-item-row';
  const cat=document.createElement('small');
  cat.textContent=b.category;
  const num=document.createElement('span');
  num.textContent='Alokasi: '+fmtRupiah(b.allocated)+' · Riil: '+fmtRupiah(b.spent);
  row2.append(cat,num);
  card.append(row1,row2);
  budgetList.append(card);
 }
 const completedCount=pData.tasks.filter(t=>t.is_completed).length;
 const totalCount=pData.tasks.length;
 const pct=totalCount?Math.round((completedCount/totalCount)*100):0;
 $('tasksProgress').textContent=pct+'%';
 $('tasksCompletedCount').textContent=completedCount+' / '+totalCount;
 for(const pill of document.querySelectorAll('#taskPhaseFilters .filter-pill')){
  pill.classList.toggle('active',pill.dataset.phase===pData.taskFilter);
 }
 const taskList=$('taskItems');
 taskList.replaceChildren();
 const visibleTasks=pData.tasks.filter(t=>pData.taskFilter==='all'||t.phase===pData.taskFilter);
 for(const t of visibleTasks){
  const card=document.createElement('div');
  card.className='planner-item';
  const row1=document.createElement('div');
  row1.className='planner-item-row';
  const label=document.createElement('label');
  const chk=document.createElement('input');
  chk.type='checkbox';
  chk.checked=!!t.is_completed;
  chk.addEventListener('change',()=>{
   t.is_completed=chk.checked;
   renderPlanner();
  });
  const txt=document.createElement('span');
  txt.textContent=t.title;
  if(t.is_completed)txt.style.textDecoration='line-through';
  label.append(chk,txt);
  const meta=document.createElement('small');
  const picLabel=t.pic==='groom'?'Pria':t.pic==='bride'?'Wanita':'Berdua';
  meta.textContent=t.phase+' · '+picLabel;
  row1.append(label,meta);
  card.append(row1);
  taskList.append(card);
 }
 let totPax=0,confPax=0;
 for(const g of pData.guests){
  const paxNum=Number(g.pax)||0;
  totPax+=paxNum;
  if(g.rsvp_status==='attending')confPax+=paxNum;
 }
 $('guestsTotalCount').textContent=String(pData.guests.length);
 $('guestsTotalPax').textContent=String(totPax);
 $('guestsConfirmedPax').textContent=String(confPax);
 for(const pill of document.querySelectorAll('#guestCategoryFilters .filter-pill')){
  pill.classList.toggle('active',pill.dataset.category===pData.guestFilter);
 }
 const guestList=$('guestItems');
 guestList.replaceChildren();
 const visibleGuests=pData.guests.filter(g=>pData.guestFilter==='all'||g.category===pData.guestFilter);
 const catNames={keluarga_pria:'Keluarga Pria',keluarga_wanita:'Keluarga Wanita',teman_kantor:'Teman Kantor',sahabat:'Sahabat',vip:'VIP',lainnya:'Lainnya'};
 for(const g of visibleGuests){
  const card=document.createElement('div');
  card.className='planner-item';
  const row1=document.createElement('div');
  row1.className='planner-item-row';
  const gName=document.createElement('strong');
  gName.textContent=g.name+' ('+g.pax+' Pax)';
  const select=document.createElement('select');
  select.className='guest-rsvp-select';
  select.append(
   new Option('Belum Dikontak','uncontacted',false,g.rsvp_status==='uncontacted'),
   new Option('Undangan Terkirim','sent',false,g.rsvp_status==='sent'),
   new Option('Hadir','attending',false,g.rsvp_status==='attending'),
   new Option('Berhalangan','declined',false,g.rsvp_status==='declined')
  );
  select.addEventListener('change',()=>{
   g.rsvp_status=select.value;
   renderPlanner();
  });
  row1.append(gName,select);
  const row2=document.createElement('div');
  row2.className='planner-item-row';
  const circle=document.createElement('small');
  circle.textContent=catNames[g.category]||g.category;
  const phone=document.createElement('small');
  phone.textContent=g.phone||'Tanpa no. WA';
  row2.append(circle,phone);
  card.append(row1,row2);
  guestList.append(card);
 }
}
let lastSelectedPackage=null;
function updatePackageSelection(){
 const currentWorkspace=owned.find(r=>r.workspace_id===selected);
 const currentTitle=currentWorkspace?.workspaces?.title||null;
 const activePkgId=selected?workspacePackages.get(selected)||lastSelectedPackage||null:lastSelectedPackage;
 if(selected&&activePkgId&&!workspacePackages.has(selected))workspacePackages.set(selected,activePkgId);
 for(const radio of document.querySelectorAll('input[name=tier]')){
  const isChecked=radio.value===activePkgId;
  radio.checked=isChecked;
  radio.closest('.tier')?.classList.toggle('selected',isChecked);
 }
 if(currentTitle&&activePkgId){
  $('packageStatus').textContent='Workspace '+currentTitle+' siap. Paket '+(packageNames[activePkgId]||activePkgId)+' dipilih. Checkout Sandbox dinonaktifkan di konfigurasi aplikasi; bukan bukti maintenance DOKU.';
 }else if(currentTitle&&!activePkgId){
  $('packageStatus').textContent='Workspace '+currentTitle+' siap. Pilih paket untuk ditinjau. Checkout Sandbox dinonaktifkan di konfigurasi aplikasi; bukan bukti maintenance DOKU.';
 }else if(activePkgId){
  $('packageStatus').textContent='Paket '+(packageNames[activePkgId]||activePkgId)+' dipilih. Pilih atau buat rencana untuk menautkan paket. Checkout Sandbox dinonaktifkan di konfigurasi aplikasi; bukan bukti maintenance DOKU.';
 }else{
  $('packageStatus').textContent='Pilihan hanya untuk ditinjau; bukan pesanan. Checkout Sandbox dinonaktifkan di konfigurasi aplikasi; bukan bukti maintenance DOKU.';
 }
 if(paymentEnabled)$('packageStatus').textContent=$('packageStatus').textContent.replace('Checkout Sandbox dinonaktifkan di konfigurasi aplikasi; bukan bukti maintenance DOKU.','Harga/versi dan kelayakan diperiksa server sebelum checkout Sandbox.');
 renderPlanner();
 paymentControls();
}
const tell=s=>{$('result').textContent=s;};
const uuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
function controls(){$('timeoutProbe').disabled=!session||busy||probeBusy||!!timeoutProbe?.used;for(const b of document.querySelectorAll('#auth button'))b.disabled=busy||!!session;$('auth').setAttribute('aria-busy',String(busy));$('signout').disabled=busy||!session;$('workspaceReload').disabled=!session||workspaceBusy;$('workspaceCreate').disabled=!WORKSPACE_CREATE_REVIEWED||!session||!inventoryReady||workspaceBusy||intentStatus?.state!=='pending';$('workspaceNext').disabled=!WORKSPACE_CREATE_REVIEWED||!session||!inventoryReady||workspaceBusy||!intentStatus||intentStatus.state==='pending';$('workspaceSelect').disabled=!session||workspaceBusy||paymentBusy||!owned.length;paymentControls();}
async function request(path,body,authenticated=false){
 const current=session;
 if(authenticated&&!current)throw Error('Session required');
 const r=await fetch(SB+path,{method:body===undefined?'GET':'POST',headers:{apikey:key,...(body===undefined?{}:{'Content-Type':'application/json'}),...(authenticated?{Authorization:'Bearer '+current.access_token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
 if(authenticated&&session!==current)throw Error('Session changed');
 if(!r.ok)throw Error('HTTP '+r.status);
 return r.status===204?null:await r.json();
}
function clear(){payment.reset();paymentBusy=false;$('paymentStatus').textContent='Sesi dihapus; masuk kembali untuk rekonsiliasi.';epoch++;intentClient=null;intentStatus=null;session=null;owned=[];selected=null;workspaceBusy=false;busy=false;inventoryReady=false;workspacePackages.clear();workspacePlannerState.clear();lastSelectedPackage=null;$('title').value='';$('date').value='';$('workspaceSelect').replaceChildren(new Option('Masuk terlebih dahulu',''));$('password').value='';$('email').value='';$('workspaceStatus').textContent='Sesi dihapus. Masuk untuk memeriksa rencana.';updatePackageSelection();controls();}
async function loadOwned(){
 if(PROBE_ONLY)return;
 if(!session||workspaceBusy||busy)return;const generation=epoch;inventoryReady=false;workspaceBusy=true;controls();$('workspaceStatus').textContent='Memproses pemeriksaan rencana…';
 try{
 const rows=await loadOwnedInventory(path=>request(path,undefined,true),session.userId);
 if(generation!==epoch)return;
 inventoryReady=true;owned=rows;
 const stillExists=owned.some(r=>r.workspace_id===selected);
 if(!stillExists)selected=owned[0]?.workspace_id||null;
 $('workspaceSelect').replaceChildren(...(owned.length?owned.map(r=>new Option(r.workspaces.title,r.workspace_id)):[new Option('Belum ada rencana milik Anda','')]));
 if(selected)$('workspaceSelect').value=selected;
 $('workspaceStatus').textContent=owned.length?'Rencana milik Anda dipilih. Paket belum diaktifkan.':creationAttempted?'Hasil pembuatan belum dapat dipastikan. Jangan buat ulang; rekonsiliasi dengan operator.':'Belum ada rencana. Memeriksa niat pembuatan server; tidak ada aktivasi pembayaran.';
 updatePackageSelection();
 }catch{if(generation===epoch){owned=[];selected=null;$('workspaceSelect').replaceChildren(new Option('Pemeriksaan belum berhasil',''));$('workspaceStatus').textContent='Rencana belum dapat diperiksa. Coba Periksa rencana lagi; jangan membuat duplikat.';updatePackageSelection();}}
 finally{if(generation===epoch){workspaceBusy=false;controls();}}
}
// A failed read must not authorize a create. Only a successful empty owned list does.
let inventoryReady=false;
function showIntent(){
 const messages={pending:'Niat pembuatan siap. Isi nama dan tanggal, lalu Buat rencana tanpa pembayaran.',completed:'Pembuatan selesai. Pilih rencana milik Anda; paket belum aktif. Untuk niat baru, pilih Buat workspace lain.',expired:'Niat kedaluwarsa. Periksa daftar rencana sebelum memilih Buat workspace lain. Tidak dibuat otomatis.',deleted:'Rencana telah dihapus. Niat lama tidak dapat menghidupkannya kembali. Buat workspace lain hanya dengan konfirmasi.'};
 $('workspaceStatus').textContent=messages[intentStatus.state];
}
async function refresh(){
 if(PROBE_ONLY)return;
 if(!session||workspaceBusy||busy)return;const generation=epoch;inventoryReady=false;intentStatus=null;
 await loadOwned();if(generation!==epoch)return;
 if(!WORKSPACE_CREATE_REVIEWED){controls();return;}
 // loadOwned marks only a validated inventory successful.
 if(!inventoryReady){controls();return;}
 workspaceBusy=true;controls();
 try{const value=await intentClient.resume();if(generation!==epoch)return;intentStatus=value;showIntent();}
 catch{if(generation===epoch){intentStatus=null;$('workspaceStatus').textContent='Hasil niat belum dapat dipastikan. Gunakan Periksa rencana; jangan buat ulang atau otomatis membuat niat baru.';}}
 finally{if(generation===epoch){workspaceBusy=false;controls();}}
}
async function auth(signup){
 if(PROBE_ONLY&&signup)return;
 if(busy||session)return;if(!key){tell('Konfigurasi belum siap. Muat ulang halaman.');return;}
 busy=true;controls();const generation=++epoch;
 try{
 const email=$('email').value.trim(),password=$('password').value;$('password').value='';tell(signup?'Memproses pendaftaran…':'Memproses masuk… (maksimal 10 detik per permintaan)');
 const data=await request('/auth/v1/'+(signup?'signup':'token?grant_type=password'),{email,password});
 if(generation!==epoch)return;
 if(signup){if(data.access_token)throw Error('Unexpected auto-confirm');tell('Email konfirmasi diminta. Konfirmasi di inbox Anda, lalu masukkan password kembali untuk masuk.');return;}
 if(typeof data.access_token!=='string'||!uuid(data.user?.id))throw Error('Invalid auth');
 session={access_token:data.access_token,userId:data.user.id};
 const u=await request('/auth/v1/user',undefined,true);
 if(generation!==epoch)return;
 if(u.id!==session.userId||!u.email_confirmed_at||u.is_anonymous!==false)throw Error('Unconfirmed');
 if(!PROBE_ONLY)intentClient=new WorkspaceIntentClient((name,args)=>request('/rest/v1/rpc/'+name,args,true));
 tell('Berhasil masuk. Akun terkonfirmasi; sesi hanya di halaman ini.');busy=false;if(!PROBE_ONLY)void refresh();
 }catch(e){if(generation===epoch){session=null;tell(e.name==='TimeoutError'||e.name==='AbortError'?'Batas waktu tercapai. Periksa koneksi lalu coba masuk lagi.':'Masuk gagal. Periksa email/password, konfirmasi email dan koneksi; coba lagi.');}}
 finally{if(generation===epoch){busy=false;controls();}}
}
$('auth').addEventListener('invalid',e=>tell(e.target.id==='email'?'Isi alamat email yang valid.':'Isi password minimal 8 karakter.'),true);
$('auth').addEventListener('submit',e=>{e.preventDefault();void auth(false);});
$('signup').addEventListener('click',()=>{if($('auth').reportValidity())void auth(true);});
$('workspaceReload').addEventListener('click',()=>{if(!workspaceBusy)void refresh();});
$('workspaceSelect').addEventListener('change',()=>{const row=owned.find(r=>r.workspace_id===$('workspaceSelect').value);selected=row?.workspace_id||null;$('workspaceStatus').textContent=row?'Rencana milik Anda dipilih. Paket belum diaktifkan.':'Pilih rencana milik Anda.';updatePackageSelection();});
$('checkout').addEventListener('click',()=>void paymentAction(true));
$('paymentCheck').addEventListener('click',()=>void paymentAction(false));
$('paymentOpen').addEventListener('click',()=>{if(!paymentBusy&&session&&!$('paymentOpen').hidden&&payment.view.checkoutUrl){try{window.open(safeCheckoutUrl(payment.view.checkoutUrl),'_blank','noopener,noreferrer');}catch{$('paymentStatus').textContent='Tautan ditolak. Periksa status.';}}});
$('workspaceCreate').addEventListener('click',async()=>{
 if(!WORKSPACE_CREATE_REVIEWED||!session||busy||workspaceBusy||!inventoryReady||intentStatus?.state!=='pending')return;
 const title=$('title').value.trim(),date=$('date').value;
 if(!title||title.length>255||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))){$('workspaceStatus').textContent='Isi nama rencana dan tanggal pernikahan yang valid.';return;}
 creationAttempted=true;workspaceBusy=true;controls();const generation=epoch;$('workspaceStatus').textContent='Memproses pembuatan rencana… Jangan ulangi permintaan.';
 try{const id=await intentClient.submit({title,weddingDate:date});if(generation!==epoch)return;if(!uuid(id))throw Error('Invalid workspace');workspaceBusy=false;await refresh();}
 catch{if(generation===epoch){intentStatus=null;$('workspaceStatus').textContent='Hasil pembuatan belum dapat dipastikan. Gunakan Periksa rencana untuk merekonsiliasi niat yang sama. Jangan buat niat baru saat timeout atau konflik.';}}
 finally{if(generation===epoch){workspaceBusy=false;controls();}}
});
$('workspaceNext').addEventListener('click',async()=>{
 if(!WORKSPACE_CREATE_REVIEWED||!session||busy||workspaceBusy||!inventoryReady||!intentStatus||intentStatus.state==='pending')return;
 if(!confirm('Buat workspace lain sebagai niat baru? Ini berbeda dari mencoba ulang. Rencana sebelumnya tidak dihapus.'))return;
 const generation=epoch;workspaceBusy=true;controls();$('workspaceStatus').textContent='Memproses niat baru yang dikonfirmasi…';
 try{const value=await intentClient.newWorkspace(true);if(generation!==epoch)return;intentStatus=value;showIntent();}
 catch{if(generation===epoch){intentStatus=null;$('workspaceStatus').textContent='Hasil niat baru belum dapat dipastikan. Gunakan Periksa rencana, jangan ulangi niat baru.';}}
 finally{if(generation===epoch){workspaceBusy=false;controls();}}
});
$('signout').addEventListener('click',async()=>{if(busy||!session)return;const captured=session;clear();const generation=epoch;tell('Sesi lokal dihapus. Memproses pencabutan server…');try{const r=await fetch(SB+'/auth/v1/logout',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+captured.access_token},credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();if(generation===epoch&&!session)tell('Berhasil keluar dan sesi dicabut.');}catch{if(generation===epoch&&!session)tell('Sesi lokal dihapus; pencabutan server belum terkonfirmasi.');}});
$('tabBtnBudget').addEventListener('click',()=>{getPlannerData(selected).activeTab='budget';renderPlanner();});
$('tabBtnTasks').addEventListener('click',()=>{getPlannerData(selected).activeTab='tasks';renderPlanner();});
$('tabBtnGuests').addEventListener('click',()=>{getPlannerData(selected).activeTab='guests';renderPlanner();});
for(const p of document.querySelectorAll('#taskPhaseFilters .filter-pill')){
 p.addEventListener('click',()=>{getPlannerData(selected).taskFilter=p.dataset.phase;renderPlanner();});
}
for(const p of document.querySelectorAll('#guestCategoryFilters .filter-pill')){
 p.addEventListener('click',()=>{getPlannerData(selected).guestFilter=p.dataset.category;renderPlanner();});
}
$('addBudgetForm').addEventListener('submit',e=>{
 e.preventDefault();
 const data=getPlannerData(selected);
 const title=$('newBudgetTitle').value.trim();
 const cat=$('newBudgetCategory').value;
 const alloc=Number($('newBudgetAllocated').value)||0;
 const spent=Number($('newBudgetSpent').value)||0;
 const status=$('newBudgetStatus').value;
 if(!title)return;
 data.budgets.push({id:'b_'+Date.now(),title,category:cat,allocated:alloc,spent,status});
 $('newBudgetTitle').value='';
 renderPlanner();
});
$('addTaskForm').addEventListener('submit',e=>{
 e.preventDefault();
 const data=getPlannerData(selected);
 const title=$('newTaskTitle').value.trim();
 const phase=$('newTaskPhase').value;
 const pic=$('newTaskPic').value;
 if(!title)return;
 data.tasks.push({id:'t_'+Date.now(),title,phase,pic,is_completed:false});
 $('newTaskTitle').value='';
 renderPlanner();
});
$('addGuestForm').addEventListener('submit',e=>{
 e.preventDefault();
 const data=getPlannerData(selected);
 const name=$('newGuestName').value.trim();
 const cat=$('newGuestCategory').value;
 const pax=Number($('newGuestPax').value)||1;
 const phone=$('newGuestPhone').value.trim();
 if(!name)return;
 data.guests.push({id:'g_'+Date.now(),name,category:cat,pax,phone,rsvp_status:'uncontacted'});
 $('newGuestName').value='';
 $('newGuestPhone').value='';
 renderPlanner();
});
window.addEventListener('pagehide',clear);
window.addEventListener('pageshow',e=>{if(e.persisted)clear();});
async function catalog(){try{
 const r=await fetch('/catalog.json',{credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();const c=await r.json();
 if(!Array.isArray(c.packages)||c.packages.length!==3||new Set(c.packages.map(p=>p.packageId)).size!==3||c.packages.some(p=>!Object.hasOwn(packageNames,p.packageId)||!Number.isSafeInteger(p.amount)||p.amount<=0||p.currency!=='IDR'||p.checkoutEligible!==false||p.timezone!=='Asia/Jakarta'||p.term!==(p.packageId==='starter'?'6 bulan kalender':'1 tahun kalender')))throw Error();
 for(const p of [...c.packages].sort((a,b)=>a.amount-b.amount)){
  versions.set(p.packageId,p.version);
  const label=document.createElement('label'),radio=document.createElement('input'),name=document.createElement('strong'),terms=document.createElement('span');
  label.className='tier';radio.type='radio';radio.name='tier';radio.value=p.packageId;
  radio.addEventListener('change',()=>{
   lastSelectedPackage=p.packageId;
   if(selected)workspacePackages.set(selected,p.packageId);
   updatePackageSelection();
  });
  name.textContent=(packageNames[p.packageId]||p.packageId)+' · '+new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(p.amount);
  terms.textContent=p.term+' · Asia/Jakarta';label.append(radio,name,terms);$('packages').append(label);
 }
 $('catalogStatus').textContent='Salinan katalog server sandbox, diverifikasi '+c.asOf+'. Harga bukan penawaran checkout; akan diperiksa ulang server sebelum transaksi tersedia.';
 updatePackageSelection();
 }catch{$('catalogStatus').textContent='Katalog belum tersedia. Tidak ada harga atau pembayaran yang dapat dikonfirmasi.';}}
if(PROBE_ONLY){
 $('workspaceCreate').closest('section').hidden=true;$('checkout').closest('section').hidden=true;
 $('plannerSection').hidden=true;
 $('timeoutProbeSection').hidden=false;$('signup').hidden=true;
 const {TimeoutProbe}=await import('./timeout-probe.mjs');
 timeoutProbe=new TimeoutProbe({getSession:()=>session,request:async(path,body,captured)=>{
  const r=await fetch(SB+path,{method:body===undefined?'GET':'POST',headers:{apikey:key,Authorization:'Bearer '+captured.access_token,...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)}),credentials:'omit',cache:'no-store',redirect:'error'});
  let value=null;try{value=await r.json();}catch{}
  return {status:r.status,body:value};
 }});
 $('timeoutProbe').addEventListener('click',async()=>{
  if(!session||busy||probeBusy||timeoutProbe.used)return;probeBusy=true;controls();
  $('timeoutProbeResult').textContent='Memproses satu pengujian...';
  const out=await timeoutProbe.run();probeBusy=false;controls();
  if(out)$('timeoutProbeResult').textContent=JSON.stringify(out);
 });
}
controls();if(!PROBE_ONLY)void catalog();
try{const r=await fetch('/config.json',{cache:'no-store',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();const c=await r.json();if(!/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(c.publishableKey))throw Error();key=c.publishableKey;paymentEnabled=c.checkoutEnabled===true;paymentControls();tell('Siap. Masuk atau daftar dengan email milik Anda.');}catch{tell('Konfigurasi tidak tersedia. Tidak ada permintaan akun yang diizinkan.');}
