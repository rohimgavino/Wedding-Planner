"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Calendar, CheckCircle2, Sparkles } from "lucide-react";
import { formatDateID } from "@/lib/utils";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const { acceptInvite, busy } = useWorkspace();

  const handleAccept = async () => {
    if (await acceptInvite(token)) { window.history.replaceState(null, "", "/invite"); router.push("/dashboard"); }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col justify-center items-center px-5 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-100 shadow-xl shadow-rose-900/10 text-center">
        
        {/* Animated Rings Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 via-rose-400 to-amber-300 text-white flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-lg shadow-rose-200">
          💍
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/70 text-rose-800 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-rose-600" />
          <span>Undangan Khusus Pasangan</span>
        </div>

        <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">
          Selamat Datang di Wedding Workspace!
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
          Masuk dan terima undangan untuk mengakses rencana pasangan. Detail workspace hanya tersedia setelah berhasil bergabung.
        </p>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Dengan bergabung, kamu bisa melihat dan mengelola pos anggaran bersama, checklist persiapan, dan daftar tamu dari HP-mu.
        </p>

        <button
          onClick={handleAccept}
          disabled={busy || !/^[a-f0-9]{64}$/.test(token)}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white font-semibold text-sm shadow-md hover:from-rose-600 hover:to-rose-700 transition flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Terima Undangan Pasangan</span>
        </button>

        {!/^[a-f0-9]{64}$/.test(token) && <p role="alert">Undangan tidak valid atau tidak ditemukan.</p>}
      </div>
    </div>
  );
}

export default function InviteLandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F5] text-slate-500 text-xs">
        Memuat undangan pasangan...
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
