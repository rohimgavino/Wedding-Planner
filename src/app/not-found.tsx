import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="space-y-2">
          <p className="text-6xl font-extrabold text-slate-800 tracking-tight font-mono">404</p>
          <h1 className="text-xl font-serif font-bold text-slate-900">404 NOT FOUND</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Halaman yang Anda tuju tidak ditemukan atau URL yang dimasukkan salah.
          </p>
        </div>
        <div className="pt-3 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-[#163e33] text-white text-xs font-semibold hover:bg-[#12332a] transition inline-flex items-center justify-center"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
