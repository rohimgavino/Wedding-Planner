"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { safeNext } from "@/lib/auth-policy";
import { createClient } from "@/lib/supabase/client";
import { Heart, Sparkles, ArrowRight, Mail, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const {configured, user, ready} = useAuth();
  const router = useRouter();
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState<string | null>(null);
  useEffect(()=>{if(ready && user)router.replace(safeNext(new URLSearchParams(window.location.search).get('next')));},[user,ready,router]);
  const handleGoogleLogin = async () => {
    if(!configured) {setMessage('Login cloud belum dikonfigurasi. Tidak ada akses demo.');return;}
    setLoading(true);setMessage(null);
    try {
      const next=safeNext(new URLSearchParams(window.location.search).get('next'));
      const {error}=await createClient().auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin+'/auth/callback?next='+encodeURIComponent(next)}});
      if(error)throw error;
    } catch {setMessage('Gagal masuk dengan Google. Silakan coba lagi.');setLoading(false);}
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col justify-center items-center px-4 sm:px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-7 sm:p-9 border border-rose-100 shadow-xl shadow-rose-900/10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-400 to-amber-300 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-rose-200">
              💍
            </div>
            <span className="font-serif font-bold text-slate-900 tracking-tight text-xl">
              Pocket Planner
            </span>
          </Link>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Masuk ke Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Masuk dengan Google untuk mengakses workspace cloud pribadi dan pasangan.
          </p>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-semibold">{message}</p>
          </div>
        )}
        {(
          <div className="space-y-4">
            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading || !configured}
              className="w-full py-3.5 px-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-3 active:scale-98"
            >
              {/* Google SVG Logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? "Menghubungkan..." : (configured ? "Lanjutkan dengan Google" : "Google OAuth belum tersedia")}</span>
            </button>

          </div>
        )}

        {!configured && <p role="alert" className="text-sm text-rose-800 mt-4">Login cloud belum dikonfigurasi. Workspace dinonaktifkan; data lama tidak diunggah.</p>}

      </div>
    </div>
  );
}
