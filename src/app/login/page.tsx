"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/context/WorkspaceContext";
import { createClient } from "@/lib/supabase/client";
import { Heart, Sparkles, ArrowRight, Mail, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isSupabaseConfigured = 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  const handleGoogleLogin = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      // Mode demo / belum setup Supabase
      setTimeout(() => {
        if (!workspace) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      }, 500);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      alert("Gagal masuk via Google: " + (err.message || err));
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    if (!isSupabaseConfigured) {
      // Mode demo / uji coba
      setMessage("Masuk berhasil!");
      setTimeout(() => {
        if (!workspace) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      }, 500);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      setMessage("Tautan login (Magic Link) telah dikirim ke email Anda!");
    } catch (err: any) {
      alert("Gagal mengirim email: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col justify-center items-center px-4 sm:px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-7 sm:p-9 border border-rose-100 shadow-xl shadow-rose-900/10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-400 to-amber-300 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-rose-200">
              💍
            </div>
            <span className="font-serif font-bold text-slate-900 tracking-tight text-xl">
              Meet to Marry
            </span>
          </a>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Masuk ke Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Lanjutkan perencanaan pernikahan bersama pasanganmu.
          </p>
        </div>

        {message ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-semibold">{message}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
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
              <span>{loading ? "Menghubungkan..." : "Lanjutkan dengan Google"}</span>
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] text-slate-400 uppercase font-semibold">atau email</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Email OTP Form */}
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-xs sm:text-sm font-medium transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold text-xs sm:text-sm shadow-md hover:from-rose-600 hover:to-rose-700 transition flex items-center justify-center gap-2 active:scale-98"
              >
                <span>{loading ? "Memproses..." : "Kirim Tautan Masuk"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Demo Fast Track Card */}
        <div className="mt-8 pt-5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500 mb-2.5">
            Belum punya workspace bersama?
          </p>
          <a
            href="/onboarding"
            className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition block"
          >
            Buat Workspace Baru
          </a>
        </div>

      </div>
    </div>
  );
}
