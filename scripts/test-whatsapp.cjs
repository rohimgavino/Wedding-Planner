const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
const m=new Module('whatsapp');m._compile(ts.transpileModule(fs.readFileSync('src/lib/whatsapp.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,'whatsapp.js');
const {buildInvitationMessage,invitationLink}=m.exports;
assert.equal(typeof buildInvitationMessage,'function','recommended invitation builder exists');
const p={guestName:'Tamu',coupleName:'Rohim & Wiwit',weddingDate:'29 Januari 2027',time:'09:00',timezone:'WIB',venue:'Gedung',address:'Alamat',mapsUrl:'https://maps.app.goo.gl/example'};
for(const style of ['islami','formal','santai']){const text=buildInvitationMessage({...p,style});assert.ok(text.includes('Rohim & Wiwit'));assert.ok(text.includes('09:00 WIB'));assert.ok(text.includes(p.mapsUrl));assert.ok(!text.includes('undefined'));}
assert.match(buildInvitationMessage({...p,style:'islami'}),/Assalamu/);
assert.ok(!buildInvitationMessage({...p,style:'formal'}).includes('Assalamu'));
const missing=buildInvitationMessage({guestName:'Tamu',coupleName:'Pasangan',weddingDate:'Tanggal',style:'formal'});assert.ok(!missing.includes('undefined'));assert.ok(!missing.includes('{'));assert.ok(!missing.includes('09:00'));
const link=new URL(invitationLink('081234567890','Teks & salam\nLokasi'));assert.equal(link.searchParams.get('phone'),'6281234567890');assert.equal(link.searchParams.get('text'),'Teks & salam\nLokasi');
assert.throws(()=>invitationLink('abc','x'));assert.throws(()=>invitationLink('081234567890',' '));
assert.ok(!buildInvitationMessage({...p,mapsUrl:'javascript:alert(1)',style:'formal'}).includes('javascript:'));
assert.equal(typeof m.exports.renderInvitationTemplate,'function');
assert.equal(m.exports.renderInvitationTemplate('Halo {nama_tamu}, {pasangan} pada {tanggal}',{guestName:'Ayu',coupleName:'A & B',weddingDate:'Jumat'}),'Halo Ayu, A & B pada Jumat');
console.log('PASS invitation styles, real details, missing values, safe Maps, phone and exact encoding');
