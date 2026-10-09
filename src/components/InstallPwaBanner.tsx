"use client";

import React, { useEffect, useState } from "react";
import { Smartphone, Download, X, Share } from "lucide-react";

export function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. Registrasi Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.log("Service Worker registration failed:", err);
      });
    }

    // 2. Deteksi apakah sudah terpasang dalam mode standalone
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // 3. Deteksi event instalasi PWA di Android / Chrome
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroidBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. Deteksi iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = isIos && /safari/.test(userAgent) && !/crios|fxios/.test(userAgent);

    if (isIos && isSafari && !isStandalone) {
      // Tampilkan banner panduan iOS hanya di mobile Safari
      setShowIosBanner(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowAndroidBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (isDismissed) return null;

  if (showAndroidBanner) {
    return (
      <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 max-w-md mx-auto bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 z-50 flex items-center justify-between gap-3 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
            💍
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Pasang Aplikasi di HP</h4>
            <p className="text-[11px] text-slate-300">Buka cepat seperti aplikasi native tanpa buka browser.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold shadow-md hover:from-rose-600 hover:to-rose-700 transition"
          >
            Pasang
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (showIosBanner) {
    return (
      <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 max-w-md mx-auto bg-white/95 backdrop-blur-md text-slate-800 p-3.5 rounded-2xl shadow-xl border border-rose-200 z-50 flex items-start justify-between gap-3 animate-fade-up">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
            <Share className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Pasang di iPhone / iPad</h4>
            <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
              Ketuk ikon <span className="font-semibold text-rose-600">Share [kotak panah]</span> di bawah browser, lalu pilih <span className="font-semibold text-slate-900">&quot;Add to Home Screen&quot;</span>.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-slate-400 hover:text-slate-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
}
