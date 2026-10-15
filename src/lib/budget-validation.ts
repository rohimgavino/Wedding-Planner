// Allocation is an estimate, never an invoice or a derived payment status.
export function validateBudget(item: Record<string, unknown>): void {
  for (const key of ['allocated_amount', 'spent_amount']) {
    if (item[key] !== undefined && (!Number.isSafeInteger(item[key]) || Number(item[key]) < 0)) {
      throw new Error('Nominal Rupiah harus bilangan bulat aman dan tidak negatif.');
    }
  }
  for (const [key, max] of [['title', 150], ['category', 50], ['notes', 2000]] as const) {
    const value = item[key];
    if (value !== undefined && (typeof value !== 'string' || value.length > max || (key !== 'notes' && !value.trim()))) {
      throw new Error(`Isi ${key} harus valid (maksimal ${max} karakter).`);
    }
  }
  if (item.payment_status !== undefined || item.spent_amount !== undefined) {
    if (!['unpaid', 'dp', 'paid'].includes(String(item.payment_status)) || item.spent_amount === undefined) {
      throw new Error('Status pembayaran dan pengeluaran riil harus diisi bersama.');
    }
    if (item.payment_status === 'unpaid' ? item.spent_amount !== 0 : Number(item.spent_amount) <= 0) {
      throw new Error('Belum DP harus memiliki riil Rp0; Sudah DP dan Lunas memerlukan riil lebih dari Rp0.');
    }
  }
}
