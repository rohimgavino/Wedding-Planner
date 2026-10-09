"use client";

import React, { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { 
  Heart, Calendar, Wallet, CheckSquare, Users, Plus, 
  MessageCircle, Share2, Check, Trash2, Edit3, ArrowLeft,
  Sparkles, Download, CheckCircle2, AlertCircle, Copy, ExternalLink,
  Filter, Search, UserCheck, ShieldCheck
} from "lucide-react";
import { formatRupiah, calculateDaysRemaining, formatDateID } from "@/lib/utils";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import { TaskItem, GuestItem, BudgetItem } from "@/types";

export default function DashboardPage() {
  const { 
    workspace, budgets, tasks, guests, inviteToken, isLoaded,
    addBudget, deleteBudget, toggleTask, addTask, deleteTask,
    addGuest, updateGuest, deleteGuest, resetData
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<"overview" | "budget" | "tasks" | "guests" | "pairing">("overview");

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form states
  const [newBudgetCategory, setNewBudgetCategory] = useState("Katering");
  const [newBudgetTitle, setNewBudgetTitle] = useState("");
  const [newBudgetAllocated, setNewBudgetAllocated] = useState(5000000);
  const [newBudgetSpent, setNewBudgetSpent] = useState(0);
  const [newBudgetStatus, setNewBudgetStatus] = useState<BudgetItem["payment_status"]>("unpaid");

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPhase, setNewTaskPhase] = useState<TaskItem["phase"]>("H-3 Bulan");
  const [newTaskPic, setNewTaskPic] = useState<TaskItem["pic"]>("both");

  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestCategory, setNewGuestCategory] = useState<GuestItem["category"]>("teman_kantor");
  const [newGuestPax, setNewGuestPax] = useState(1);
  const [newGuestPhone, setNewGuestPhone] = useState("");

  // Filters
  const [taskPhaseFilter, setTaskPhaseFilter] = useState<string>("all");
  const [guestCategoryFilter, setGuestCategoryFilter] = useState<string>("all");
  const [guestSearch, setGuestSearch] = useState("");

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F5] text-slate-500">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-500 animate-spin" />
          <span className="text-sm font-medium">Memuat Wedding Workspace...</span>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#FAF7F5] px-4 py-12 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-100 shadow-xl shadow-rose-900/10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 via-rose-400 to-amber-300 text-white flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-lg shadow-rose-200">
            💍
          </div>
          <span className="text-xs uppercase tracking-wider font-bold text-rose-500">Ruang Perencanaan Masih Kosong</span>
          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-1 mb-2">
            Mulai Buat Workspace Pernikahanmu
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
            Belum ada data pernikahan yang tersimpan. Masukkan nama calon mempelai dan tanggal acara untuk mulai merencanakan berdua secara rapi.
          </p>
          <a
            href="/onboarding"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold text-sm shadow-md hover:from-rose-600 hover:to-rose-700 transition block text-center"
          >
            Mulai Isi Data Pernikahan ✨
          </a>
        </div>
      </div>
    );
  }

  const daysRemaining = workspace ? calculateDaysRemaining(workspace.wedding_date) : 0;
  
  // Aggregate Metrics
  const totalAllocatedBudget = budgets.reduce((acc, b) => acc + (b.allocated_amount || 0), 0);
  const totalSpentBudget = budgets.reduce((acc, b) => acc + (b.spent_amount || 0), 0);
  const totalCompletedTasks = tasks.filter((t) => t.is_completed).length;
  const totalTasksCount = tasks.length;
  const taskProgressPercent = totalTasksCount > 0 ? Math.round((totalCompletedTasks / totalTasksCount) * 100) : 0;
  
  const totalGuestsCount = guests.length;
  const totalPaxCount = guests.reduce((acc, g) => acc + (g.pax || 1), 0);
  const totalConfirmedPax = guests
    .filter((g) => g.rsvp_status === "attending")
    .reduce((acc, g) => acc + (g.pax || 1), 0);

  const inviteLink = typeof window !== "undefined" 
    ? `${window.location.origin}/invite/${inviteToken}` 
    : `https://mins-permitted-speech-such.trycloudflare.com/invite/${inviteToken}`;

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleExportCSV = () => {
    if (guests.length === 0) {
      alert("Belum ada tamu untuk di-export.");
      return;
    }
    const headers = ["Nama Tamu", "Kategori Circle", "Jumlah Pax", "Nomor WhatsApp", "Status RSVP"];
    const rows = guests.map((g) => [
      `"${g.name}"`,
      `"${g.category}"`,
      g.pax,
      `"${g.phone || '-'}"`,
      `"${g.rsvp_status}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Daftar_Tamu_${workspace?.title.replace(/\s+/g, "_") || "Wedding"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAF7F5] min-h-screen text-slate-800 pb-20 sm:pb-12">
      
      {/* Top Navbar */}
      <header className="border-b border-rose-100 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-300 text-white flex items-center justify-center font-bold text-base shadow-sm">
              💍
            </a>
            <div>
              <h1 className="font-serif font-bold text-slate-900 text-base sm:text-lg leading-tight">
                {workspace?.title || "Wedding Workspace"}
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Tersinkron Berdua
                </span>
                <span>•</span>
                <span>{workspace ? formatDateID(workspace.wedding_date) : "-"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="text-xs font-semibold px-3 sm:px-4 py-2 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60 transition flex items-center gap-1.5 shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Undang Pasangan</span>
              <span className="sm:hidden">Invite</span>
            </button>
            <a
              href="/"
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-2"
              title="Kembali ke Beranda"
            >
              Beranda
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 w-full flex-1 flex flex-col">
        
        {/* Workspace Hero Highlight Card */}
        <div className="mb-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-700 text-white shadow-xl shadow-rose-900/10 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-rose-100 font-semibold">Ruang Perencanaan Bersama</span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold">{workspace?.title}</h2>
              <p className="text-xs text-rose-100/90 mt-0.5">Hari Bahagia: {workspace ? formatDateID(workspace.wedding_date) : "-"}</p>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-md text-white font-semibold text-sm border border-white/20 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-200" />
              <span>{daysRemaining} Hari Lagi</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/15 text-left">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
              <div className="text-[10px] text-rose-100">Target Budget</div>
              <div className="text-sm sm:text-base font-bold">{formatRupiah(workspace?.target_budget || 0)}</div>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
              <div className="text-[10px] text-rose-100">Realisasi Biaya</div>
              <div className="text-sm sm:text-base font-bold">{formatRupiah(totalSpentBudget)}</div>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
              <div className="text-[10px] text-rose-100">Checklist Selesai</div>
              <div className="text-sm sm:text-base font-bold">{totalCompletedTasks} / {totalTasksCount} ({taskProgressPercent}%)</div>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
              <div className="text-[10px] text-rose-100">Tamu Konfirmasi</div>
              <div className="text-sm sm:text-base font-bold">{totalConfirmedPax} Pax ({totalPaxCount} Total)</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-rose-100 shadow-sm mb-6 overflow-x-auto text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "overview" ? "bg-rose-50 text-rose-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Ringkasan</span>
          </button>
          <button
            onClick={() => setActiveTab("budget")}
            className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "budget" ? "bg-rose-50 text-rose-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Budget & Biaya</span>
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "tasks" ? "bg-rose-50 text-rose-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Checklist & KUA</span>
          </button>
          <button
            onClick={() => setActiveTab("guests")}
            className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "guests" ? "bg-rose-50 text-rose-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Buku Tamu</span>
          </button>
          <button
            onClick={() => setActiveTab("pairing")}
            className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "pairing" ? "bg-rose-50 text-rose-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Pasangan</span>
          </button>
        </div>

        {/* Tab 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Financial Progress Card */}
              <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-rose-500" />
                    Status Anggaran (Budget)
                  </h3>
                  <button 
                    onClick={() => setActiveTab("budget")}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Kelola
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-slate-500">Terpakai: {formatRupiah(totalSpentBudget)}</span>
                      <span className="text-slate-800 font-bold">{Math.round((totalSpentBudget / (workspace?.target_budget || 1)) * 100)}% dari Plafon</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${totalSpentBudget > (workspace?.target_budget || 0) ? 'bg-rose-600' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(100, Math.round((totalSpentBudget / (workspace?.target_budget || 1)) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-400 block text-[10px]">Sisa Plafon Anggaran</span>
                      <span className="font-bold text-slate-800">{formatRupiah((workspace?.target_budget || 0) - totalSpentBudget)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-400 block text-[10px]">Total Pos Dialokasikan</span>
                      <span className="font-bold text-slate-800">{formatRupiah(totalAllocatedBudget)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist Progress Card */}
              <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    Tugas & Dokumen Terdekat
                  </h3>
                  <button 
                    onClick={() => setActiveTab("tasks")}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Lihat Semua
                  </button>
                </div>

                <div className="space-y-2">
                  {tasks.filter((t) => !t.is_completed).slice(0, 4).map((task) => (
                    <div key={task.id} className="p-2.5 rounded-xl bg-slate-50 flex items-center gap-2.5 text-xs">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="w-4 h-4 rounded border border-slate-300 hover:border-emerald-500 shrink-0"
                      />
                      <span className="flex-1 font-medium text-slate-700">{task.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        task.pic === 'groom' ? 'bg-amber-100 text-amber-800' :
                        task.pic === 'bride' ? 'bg-pink-100 text-pink-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {task.pic === 'groom' ? 'Pria' : task.pic === 'bride' ? 'Wanita' : 'Bersama'}
                      </span>
                    </div>
                  ))}
                  {tasks.filter((t) => !t.is_completed).length === 0 && (
                    <div className="p-4 text-center text-xs text-emerald-600 font-medium">
                      🎉 Luar biasa! Semua tugas dan berkas telah selesai.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Quick Guest Confirmation Bar */}
            <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Konfirmasi Tamu via WhatsApp</h4>
                  <p className="text-xs text-slate-500">Kirim pesan undangan personal langsung dari HP masing-masing pengantin.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("guests")}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-md hover:bg-emerald-700 transition"
              >
                Buka Buku Tamu ({totalGuestsCount} Tamu)
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: BUDGET & EXPENSES */}
        {activeTab === "budget" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Alokasi Anggaran & Pengeluaran</h3>
                <p className="text-xs text-slate-500">Pantau plafon anggaran per pos dan status pelunasan vendor.</p>
              </div>
              <button
                onClick={() => setShowAddBudgetModal(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-md hover:bg-rose-600 transition flex items-center justify-center gap-1.5 self-start"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pos Anggaran</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {budgets.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{item.title}</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        item.payment_status === 'dp' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.payment_status === 'paid' ? 'Lunas' : item.payment_status === 'dp' ? 'Sudah DP' : 'Belum DP'}
                      </span>
                      <button
                        onClick={() => deleteBudget(item.id)}
                        className="text-slate-300 hover:text-rose-500 p-1"
                        title="Hapus pos"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Plafon: {formatRupiah(item.allocated_amount)}</span>
                      <span className="font-bold text-slate-800">Riil: {formatRupiah(item.spent_amount)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${item.spent_amount > item.allocated_amount ? 'bg-rose-600' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(100, item.allocated_amount > 0 ? (item.spent_amount / item.allocated_amount) * 100 : 0)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {budgets.length === 0 && (
                <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-dashed border-rose-200">
                  <Wallet className="w-8 h-8 text-rose-300 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 text-sm mb-1">Pos Anggaran Masih Kosong</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                    Belum ada pos alokasi biaya yang dicatat. Klik tombol di bawah untuk menambahkan pos anggaran pertama Anda.
                  </p>
                  <button
                    onClick={() => setShowAddBudgetModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-xs hover:bg-rose-600 transition inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Pos Anggaran Pertama</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: TASKS & KUA */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Checklist Persiapan & Berkas KUA</h3>
                <p className="text-xs text-slate-500">Daftar berkas resmi KUA dan timeline mundur pernikahan.</p>
              </div>
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-md hover:bg-rose-600 transition flex items-center justify-center gap-1.5 self-start"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Tugas Custom</span>
              </button>
            </div>

            {/* Filter Phase Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 text-xs font-semibold">
              {["all", "Dokumen KUA", "H-6 Bulan", "H-3 Bulan", "H-1 Bulan", "H-1 Minggu", "Hari H"].map((phase) => (
                <button
                  key={phase}
                  onClick={() => setTaskPhaseFilter(phase)}
                  className={`px-3 py-1.5 rounded-full transition whitespace-nowrap ${
                    taskPhaseFilter === phase ? "bg-rose-600 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {phase === "all" ? "Semua Fase" : phase}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {tasks
                .filter((t) => taskPhaseFilter === "all" || t.phase === taskPhaseFilter)
                .map((task) => (
                  <div 
                    key={task.id} 
                    className={`p-3 rounded-2xl bg-white border transition flex items-center gap-3 ${
                      task.is_completed ? "border-slate-100 bg-slate-50/70 opacity-75" : "border-rose-100 shadow-xs"
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition shrink-0 ${
                        task.is_completed ? "bg-emerald-500 text-white" : "border-2 border-slate-300 hover:border-emerald-500"
                      }`}
                    >
                      {task.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex-1">
                      <div className={`text-xs sm:text-sm font-medium ${task.is_completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-semibold text-rose-600">{task.phase}</span>
                        <span>•</span>
                        <span className="capitalize">
                          PIC: {task.pic === 'groom' ? 'Calon Pengantin Pria' : task.pic === 'bride' ? 'Calon Pengantin Wanita' : 'Berdua'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-slate-300 hover:text-rose-500 p-1"
                      title="Hapus tugas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

              {tasks.length === 0 && (
                <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-rose-200">
                  <CheckSquare className="w-8 h-8 text-rose-300 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 text-sm mb-1">Daftar Tugas Masih Kosong</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                    Belum ada tugas atau dokumen yang dicatat. Klik tombol di bawah untuk menambahkan to-do list pertama.
                  </p>
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-xs hover:bg-rose-600 transition inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Tugas Pertama</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: GUEST LIST & WHATSAPP */}
        {activeTab === "guests" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Manajemen Buku Tamu & WhatsApp RSVP</h3>
                <p className="text-xs text-slate-500">Total Tamu: {totalGuestsCount} Undangan ({totalPaxCount} Pax) • {totalConfirmedPax} Pax Terkonfirmasi</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setShowAddGuestModal(true)}
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-md hover:bg-rose-600 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Tamu</span>
                </button>
              </div>
            </div>

            {/* Filter Category & Search */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama tamu..."
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex gap-1 overflow-x-auto text-xs font-semibold">
                {["all", "keluarga_pria", "keluarga_wanita", "teman_kantor", "sahabat", "vip"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setGuestCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                      guestCategoryFilter === cat ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    {cat === "all" ? "Semua Circle" : cat.replace("_", " ").toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {guests
                .filter((g) => guestCategoryFilter === "all" || g.category === guestCategoryFilter)
                .filter((g) => !guestSearch || g.name.toLowerCase().includes(guestSearch.toLowerCase()))
                .map((guest) => {
                  const waLink = generateWhatsAppLink({
                    phone: guest.phone || "",
                    guestName: guest.name,
                    coupleName: workspace?.title || "Mempelai",
                    weddingDate: workspace ? formatDateID(workspace.wedding_date) : "-",
                  });

                  return (
                    <div key={guest.id} className="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-xs flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{guest.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                            {guest.pax} Pax
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span className="uppercase text-rose-600 font-semibold">{guest.category.replace("_", " ")}</span>
                          <span>•</span>
                          <span>{guest.phone || "Belum ada no. HP"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Select */}
                        <select
                          value={guest.rsvp_status}
                          onChange={(e) => updateGuest(guest.id, { rsvp_status: e.target.value as any })}
                          className={`text-[11px] font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer ${
                            guest.rsvp_status === 'attending' ? 'bg-emerald-100 text-emerald-800' :
                            guest.rsvp_status === 'declined' ? 'bg-rose-100 text-rose-800' :
                            guest.rsvp_status === 'sent' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <option value="uncontacted">Belum Dikontak</option>
                          <option value="sent">Undangan Terkirim</option>
                          <option value="attending">Hadir</option>
                          <option value="declined">Berhalangan</option>
                        </select>

                        {/* WhatsApp Direct Action Button */}
                        {guest.phone ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition shadow-xs flex items-center gap-1"
                            title="Kirim pesan WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        ) : (
                          <button
                            disabled
                            className="p-2 rounded-xl bg-slate-100 text-slate-300 cursor-not-allowed"
                            title="No. HP belum diisi"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => deleteGuest(guest.id)}
                          className="text-slate-300 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

              {guests.length === 0 && (
                <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-rose-200">
                  <Users className="w-8 h-8 text-rose-300 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 text-sm mb-1">Daftar Tamu Masih Kosong</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                    Belum ada tamu undangan yang dicatat. Klik tombol di bawah untuk mulai menyusun daftar tamu dan circle keluarga.
                  </p>
                  <button
                    onClick={() => setShowAddGuestModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-xs hover:bg-rose-600 transition inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Tamu Pertama</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: PAIRING PASANGAN */}
        {activeTab === "pairing" && (
          <div className="max-w-xl mx-auto w-full bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm text-center">
            <div className="w-14 h-14 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 fill-rose-500" />
            </div>
            <h3 className="font-serif font-bold text-slate-900 text-xl">Koneksi Pasangan</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 mb-6">
              Undang pasangan agar dapat mengakses dan memperbarui to-do list serta pos keuangan yang sama secara real-time.
            </p>

            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-100 text-left mb-6">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Tautan Pairing Unik:</span>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 bg-white px-3 py-2 rounded-xl text-xs border border-rose-200 text-slate-600 font-mono select-all"
                />
                <button
                  onClick={handleCopyInviteLink}
                  className="px-3.5 py-2 rounded-xl bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition flex items-center gap-1 shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Tersalin!" : "Salin"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Halo sayang! Yuk kita rencanakan pernikahan kita bareng di Wedding Planner: ${inviteLink}`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 text-white font-semibold text-xs shadow-md hover:bg-emerald-600 transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim Tautan ke WhatsApp Pasangan</span>
              </a>

              <button
                onClick={resetData}
                className="text-xs text-rose-500 hover:underline pt-4 block mx-auto"
              >
                Reset Data Workspace ke Format Default
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Modal: Invite Partner */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-100">
            <h3 className="font-serif font-bold text-slate-900 text-lg mb-2 text-center">Undang Pasangan</h3>
            <p className="text-xs text-slate-600 text-center mb-4 leading-relaxed">
              Kirim tautan ini ke WhatsApp pasanganmu agar bisa langsung membuka dan merencanakan berdua:
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono break-all text-slate-700 mb-4 select-all">
              {inviteLink}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleCopyInviteLink}
                className="w-full py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs hover:bg-rose-600 transition flex items-center justify-center gap-1.5"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? "Tautan Berhasil Disalin!" : "Salin Tautan"}</span>
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Budget */}
      {showAddBudgetModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100">
            <h3 className="font-serif font-bold text-slate-900 text-lg mb-4">Tambah Pos Anggaran</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              addBudget({
                category: newBudgetCategory,
                title: newBudgetTitle || newBudgetCategory,
                allocated_amount: Number(newBudgetAllocated) || 0,
                spent_amount: Number(newBudgetSpent) || 0,
                payment_status: newBudgetStatus,
              });
              setShowAddBudgetModal(false);
              setNewBudgetTitle("");
            }}>
              <div className="space-y-3 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block mb-1">Kategori Pos</label>
                  <select 
                    value={newBudgetCategory}
                    onChange={(e) => setNewBudgetCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="Venue & Gedung">Venue & Gedung</option>
                    <option value="Katering">Katering</option>
                    <option value="Rias & Busana">Rias & Busana</option>
                    <option value="Dekorasi">Dekorasi</option>
                    <option value="Dokumentasi">Dokumentasi</option>
                    <option value="Undangan & Souvenir">Undangan & Souvenir</option>
                    <option value="Mahar & Seserahan">Mahar & Seserahan</option>
                    <option value="Hiburan / MC">Hiburan / MC</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Nama / Keterangan Pos</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Katering Akad 200 Pax"
                    value={newBudgetTitle}
                    onChange={(e) => setNewBudgetTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-1">Plafon Alokasi (Rp)</label>
                    <input
                      type="number"
                      step="500000"
                      value={newBudgetAllocated}
                      onChange={(e) => setNewBudgetAllocated(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Pengeluaran Riil (Rp)</label>
                    <input
                      type="number"
                      step="500000"
                      value={newBudgetSpent}
                      onChange={(e) => setNewBudgetSpent(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1">Status Pembayaran</label>
                  <select
                    value={newBudgetStatus}
                    onChange={(e) => setNewBudgetStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="unpaid">Belum DP</option>
                    <option value="dp">Sudah Bayar DP</option>
                    <option value="paid">Lunas</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddBudgetModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs hover:bg-rose-600 transition"
                >
                  Simpan Pos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Task */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100">
            <h3 className="font-serif font-bold text-slate-900 text-lg mb-4">Tambah Tugas / Checklist</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              addTask({
                title: newTaskTitle,
                phase: newTaskPhase,
                pic: newTaskPic,
              });
              setShowAddTaskModal(false);
              setNewTaskTitle("");
            }}>
              <div className="space-y-3 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block mb-1">Nama Tugas</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Booking MUA Akad"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-1">Fase Waktu</label>
                    <select
                      value={newTaskPhase}
                      onChange={(e) => setNewTaskPhase(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    >
                      <option value="Dokumen KUA">Dokumen KUA</option>
                      <option value="H-6 Bulan">H-6 Bulan</option>
                      <option value="H-3 Bulan">H-3 Bulan</option>
                      <option value="H-1 Bulan">H-1 Bulan</option>
                      <option value="H-1 Minggu">H-1 Minggu</option>
                      <option value="Hari H">Hari H</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">PIC Penanggung Jawab</label>
                    <select
                      value={newTaskPic}
                      onChange={(e) => setNewTaskPic(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    >
                      <option value="both">Berdua Bersama</option>
                      <option value="groom">Calon Pengantin Pria</option>
                      <option value="bride">Calon Pengantin Wanita</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs hover:bg-rose-600 transition"
                >
                  Simpan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Guest */}
      {showAddGuestModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100">
            <h3 className="font-serif font-bold text-slate-900 text-lg mb-4">Tambah Tamu Undangan</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              addGuest({
                name: newGuestName,
                category: newGuestCategory,
                pax: Number(newGuestPax) || 1,
                phone: newGuestPhone.trim(),
                rsvp_status: "uncontacted",
              });
              setShowAddGuestModal(false);
              setNewGuestName("");
              setNewGuestPhone("");
              setNewGuestPax(1);
            }}>
              <div className="space-y-3 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block mb-1">Nama Tamu / Keluarga</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bpk. Joko & Istri"
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-1">Circle / Kelompok</label>
                    <select
                      value={newGuestCategory}
                      onChange={(e) => setNewGuestCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    >
                      <option value="keluarga_pria">Keluarga Pria</option>
                      <option value="keluarga_wanita">Keluarga Wanita</option>
                      <option value="teman_kantor">Teman Kantor</option>
                      <option value="sahabat">Sahabat</option>
                      <option value="vip">VIP</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Jumlah Pax</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newGuestPax}
                      onChange={(e) => setNewGuestPax(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1">No. WhatsApp (Awalan 08xxx atau 628xxx)</label>
                  <input
                    type="tel"
                    placeholder="081234567890"
                    value={newGuestPhone}
                    onChange={(e) => setNewGuestPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddGuestModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs hover:bg-rose-600 transition"
                >
                  Simpan Tamu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
