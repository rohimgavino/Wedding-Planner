export type InvitationStyle = 'islami' | 'formal' | 'santai';
export interface InvitationParams {
 guestName: string; coupleName: string; weddingDate: string; style?: InvitationStyle;
 time?: string; timezone?: string; venue?: string; address?: string; mapsUrl?: string;
}
export function safeMapsUrl(value: string = '') {
 try { const u=new URL(value); return u.protocol==='https:' && !u.username && !u.password && ['maps.app.goo.gl','maps.google.com','www.google.com','google.com','goo.gl'].includes(u.hostname) ? u.href : ''; } catch {return '';}
}
export function buildInvitationMessage(p: InvitationParams): string {
 const details=[`🗓 ${p.weddingDate}`,p.time?.trim() ? `🕘 ${p.time.trim()} ${p.timezone || 'WIB'}` : '',p.venue?.trim() ? `📍 ${p.venue.trim()}` : '',p.address?.trim() || '',safeMapsUrl(p.mapsUrl) ? `🗺 Lokasi: ${safeMapsUrl(p.mapsUrl)}` : ''].filter(Boolean).join('\n');
 const names=`*${p.coupleName}*`;
 if(p.style==='islami') return `Assalamu’alaikum warahmatullahi wabarakatuh.\n\nYth. Bapak/Ibu/Kak ${p.guestName},\nDengan memohon rahmat dan rida Allah SWT, kami mengundang Anda untuk menghadiri pernikahan:\n\n${names}\n\n${details}\n\nMerupakan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu. Mohon konfirmasi kehadiran melalui balasan pesan ini.\n\nWassalamu’alaikum warahmatullahi wabarakatuh.`;
 if(p.style==='santai') return `Halo ${p.guestName}! 👋\n\nKami ingin berbagi hari bahagia pernikahan ${names} denganmu!\n\n${details}\n\nKami senang sekali kalau kamu bisa hadir. Kabari kehadiranmu lewat balasan pesan ini ya. Terima kasih! 🙏`;
 return `Yth. Bapak/Ibu/Kak ${p.guestName},\n\nDengan penuh kebahagiaan, kami mengundang Anda untuk menghadiri pernikahan:\n\n${names}\n\n${details}\n\nKehadiran dan doa restu Anda sangat berarti bagi kami. Mohon konfirmasi kehadiran melalui balasan pesan ini. Terima kasih.`;
}
export function invitationLink(phone: string, message: string) {
 let number=phone.replace(/[\s()+-]/g,'');if(number.startsWith('0'))number='62'+number.slice(1);
 if(!/^\d{8,15}$/.test(number) || !message.trim())throw new Error('Nomor WhatsApp dan teks pesan harus valid.');
 return `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(message)}`;
}
export interface WhatsAppMessageParams {
  phone: string;
  guestName: string;
  coupleName: string;
  weddingDate: string;
  customNote?: string;
}

export function generateWhatsAppLink(params: WhatsAppMessageParams): string {
  // Standarisasi nomor HP Indonesia: ubah 08xxx atau +628xxx menjadi 628xxx
  let cleanPhone = params.phone.replace(/[^0-9]/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.slice(1);
  }

  const defaultMessage = `Halo ${params.guestName}! Kami berbahagia mengundang Anda untuk hadir di pernikahan ${params.coupleName} pada ${params.weddingDate}. ${params.customNote ? "\n\n" + params.customNote : ""}\n\nMohon konfirmasi kehadiran Anda melalui pesan ini ya. Terima kasih banyak! 🙏✨`;

  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(defaultMessage)}`;
}
