import React from "react";
import { Heart, Calendar, Users, Wallet, CheckSquare, MessageCircle, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col pb-16">
      {/* Top Banner / Navbar */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-wedding-100 bg-white sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-wedding-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            💍
          </div>
          <span className="font-semibold text-gray-900 tracking-tight text-lg">
            Meet to Marry
          </span>
        </div>
        <a
          href="/login"
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-wedding-100 text-wedding-700 hover:bg-wedding-200 transition"
        >
          Masuk
        </a>
      </header>

      {/* Hero Section */}
      <section className="px-5 pt-8 pb-6 text-center bg-gradient-to-b from-wedding-50 via-white to-white">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-wedding-100 text-wedding-800 text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5 text-wedding-600" />
          <span>Wedding Planner Pasangan Indonesia</span>
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight mb-2">
          Nikahnya Berdua. <br />
          <span className="text-wedding-600">Planning-nya Juga.</span>
        </h1>

        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Atur tabungan, plafon budget, daftar tamu, checklist KUA, dan rundown hari H berdua — real-time dari HP masing-masing.
        </p>

        <div className="flex flex-col gap-2.5">
          <a
            href="/onboarding"
            className="w-full py-3 px-4 rounded-xl bg-wedding-500 text-white font-medium text-sm shadow-md hover:bg-wedding-600 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <span>Mulai Rencanakan Gratis</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <span className="text-xs text-gray-400">PWA Ready · Tanpa Download Play Store · 100% Gratis Tahap 1</span>
        </div>
      </section>

      {/* Mockup Dashboard Preview */}
      <section className="px-5 py-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-wedding-50 to-champagne-50 border border-wedding-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-wedding-200/60 mb-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-wedding-700 font-semibold">Workspace Bersama</span>
              <h3 className="font-bold text-gray-900 text-sm">Rian & Dina</h3>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-white text-wedding-600 font-semibold text-xs border border-wedding-200 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>128 Hari Lagi</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div className="bg-white p-3 rounded-xl border border-wedding-100">
              <div className="text-[11px] text-gray-500 font-medium mb-1">Total Tabungan</div>
              <div className="text-sm font-bold text-gray-900">Rp 45.000.000</div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "75%" }}></div>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">75% dari Rp 60jt</div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-wedding-100">
              <div className="text-[11px] text-gray-500 font-medium mb-1">Anggaran Terpakai</div>
              <div className="text-sm font-bold text-gray-900">Rp 38.500.000</div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-wedding-500 h-full rounded-full" style={{ width: "48%" }}></div>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">48% dari Rp 80jt</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-wedding-100">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-800 mb-2">
              <span className="flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-wedding-500" />
                Tugas Terdekat
              </span>
              <span className="text-[11px] text-wedding-600">24/36 Selesai</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-wedding-500"></span>
                <span className="flex-1 font-medium">Urus Surat N1-N4 Kelurahan (KUA)</span>
                <span className="text-[10px] bg-wedding-100 text-wedding-700 px-1.5 py-0.5 rounded font-medium">Pria</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="flex-1 font-medium">Fitting Busana Akad & Resepsi</span>
                <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded font-medium">Wanita</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur Utama Tahap 1 */}
      <section className="px-5 py-6">
        <h2 className="text-base font-bold text-gray-900 mb-4 text-center">
          Semua Kebutuhan Inti Perencanaan
        </h2>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 flex gap-3.5 items-start">
            <div className="p-2 rounded-lg bg-pink-100 text-pink-600 shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-0.5">Shared Workspace Berdua</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Invite pasangan via tautan token. Keduanya dapat melihat dan mengedit data tanpa risiko hilang atau tumpang tindih.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 flex gap-3.5 items-start">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-0.5">Manajemen Tabungan & Budget</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Kendalikan pos rekening bersama dan pantau alokasi budget vs pengeluaran riil per kategori (Venue, Katering, MUA).
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 flex gap-3.5 items-start">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-0.5">Timeline & Syarat Berkas KUA</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Checklist otomatis berbasis timeline (H-6 bulan s/d Hari H) dan daftar berkas resmi KUA dengan pembagian PIC.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 flex gap-3.5 items-start">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-0.5">Daftar Tamu & WhatsApp RSVP</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Kelola tamu undangan, circle keluarga/kantor, dan kirim pesan undangan konfirmasi via WhatsApp langsung dari HP tanpa biaya API.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-3.5 bg-white/95 backdrop-blur border-t border-gray-200 z-40">
        <a
          href="/onboarding"
          className="w-full py-3 rounded-xl bg-wedding-500 text-white font-semibold text-sm shadow-md hover:bg-wedding-600 text-center block transition"
        >
          Buat Workspace Pernikahan
        </a>
      </div>
    </div>
  );
}
