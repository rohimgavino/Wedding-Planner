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
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [targetBudget, setTargetBudget] = useState<number | "">("");
  const [targetSavings, setTargetSavings] = useState<number | "">("");

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkspace({
      groom_name: groomName.trim() || "Mempelai Pria",
      bride_name: brideName.trim() || "Mempelai Wanita",
      wedding_date: weddingDate || new Date().toISOString().split("T")[0],
      target_budget: Number(targetBudget) || 0,
      target_savings: Number(targetSavings) || 0,
    });
    router.push("/dashboard");
  };

  const daysRemaining = calculateDaysRemaining(weddingDate);

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col justify-center items-center px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-md lg:max-w-4xl w-full my-auto">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <a href="/" className="inline-flex items-center gap-2 mb-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-400 to-amber-300 text-white flex items-center justify-center font-bold text-base shadow-sm">
              💍
            </div>
            <span className="font-serif font-bold text-slate-900 tracking-tight text-xl">
              Meet to Marry
            </span>
          </a>
          <h1 className="text-2xl font-serif font-bold text-slate-900 leading-tight">
            {step === 1 && "Siapa Nama Kedua Mempelai?"}
            {step === 2 && "Kapan Hari Bahagia Kalian?"}
            {step === 3 && "Rencana Anggaran & Tabungan"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            {step === 1 && "Langkah awal membuat ruang kerja bersama yang rapi dan terhubung."}
            {step === 2 && "Sistem otomatis menyusun jadwal mundur persiapan & dokumen KUA."}
            {step === 3 && "Atur target bersama agar pengeluaran terkendali sampai hari H."}
          </p>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-1.5">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
              step >= 1 ? "bg-rose-500 text-white shadow-xs" : "bg-slate-200 text-slate-600"
            }`}>
              1
            </span>
            <span className={`text-[11px] font-semibold ${step >= 1 ? "text-rose-600" : "text-slate-400"}`}>
              Mempelai
            </span>
          </div>

          <div className={`w-8 h-0.5 rounded transition ${step >= 2 ? "bg-rose-400" : "bg-slate-200"}`} />

          <div className="flex items-center gap-1.5">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
              step >= 2 ? "bg-rose-500 text-white shadow-xs" : "bg-slate-200 text-slate-600"
            }`}>
              2
            </span>
            <span className={`text-[11px] font-semibold ${step >= 2 ? "text-rose-600" : "text-slate-400"}`}>
              Tanggal
            </span>
          </div>

          <div className={`w-8 h-0.5 rounded transition ${step >= 3 ? "bg-rose-400" : "bg-slate-200"}`} />

          <div className="flex items-center gap-1.5">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
              step >= 3 ? "bg-rose-500 text-white shadow-xs" : "bg-slate-200 text-slate-600"
            }`}>
              3
            </span>
            <span className={`text-[11px] font-semibold ${step >= 3 ? "text-rose-600" : "text-slate-400"}`}>
              Anggaran
            </span>
          </div>
        </div>

        {/* Main Content Layout: Single Column on Mobile, 2 Columns on Desktop */}
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          
          {/* Left Panel: Desktop Romantic Showcase Card (Hidden on Mobile) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-700 text-white shadow-xl shadow-rose-950/10 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />

            <div>
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-lg mb-4 border border-white/25 shadow-xs">
                💍
              </div>
              <span className="text-[10px] uppercase tracking-wider text-rose-100 font-bold block mb-1">
                Ruang Perencanaan Bersama
              </span>
              <h3 className="font-serif font-bold text-2xl leading-tight">
                {groomName.trim() || brideName.trim() 
                  ? `${groomName.trim() || "Mempelai Pria"} & ${brideName.trim() || "Mempelai Wanita"}`
                  : "Pernikahan Kita"}
              </h3>
              <p className="text-xs text-rose-100/80 mt-1">
                {weddingDate ? formatDateID(weddingDate) : "Tentukan tanggal hari H"}
              </p>

              {/* Dynamic Live Badges on Desktop */}
              <div className="mt-6 space-y-2.5">
                {weddingDate && (
                  <div className="p-3 bg-white/15 backdrop-blur-xs rounded-2xl border border-white/20 flex items-center gap-2.5 text-xs font-medium">
                    <Calendar className="w-4 h-4 text-rose-200 shrink-0" />
                    <span>{daysRemaining} Hari Menuju Hari H</span>
                  </div>
                )}
                {targetBudget ? (
                  <div className="p-3 bg-white/15 backdrop-blur-xs rounded-2xl border border-white/20 flex items-center gap-2.5 text-xs font-medium">
                    <Wallet className="w-4 h-4 text-rose-200 shrink-0" />
                    <span>Target Budget: {formatRupiah(Number(targetBudget) || 0)}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Feature Perks */}
            <div className="pt-6 border-t border-white/15 space-y-2.5 text-xs text-rose-50 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Sinkronisasi instan antar 2 HP</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Checklist berkas resmi KUA</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>WhatsApp RSVP langsung tanpa biaya</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Active Form Card */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-rose-100/80 shadow-xl shadow-rose-950/5 flex flex-col justify-center">
          <form onSubmit={step === 3 ? handleFinish : (e) => { e.preventDefault(); setStep((s) => (s + 1) as any); }}>
            
            {/* Step 1: Couple Names */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Panggilan Mempelai Pria
                  </label>
                  <input
                    type="text"
                    required
                    value={groomName}
                    onChange={(e) => setGroomName(e.target.value)}
                    placeholder="Contoh: Rian"
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100 text-sm font-medium transition shadow-xs placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Panggilan Mempelai Wanita
                  </label>
                  <input
                    type="text"
                    required
                    value={brideName}
                    onChange={(e) => setBrideName(e.target.value)}
                    placeholder="Contoh: Dina"
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100 text-sm font-medium transition shadow-xs placeholder:text-slate-400"
                  />
                </div>

                {/* Gentle Pair Preview Badge */}
                {(groomName.trim() || brideName.trim()) && (
                  <div className="p-3 bg-rose-50/70 border border-rose-200/60 rounded-2xl flex items-center gap-2.5 animate-fade-up">
                    <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      💍
                    </div>
                    <div className="text-xs text-slate-700">
                      Ruang Perencanaan: <span className="font-bold text-rose-700">{groomName.trim() || "..."} & {brideName.trim() || "..."}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white font-semibold text-sm shadow-md hover:from-rose-600 hover:to-rose-700 transition flex items-center justify-center gap-2 active:scale-98"
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
                    placeholder="Contoh: 80000000"
                    value={targetBudget}
                    onChange={(e) => setTargetBudget(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm font-medium transition"
                  />
                  <span className="text-xs font-semibold text-rose-600 mt-1 block">
                    {formatRupiah(Number(targetBudget) || 0)}
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
                    placeholder="Contoh: 60000000"
                    value={targetSavings}
                    onChange={(e) => setTargetSavings(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm font-medium transition"
                  />
                  <span className="text-xs font-semibold text-emerald-600 mt-1 block">
                    {formatRupiah(Number(targetSavings) || 0)}
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

        {/* Back to Home Link */}
        <div className="text-center mt-6">
          <a href="/" className="text-xs text-slate-400 hover:text-rose-600 transition font-medium">
            ← Kembali ke Beranda
          </a>
        </div>

      </div>
    </div>
  );
}
