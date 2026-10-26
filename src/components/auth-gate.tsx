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
 return <><div className="flex justify-end p-2 bg-[#FAF7F5]"><button className="text-sm text-rose-700 underline" onClick={()=>void logout()}>Keluar</button></div>{error && <p role="alert">{error}</p>}{children}</>;
}
