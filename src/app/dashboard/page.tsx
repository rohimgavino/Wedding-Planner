"use client";

import React, { useState } from "react";
import "./dashboard.css";
import { PlannerDialog } from "@/components/everrae/planner-dialog";
import { GuestCSVImport } from "@/components/everrae/guest-csv-import";
import { serializeGuestCSV } from "@/lib/guest-csv";
import { useWorkspace } from "@/context/WorkspaceContext";
import { 
  Heart, Calendar, Wallet, CheckSquare, Users, Plus, 
  MessageCircle, Share2, Check, Trash2,
  Sparkles, Download, CheckCircle2, Copy,
  Search, ShieldCheck
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
      <div className="min-h-screen flex items-center justify-center planner-empty bg-[#FAF7F5] text-slate-500">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-500 animate-spin" />
          <span className="text-sm font-medium">Memuat Wedding Workspace...</span>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center planner-empty bg-[#FAF7F5] px-4 py-12 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-100 shadow-xl shadow-rose-900/10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 via-rose-400 to-amber-300 text-white flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-lg shadow-rose-200">
            EverRae
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
            Mulai Isi Data Pernikahan
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
    ? `${window.location.origin}/invite?token=${inviteToken}` 
    : `https://mins-permitted-speech-such.trycloudflare.com/invite?token=${inviteToken}`;

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
    const encodedUri = URL.createObjectURL(new Blob([serializeGuestCSV(guests)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Daftar_Tamu_${workspace?.title.replace(/\s+/g, "_") || "Wedding"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="planner-shell">
      <aside className="planner-sidebar">
        <a className="planner-brand" href="/">EverRae<span>WEDDING PLANNER</span></a>
        <p className="planner-nav-caption">RUANG PERENCANAAN</p>
        <nav aria-label="Navigasi workspace">{([['overview','Dashboard',Sparkles],['tasks','Timeline & Checklist',CheckSquare],['budget','Budget & Biaya',Wallet],['guests','Buku Tamu',Users],['pairing','Pengaturan & Pasangan',Heart]] as const).map(([tab,label,Icon]) => <button key={tab} aria-current={activeTab === tab ? 'page' : undefined} onClick={() => setActiveTab(tab)}><Icon size={18}/>{label}</button>)}</nav>
        <div className="planner-sidebar-note"><ShieldCheck size={22}/><strong>Rencana milikmu.</strong><p>Data tersimpan di browser ini. Belum ada sinkronisasi cloud.</p><a href="/">Kembali ke beranda →</a></div>
      </aside>
      <div className="planner-body">
        <header className="planner-topbar"><span className="planner-topbar-brand">EverRae</span><span className="planner-breadcrumb">Workspace / {activeTab === 'overview' ? 'Dashboard' : activeTab === 'pairing' ? 'Pengaturan' : activeTab === 'tasks' ? 'Timeline' : activeTab === 'guests' ? 'Buku Tamu' : 'Budget'}</span><button onClick={() => setShowInviteModal(true)}><Share2 size={16}/><span>Tautan pasangan</span></button></header>
        <main className="planner-main">
          <section className="planner-heading"><div><span className="planner-eyebrow">RENCANA PERNIKAHANMU</span><h1>Halo, {workspace.title.replace(/^Pernikahan\s+/i, '')}.</h1><p>Satu langkah lebih dekat ke hari bahagia.</p></div><div className="planner-date"><Calendar size={20}/><div><strong>{formatDateID(workspace.wedding_date)}</strong><span>{daysRemaining > 0 ? `${daysRemaining} hari lagi` : daysRemaining === 0 ? 'Hari pernikahanmu' : 'Tanggal pernikahan telah berlalu'}</span></div></div></section>
          <div className="planner-mobile-progress"><div><span>Progres persiapan</span><strong>{taskProgressPercent}%</strong></div><progress max="100" value={taskProgressPercent}/></div>
          <nav className="planner-shortcuts" aria-label="Pintasan workspace">{([['overview','Ringkasan',Sparkles],['tasks','Timeline',CheckSquare],['budget','Budget',Wallet],['guests','Tamu',Users],['pairing','Pengaturan',Heart]] as const).map(([tab,label,Icon]) => <button key={tab} aria-current={activeTab === tab ? 'page' : undefined} onClick={() => setActiveTab(tab)}><Icon size={19}/><span>{label}</span></button>)}</nav>
          {activeTab === 'overview' && <div className="planner-overview">
            <section className="planner-metrics" aria-label="Ringkasan rencana">
              <button onClick={() => setActiveTab('tasks')}><span>Timeline <CheckSquare size={17}/></span><strong>{totalCompletedTasks}<small> / {totalTasksCount}</small></strong><p>Tugas selesai · {taskProgressPercent}%</p><progress value={taskProgressPercent} max="100"/></button>
              <button onClick={() => setActiveTab('budget')}><span>Budget <Wallet size={17}/></span><strong className="planner-money">{formatRupiah(totalSpentBudget)}</strong><p>{workspace.target_budget > 0 ? `${Math.round(totalSpentBudget / workspace.target_budget * 100)}% dari ${formatRupiah(workspace.target_budget)}` : 'Target anggaran belum diatur'}</p><progress value={Math.min(100, workspace.target_budget > 0 ? totalSpentBudget / workspace.target_budget * 100 : 0)} max="100"/></button>
              <button onClick={() => setActiveTab('guests')}><span>Tamu <Users size={17}/></span><strong>{totalConfirmedPax}<small> pax hadir</small></strong><p>{totalGuestsCount} undangan · {totalPaxCount} pax total</p><progress value={totalPaxCount > 0 ? totalConfirmedPax / totalPaxCount * 100 : 0} max="100"/></button>
            </section>
            <div className="planner-panels">
              <section className="planner-panel"><div className="planner-panel-heading"><div><h2>Langkah berikutnya</h2><p>Tugas belum selesai, diurutkan menurut fase.</p></div><button onClick={() => setActiveTab('tasks')}>Lihat semua →</button></div>
                {tasks.filter(t => !t.is_completed).sort((a,b) => ['Dokumen KUA','H-6 Bulan','H-3 Bulan','H-1 Bulan','H-1 Minggu','Hari H'].indexOf(a.phase) - ['Dokumen KUA','H-6 Bulan','H-3 Bulan','H-1 Bulan','H-1 Minggu','Hari H'].indexOf(b.phase)).slice(0,5).map(task => <div key={task.id} className="planner-next-task"><button aria-label={`Selesaikan ${task.title}`} onClick={() => toggleTask(task.id)}><Check size={16}/></button><div><strong>{task.title}</strong><span>{task.phase} · {task.pic === 'both' ? 'Berdua' : task.pic === 'groom' ? 'Calon pengantin pria' : 'Calon pengantin wanita'}</span></div><span className="planner-task-status">Belum selesai</span></div>)}
                {!tasks.some(t => !t.is_completed) && <div className="planner-empty-inline"><CheckCircle2 size={26}/><h3>{tasks.length ? 'Semua tugas selesai' : 'Mulai dari satu langkah kecil'}</h3><p>{tasks.length ? 'Kamu dapat menambahkan tugas berikutnya kapan saja.' : 'Belum ada tugas. Tambahkan persiapan pertamamu.'}</p><button onClick={() => setShowAddTaskModal(true)}>Tambah tugas</button></div>}
              </section>
              <section className="planner-panel planner-actions"><h2>Aksi cepat</h2><p>Catat detail, lanjutkan rencana.</p><button onClick={() => setShowAddTaskModal(true)}><Plus size={18}/>Tambah tugas</button><button onClick={() => setShowAddBudgetModal(true)}><Wallet size={18}/>Tambah pos anggaran</button><button onClick={() => setShowAddGuestModal(true)}><Users size={18}/>Tambah tamu</button><button onClick={() => setActiveTab('tasks')}><Calendar size={18}/>Lihat timeline</button></section>
            </div>
            <section className="planner-budget-note"><Wallet size={20}/><div><strong>Ruang untuk setiap kebutuhan</strong><p>Alokasi {formatRupiah(totalAllocatedBudget)} · Sisa target {formatRupiah(workspace.target_budget - totalSpentBudget)}</p></div><button onClick={() => setActiveTab('budget')}>Kelola budget →</button></section>
            <p className="planner-local-note">Tersimpan secara lokal di browser ini. RSVP dicatat manual; WhatsApp membuka pesan, bukan mengirim otomatis.</p>
          </div>}


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
                      aria-label={`Tandai ${task.title}`}
                      aria-pressed={task.is_completed}
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

            <GuestCSVImport />

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
                          aria-label={`RSVP ${guest.name}`}
                          value={guest.rsvp_status}
                          onChange={(e) => updateGuest(guest.id, { rsvp_status: e.target.value as GuestItem["rsvp_status"] })}
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
                          aria-label={`Hapus ${guest.name}`}
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
              Kolaborasi cloud belum tersedia. Tautan ini adalah prototype lokal, bukan akses bersama atau sinkronisasi real-time.
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
                onClick={() => { if (confirm("Hapus seluruh data workspace dari browser ini?")) resetData(); }}
                className="text-xs text-rose-500 hover:underline pt-4 block mx-auto"
              >
                Hapus Data Workspace Lokal
              </button>
            </div>
          </div>
        )}

        </main>
      </div>

      {/* Modal: Invite Partner */}
      {showInviteModal && (
              <PlannerDialog title="Tautan pasangan" onClose={() => setShowInviteModal(false)}>
                <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-100">
                  <h3 className="font-serif font-bold text-slate-900 text-lg mb-2 text-center">Undang Pasangan</h3>
                  <p className="text-xs text-slate-600 text-center mb-4 leading-relaxed">
                    Tautan prototype lokal. Data hanya ada di browser ini; membuka tautan di perangkat lain tidak membagikan workspace. Sinkronisasi cloud belum tersedia.
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
              </PlannerDialog>
            )}

      {/* Modal: Add Budget */}
      {showAddBudgetModal && (
              <PlannerDialog title="Tambah Pos Anggaran" onClose={() => setShowAddBudgetModal(false)}>
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
                        <label htmlFor="planner-field-0" className="block mb-1">Kategori Pos</label>
                                                <select id="planner-field-0"
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
                        <label htmlFor="planner-field-1" className="block mb-1">Nama / Keterangan Pos</label>
                                                <input id="planner-field-1"
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
                          <label htmlFor="planner-field-2" className="block mb-1">Plafon Alokasi (Rp)</label>
                                                    <input id="planner-field-2"
                            type="number"
                                                        min="0"
                                                        step="1"
                            value={newBudgetAllocated}
                            onChange={(e) => setNewBudgetAllocated(Number(e.target.value))}
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <label htmlFor="planner-field-3" className="block mb-1">Pengeluaran Riil (Rp)</label>
                                                    <input id="planner-field-3"
                            type="number"
                                                        min="0"
                                                        step="1"
                            value={newBudgetSpent}
                            onChange={(e) => setNewBudgetSpent(Number(e.target.value))}
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="planner-field-4" className="block mb-1">Status Pembayaran</label>
                                                <select id="planner-field-4"
                          value={newBudgetStatus}
                          onChange={(e) => setNewBudgetStatus(e.target.value as BudgetItem["payment_status"])}
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
              </PlannerDialog>
            )}

      {/* Modal: Add Task */}
      {showAddTaskModal && (
              <PlannerDialog title="Tambah Tugas" onClose={() => setShowAddTaskModal(false)}>
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
                        <label htmlFor="planner-field-5" className="block mb-1">Nama Tugas</label>
                                                <input id="planner-field-5"
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
                          <label htmlFor="planner-field-6" className="block mb-1">Fase Waktu</label>
                                                    <select id="planner-field-6"
                            value={newTaskPhase}
                            onChange={(e) => setNewTaskPhase(e.target.value as TaskItem["phase"])}
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
                          <label htmlFor="planner-field-7" className="block mb-1">PIC Penanggung Jawab</label>
                                                    <select id="planner-field-7"
                            value={newTaskPic}
                            onChange={(e) => setNewTaskPic(e.target.value as TaskItem["pic"])}
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
              </PlannerDialog>
            )}

      {/* Modal: Add Guest */}
      {showAddGuestModal && (
              <PlannerDialog title="Tambah Tamu" onClose={() => setShowAddGuestModal(false)}>
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
                        <label htmlFor="planner-field-8" className="block mb-1">Nama Tamu / Keluarga</label>
                                                <input id="planner-field-8"
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
                          <label htmlFor="planner-field-9" className="block mb-1">Circle / Kelompok</label>
                                                    <select id="planner-field-9"
                            value={newGuestCategory}
                            onChange={(e) => setNewGuestCategory(e.target.value as GuestItem["category"])}
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
                          <label htmlFor="guest-pax" className="block mb-1">Jumlah Pax</label>
                          <input id="guest-pax"
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
                        <label htmlFor="guest-phone" className="block mb-1">No. WhatsApp (Awalan 08xxx atau 628xxx)</label>
                        <input id="guest-phone"
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
              </PlannerDialog>
            )}

    </div>
  );
}
