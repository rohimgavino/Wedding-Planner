'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AuthGate } from '@/components/auth-gate';
import { AdminShell } from '@/components/admin-shell';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/auth-policy';
import {
  AdminDokuOrder,
  AdminVoucher,
  AuditEntry,
  Commerce,
  PaymentCatalog,
  SiteAdminEntry,
  TierPackage,
  fetchPaymentCatalog,
  formatOrderStatus,
} from '@/lib/commerce';
import { formatRupiah } from '@/lib/utils';
import {
  Download,
  TrendingUp,
  CircleDollarSign,
  CheckCircle2,
  Clock,
  CreditCard,
  ArrowRight,
  ShieldAlert,
  Tag,
  Plus,
  Trash2,
  Edit3,
  Percent,
} from 'lucide-react';
import '../app/admin/admin.css';

function Panel() {
  const { user, logout } = useAuth();
  const [menu, setMenu] = useState('Ringkasan');
  const [role, setRole] = useState<'operator' | 'developer' | null>(null);
  const [state, setState] = useState<'loading' | 'allowed' | 'denied'>('loading');

  const [catalog, setCatalog] = useState<PaymentCatalog | null>(null);
  const [orders, setOrders] = useState<AdminDokuOrder[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [admins, setAdmins] = useState<SiteAdminEntry[]>([]);

  const [salesEnabled, setSalesEnabled] = useState(false);
  const [supportEmail, setSupportEmail] = useState('');
  const [salesReason, setSalesReason] = useState('');
  const [salesConfirmed, setSalesConfirmed] = useState(false);

  const [testWorkspace, setTestWorkspace] = useState('');
  const [testDays, setTestDays] = useState('7');
  const [testReason, setTestReason] = useState('');

  const [adminUid, setAdminUid] = useState('');
  const [adminRole, setAdminRole] = useState<'operator' | 'developer' | ''>('operator');
  const [adminReason, setAdminReason] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolveInvoice, setResolveInvoice] = useState<string | null>(null);
  const [resolveReason, setResolveReason] = useState('');

  const [financePeriod, setFinancePeriod] = useState<'all' | 'this_month' | 'last_30_days' | 'last_7_days'>('all');
  const [financeChannel, setFinanceChannel] = useState('all');
  const [financeSearch, setFinanceSearch] = useState('');

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Vouchers & Pricing state
  const [vouchers, setVouchers] = useState<AdminVoucher[]>([]);
  const [editingPackage, setEditingPackage] = useState<TierPackage | null>(null);
  const [editPriceInput, setEditPriceInput] = useState('');
  const [editPriceReason, setEditPriceReason] = useState('');

  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [vCode, setVCode] = useState('');
  const [vTitle, setVTitle] = useState('');
  const [vType, setVType] = useState<'fixed' | 'percentage'>('fixed');
  const [vValue, setVValue] = useState('');
  const [vMaxUses, setVMaxUses] = useState('');
  const [vMaxDiscount, setVMaxDiscount] = useState('');
  const [vPackage, setVPackage] = useState('all');

  const commerce = useMemo(() => new Commerce(createClient()), []);

  const loadOperationalData = useCallback(async () => {
    setState('loading');
    setError('');

    const email = user?.email?.trim().toLowerCase();
    if (!isAdminEmail(email)) {
      setRole(null);
      setState('denied');
      setError('Akun tidak memiliki izin akses administrasi.');
      return;
    }

    try {
      const nextRole = await commerce.role();
      setRole(nextRole);
      if (!nextRole) {
        setState('denied');
        return;
      }

      const [nextCatalog, nextOrders, nextAudit, nextAdmins, nextVouchers] = await Promise.all([
        fetchPaymentCatalog().catch(() => null),
        commerce.dokuOrders(),
        commerce.audit(),
        nextRole === 'developer' ? commerce.admins() : Promise.resolve([]),
        commerce.listVouchers().catch(() => []),
      ]);

      if (nextCatalog) {
        setCatalog(nextCatalog);
        setSalesEnabled(nextCatalog.salesEnabled);
        setSupportEmail(nextCatalog.supportEmail || '');
      }
      setOrders(nextOrders);
      setAudit(nextAudit);
      setAdmins(nextAdmins);
      setVouchers(nextVouchers);
      setState('allowed');
    } catch (err) {
      setRole(null);
      setState('denied');
      setError(err instanceof Error ? err.message : 'Hak admin gagal divalidasi.');
    }
  }, [commerce, user?.email]);

  useEffect(() => {
    void loadOperationalData();
  }, [user?.id, loadOperationalData]);

  const paidOrders = useMemo(() => orders.filter((item) => item.status === 'paid'), [orders]);
  const paidTotalIdr = useMemo(
    () => paidOrders.reduce((sum, item) => sum + (Number(item.amount_idr) || 0), 0),
    [paidOrders]
  );
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.invoice.toLowerCase().includes(q) ||
        item.workspace_id.toLowerCase().includes(q) ||
        item.package_id.toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, searchQuery]);

  const financeFilteredOrders = useMemo(() => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return orders.filter((item) => {
      const orderTime = new Date(item.paid_at || item.created_at).getTime();
      if (financePeriod === 'this_month' && orderTime < startOfThisMonth) return false;
      if (financePeriod === 'last_7_days' && orderTime < sevenDaysAgo) return false;
      if (financePeriod === 'last_30_days' && orderTime < thirtyDaysAgo) return false;

      if (financeChannel !== 'all') {
        const ch = (item.payment_channel || '').toLowerCase();
        if (financeChannel === 'qris' && !ch.includes('qris')) return false;
        if (financeChannel === 'va' && !ch.includes('va') && !ch.includes('virtual')) return false;
        if (financeChannel === 'other' && (ch.includes('qris') || ch.includes('va') || ch.includes('virtual'))) return false;
      }

      if (financeSearch.trim()) {
        const q = financeSearch.trim().toLowerCase();
        return (
          item.invoice.toLowerCase().includes(q) ||
          item.workspace_id.toLowerCase().includes(q) ||
          item.package_id.toLowerCase().includes(q) ||
          (item.payment_channel || '').toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [orders, financePeriod, financeChannel, financeSearch]);

  const financePaidOrders = useMemo(
    () => financeFilteredOrders.filter((item) => item.status === 'paid'),
    [financeFilteredOrders]
  );

  const financeTotalGross = useMemo(
    () => financePaidOrders.reduce((sum, item) => sum + (Number(item.amount_idr) || 0), 0),
    [financePaidOrders]
  );

  const financeTotalCount = financeFilteredOrders.length;
  const financePaidCount = financePaidOrders.length;
  const financeConversionRate = financeTotalCount > 0 ? Math.round((financePaidCount / financeTotalCount) * 100) : 0;
  const financeAov = financePaidCount > 0 ? Math.round(financeTotalGross / financePaidCount) : 0;

  const financePendingOrders = useMemo(
    () => financeFilteredOrders.filter((item) => item.status === 'checkout_ready' || item.status === 'pending'),
    [financeFilteredOrders]
  );
  const financePendingGross = useMemo(
    () => financePendingOrders.reduce((sum, item) => sum + (Number(item.amount_idr) || 0), 0),
    [financePendingOrders]
  );

  const financeTierBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const order of financePaidOrders) {
      const pid = order.package_id || 'unassigned';
      const prev = map.get(pid) || { count: 0, total: 0 };
      prev.count += 1;
      prev.total += Number(order.amount_idr) || 0;
      map.set(pid, prev);
    }
    return Array.from(map.entries())
      .map(([id, d]) => {
        const matched = catalog?.packages.find((p) => p.id === id);
        return {
          id,
          name: matched?.name || id.replace(/_/g, ' ').toUpperCase(),
          count: d.count,
          total: d.total,
          percent: financeTotalGross > 0 ? Math.round((d.total / financeTotalGross) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [financePaidOrders, catalog?.packages, financeTotalGross]);

  const financeChannelBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const order of financePaidOrders) {
      const ch = order.payment_channel ? order.payment_channel.toUpperCase() : 'BELUM TERCATAT';
      const prev = map.get(ch) || { count: 0, total: 0 };
      prev.count += 1;
      prev.total += Number(order.amount_idr) || 0;
      map.set(ch, prev);
    }
    return Array.from(map.entries())
      .map(([channel, d]) => ({
        channel,
        count: d.count,
        total: d.total,
        percent: financeTotalGross > 0 ? Math.round((d.total / financeTotalGross) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [financePaidOrders, financeTotalGross]);

  const financeMonthlySummary = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const order of financePaidOrders) {
      const date = new Date(order.paid_at || order.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const prev = map.get(key) || { count: 0, total: 0 };
      prev.count += 1;
      prev.total += Number(order.amount_idr) || 0;
      map.set(key, prev);
    }
    return Array.from(map.entries())
      .map(([key, d]) => {
        const [year, month] = key.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const label = `${monthNames[Number(month) - 1]} ${year}`;
        return { key, label, count: d.count, total: d.total };
      })
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [financePaidOrders]);

  const exportFinanceCsv = useCallback(() => {
    if (!financePaidOrders.length) {
      alert('Tidak ada transaksi lunas untuk diekspor pada filter ini.');
      return;
    }
    const headers = [
      'No',
      'Tanggal Bayar',
      'Tanggal Order',
      'Invoice',
      'Workspace ID',
      'Paket',
      'Nominal IDR',
      'Durasi Hari',
      'Kanal Pembayaran',
      'Status',
    ];
    const rows = financePaidOrders.map((o, idx) => [
      idx + 1,
      o.paid_at ? `"${new Date(o.paid_at).toLocaleString('id-ID')}"` : '-',
      o.created_at ? `"${new Date(o.created_at).toLocaleString('id-ID')}"` : '-',
      `"${o.invoice}"`,
      `"${o.workspace_id}"`,
      `"${o.package_id}"`,
      o.amount_idr,
      o.duration_days,
      `"${o.payment_channel || '-'}"`,
      `"${o.status}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const nowStr = new Date().toISOString().slice(0, 10);
    a.download = `laporan-keuangan-pocket-wedding-${financePeriod}-${nowStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [financePaidOrders, financePeriod]);

  if (state === 'loading') return <p role="status" className="p-6">Memvalidasi hak admin…</p>;

  if (state !== 'allowed') {
    return (
      <section className="min-h-screen bg-[#FAF7F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-100 shadow-xl shadow-rose-900/10 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-serif font-bold text-slate-900">Akses admin ditolak.</h1>
          <p role="alert" className="text-sm text-slate-600 leading-relaxed">
            Halaman administrasi hanya dapat diakses oleh akun terdaftar (<strong>ahmadnurrochim11</strong> dan <strong>setiarama</strong>). Login Google umum tidak memberi hak admin.
          </p>
          {user?.email && (
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 font-mono break-all border border-slate-100">
              Akun aktif: {user.email}
            </div>
          )}
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={() => void logout?.()}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Keluar / Ganti Akun
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-xl bg-[#163e33] text-white text-xs font-semibold hover:bg-[#12332a] transition inline-flex items-center justify-center"
            >
              Ke Workspace Planner
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const shellStatusLabel = !catalog
    ? 'Status DOKU tidak tersedia'
    : !catalog.dokuConfigured
      ? 'DOKU belum dikonfigurasi'
      : catalog.salesEnabled
        ? 'DOKU Checkout aktif'
        : 'DOKU siap · Penjualan nonaktif';

  const runAction = async (fn: () => Promise<void>, successMessage: string) => {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      await loadOperationalData();
      setNotice(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operasi admin gagal.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell menu={menu} onMenu={setMenu} role={role} statusLabel={shellStatusLabel}>
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 text-rose-900 p-3 mb-4 text-sm">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl bg-emerald-50 text-emerald-900 p-3 mb-4 text-sm">
          {notice}
        </p>
      )}

      {menu === 'Ringkasan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <article className="admin-panel min-w-0 break-words">
              <p className="text-xs text-slate-500">Status Penjualan</p>
              <strong className="text-lg block break-words">{catalog?.salesEnabled ? 'Aktif' : 'Nonaktif'}</strong>
            </article>
            <article className="admin-panel min-w-0 break-words">
              <p className="text-xs text-slate-500">Gateway DOKU</p>
              <strong className="text-lg block break-words">{catalog?.dokuConfigured ? 'Terkonfigurasi' : 'Belum siap'}</strong>
            </article>
            <article className="admin-panel min-w-0 break-words">
              <p className="text-xs text-slate-500">Order Lunas</p>
              <strong className="text-lg block break-words">{paidOrders.length} transaksi</strong>
            </article>
            <article className="admin-panel min-w-0 break-words">
              <p className="text-xs text-slate-500">Gross Lunas Tercatat</p>
              <strong className="text-lg block break-words">{formatRupiah(paidTotalIdr)}</strong>
            </article>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-emerald-200 bg-emerald-50/70">
            <div>
              <strong className="text-sm font-semibold text-emerald-950 block">Laporan & Analisis Keuangan</strong>
              <p className="text-xs text-emerald-800">Pantau detail omset, conversion rate, AOV, breakdown paket & kanal bayar, serta ekspor CSV pembukuan kas.</p>
            </div>
            <button
              type="button"
              onClick={() => setMenu('Laporan Keuangan')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#163e33] text-white hover:bg-[#1f5244] min-h-11"
            >
              <span>Buka Laporan Keuangan</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <section className="admin-panel space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Kontrol penjualan DOKU Checkout</h2>
                <p className="text-xs text-slate-600">
                  Mengatur aktivasi checkout DOKU publik dan email dukungan tanpa mengubah harga server atau hak yang sudah aktif.
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void loadOperationalData()}
                className="min-h-11 rounded-xl border px-3 py-2 text-xs"
              >
                Muat ulang status
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void runAction(async () => {
                  await commerce.setSalesActivation(salesEnabled, supportEmail, salesReason, salesConfirmed);
                  setSalesReason('');
                  setSalesConfirmed(false);
                }, 'Kontrol penjualan DOKU diperbarui dan diaudit.');
              }}
            >
              <label className="flex items-center gap-3 text-sm font-medium min-h-11">
                <input
                  type="checkbox"
                  checked={salesEnabled}
                  onChange={(e) => setSalesEnabled(e.target.checked)}
                />
                <span>Aktifkan penjualan paket melalui DOKU Checkout</span>
              </label>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block text-xs space-y-1">
                  <span>Email dukungan pelanggan</span>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="support@pocketwedding.id"
                    className="w-full rounded-xl border p-2.5 text-sm bg-white"
                  />
                </label>

                <label className="block text-xs space-y-1">
                  <span>Alasan perubahan</span>
                  <input
                    type="text"
                    required
                    value={salesReason}
                    onChange={(e) => setSalesReason(e.target.value)}
                    placeholder="Contoh: Aktivasi penjualan production setelah uji DOKU"
                    className="w-full rounded-xl border p-2.5 text-sm bg-white"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 text-xs text-slate-700 min-h-11">
                <input
                  type="checkbox"
                  checked={salesConfirmed}
                  onChange={(e) => setSalesConfirmed(e.target.checked)}
                />
                <span>Saya mengonfirmasi perubahan status penjualan ini akan diaudit.</span>
              </label>

              <button
                type="submit"
                disabled={busy}
                className="min-h-11 rounded-xl bg-[#163e33] text-white px-4 py-2.5 text-sm font-medium"
              >
                Simpan kontrol penjualan
              </button>
            </form>
          </section>
        </div>
      )}

      {menu === 'Laporan Keuangan' && (
        <div className="space-y-6">
          {/* Header Controls & Export */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-medium text-slate-600 self-center mr-1">Periode:</label>
              <select
                aria-label="Filter periode laporan"
                value={financePeriod}
                onChange={(e) => setFinancePeriod(e.target.value as 'all' | 'this_month' | 'last_30_days' | 'last_7_days')}
                className="rounded-xl border px-3 py-2 text-xs bg-white min-h-11"
              >
                <option value="all">Semua Waktu</option>
                <option value="this_month">Bulan Ini</option>
                <option value="last_30_days">30 Hari Terakhir</option>
                <option value="last_7_days">7 Hari Terakhir</option>
              </select>

              <label className="text-xs font-medium text-slate-600 self-center ml-2 mr-1">Kanal:</label>
              <select
                aria-label="Filter kanal pembayaran"
                value={financeChannel}
                onChange={(e) => setFinanceChannel(e.target.value)}
                className="rounded-xl border px-3 py-2 text-xs bg-white min-h-11"
              >
                <option value="all">Semua Metode</option>
                <option value="qris">QRIS</option>
                <option value="va">Virtual Account</option>
                <option value="other">Metode Lainnya</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="search"
                aria-label="Cari transaksi laporan"
                value={financeSearch}
                onChange={(e) => setFinanceSearch(e.target.value)}
                placeholder="Cari invoice / workspace..."
                className="rounded-xl border px-3 py-2 text-xs bg-white min-h-11 w-48 sm:w-60"
              />
              <button
                type="button"
                onClick={exportFinanceCsv}
                className="inline-flex items-center gap-2 rounded-xl bg-[#163e33] text-white px-4 py-2.5 text-xs font-semibold hover:bg-[#205244] min-h-11"
              >
                <Download size={15} />
                <span>Ekspor CSV</span>
              </button>
            </div>
          </div>

          {/* Financial KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <article className="admin-panel min-w-0">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Omset Lunas (Gross)</span>
                <CircleDollarSign size={16} className="text-emerald-700" />
              </div>
              <strong className="text-2xl font-bold text-slate-900 block font-variant-numeric:tabular-nums">
                {formatRupiah(financeTotalGross)}
              </strong>
              <p className="text-[11px] text-slate-500 mt-2">
                {financePaidCount} transaksi lunas tercatat
              </p>
            </article>

            <article className="admin-panel min-w-0">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Tingkat Konversi</span>
                <TrendingUp size={16} className="text-emerald-700" />
              </div>
              <strong className="text-2xl font-bold text-slate-900 block font-variant-numeric:tabular-nums">
                {financeConversionRate}%
              </strong>
              <p className="text-[11px] text-slate-500 mt-2">
                {financePaidCount} lunas dari {financeTotalCount} total checkout
              </p>
            </article>

            <article className="admin-panel min-w-0">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Average Order Value (AOV)</span>
                <CreditCard size={16} className="text-emerald-700" />
              </div>
              <strong className="text-2xl font-bold text-slate-900 block font-variant-numeric:tabular-nums">
                {formatRupiah(financeAov)}
              </strong>
              <p className="text-[11px] text-slate-500 mt-2">
                Rata-rata pendapatan per order lunas
              </p>
            </article>

            <article className="admin-panel min-w-0">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Potensi Tertahan</span>
                <Clock size={16} className="text-amber-600" />
              </div>
              <strong className="text-2xl font-bold text-slate-900 block font-variant-numeric:tabular-nums">
                {formatRupiah(financePendingGross)}
              </strong>
              <p className="text-[11px] text-slate-500 mt-2">
                {financePendingOrders.length} order menunggu pembayaran
              </p>
            </article>
          </div>

          {/* Breakdown: Tier & Channels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tier Breakdown */}
            <section className="admin-panel space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Pendapatan Berdasarkan Paket</h2>
                  <p className="text-xs text-slate-500">Kontribusi omset dari masing-masing paket langganan.</p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {financeTierBreakdown.length} Paket
                </span>
              </div>

              {!financeTierBreakdown.length ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Belum ada transaksi lunas pada filter ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {financeTierBreakdown.map((tier) => (
                    <div key={tier.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{tier.name}</span>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">{formatRupiah(tier.total)}</span>
                          <span className="text-slate-400 ml-1.5">({tier.count} unit · {tier.percent}%)</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#163e33] rounded-full transition-all duration-300"
                          style={{ width: `${tier.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Payment Channel Breakdown & Run Rate */}
            <section className="admin-panel space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Kanal Pembayaran & Tren</h2>
                  <p className="text-xs text-slate-500">Metode pembayaran yang digunakan oleh pelanggan.</p>
                </div>
              </div>

              {!financeChannelBreakdown.length ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Belum ada kanal pembayaran tercatat pada filter ini.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {financeChannelBreakdown.map((ch) => (
                      <div key={ch.channel} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2">
                          <CreditCard size={15} className="text-slate-500" />
                          <span className="font-medium text-slate-800">{ch.channel}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-slate-900">{formatRupiah(ch.total)}</span>
                          <span className="text-slate-400 ml-1.5">({ch.count}x · {ch.percent}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {financeMonthlySummary.length > 0 && (
                    <div className="pt-3 border-t">
                      <span className="text-xs font-semibold text-slate-700 block mb-2">Omset per Bulan</span>
                      <div className="space-y-1.5">
                        {financeMonthlySummary.map((m) => (
                          <div key={m.key} className="flex justify-between text-xs text-slate-600">
                            <span>{m.label} ({m.count} transaksi)</span>
                            <strong className="text-slate-900 font-medium">{formatRupiah(m.total)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Financial Transactions Ledger Table */}
          <section className="admin-panel space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Buku Kas & Riwayat Transaksi Lunas</h2>
                <p className="text-xs text-slate-500">Daftar transaksi yang telah terverifikasi lunas oleh sistem.</p>
              </div>
              <span className="text-xs text-slate-500">
                Menampilkan <strong>{financePaidOrders.length}</strong> transaksi lunas
              </span>
            </div>

            {!financePaidOrders.length ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Belum ada transaksi lunas yang sesuai dengan kriteria filter saat ini.
              </p>
            ) : (
              <div className="admin-table-wrap">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-600">
                      <th className="p-3 font-semibold">TANGGAL BAYAR</th>
                      <th className="p-3 font-semibold">NO. INVOICE</th>
                      <th className="p-3 font-semibold">PAKET</th>
                      <th className="p-3 font-semibold">KANAL</th>
                      <th className="p-3 font-semibold text-right">NOMINAL</th>
                      <th className="p-3 font-semibold text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {financePaidOrders.map((order) => (
                      <tr key={order.invoice} className="hover:bg-slate-50/50">
                        <td className="p-3 whitespace-nowrap text-slate-600" data-label="Tanggal">
                          {order.paid_at ? new Date(order.paid_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                        </td>
                        <td className="p-3 font-mono font-medium text-slate-900" data-label="Invoice">
                          {order.invoice}
                        </td>
                        <td className="p-3 capitalize text-slate-700" data-label="Paket">
                          {order.package_id}
                        </td>
                        <td className="p-3 text-slate-600" data-label="Kanal">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-medium">
                            {order.payment_channel || 'DOKU'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-semibold text-emerald-950 font-variant-numeric:tabular-nums" data-label="Nominal">
                          {formatRupiah(order.amount_idr)}
                        </td>
                        <td className="p-3 text-center" data-label="Status">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 size={12} />
                            Lunas
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {menu === 'Penjualan' && (
        <section className="admin-panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Transaksi DOKU Checkout</h2>
              <p className="text-xs text-slate-600">
                Status hanya diperbarui oleh proses server/webhook DOKU terverifikasi. Tidak ada tombol verifikasi manual.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                aria-label="Filter status transaksi"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border px-3 py-2 text-xs bg-white min-h-11"
              >
                <option value="all">Semua status</option>
                <option value="paid">Lunas</option>
                <option value="checkout_ready">Menunggu pembayaran</option>
                <option value="pending">Memproses checkout</option>
                <option value="unknown">Menunggu konfirmasi gateway</option>
                <option value="expired">Kedaluwarsa</option>
                <option value="failed">Gagal</option>
              </select>
              <input
                type="search"
                aria-label="Cari invoice atau workspace"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari invoice / workspace…"
                className="rounded-xl border px-3 py-2 text-xs bg-white min-h-11"
              />
            </div>
          </div>

          {!filteredOrders.length && <p className="text-sm text-slate-500">Belum ada transaksi DOKU yang cocok.</p>}

          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const badge = formatOrderStatus(order.status);
              return (
                <article key={order.invoice} className="rounded-2xl border p-4 bg-white text-sm space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="font-mono text-xs sm:text-sm">{order.invoice}</strong>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-slate-700">
                    Paket <strong>{order.package_id}</strong> · {formatRupiah(order.amount_idr)} · {order.duration_days} hari
                  </p>
                  <p className="text-xs text-slate-500 break-all">
                    Workspace: {order.workspace_id} {order.payment_channel ? `· Kanal: ${order.payment_channel}` : ''}
                  </p>
                  {order.error_code && <p className="text-xs text-rose-700">Kode error: {order.error_code}</p>}
                  {order.status === 'unknown' && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      {resolveInvoice !== order.invoice ? (
                        <button
                          type="button"
                          onClick={() => {
                            setResolveInvoice(order.invoice);
                            setResolveReason('');
                          }}
                          className="text-xs underline text-rose-700 min-h-11 inline-flex items-center"
                        >
                          Selesaikan status tertahan (gagal / kedaluwarsa)
                        </button>
                      ) : (
                        <div className="space-y-2 bg-slate-50 rounded-xl p-3">
                          <label className="block text-xs space-y-1">
                            <span>Alasan audit (wajib 8–240 karakter; aktifkan akses tetap hanya via webhook DOKU)</span>
                            <input
                              type="text"
                              minLength={8}
                              maxLength={240}
                              value={resolveReason}
                              onChange={(e) => setResolveReason(e.target.value)}
                              placeholder="Mis. timeout checkout dikonfirmasi tidak dibayar"
                              className="w-full rounded-xl border p-2 text-xs bg-white"
                            />
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={busy || resolveReason.trim().length < 8}
                              onClick={() =>
                                void runAction(async () => {
                                  await commerce.resolveDokuOrder(order.invoice, 'failed', resolveReason);
                                  setResolveInvoice(null);
                                  setResolveReason('');
                                }, `Order ${order.invoice} ditandai gagal agar workspace dapat checkout ulang.`)
                              }
                              className="rounded-lg bg-rose-700 text-white px-3 py-1.5 text-xs disabled:opacity-50"
                            >
                              Tandai gagal
                            </button>
                            <button
                              type="button"
                              disabled={busy || resolveReason.trim().length < 8}
                              onClick={() =>
                                void runAction(async () => {
                                  await commerce.resolveDokuOrder(order.invoice, 'expired', resolveReason);
                                  setResolveInvoice(null);
                                  setResolveReason('');
                                }, `Order ${order.invoice} ditandai kedaluwarsa.`)
                              }
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs disabled:opacity-50"
                            >
                              Tandai kedaluwarsa
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResolveInvoice(null);
                                setResolveReason('');
                              }}
                              className="text-xs text-slate-600 px-2 py-1.5"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {menu === 'Paket & Harga' && (
        <div className="space-y-8">
          {/* Section 1: Paket & Edit Harga */}
          <section className="admin-panel space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Katalog Paket & Harga Aktif</h2>
                <p className="text-xs text-slate-500">
                  Harga paket diverifikasi langsung oleh database server saat checkout dibuat. Anda dapat mengubah harga nominal paket secara aman di bawah.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {(catalog?.packages || []).map((pkg) => (
                <article key={pkg.id} className="rounded-2xl border border-slate-200 p-5 bg-white space-y-3 shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-base">{pkg.name}</h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                        {pkg.id}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-2xl font-bold text-emerald-900">{formatRupiah(pkg.price_idr)}</p>
                      <p className="text-xs text-slate-500">{pkg.duration_days} hari masa aktif</p>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{pkg.description}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPackage(pkg);
                        setEditPriceInput(String(pkg.price_idr));
                        setEditPriceReason('');
                      }}
                      className="w-full py-2 px-3 rounded-xl border border-emerald-700/30 text-emerald-900 hover:bg-emerald-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-98"
                    >
                      <Edit3 size={14} />
                      <span>Ubah Harga Paket</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Section 2: Manajemen Kode Voucher Promo */}
          <section className="admin-panel space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">Kode Voucher & Kupon Promo</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    {vouchers.length} Kupon
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Buat kode promo khusus untuk calon pengantin. Pengantin dapat memasukkan kode saat checkout di halaman pembayaran.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVCode('');
                  setVTitle('');
                  setVType('fixed');
                  setVValue('');
                  setVMaxUses('');
                  setVMaxDiscount('');
                  setVPackage('all');
                  setVoucherModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#163e33] hover:bg-[#12332a] text-white text-xs font-semibold shadow-xs transition active:scale-98 shrink-0"
              >
                <Plus size={15} />
                <span>+ Buat Voucher Baru</span>
              </button>
            </div>

            {!vouchers.length ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Belum ada kode voucher. Klik tombol di atas untuk membuat voucher pertama.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3">Kode Voucher</th>
                      <th className="py-3 px-3">Judul Promo</th>
                      <th className="py-3 px-3">Potongan</th>
                      <th className="py-3 px-3">Kuota Terpakai</th>
                      <th className="py-3 px-3">Paket</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-rose-900 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200/60">
                            {v.code}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">{v.title}</td>
                        <td className="py-3 px-3 font-semibold text-emerald-900">
                          {v.discount_type === 'fixed'
                            ? formatRupiah(v.discount_value)
                            : `${v.discount_value}%${v.max_discount_idr ? ` (Maks. ${formatRupiah(v.max_discount_idr)})` : ''}`}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {v.max_uses ? `${v.used_count} / ${v.max_uses}` : `${v.used_count} (Tanpa Batas)`}
                        </td>
                        <td className="py-3 px-3 text-slate-600 capitalize">
                          {v.package_ids && v.package_ids.length ? v.package_ids.join(', ') : 'Semua Paket'}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              void runAction(async () => {
                                const updated = await commerce.toggleVoucher(v.id, !v.is_active);
                                setVouchers(updated);
                              }, `Status voucher ${v.code} berhasil diperbarui.`);
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                              v.is_active ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${v.is_active ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                            {v.is_active ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus voucher ${v.code}?`)) {
                                void runAction(async () => {
                                  const updated = await commerce.deleteVoucher(v.id);
                                  setVouchers(updated);
                                }, `Voucher ${v.code} berhasil dihapus.`);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            title="Hapus Voucher"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Modal Edit Harga Paket */}
          {editingPackage && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-slate-900 text-base">Ubah Harga Paket {editingPackage.name}</h3>
                  <button
                    type="button"
                    onClick={() => setEditingPackage(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
                  >
                    ✕
                  </button>
                </div>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const newPriceNum = Number(editPriceInput);
                    if (newPriceNum < 10000) {
                      alert('Harga minimal Rp 10.000');
                      return;
                    }
                    if (!editPriceReason.trim()) {
                      alert('Alasan perubahan harga wajib diisi untuk jejak audit.');
                      return;
                    }
                    void runAction(async () => {
                      await commerce.updatePackagePrice(editingPackage.id, newPriceNum, editPriceReason.trim());
                      setEditingPackage(null);
                    }, `Harga paket ${editingPackage.name} berhasil diubah ke ${formatRupiah(newPriceNum)}.`);
                  }}
                >
                  <label className="block text-xs space-y-1">
                    <span className="font-semibold text-slate-700">Harga Baru (IDR)</span>
                    <input
                      type="number"
                      required
                      min={10000}
                      step={100}
                      value={editPriceInput}
                      onChange={(e) => setEditPriceInput(e.target.value)}
                      placeholder="Contoh: 79900"
                      className="w-full rounded-xl border p-2.5 text-sm bg-white font-mono"
                    />
                    <span className="text-[11px] text-slate-400">
                      Pratinjau: {formatRupiah(Number(editPriceInput) || 0)}
                    </span>
                  </label>
                  <label className="block text-xs space-y-1">
                    <span className="font-semibold text-slate-700">Alasan Perubahan (Jejak Audit)</span>
                    <input
                      type="text"
                      required
                      maxLength={500}
                      value={editPriceReason}
                      onChange={(e) => setEditPriceReason(e.target.value)}
                      placeholder="Contoh: Penyesuaian tarif tahun 2026"
                      className="w-full rounded-xl border p-2.5 text-sm bg-white"
                    />
                  </label>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setEditingPackage(null)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="px-5 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 disabled:opacity-50"
                    >
                      Simpan Harga Baru
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Buat Voucher Baru */}
          {voucherModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-slate-900 text-base">Buat Kode Voucher Promo Baru</h3>
                  <button
                    type="button"
                    onClick={() => setVoucherModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
                  >
                    ✕
                  </button>
                </div>
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const code = vCode.trim().toUpperCase();
                    const title = vTitle.trim();
                    const val = Number(vValue);
                    if (code.length < 3) {
                      alert('Kode voucher minimal 3 karakter.');
                      return;
                    }
                    if (!val || val <= 0) {
                      alert('Nilai diskon harus lebih dari 0.');
                      return;
                    }
                    void runAction(async () => {
                      const updated = await commerce.createVoucher({
                        code,
                        title,
                        discountType: vType,
                        discountValue: val,
                        maxUses: vMaxUses ? Number(vMaxUses) : null,
                        maxDiscountIdr: vMaxDiscount ? Number(vMaxDiscount) : null,
                        packageIds: vPackage === 'all' ? null : [vPackage],
                        isActive: true,
                      });
                      setVouchers(updated);
                      setVoucherModalOpen(false);
                    }, `Voucher ${code} berhasil dibuat.`);
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block text-xs space-y-1">
                      <span className="font-semibold text-slate-700">Kode Voucher (Kapital)</span>
                      <input
                        type="text"
                        required
                        value={vCode}
                        onChange={(e) => setVCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                        placeholder="Contoh: NIKAHHEMAT"
                        className="w-full rounded-xl border p-2.5 text-sm font-mono uppercase bg-white"
                      />
                    </label>
                    <label className="block text-xs space-y-1">
                      <span className="font-semibold text-slate-700">Judul / Keterangan Promo</span>
                      <input
                        type="text"
                        required
                        value={vTitle}
                        onChange={(e) => setVTitle(e.target.value)}
                        placeholder="Contoh: Diskon Wedding Fair 2026"
                        className="w-full rounded-xl border p-2.5 text-sm bg-white"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block text-xs space-y-1">
                      <span className="font-semibold text-slate-700">Tipe Potongan</span>
                      <select
                        value={vType}
                        onChange={(e) => setVType(e.target.value as 'fixed' | 'percentage')}
                        className="w-full rounded-xl border p-2.5 text-sm bg-white"
                      >
                        <option value="fixed">Potongan Tetap (Rupiah)</option>
                        <option value="percentage">Persentase (%)</option>
                      </select>
                    </label>
                    <label className="block text-xs space-y-1">
                      <span className="font-semibold text-slate-700">
                        {vType === 'fixed' ? 'Nominal Potongan (IDR)' : 'Persentase Diskon (%)'}
                      </span>
                      <input
                        type="number"
                        required
                        min={1}
                        max={vType === 'percentage' ? 100 : 10000000}
                        value={vValue}
                        onChange={(e) => setVValue(e.target.value)}
                        placeholder={vType === 'fixed' ? 'Contoh: 20000' : 'Contoh: 20'}
                        className="w-full rounded-xl border p-2.5 text-sm font-mono bg-white"
                      />
                    </label>
                  </div>

                  {vType === 'percentage' && (
                    <label className="block text-xs space-y-1">
                      <span className="font-semibold text-slate-700">Maksimal Diskon (IDR, Opsional)</span>
                      <input
                        type="number"
                        min={1000}
                        value={vMaxDiscount}
                        onChange={(e) => setVMaxDiscount(e.target.value)}
                        placeholder="Contoh: 50000 (Kosongkan jika tanpa batas)"
                        className="w-full rounded-xl border p-2.5 text-sm bg-white font-mono"
                      />
                    </label>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block text-xs space-y-1">
                      <span className="font-semibold text-slate-700">Batas Kuota Penggunaan</span>
                      <input
                        type="number"
                        min={1}
                        value={vMaxUses}
                        onChange={(e) => setVMaxUses(e.target.value)}
                        placeholder="Contoh: 50 (Kosongkan jika tanpa batas)"
                        className="w-full rounded-xl border p-2.5 text-sm bg-white font-mono"
                      />
                    </label>
                    <label className="block text-xs space-y-1">
                      <span className="font-semibold text-slate-700">Berlaku untuk Paket</span>
                      <select
                        value={vPackage}
                        onChange={(e) => setVPackage(e.target.value)}
                        className="w-full rounded-xl border p-2.5 text-sm bg-white"
                      >
                        <option value="all">Semua Paket</option>
                        <option value="starter">Starter Saja</option>
                        <option value="premium">Premium Saja</option>
                        <option value="wedding_pro">Wedding Pro Saja</option>
                      </select>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setVoucherModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="px-5 py-2 rounded-xl bg-[#163e33] text-white text-xs font-semibold hover:bg-[#12332a] disabled:opacity-50"
                    >
                      Simpan Voucher
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {menu === 'Workspace & Masa Akses' && (
        <section className="admin-panel space-y-4">
          {role !== 'developer' ? (
            <>
              <h2 className="text-lg font-semibold">Workspace & Masa Akses</h2>
              <p className="text-sm text-slate-600">
                Akses uji nonpembayaran hanya tersedia untuk role developer. Isi data planner tenant tetap privat.
              </p>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-semibold">Akses uji nonpembayaran — developer saja</h2>
                <p className="text-xs text-slate-600">
                  Memberi akses uji sementara (1–30 hari) pada workspace milik developer sendiri tanpa membuat catatan transaksi DOKU.
                </p>
              </div>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void runAction(async () => {
                    await commerce.testAccess(testWorkspace.trim(), testDays, testReason);
                    setTestReason('');
                  }, 'Akses uji sementara diberikan dan diaudit.');
                }}
              >
                <div className="grid sm:grid-cols-3 gap-3">
                  <label className="block text-xs space-y-1 sm:col-span-2">
                    <span>UUID workspace uji</span>
                    <input
                      type="text"
                      required
                      value={testWorkspace}
                      onChange={(e) => setTestWorkspace(e.target.value)}
                      placeholder="UUID workspace"
                      className="w-full rounded-xl border p-2.5 text-sm bg-white"
                    />
                  </label>
                  <label className="block text-xs space-y-1">
                    <span>Durasi (hari, 1–30)</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      required
                      value={testDays}
                      onChange={(e) => setTestDays(e.target.value)}
                      className="w-full rounded-xl border p-2.5 text-sm bg-white"
                    />
                  </label>
                </div>
                <label className="block text-xs space-y-1">
                  <span>Alasan akses uji</span>
                  <input
                    type="text"
                    required
                    value={testReason}
                    onChange={(e) => setTestReason(e.target.value)}
                    placeholder="Contoh: Uji alur workspace internal"
                    className="w-full rounded-xl border p-2.5 text-sm bg-white"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="min-h-11 rounded-xl bg-[#163e33] text-white px-4 py-2 text-sm font-medium"
                  >
                    Beri akses uji sementara
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void runAction(async () => {
                        await commerce.revokeTestAccess(testWorkspace.trim(), testReason);
                        setTestReason('');
                      }, 'Akses uji dicabut dan diaudit.')
                    }
                    className="min-h-11 rounded-xl border px-4 py-2 text-sm"
                  >
                    Cabut akses uji
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      )}

      {menu === 'Audit' && (
        <section className="admin-panel space-y-3">
          <h2 className="text-lg font-semibold">Jejak audit operasional</h2>
          {!audit.length && <p className="text-sm text-slate-500">Belum ada catatan audit.</p>}
          <div className="space-y-2">
            {audit.map((entry) => (
              <article key={entry.id} className="rounded-xl border bg-white p-3 text-xs space-y-1">
                <div className="flex flex-wrap justify-between gap-2">
                  <strong className="font-semibold text-slate-900">{entry.action}</strong>
                  <span className="text-slate-500">{entry.created_at}</span>
                </div>
                <p className="text-slate-600 break-all">
                  Actor: {entry.actor_id} {entry.subject_id ? `· Target: ${entry.subject_id}` : ''}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {menu === 'Akses Admin' && role === 'developer' && (
        <section className="admin-panel space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Hak admin — developer saja</h2>
            <p className="text-xs text-slate-600">
              Tetapkan atau cabut role operator/developer berdasarkan UUID Auth Supabase yang sudah terverifikasi.
            </p>
          </div>

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void runAction(async () => {
                await commerce.setAdmin(adminUid.trim(), adminRole || null, adminReason);
                setAdminReason('');
              }, 'Hak admin diperbarui dan diaudit.');
            }}
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-xs space-y-1">
                <span>UUID Auth terverifikasi</span>
                <input
                  type="text"
                  required
                  value={adminUid}
                  onChange={(e) => setAdminUid(e.target.value)}
                  placeholder="UUID user auth.users"
                  className="w-full rounded-xl border p-2.5 text-sm bg-white"
                />
              </label>

              <label className="block text-xs space-y-1">
                <span>Role</span>
                <select
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value as 'operator' | 'developer' | '')}
                  className="w-full rounded-xl border p-2.5 text-sm bg-white"
                >
                  <option value="operator">operator</option>
                  <option value="developer">developer</option>
                  <option value="">Cabut akses admin</option>
                </select>
              </label>
            </div>

            <label className="block text-xs space-y-1">
              <span>Alasan / tiket persetujuan</span>
              <input
                type="text"
                required
                value={adminReason}
                onChange={(e) => setAdminReason(e.target.value)}
                placeholder="Alasan perubahan hak admin"
                className="w-full rounded-xl border p-2.5 text-sm bg-white"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded-xl bg-[#163e33] text-white px-4 py-2.5 text-sm font-medium"
            >
              Perbarui hak admin
            </button>
          </form>

          <div className="space-y-2 pt-2 border-t">
            <h3 className="text-sm font-semibold">Daftar admin aktif</h3>
            {admins.map((item) => (
              <div key={item.user_id} className="rounded-xl border bg-white p-3 text-xs flex justify-between gap-2">
                <span className="font-mono break-all">{item.user_id}</span>
                <strong>{item.role}</strong>
              </div>
            ))}
          </div>
        </section>
      )}
    </AdminShell>
  );
}

export default function AdminReleasePage() {
  return (
    <AuthGate>
      <Panel />
    </AuthGate>
  );
}
