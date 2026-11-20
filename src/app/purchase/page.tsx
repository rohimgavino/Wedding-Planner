'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useWorkspace } from '@/context/WorkspaceContext';
import { isTesterBypassEmail } from '@/lib/auth-policy';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  Commerce,
  DokuOrderSummary,
  PaymentCatalog,
  VoucherValidationResult,
  WorkspaceBillingStatus,
  fetchPaymentCatalog,
  fetchWorkspaceBilling,
  formatOrderStatus,
  formatPurchaseDuration,
  isOrderCheckoutActive,
  startDokuCheckout,
} from '@/lib/commerce';
import { formatRupiah } from '@/lib/utils';
import { Tag, CheckCircle2, X } from 'lucide-react';

function hasActiveCoreAccess(billing: WorkspaceBillingStatus | null): boolean {
  if (!billing) return false;
  const now = Date.now();
  return billing.entitlements.some((item) => {
    if (item.feature !== 'core' || item.revoked_at) return false;
    if (item.expires_at === null) return true;
    const expiresAt = Date.parse(item.expires_at);
    return Number.isFinite(expiresAt) && expiresAt > now;
  });
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ?? null;
}

export default function PurchasePage() {
  const { user, ready: authReady } = useAuth();
  const { workspace, isLoaded, reload } = useWorkspace();
  const workspaceId = workspace?.id;
  const userId = user?.id;

  const [catalog, setCatalog] = useState<PaymentCatalog | null>(null);
  const [billing, setBilling] = useState<WorkspaceBillingStatus | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyPackageId, setBusyPackageId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Voucher State
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherValidationResult | null>(null);

  const handleApplyVoucher = async () => {
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) {
      setVoucherError('Masukkan kode voucher.');
      return;
    }
    if (!workspaceId) {
      setVoucherError('Workspace belum siap.');
      return;
    }
    if (!isSupabaseConfigured()) {
      setVoucherError('Layanan login cloud belum dikonfigurasi.');
      return;
    }
    setVoucherLoading(true);
    setVoucherError('');
    try {
      const commerce = new Commerce(createClient());
      const res = await commerce.validateVoucher(code, 'premium', workspaceId);
      if (!res.valid) {
        setVoucherError(res.message || 'Kode voucher tidak valid.');
        setAppliedVoucher(null);
      } else {
        setAppliedVoucher(res);
        setVoucherCodeInput(res.code || code);
        setNotice(`Voucher ${res.code} berhasil diterapkan!`);
      }
    } catch (err) {
      setVoucherError(err instanceof Error ? err.message : 'Gagal memvalidasi voucher.');
      setAppliedVoucher(null);
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput('');
    setVoucherError('');
  };

  const loadBilling = useCallback(async () => {
    if (!workspaceId) {
      setBilling(null);
      return;
    }
    const token = await getAccessToken();
    if (!token) {
      setBilling(null);
      return;
    }
    const nextBilling = await fetchWorkspaceBilling(token, workspaceId);
    setBilling(nextBilling);
  }, [workspaceId]);

  useEffect(() => {
    let active = true;
    setError('');
    void fetchPaymentCatalog()
      .then((data) => {
        if (active) setCatalog(data);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Katalog pembayaran belum dapat dimuat.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!workspaceId || !userId) {
      setBilling(null);
      return;
    }
    void getAccessToken()
      .then((token) => (token ? fetchWorkspaceBilling(token, workspaceId) : null))
      .then((data) => {
        if (active) setBilling(data);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Status pembayaran workspace gagal dimuat.');
        }
      });
    return () => {
      active = false;
    };
  }, [workspaceId, userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('invoice') || params.get('payment') || params.get('status')) {
      setNotice(
        'Kamu kembali dari halaman pembayaran. Status akses aktif otomatis setelah notifikasi resmi pembayaran diterima.'
      );
    }
  }, []);

  const orders: DokuOrderSummary[] = useMemo(() => billing?.orders || [], [billing]);
  const isBypass = isTesterBypassEmail(user?.email);
  const coreActive = useMemo(() => isBypass || hasActiveCoreAccess(billing), [billing, isBypass]);
  const activeCheckoutOrder = useMemo(
    () => orders.find((order) => isOrderCheckoutActive(order)) || null,
    [orders]
  );

  const canCheckout = Boolean(catalog?.salesEnabled && catalog?.dokuConfigured);

  const handleCheckout = async (packageId: string) => {
    if (!workspaceId || coreActive || busyPackageId || refreshing) return;
    setBusyPackageId(packageId);
    setError('');
    setNotice('');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Sesi login tidak ditemukan. Silakan masuk kembali.');
      const result = await startDokuCheckout(token, workspaceId, packageId, appliedVoucher?.code);
      if (result.status === 'already_active') {
        setNotice(result.message || 'Workspace ini sudah memiliki akses aktif.');
        await Promise.all([loadBilling(), reload()]);
        return;
      }
      if (result.status === 'checkout_ready' && result.checkoutUrl) {
        await loadBilling();
        window.location.assign(result.checkoutUrl);
        return;
      }
      throw new Error('Respons checkout DOKU tidak lengkap.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memulai pembayaran DOKU.');
    } finally {
      setBusyPackageId(null);
    }
  };

  const handleRefresh = async () => {
    if (!workspaceId || refreshing || busyPackageId) return;
    setRefreshing(true);
    setError('');
    try {
      const [nextCatalog] = await Promise.all([fetchPaymentCatalog(), loadBilling(), reload()]);
      setCatalog(nextCatalog);
      setNotice('Status paket dan pembayaran workspace berhasil diperbarui.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status gagal dimuat. Coba lagi.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <main className="max-w-3xl w-full mx-auto p-4 sm:p-8 space-y-6 break-words">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="inline-flex min-h-11 items-center" aria-label="Pocket Planner — Beranda">
          <Image src="/images/pocket-planner-logo.png" alt="Pocket Planner" width={132} height={78} unoptimized />
        </Link>
        <Link className="underline text-rose-700 min-h-11 inline-flex items-center" href={user ? '/dashboard' : '/'}>
          {user ? '← Kembali ke workspace' : '← Kembali ke beranda'}
        </Link>
      </div>

      <section className="bg-white rounded-3xl border border-rose-100 p-6 space-y-4">
        <p className="text-xs tracking-widest text-rose-700">POCKET PLANNER · AKTIVASI PAKET WORKSPACE</p>
        <h1 className="font-serif text-3xl">Aktivasi paket workspace</h1>
        <p className="text-slate-600">
          Satu paket membuka fitur penuh perencanaan pernikahan untuk workspace kamu dan pasangan (anggaran, checklist, daftar tamu, dan tabungan).
        </p>

        {authReady && !user && (
          <div className="rounded-2xl bg-[#FAF7F5] border border-rose-100 p-4 text-sm space-y-3">
            <p className="text-slate-800">Masuk dengan akun Google untuk memilih workspace dan mengaktifkan paket perencanaan.</p>
            <Link
              href="/login?next=%2Fpurchase"
              className="min-h-11 inline-flex items-center rounded-xl bg-rose-700 px-4 py-2.5 text-white font-medium"
            >
              Masuk untuk membeli paket
            </Link>
          </div>
        )}

        {user && !isLoaded && <p role="status">Memuat workspace…</p>}
        {user && isLoaded && !workspace && (
          <p className="rounded-2xl bg-[#FAF7F5] border border-rose-100 p-4 text-sm">
            Buat workspace dahulu melalui{' '}
            <Link href="/onboarding" className="underline text-rose-700 font-medium inline-flex items-center min-h-11">
              halaman onboarding
            </Link>{' '}
            sebelum melakukan pembayaran.
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 text-rose-900 p-3 text-sm">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-xl bg-amber-50 text-amber-900 p-3 text-sm">
            {notice}
          </p>
        )}

        {user && workspace && (
          <div className="rounded-2xl bg-[#FAF7F5] border border-rose-100 p-4 text-sm space-y-1">
            <p className="font-medium text-slate-900">Workspace: {workspace.title}</p>
            <p className="text-slate-600 break-all">ID: {workspace.id}</p>
            {coreActive && (
              <p className="text-emerald-700 font-medium pt-1">
                Akses paket aktif. Upgrade paket belum tersedia.{' '}
                <Link href="/dashboard" className="underline inline-flex items-center min-h-11">
                  Buka dashboard planner
                </Link>
              </p>
            )}
          </div>
        )}

        {catalog && !canCheckout && (
          <p className="rounded-xl bg-amber-50 text-amber-900 p-3 text-sm">
            Penjualan saat ini belum dibuka atau gateway pembayaran sedang dalam pemeliharaan. Pembayaran baru hanya melalui sistem resmi; jangan transfer manual di luar sistem.
          </p>
        )}

        {activeCheckoutOrder?.checkout_url && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm space-y-2">
            <p className="font-semibold text-amber-950">
              Sesi pembayaran aktif tersedia ({activeCheckoutOrder.invoice})
            </p>
            <p className="text-amber-900">
              Nominal {formatRupiah(activeCheckoutOrder.amount_idr)} · Paket {activeCheckoutOrder.package_id}
            </p>
            <a
              href={activeCheckoutOrder.checkout_url}
              className="inline-flex items-center justify-center min-h-11 rounded-xl bg-rose-700 text-white px-4 py-2 font-medium"
            >
              Lanjutkan pembayaran
            </a>
          </div>
        )}

        {/* Voucher Input Box */}
        {catalog && !coreActive && (
          <div className="rounded-2xl border border-rose-100 p-4 bg-rose-50/40 space-y-3">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-rose-700" />
              <strong className="text-xs sm:text-sm font-semibold text-slate-900">Punya Kode Voucher Promo?</strong>
            </div>

            {!appliedVoucher ? (
              <form
                className="flex flex-col sm:flex-row gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleApplyVoucher();
                }}
              >
                <input
                  type="text"
                  value={voucherCodeInput}
                  onChange={(e) => {
                    setVoucherCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                    setVoucherError('');
                  }}
                  placeholder="Contoh: NIKAHHEMAT"
                  className="flex-1 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-mono uppercase tracking-wider placeholder:normal-case placeholder:font-sans placeholder:tracking-normal focus:border-rose-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={voucherLoading || !voucherCodeInput.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-semibold transition disabled:opacity-50 active:scale-98 shrink-0"
                >
                  {voucherLoading ? 'Memeriksa…' : 'Terapkan Voucher'}
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-mono font-bold">{appliedVoucher.code}</span>
                    <span className="text-emerald-700 ml-1.5 font-medium">
                      (Potongan {formatRupiah(appliedVoucher.discount_amount_idr || 0)})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveVoucher}
                  className="text-xs text-rose-700 hover:text-rose-900 font-semibold p-1"
                >
                  Hapus
                </button>
              </div>
            )}

            {voucherError && (
              <p role="alert" className="text-xs text-rose-700 font-medium">
                {voucherError}
              </p>
            )}
          </div>
        )}

        {catalog && (
          <div className="grid sm:grid-cols-3 gap-4 pt-2">
            {catalog.packages.map((pkg) => {
              const packageId = pkg.id || (pkg as unknown as { package_id?: string }).package_id || '';
              const basePrice = Number(
                pkg.price_idr ?? (pkg as unknown as { effective_amount_idr?: string | number }).effective_amount_idr ?? pkg.base_amount_idr ?? 0
              );
              let finalPrice = basePrice;
              let discountAmount = 0;
              if (appliedVoucher && appliedVoucher.valid) {
                if (appliedVoucher.discount_type === 'fixed') {
                  discountAmount = appliedVoucher.discount_value || appliedVoucher.discount_amount_idr || 0;
                } else if (appliedVoucher.discount_type === 'percentage') {
                  discountAmount = Math.round((basePrice * (appliedVoucher.discount_value || 0)) / 100);
                }
                if (discountAmount >= basePrice) discountAmount = basePrice - 1000;
                finalPrice = Math.max(1000, basePrice - discountAmount);
              }

              const packageFeatures = Array.isArray(pkg.features) ? pkg.features : [];

              const disabled =
                !user ||
                !workspace ||
                !canCheckout ||
                !pkg.checkout_eligible ||
                coreActive ||
                busyPackageId !== null ||
                refreshing;

              return (
                <article
                  key={packageId}
                  className="rounded-2xl border border-rose-100 p-4 flex flex-col justify-between space-y-4 bg-white"
                >
                  <div className="space-y-2">
                    <h2 className="font-serif text-xl text-slate-900">{pkg.name || packageId}</h2>
                    {appliedVoucher && discountAmount > 0 ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs line-through text-slate-400">{formatRupiah(basePrice)}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                            Hemat {formatRupiah(discountAmount)}
                          </span>
                        </div>
                        <p className="text-xl font-bold text-rose-800">{formatRupiah(finalPrice)}</p>
                      </div>
                    ) : (
                      <p className="text-lg font-semibold text-rose-800">{formatRupiah(basePrice)}</p>
                    )}
                    <p className="text-xs text-slate-500">{pkg.duration_days ?? 365} hari sejak aktivasi</p>
                    {pkg.description && <p className="text-sm text-slate-600">{pkg.description}</p>}
                    <ul className="text-xs text-slate-700 space-y-1 pt-1 list-disc pl-4">
                      {packageFeatures.map((feat) => (
                        <li key={feat}>{feat}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => void handleCheckout(packageId)}
                    className="w-full min-h-11 rounded-xl bg-rose-700 text-white px-4 py-2.5 text-sm font-medium disabled:opacity-50 transition active:scale-98"
                  >
                    {busyPackageId === packageId
                      ? 'Menyiapkan pembayaran…'
                      : coreActive
                        ? 'Akses sudah aktif'
                        : 'Bayar Sekarang'}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        <p className="text-xs text-slate-600 pt-2">
          Pembayaran resmi mendukung QRIS, Virtual Account, dan e-Wallet. Login, redirect pembayaran, atau tangkapan layar tidak mengaktifkan akses secara sepihak. Jangan pernah mengirimkan data kartu, password, atau kode OTP.
        </p>

        {catalog?.supportEmail && (
          <p className="text-sm break-words">
            Bantuan pembayaran:{' '}
            <a className="underline text-rose-700 inline-flex items-center min-h-11 break-all max-w-full" href={`mailto:${catalog.supportEmail}`}>
              {catalog.supportEmail}
            </a>
          </p>
        )}

        {user && workspace && (
          <div className="pt-3 border-t border-rose-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-lg">Riwayat transaksi workspace</h2>
              <button
                type="button"
                disabled={refreshing || busyPackageId !== null}
                onClick={() => void handleRefresh()}
                className="underline text-sm min-h-11 text-left text-rose-700 disabled:opacity-50"
              >
                {refreshing ? 'Menyegarkan…' : 'Periksa status aktivasi'}
              </button>
            </div>

            {!orders.length && <p className="text-sm text-slate-500">Belum ada riwayat transaksi untuk workspace ini.</p>}

            <div className="space-y-3">
              {orders.map((order) => {
                const badge = formatOrderStatus(order.status);
                const checkoutActive = isOrderCheckoutActive(order);
                return (
                  <article key={order.invoice} className="border border-rose-100 rounded-2xl p-4 text-sm space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="font-medium text-slate-900">{order.invoice}</strong>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-slate-700">
                      Paket {order.package_id} · {formatRupiah(order.amount_idr)} · {formatPurchaseDuration(order)}
                    </p>
                    {order.payment_channel && (
                      <p className="text-xs text-slate-500">Kanal: {order.payment_channel}</p>
                    )}
                    {checkoutActive && order.checkout_url && (
                      <a
                        href={order.checkout_url}
                        className="inline-block min-h-11 underline text-rose-700 pt-1"
                      >
                        Buka halaman pembayaran
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
