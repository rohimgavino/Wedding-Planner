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
