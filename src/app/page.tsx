"use client";

import React, { useState } from "react";
import { 
  Heart, Calendar, Users, Wallet, CheckSquare, MessageCircle, 
  ArrowRight, Sparkles, ChevronRight, Share2, Check, Clock, 
  ShieldCheck, Smartphone, Zap, Gift, FileText, ExternalLink
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"overview" | "budget" | "tasks" | "guests">("overview");

  return (
    <div className="flex-1 flex flex-col pb-24 bg-[#FAF7F5] min-h-screen text-slate-800 antialiased selection:bg-rose-100">
      {/* Top Floating Glass Header */}
      <header className="px-5 py-3.5 flex items-center justify-between border-b border-rose-100/60 bg-white/85 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-400 to-amber-300 text-white flex items-center justify-center font-bold text-base shadow-md shadow-rose-200">
            💍
          </div>
          <div>
            <span className="font-serif font-bold text-slate-900 tracking-tight text-lg block leading-none">
              Meet to Marry
            </span>
            <span className="text-[10px] tracking-wider uppercase text-rose-500 font-semibold">
              Couple Workspace
            </span>
          </div>
        </div>
        <a
          href="/login"
          className="text-xs font-semibold px-4 py-2 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 active:scale-95 transition border border-rose-200/50"
        >
          Masuk
        </a>
      </header>

      {/* Hero Section */}
      <section className="px-5 pt-8 pb-5 text-center relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-44 bg-gradient-to-b from-rose-200/40 via-amber-100/20 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100/70 border border-rose-200/60 text-rose-800 text-xs font-medium mb-3.5 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
          <span>Edisi Spesial Pasangan Indonesia</span>
        </div>

        <h1 className="text-3xl font-serif font-bold text-slate-900 leading-tight mb-3">
          Nikahnya Berdua. <br />
          <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 bg-clip-text text-transparent italic">
            Planning-nya juga.
          </span>
        </h1>

        <p className="text-slate-600 text-sm leading-relaxed max-w-xs mx-auto mb-6">
          Satu dasbor terhubung untuk kamu dan pasangan. Pantau tabungan bersama, alokasi biaya, checklist KUA, hingga buku tamu dengan tautan WhatsApp otomatis.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
          <a
            href="/onboarding"
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white font-medium text-sm shadow-lg shadow-rose-300/60 hover:shadow-rose-400 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <span>Mulai Rencanakan Berdua</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Gratis Tahap 1</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5 text-rose-500" /> PWA Langsung Pasang di HP</span>
          </div>
        </div>
      </section>

      {/* Interactive Mobile App Mockup */}
      <section className="px-4 py-2">
        <div className="bg-white rounded-3xl p-4 border border-rose-100 shadow-xl shadow-slate-200/60">
          
          {/* Header Card Mockup */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-700 text-white shadow-md relative overflow-hidden mb-4">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  <div className="w-7 h-7 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-[10px] font-bold">R</div>
                  <div className="w-7 h-7 rounded-full bg-rose-300 border border-white/40 flex items-center justify-center text-[10px] font-bold text-rose-900">D</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-rose-100/90 font-medium leading-none">Wedding Workspace</div>
                  <div className="font-serif font-bold text-sm tracking-wide">Rian & Dina</div>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-rose-200" />
                <span>128 Hari Lagi</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/15">
              <div>
                <div className="text-[10px] text-rose-100 font-medium">Target Tabungan</div>
                <div className="text-sm font-bold tracking-tight">Rp 45jt <span className="text-[10px] font-normal text-rose-200">/ 60jt</span></div>
              </div>
              <div>
                <div className="text-[10px] text-rose-100 font-medium">Realisasi Budget</div>
                <div className="text-sm font-bold tracking-tight">Rp 38.5jt <span className="text-[10px] font-normal text-rose-200">/ 80jt</span></div>
              </div>
            </div>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="flex bg-slate-100/80 p-1 rounded-2xl mb-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 py-2 rounded-xl transition ${activeTab === "overview" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              Ringkasan
            </button>
            <button
              onClick={() => setActiveTab("budget")}
              className={`flex-1 py-2 rounded-xl transition ${activeTab === "budget" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              Budget
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`flex-1 py-2 rounded-xl transition ${activeTab === "tasks" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              Checklist
            </button>
            <button
              onClick={() => setActiveTab("guests")}
              className={`flex-1 py-2 rounded-xl transition ${activeTab === "guests" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              Tamu
            </button>
          </div>

          {/* Tab Content Display */}
          {activeTab === "overview" && (
            <div className="space-y-3">
              <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Status Sinkronisasi Berdua</div>
                    <div className="text-[10px] text-slate-500">Dina baru saja menandai: <span className="font-semibold text-rose-600">Fitting Gaun Selesai</span></div>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
                  <div className="text-[11px] text-amber-800 font-medium">BCA Bersama</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">Rp 32.500.000</div>
                  <div className="text-[10px] text-amber-600 mt-1">Rekening Khusus Resepsi</div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <div className="text-[11px] text-emerald-800 font-medium">Tamu Terkonfirmasi</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">240 Pax</div>
                  <div className="text-[10px] text-emerald-600 mt-1">82% Kuota Resepsi</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "budget" && (
            <div className="space-y-2.5">
              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Gedung & Katering (500 Pax)</div>
                  <div className="text-[10px] text-slate-400">Plafon: Rp 45.000.000 • Terpakai: Rp 42.000.000</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Lunas DP</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">MUA & Busana Pengantin</div>
                  <div className="text-[10px] text-slate-400">Plafon: Rp 12.000.000 • Terpakai: Rp 10.500.000</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">DP 50%</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Foto & Cinematic Video</div>
                  <div className="text-[10px] text-slate-400">Plafon: Rp 8.000.000 • Terpakai: Rp 7.500.000</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700">Belum Bayar</span>
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="space-y-2">
              <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center gap-2.5">
                <div className="w-4 h-4 rounded bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-800 line-through">Daftar Berkas KUA (N1, N2, N4 Kelurahan)</div>
                  <div className="text-[10px] text-slate-400">PIC: Pria • Selesai 2 hari lalu</div>
                </div>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-rose-100 bg-rose-50/20 flex items-center gap-2.5">
                <div className="w-4 h-4 rounded border border-rose-300 shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-800">Suntik TT & Cek Lab Kesehatan Puskesmas</div>
                  <div className="text-[10px] text-rose-600 font-medium">PIC: Wanita • Tenggat: Sabtu ini</div>
                </div>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center gap-2.5">
                <div className="w-4 h-4 rounded border border-slate-300 shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-800">Finalisasi Desain Undangan Cetak & Souvenir</div>
                  <div className="text-[10px] text-slate-400">PIC: Berdua • Tenggat: H-30 Hari</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "guests" && (
            <div className="space-y-2">
              <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Bpk. Hendro & Keluarga</div>
                  <div className="text-[10px] text-slate-400">Circle: Keluarga Pria • 3 Pax</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Hadir</span>
                  <a
                    href="https://api.whatsapp.com/send?phone=628123456789&text=Halo%20Bpk.%20Hendro"
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Maya & Suami (Teman Kuliah)</div>
                  <div className="text-[10px] text-slate-400">Circle: Sahabat Wanita • 2 Pax</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Terkirim</span>
                  <button className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Nilai Plus: Mengapa Lebih Unggul dari Meet to Marry */}
      <section className="px-5 py-6">
        <div className="text-center mb-5">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-widest">Keunggulan Desain</span>
          <h2 className="text-lg font-serif font-bold text-slate-900 mt-1">
            Dibuat Lebih Romantis & Mudah Digunakan
          </h2>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-white border border-rose-100/70 shadow-xs flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 mb-0.5">Estetika Wedding Elegan</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bukan sekadar form/tabel kaku seperti aplikasi SaaS kantor. Visual didesain hangat dengan palet blush, rose, dan champagne yang nyaman dilihat berbulan-bulan sampai hari H.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-rose-100/70 shadow-xs flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 mb-0.5">Click-to-Chat WhatsApp Instan</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kirim pesan konfirmasi kehadiran tamu langsung dari WhatsApp HP masing-masing pengantin tanpa biaya server atau pulsa API pihak ketiga.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-rose-100/70 shadow-xs flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 mb-0.5">Checklist Berkas Resmi KUA Indonesia</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sudah disesuaikan dengan alur administrasi pernikahan resmi di Indonesia (Surat N1-N4 kelurahan, rekomendasi nikah, cek kesehatan Puskesmas, hingga bimbingan pranikah).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Bottom Navigation Bar (App Experience) */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-3 bg-white/95 backdrop-blur-md border-t border-rose-100 z-50 flex items-center justify-between px-6 shadow-lg">
        <a
          href="/onboarding"
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white font-semibold text-sm shadow-md hover:shadow-rose-300 text-center block transition active:scale-[0.98]"
        >
          Buat Workspace Pasangan Sekarang ✨
        </a>
      </div>
    </div>
  );
}
