"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Heart, Calendar, Wallet, ArrowRight, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { formatRupiah, calculateDaysRemaining, formatDateID } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const { createWorkspace } = useWorkspace();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [groomName, setGroomName] = useState("Rian");
  const [brideName, setBrideName] = useState("Dina");
  const [weddingDate, setWeddingDate] = useState("2026-12-25");
  const [targetBudget, setTargetBudget] = useState(80000000);
  const [targetSavings, setTargetSavings] = useState(60000000);

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkspace({
      groom_name: groomName.trim() || "Mempelai Pria",
      bride_name: brideName.trim() || "Mempelai Wanita",
      wedding_date: weddingDate,
      target_budget: Number(targetBudget) || 50000000,
      target_savings: Number(targetSavings) || 40000000,
    });
    router.push("/dashboard");
  };

  const daysRemaining = calculateDaysRemaining(weddingDate);

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col justify-center px-4 sm:px-6 py-10">
      <div className="max-w-xl mx-auto w-full">
        
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
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
            Mulai Perjalanan Pernikahan Berdua
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Langkah awal membuat ruang kerja bersama yang rapi dan terhubung real-time.
          </p>
        </div>

        {/* Live Preview Card */}
        <div className="mb-8 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-700 text-white shadow-xl shadow-rose-900/10 relative overflow-hidden transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-1.5">
                <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-xs font-bold">
                  {groomName.charAt(0).toUpperCase() || "P"}
                </div>
                <div className="w-8 h-8 rounded-full bg-rose-300 border border-white/40 flex items-center justify-center text-xs font-bold text-rose-900">
                  {brideName.charAt(0).toUpperCase() || "W"}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-rose-100 font-medium">Wedding Workspace</span>
                <h3 className="font-serif font-bold text-base tracking-wide">
                  {groomName || "Mempelai Pria"} & {brideName || "Mempelai Wanita"}
                </h3>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-200" />
              <span>{daysRemaining} Hari Lagi</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/15">
            <div>
              <div className="text-[10px] text-rose-100 font-medium">Target Tabungan</div>
              <div className="text-sm font-bold">{formatRupiah(targetSavings)}</div>
            </div>
            <div>
              <div className="text-[10px] text-rose-100 font-medium">Target Budget</div>
              <div className="text-sm font-bold">{formatRupiah(targetBudget)}</div>
            </div>
          </div>
        </div>

        {/* Step Wizard Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xl shadow-slate-200/50">
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
                {step}
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {step === 1 && "Nama Calon Mempelai"}
                {step === 2 && "Tanggal Acara Pernikahan"}
                {step === 3 && "Rencana Anggaran & Tabungan"}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Langkah {step} dari 3</span>
          </div>

          <form onSubmit={step === 3 ? handleFinish : (e) => { e.preventDefault(); setStep((s) => (s + 1) as any); }}>
            
            {/* Step 1: Couple Names */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Panggilan Calon Pengantin Pria
                  </label>
                  <input
                    type="text"
                    required
                    value={groomName}
                    onChange={(e) => setGroomName(e.target.value)}
                    placeholder="Contoh: Rian"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm font-medium transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Panggilan Calon Pengantin Wanita
                  </label>
                  <input
                    type="text"
                    required
                    value={brideName}
                    onChange={(e) => setBrideName(e.target.value)}
                    placeholder="Contoh: Dina"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm font-medium transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold text-sm shadow-md hover:from-rose-600 hover:to-rose-700 transition flex items-center justify-center gap-2"
                >
                  <span>Lanjut ke Tanggal Acara</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: Wedding Date */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Rencana Tanggal Akad / Resepsi
                  </label>
                  <input
                    type="date"
                    required
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm font-medium transition"
                  />
                  <p className="text-[11px] text-slate-500 mt-2">
                    Tanggal terpilih: <span className="font-semibold text-rose-600">{formatDateID(weddingDate)}</span> ({daysRemaining} hari lagi)
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-100 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-800 leading-relaxed">
                    Sistem akan otomatis mengatur jadwal mundur dokumen KUA dan checklist persiapan sesuai tanggal ini.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold text-sm shadow-md hover:from-rose-600 hover:to-rose-700 transition flex items-center justify-center gap-2"
                  >
                    <span>Lanjut ke Anggaran</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Target Budget & Savings */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Total Anggaran Pernikahan (Budget Plafon)
                  </label>
                  <input
                    type="number"
                    step="1000000"
                    required
                    value={targetBudget}
                    onChange={(e) => setTargetBudget(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm font-medium transition"
                  />
                  <span className="text-xs font-semibold text-rose-600 mt-1 block">
                    {formatRupiah(targetBudget)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Tabungan Bersama Calon Mempelai
                  </label>
                  <input
                    type="number"
                    step="1000000"
                    required
                    value={targetSavings}
                    onChange={(e) => setTargetSavings(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm font-medium transition"
                  />
                  <span className="text-xs font-semibold text-emerald-600 mt-1 block">
                    {formatRupiah(targetSavings)}
                  </span>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold text-sm shadow-md hover:from-rose-600 hover:to-rose-700 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Buat Wedding Workspace Sekarang ✨</span>
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>

      </div>
    </div>
  );
}
