'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthGate } from '@/components/auth-gate';
import { AdminShell } from '@/components/admin-shell';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/client';
import {
  AdminDokuOrder,
  AuditEntry,
  Commerce,
  PaymentCatalog,
  SiteAdminEntry,
  fetchPaymentCatalog,
  formatOrderStatus,
} from '@/lib/commerce';
import { formatRupiah } from '@/lib/utils';
import '../app/admin/admin.css';

function Panel() {
  const { user } = useAuth();
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

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const commerce = useMemo(() => new Commerce(createClient()), []);

  const loadOperationalData = useCallback(async () => {
    setState('loading');
    setError('');
    try {
      const nextRole = await commerce.role();
      setRole(nextRole);
      if (!nextRole) {
        setState('denied');
        return;
      }

      const [nextCatalog, nextOrders, nextAudit, nextAdmins] = await Promise.all([
        fetchPaymentCatalog().catch(() => null),
        commerce.dokuOrders(),
        commerce.audit(),
        nextRole === 'developer' ? commerce.admins() : Promise.resolve([]),
      ]);

      if (nextCatalog) {
        setCatalog(nextCatalog);
        setSalesEnabled(nextCatalog.salesEnabled);
        setSupportEmail(nextCatalog.supportEmail || '');
      }
      setOrders(nextOrders);
      setAudit(nextAudit);
      setAdmins(nextAdmins);
      setState('allowed');
    } catch (err) {
      setRole(null);
      setState('denied');
      setError(err instanceof Error ? err.message : 'Hak admin gagal divalidasi.');
    }
  }, [commerce]);

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

  if (state === 'loading') return <p role="status" className="p-6">Memvalidasi hak admin…</p>;

  if (state !== 'allowed') {
    return (
      <section className="p-6 space-y-2">
        <h1>Akses admin ditolak.</h1>
        <p role="alert">
          Identitas atau schema admin tidak dapat divalidasi. Login Google tidak memberi hak admin.
        </p>
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
        <section className="admin-panel space-y-4">
          <h2 className="text-lg font-semibold">Katalog paket aktif (authoritative server)</h2>
          <p className="text-xs text-slate-600">
            Harga dan durasi paket diverifikasi langsung oleh Worker/server saat checkout dibuat. Tidak ada perubahan nominal dari sisi klien.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {(catalog?.packages || []).map((pkg) => (
              <article key={pkg.id} className="rounded-2xl border p-4 bg-white space-y-2">
                <h3 className="font-semibold text-base">{pkg.name}</h3>
                <p className="text-sm font-semibold text-emerald-900">{formatRupiah(pkg.price_idr)}</p>
                <p className="text-xs text-slate-500">{pkg.duration_days} hari · ID: {pkg.id}</p>
                <p className="text-xs text-slate-600">{pkg.description}</p>
              </article>
            ))}
          </div>
        </section>
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
