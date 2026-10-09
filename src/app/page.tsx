"use client";

import React, { useState } from "react";
import { 
  Heart, Calendar, Users, Wallet, CheckSquare, MessageCircle, 
  ArrowRight, Sparkles, ChevronRight, Share2, Check, Clock, 
  ShieldCheck, Smartphone, Zap, Gift, FileText, ExternalLink,
  Laptop, CheckCircle2
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"overview" | "budget" | "tasks" | "guests">("overview");

  return (
    <div className="flex-1 flex flex-col bg-[#FAF7F5] min-h-screen text-slate-800 antialiased selection:bg-rose-100">
      
      {/* Top Responsive Glass Header */}
      <header className="border-b border-rose-100/70 bg-white/90 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-400 to-amber-300 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-rose-200">
              💍
            </div>
            <div>
              <span className="font-serif font-bold text-slate-900 tracking-tight text-xl block leading-none">
                Meet to Marry
              </span>
              <span className="text-[10px] tracking-wider uppercase text-rose-500 font-semibold">
                Collaborative Couple Workspace
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#fitur" className="hover:text-rose-600 transition">Fitur Utama</a>
            <a href="#cara-kerja" className="hover:text-rose-600 transition">Cara Kerja</a>
            <a href="#kua-checklist" className="hover:text-rose-600 transition">Panduan KUA</a>
            <a href="#keunggulan" className="hover:text-rose-600 transition">Keunggulan</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-full text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              Masuk
            </a>
            <a
              href="/onboarding"
              className="text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-200 hover:shadow-rose-300 hover:from-rose-600 hover:to-rose-700 active:scale-95 transition"
            >
              Mulai Gratis
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section (Responsive 2 Columns on Desktop) */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 sm:pb-20 border-b border-rose-100/50">
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-rose-200/40 via-amber-100/25 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Value Proposition & Copywriting */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100/80 border border-rose-200/60 text-rose-800 text-xs font-semibold mb-5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span>Wedding Planner Khusus Pasangan Indonesia</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 leading-[1.15] mb-4">
                Nikahnya Berdua. <br />
                <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 bg-clip-text text-transparent italic">
                  Planning-nya juga.
                </span>
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 mb-7">
                Semua persiapan di satu tempat: kendalikan tabungan bersama, alokasi budget vendor, checklist berkas resmi KUA, hingga manajemen tamu & WhatsApp RSVP instan. Sinkron real-time antar HP berdua.
              </p>

              {/* Bullet Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0 mb-8 text-left">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Shared Workspace real-time</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Plafon budget & kontrol overbudget</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Daftar berkas resmi KUA & N1-N4</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Kirim WhatsApp RSVP tanpa biaya API</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 max-w-md mx-auto lg:mx-0">
                <a
                  href="/onboarding"
                  className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white font-semibold text-sm shadow-lg shadow-rose-300/60 hover:shadow-rose-400 hover:from-rose-600 hover:to-rose-700 active:scale-98 transition flex items-center justify-center gap-2"
                >
                  <span>Mulai Rencanakan Berdua</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Smartphone className="w-4 h-4 text-rose-500" />
                  <span>Bisa dibuka di Laptop & HP (PWA)</span>
                </div>
              </div>
            </div>

            {/* Right Column: Device Frame / Interactive Live App Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm">
                
                {/* Phone Shell for Desktop Viewing */}
                <div className="relative rounded-[2.5rem] p-3 bg-slate-900 shadow-2xl shadow-rose-900/20 border-4 border-slate-800">
                  {/* Dynamic Island / Notch */}
                  <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-800" />
                  </div>

                  {/* Inner Screen */}
                  <div className="bg-[#FAF7F5] rounded-[2rem] p-3 sm:p-4 overflow-hidden border border-slate-800/40">
                    
                    {/* Header Card Inside App */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-700 text-white shadow-md relative overflow-hidden mb-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1.5">
                            <div className="w-7 h-7 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-[10px] font-bold">R</div>
                            <div className="w-7 h-7 rounded-full bg-rose-300 border border-white/40 flex items-center justify-center text-[10px] font-bold text-rose-900">D</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-rose-100 font-medium leading-none">Wedding Workspace</div>
                            <div className="font-serif font-bold text-sm tracking-wide">Rian & Dina</div>
                          </div>
                        </div>
                        <div className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-rose-200" />
                          <span>128 Hari</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/15">
                        <div>
                          <div className="text-[10px] text-rose-100">Tabungan</div>
                          <div className="text-xs sm:text-sm font-bold">Rp 45jt <span className="text-[9px] font-normal text-rose-200">/ 60jt</span></div>
                        </div>
                        <div>
                          <div className="text-[10px] text-rose-100">Realisasi</div>
                          <div className="text-xs sm:text-sm font-bold">Rp 38.5jt <span className="text-[9px] font-normal text-rose-200">/ 80jt</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Tab Selector */}
                    <div className="flex bg-slate-200/70 p-1 rounded-xl mb-3 text-[11px] font-semibold">
                      <button
                        onClick={() => setActiveTab("overview")}
                        className={`flex-1 py-1.5 rounded-lg transition ${activeTab === "overview" ? "bg-white text-rose-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                      >
                        Ringkasan
                      </button>
                      <button
                        onClick={() => setActiveTab("budget")}
                        className={`flex-1 py-1.5 rounded-lg transition ${activeTab === "budget" ? "bg-white text-rose-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                      >
                        Budget
                      </button>
                      <button
                        onClick={() => setActiveTab("tasks")}
                        className={`flex-1 py-1.5 rounded-lg transition ${activeTab === "tasks" ? "bg-white text-rose-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                      >
                        Checklist
                      </button>
                      <button
                        onClick={() => setActiveTab("guests")}
                        className={`flex-1 py-1.5 rounded-lg transition ${activeTab === "guests" ? "bg-white text-rose-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                      >
                        Tamu
                      </button>
                    </div>

                    {/* Tab Panes */}
                    {activeTab === "overview" && (
                      <div className="space-y-2.5">
                        <div className="p-2.5 bg-rose-50/80 rounded-xl border border-rose-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
                            <div className="text-[11px] text-slate-700">
                              Dina menandai: <span className="font-semibold text-rose-700">Fitting Selesai</span>
                            </div>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-left">
                          <div className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-xs">
                            <div className="text-[10px] text-slate-400">BCA Bersama</div>
                            <div className="text-xs font-bold text-slate-800">Rp 32.500.000</div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-xs">
                            <div className="text-[10px] text-slate-400">RSVP Hadir</div>
                            <div className="text-xs font-bold text-emerald-600">240 Tamu</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "budget" && (
                      <div className="space-y-2 text-left">
                        <div className="p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-800">Gedung & Katering</div>
                            <div className="text-[10px] text-slate-400">Plafon: 45jt • Real: 42jt</div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-700">Lunas DP</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-800">MUA & Busana</div>
                            <div className="text-[10px] text-slate-400">Plafon: 12jt • Real: 10.5jt</div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-700">DP 50%</span>
                        </div>
                      </div>
                    )}

                    {activeTab === "tasks" && (
                      <div className="space-y-1.5 text-left">
                        <div className="p-2 bg-white rounded-lg border border-slate-100 flex items-center gap-2 text-xs">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="line-through text-slate-400 text-[11px] flex-1">Urus Berkas N1-N4 KUA</span>
                          <span className="text-[9px] bg-rose-100 text-rose-700 px-1 rounded">Pria</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-rose-200 bg-rose-50/20 flex items-center gap-2 text-xs">
                          <div className="w-3.5 h-3.5 rounded border border-rose-400 shrink-0" />
                          <span className="text-slate-700 text-[11px] font-medium flex-1">Suntik TT Puskesmas</span>
                          <span className="text-[9px] bg-pink-100 text-pink-700 px-1 rounded">Wanita</span>
                        </div>
                      </div>
                    )}

                    {activeTab === "guests" && (
                      <div className="space-y-1.5 text-left">
                        <div className="p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-slate-800 text-[11px]">Bpk. Hendro & Kel.</div>
                            <div className="text-[9px] text-slate-400">3 Pax • Keluarga Pria</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Hadir</span>
                            <a
                              href="https://api.whatsapp.com/send?phone=628123456789&text=Halo"
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-emerald-500 text-white"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Fitur Utama Grid Section (Responsive on Desktop & Mobile) */}
      <section id="fitur" className="py-12 sm:py-16 max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Semua Kebutuhan Inti</span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
            Fitur Lengkap Tanpa Bikin Pusing
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Didesain khusus untuk budaya dan alur pernikahan di Indonesia, dari administrasi KUA hingga pembagian keluarga.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 fill-rose-500" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1.5">Pairing Pasangan</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Undang pasangan via tautan khusus. Dua akun HP terhubung ke workspace pernikahan yang sama dengan sinkronisasi instan.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1.5">Tabungan & Budget</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pos rekening bersama, target tabungan, plafon biaya per kategori, dan peringatan dini jika pos pengeluaran melampaui batas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1.5">Syarat Berkas KUA</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Checklist otomatis berkas nikah KUA (Surat N1-N4 kelurahan, tes lab puskesmas, foto latar biru, dispensasi, & kursus calon pengantin).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1.5">Buku Tamu & WhatsApp</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Kelola circle tamu keluarga & teman kantor, rekap jumlah pax, dan kirim pesan konfirmasi WhatsApp langsung tanpa biaya API.
            </p>
          </div>
        </div>
      </section>

      {/* Cara Kerja (How it Works) */}
      <section id="cara-kerja" className="py-12 sm:py-16 bg-white border-y border-rose-100/60">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Alur Sederhana</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              Mulai Dalam 3 Langkah Praktis
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 shadow-md shadow-rose-200">
                1
              </div>
              <h4 className="font-bold text-base text-slate-900 mb-1">Buat Workspace</h4>
              <p className="text-xs sm:text-sm text-slate-600">
                Tentukan nama kamu & pasangan, tanggal hari H, serta target budget awal.
              </p>
            </div>

            <div className="text-center p-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 shadow-md shadow-amber-200">
                2
              </div>
              <h4 className="font-bold text-base text-slate-900 mb-1">Invite Pasangan</h4>
              <p className="text-xs sm:text-sm text-slate-600">
                Kirim link pairing via WhatsApp. Pasangan login dan langsung terhubung berdua.
              </p>
            </div>

            <div className="text-center p-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-200">
                3
              </div>
              <h4 className="font-bold text-base text-slate-900 mb-1">Rencanakan Bersama</h4>
              <p className="text-xs sm:text-sm text-slate-600">
                Bagi tugas PIC, pantau tabungan, dan kelola tamu dengan tenang sampai hari H.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Responsive */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-sm">
              💍
            </div>
            <div>
              <span className="font-serif font-bold text-white text-base">Meet to Marry</span>
              <p className="text-xs text-slate-500">Plan Together. Marry Happier.</p>
            </div>
          </div>

          <div className="text-xs text-slate-500 text-center sm:text-right">
            © 2026 Meet to Marry. Desain adaptif untuk Desktop, Tablet & Mobile (PWA).
          </div>
        </div>
      </footer>

      {/* Mobile-Only Sticky Floating Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-rose-100 z-50 flex items-center justify-between px-5 shadow-lg">
        <a
          href="/onboarding"
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold text-sm shadow-md text-center block transition active:scale-98"
        >
          Mulai Rencanakan Berdua ✨
        </a>
      </div>

    </div>
  );
}
