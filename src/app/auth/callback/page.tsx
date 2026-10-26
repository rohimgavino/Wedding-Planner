'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { completeCallback, safeNext } from '@/lib/auth-policy';
import { useAuth } from '@/context/auth-context';
export default function CallbackPage() {
 const started=useRef(false);const [error,setError]=useState('');const {refresh}=useAuth();
 useEffect(()=>{
  if(started.current)return;started.current=true;
  const url=new URL(window.location.href);
  const next=safeNext(url.searchParams.get('next'));
  void (async()=>{try {
   await completeCallback(createClient().auth,url);
   window.history.replaceState(null,'','/auth/callback');
   await refresh();window.location.replace(next);
  } catch(err){window.history.replaceState(null,'','/auth/callback');setError(err instanceof Error?err.message:'Login gagal.');}})();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 return <main className="min-h-screen bg-[#FAF7F5] flex flex-col items-center justify-center p-6 text-center">{error ? <><p role="alert">{error}</p><Link href="/login" className="underline mt-4">Kembali ke login</Link></> : <p role="status">Menyelesaikan login aman…</p>}</main>;
}
