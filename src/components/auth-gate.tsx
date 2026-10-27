'use client';
import { useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { safeNext } from '@/lib/auth-policy';
export function AuthGate({children}: {children: ReactNode}) {
 const {user,ready,configured,error,logout} = useAuth();
 const pathname=usePathname(),router=useRouter();
 useEffect(()=>{
  if(ready && configured && !user) {
   const next=safeNext(pathname + (pathname==='/invite' ? window.location.search : ''));
   router.replace('/login?next='+encodeURIComponent(next));
  }
 },[ready,configured,user,pathname,router]);
 if(!configured)return <div role="alert" className="min-h-screen p-8 bg-[#FAF7F5]">Login cloud belum dikonfigurasi. Workspace dinonaktifkan. <Link href="/login">Masuk</Link></div>;
 if(!ready || !user)return <div role="status" className="min-h-screen p-8 bg-[#FAF7F5]">Memvalidasi sesi… {error}</div>;
 return <><div className="account-toolbar"><button type="button" className="account-logout" onClick={()=>{if(window.confirm('Keluar dari akun? Data yang sudah tersimpan tetap aman.'))void logout();}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M9 5H5v14h4M14 8l4 4-4 4M9 12h9"/></svg><span>Keluar</span></button></div>{error && <p role="alert">{error}</p>}{children}</>;
}
