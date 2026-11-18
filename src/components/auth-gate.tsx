'use client';
import { useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { formatRemainingTime, safeNext } from '@/lib/auth-policy';

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, ready, configured, error, logout, remainingMs, isSessionWarning } = useAuth();
  const pathname = usePathname(), router = useRouter();

  useEffect(() => {
    if (ready && configured && !user) {
      const next = safeNext(pathname + (pathname === '/invite' ? window.location.search : ''));
      router.replace('/login?next=' + encodeURIComponent(next));
    }
  }, [ready, configured, user, pathname, router]);

  if (!configured) {
    return (
      <div role="alert" className="min-h-screen p-8 bg-[#FAF7F5]">
        Login cloud belum dikonfigurasi. Workspace dinonaktifkan. <Link href="/login">Masuk</Link>
      </div>
    );
  }

  if (!ready || !user) {
    return (
      <div role="status" className="min-h-screen p-8 bg-[#FAF7F5]">
        Memvalidasi sesi… {error}
      </div>
    );
  }

  return (
    <>
      <div className="account-toolbar">
        <div
          className={`account-session-badge ${isSessionWarning ? 'warning' : ''}`}
          title="Batas sesi login aktif 1 jam demi keamanan akun"
        >
          <Clock className={`w-3.5 h-3.5 ${isSessionWarning ? 'text-amber-600 animate-pulse' : 'text-[#C6AA78]'}`} />
          <span>
            {remainingMs !== null
              ? `Sisa Sesi: ${formatRemainingTime(remainingMs)}`
              : 'Sesi maks. 1 jam'}
          </span>
        </div>
        <button
          type="button"
          className="account-logout"
          onClick={() => {
            if (window.confirm('Keluar dari akun? Data yang sudah tersimpan tetap aman.'))
              void logout();
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M9 5H5v14h4M14 8l4 4-4 4M9 12h9" />
          </svg>
          <span>Keluar</span>
        </button>
      </div>
      {isSessionWarning && (
        <div role="status" className="bg-amber-50 border-b border-amber-200 text-amber-800 px-4 py-2 text-center text-xs font-medium flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Sesi login Anda akan berakhir dalam beberapa menit (batas 1 jam). Perubahan yang belum disimpan segera diselesaikan.</span>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {children}
    </>
  );
}
