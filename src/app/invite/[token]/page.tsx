"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Heart, Calendar, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { formatDateID } from "@/lib/utils";

export default function InviteLandingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const { workspace } = useWorkspace();

  const handleAccept = () => {
    // Di tahap MVP / lokal, langsung mengarahkan pasangan ke dashboard bersama
    router.push("/dashboard");
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
          Pasanganmu telah membuat ruang kerja perencanaan bersama untuk:
        </p>

        {/* Wedding Card Details */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-champagne-50 border border-rose-100 text-left mb-6">
          <span className="text-[10px] uppercase tracking-wider text-rose-700 font-bold block mb-1">
            Ruang Perencanaan Bersama
          </span>
          <h3 className="font-serif font-bold text-slate-900 text-base mb-1">
            {workspace?.title || "Pernikahan Kita"}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
            <span>{workspace ? formatDateID(workspace.wedding_date) : "2026"}</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Dengan bergabung, kamu bisa melihat dan mengelola pos anggaran bersama, checklist persiapan, dan daftar tamu dari HP-mu.
        </p>

        <button
          onClick={handleAccept}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white font-semibold text-sm shadow-md hover:from-rose-600 hover:to-rose-700 transition flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Buka Dasbor Bersama Sekarang</span>
        </button>

        <div className="mt-4 text-[10px] text-slate-400 font-mono">
          Token: {token || "PASS-VALID"}
        </div>
      </div>
    </div>
  );
}
