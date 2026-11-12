'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useWorkspace } from '@/context/WorkspaceContext';
import { createClient } from '@/lib/supabase/client';
import {
  DokuOrderSummary,
  PaymentCatalog,
  WorkspaceBillingStatus,
  fetchPaymentCatalog,
  fetchWorkspaceBilling,
  formatOrderStatus,
  isOrderCheckoutActive,
  startDokuCheckout,
} from '@/lib/commerce';
import { formatRupiah } from '@/lib/utils';

const TIER_RANK: Record<string, number> = {
  starter: 1,
  premium: 2,
  wedding_pro: 3,
};

function hasActivePackageAccess(billing: WorkspaceBillingStatus | null, packageId?: string): boolean {
  if (!billing) return false;
  const now = Date.now();
  const activeFeatures = billing.entitlements
    .filter((item) => {
      if (item.revoked_at) return false;
      if (!item.expires_at) return true;
      const exp = Date.parse(item.expires_at);
      return Number.isFinite(exp) && exp > now;
    })
    .map((item) => item.feature);

  if (!packageId) {
    return activeFeatures.some(
      (f) => f === 'core' || f === 'starter' || f === 'premium' || f === 'wedding_pro'
    );
  }

  const targetRank = TIER_RANK[packageId] ?? 0;
  const maxTierRank = activeFeatures.reduce((max, f) => Math.max(max, TIER_RANK[f] ?? 0), 0);
  if (maxTierRank > 0) {
    return maxTierRank >= targetRank;
  }
  return activeFeatures.includes('core');
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
        'Anda kembali dari halaman pembayaran DOKU. Status akses aktif otomatis setelah notifikasi resmi dari gateway DOKU diterima.'
      );
    }
  }, []);

  const orders: DokuOrderSummary[] = useMemo(() => billing?.orders || [], [billing]);
  const coreActive = useMemo(() => hasActivePackageAccess(billing), [billing]);
  const activeCheckoutOrder = useMemo(
    () => orders.find((order) => isOrderCheckoutActive(order)) || null,
    [orders]
  );

  const canCheckout = Boolean(catalog?.salesEnabled && catalog?.dokuConfigured);

  const handleCheckout = async (packageId: string) => {
    if (!workspaceId || busyPackageId || refreshing) return;
    setBusyPackageId(packageId);
    setError('');
    setNotice('');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Sesi login tidak ditemukan. Silakan masuk kembali.');
      const result = await startDokuCheckout(token, workspaceId, packageId);
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
        <p className="text-xs tracking-widest text-rose-700">POCKET PLANNER · PEMBAYARAN RESMI DOKU CHECKOUT</p>
        <h1 className="font-serif text-3xl">Aktivasi paket workspace</h1>
        <p className="text-slate-600">
          Satu paket membuka fitur penuh perencanaan pernikahan untuk workspace Anda dan pasangan (anggaran, checklist, daftar tamu, dan tabungan).
        </p>

        {authReady && !user && (
          <div className="rounded-2xl bg-[#FAF7F5] border border-rose-100 p-4 text-sm space-y-3">
            <p className="text-slate-800">Masuk dengan akun Google untuk memilih workspace dan melanjutkan pembayaran melalui DOKU Checkout.</p>
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
                Akses paket aktif.{' '}
                <Link href="/dashboard" className="underline inline-flex items-center min-h-11">
                  Buka dashboard planner
                </Link>
              </p>
            )}
          </div>
        )}

        {catalog && !canCheckout && (
          <p className="rounded-xl bg-amber-50 text-amber-900 p-3 text-sm">
            Penjualan saat ini belum dibuka atau gateway DOKU sedang dalam pemeliharaan. Pembayaran baru hanya melalui DOKU Checkout; jangan transfer manual di luar sistem.
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
              Lanjutkan pembayaran DOKU
            </a>
          </div>
        )}

        {catalog && (
          <div className="grid sm:grid-cols-3 gap-4 pt-2">
            {catalog.packages.map((pkg) => {
              const packageId = pkg.id || (pkg as unknown as { package_id?: string }).package_id || '';
              const packagePrice = Number(
                pkg.price_idr ?? (pkg as unknown as { effective_amount_idr?: string | number }).effective_amount_idr ?? pkg.base_amount_idr ?? 0
              );
              const packageFeatures = Array.isArray(pkg.features) ? pkg.features : [];
              const packageActive = hasActivePackageAccess(billing, packageId);
              const disabled =
                !user ||
                !workspace ||
                !canCheckout ||
                !pkg.checkout_eligible ||
                packageActive ||
                busyPackageId !== null ||
                refreshing;

              return (
                <article
                  key={packageId}
                  className="rounded-2xl border border-rose-100 p-4 flex flex-col justify-between space-y-4 bg-white"
                >
                  <div className="space-y-2">
                    <h2 className="font-serif text-xl text-slate-900">{pkg.name || packageId}</h2>
                    <p className="text-lg font-semibold text-rose-800">{formatRupiah(packagePrice)}</p>
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
                    className="w-full min-h-11 rounded-xl bg-rose-700 text-white px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                  >
                    {busyPackageId === packageId
                      ? 'Menyiapkan checkout…'
                      : packageActive
                        ? 'Paket sudah aktif'
                        : 'Bayar via DOKU'}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        <p className="text-xs text-slate-600 pt-2">
          Pembayaran hanya tersedia melalui DOKU Checkout (QRIS, Virtual Account, e-Wallet, atau kanal aktif DOKU lainnya). Login, redirect pembayaran, atau screenshot tidak mengaktifkan akses secara sepihak. Jangan kirim data kartu, password, atau kode OTP.
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

            {!orders.length && <p className="text-sm text-slate-500">Belum ada transaksi DOKU untuk workspace ini.</p>}

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
                      Paket {order.package_id} · {formatRupiah(order.amount_idr)} · {order.duration_days} hari
                    </p>
                    {order.payment_channel && (
                      <p className="text-xs text-slate-500">Kanal: {order.payment_channel}</p>
                    )}
                    {checkoutActive && order.checkout_url && (
                      <a
                        href={order.checkout_url}
                        className="inline-block min-h-11 underline text-rose-700 pt-1"
                      >
                        Buka halaman pembayaran DOKU
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
