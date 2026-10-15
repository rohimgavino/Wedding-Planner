'use client';
import { useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { safeNext } from '@/lib/auth-policy';
import { LogoutButton } from '@/components/everrae/logout-button';
export function AuthGate({children}: {children: ReactNode}) {
 const {user,ready,configured,error} = useAuth();
 const pathname=usePathname(),router=useRouter();
 useEffect(()=>{
  if(ready && configured && !user) {
   const next=safeNext(pathname + (pathname==='/invite' ? window.location.search : ''));
   router.replace('/login?next='+encodeURIComponent(next));
  }
 },[ready,configured,user,pathname,router]);
 if(!configured)return <div role="alert" className="min-h-screen p-8 bg-[#FAF7F5]">Login cloud belum dikonfigurasi. Workspace dinonaktifkan. <Link href="/login">Masuk</Link></div>;
 if(!ready || !user)return <div role="status" className="min-h-screen p-8 bg-[#FAF7F5]">Memvalidasi sesi… {error}</div>;
 return <><LogoutButton/>{error && <p role="alert">{error}</p>}{children}</>;
}
