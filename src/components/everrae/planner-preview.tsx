"use client";
import Image from "next/image";
import { useState } from "react";
import { Check, CalendarDays, LayoutDashboard, Wallet, Users } from "lucide-react";
const tasks = ["Tentukan tanggal & lokasi utama", "Hitung estimasi jumlah tamu", "Pilih fotografer & videografer", "Fitting busana pengantin"];

export function PlannerPreview({ interactive = true }: { interactive?: boolean }) {
  const [tab, setTab] = useState("Timeline");
  const [done, setDone] = useState([true, true, false, false]);
  const tabs = ["Timeline", "Budget", "Guest List"];
  return (
    <div className="er-preview">
      <aside className="er-preview-sidebar">
        <span className="er-preview-brand">Pocket Planner</span>
        <span className="er-preview-side-label">WEDDING WORKSPACE</span>
        {[[LayoutDashboard, "Dashboard"], [CalendarDays, "Timeline"], [Wallet, "Budget"], [Users, "Guest List"]].map(([Icon, label]) => {
          const I = Icon as typeof CalendarDays;
          return (
            <div key={String(label)} className={label === tab ? "selected" : ""}>
              <I size={15} />
              {String(label)}
            </div>
          );
        })}
        <small>DEMO · DATA FIKTIF</small>
      </aside>
      <div className="er-preview-main">
        <div className="er-preview-top">
          <span>THE WEDDING OF</span>
          <span className="er-avatar">A & R</span>
        </div>
        <h3>Alya & Reza</h3>
        <p className="er-preview-date">12 Desember 2027 · Bandung</p>
        <div className="er-preview-tabs">
          {tabs.map((t) =>
            interactive ? (
              <button
                aria-pressed={tab === t}
                className={tab === t ? "active" : ""}
                key={t}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ) : (
              <span className={tab === t ? "active" : ""} key={t}>
                {t}
              </span>
            )
          )}
        </div>
        <div className="er-preview-grid">
          <div className="er-preview-panel">
            <h4>{tab === "Timeline" ? "Wedding Timeline" : tab === "Budget" ? "Rincian anggaran" : "Guest List"}</h4>
            {tab === "Timeline" ? (
              <>
                <p className="er-preview-muted">SETIAP LANGKAH, LEBIH DEKAT</p>
                {tasks.map((t, i) => (
                  <label className="er-preview-task" key={t}>
                    {interactive ? (
                      <input
                        type="checkbox"
                        checked={done[i]}
                        onChange={() => setDone(done.map((v, j) => (j === i ? !v : v)))}
                      />
                    ) : (
                      <span className={done[i] ? "er-check done" : "er-check"}>
                        {done[i] && <Check size={12} />}
                      </span>
                    )}
                    <span>
                      {t}
                      <small>{i < 2 ? "Persiapan awal" : "Persiapan berikutnya"}</small>
                    </span>
                  </label>
                ))}
                <p className="er-preview-muted">{done.filter(Boolean).length} dari 4 tugas selesai</p>
              </>
            ) : tab === "Budget" ? (
              <>
                <p>Venue & katering <strong>Rp 45.000.000</strong></p>
                <p>Busana & dokumentasi <strong>Rp 15.000.000</strong></p>
                <p>Anggaran total <strong>Rp 100.000.000</strong></p>
              </>
            ) : (
              <>
                <p>Keluarga · 120 tamu</p>
                <p>Sahabat · 80 tamu</p>
                <p>Konfirmasi hadir · 150 dari 200</p>
                <small>Contoh status RSVP, bukan undangan terkirim.</small>
              </>
            )}
          </div>
          <div className="er-preview-right">
            <Image
              src="/images/wedding-flowers.jpg"
              alt="Buket bunga ivory dan biru sebagai inspirasi dekorasi workspace"
              width={500}
              height={330}
            />
            <div className="er-preview-panel">
              <h4>Budget Progress</h4>
              <strong>Rp 60.000.000</strong>
              <p className="er-preview-muted">dari Rp 100.000.000 · contoh</p>
              <progress value={60} max={100} aria-label="Budget demo 60 persen" />
              <div className="er-budget-footer">
                <span>Terencana</span>
                <b>60%</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
