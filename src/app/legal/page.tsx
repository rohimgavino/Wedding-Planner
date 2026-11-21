import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privasi, Syarat & Kebijakan Pengembalian Dana — Pocket Planner",
  description:
    "Kebijakan privasi resmi, syarat penggunaan layanan, kebijakan pengembalian dana (refund), dan informasi pengelola resmi Pocket Planner (pocketwedding.id).",
  alternates: {
    canonical: "/legal",
  },
  openGraph: {
    title: "Privasi, Syarat & Kebijakan Pengembalian Dana — Pocket Planner",
    description:
      "Informasi legal dan kebijakan privasi perlindungan data pengguna Pocket Planner.",
    url: "https://pocketwedding.id/legal",
    siteName: "Pocket Planner",
    type: "website",
  },
};

export default function Legal() {
  return (
    <div className="everrae">
      <article className="er-legal">
        <Link className="er-text-link" href="/">
          ← Pocket Planner
        </Link>
        <h1 className="my-8">
          Privasi, Syarat &amp; Kebijakan Pengembalian Dana
        </h1>

        <nav className="my-6 p-4 bg-[#f8f5ef] rounded border border-[#dedbd0] flex flex-wrap gap-4 text-xs font-medium">
          <a href="#privacy" className="underline hover:text-[#786442]">
            Kebijakan Privasi
          </a>
          <span>·</span>
          <a href="#terms" className="underline hover:text-[#786442]">
            Syarat Penggunaan
          </a>
          <span>·</span>
          <a href="#refund" className="underline hover:text-[#786442]">
            Kebijakan Pengembalian Dana (Refund)
          </a>
          <span>·</span>
          <a href="#contact" className="underline hover:text-[#786442]">
            Pengelola &amp; Kontak Resmi
          </a>
          <span>·</span>
          <a href="#credits" className="underline hover:text-[#786442]">
            Atribusi Foto
          </a>
        </nav>

        {/* 1. Kebijakan Privasi */}
        <section id="privacy">
          <h2>Kebijakan Privasi</h2>
          <p>
            Pocket Planner dikelola secara resmi oleh Ahmad Nur Rochim. Pertanyaan mengenai privasi, permintaan akses, koreksi, atau penghapusan data dapat disampaikan melalui surat elektronik ke{" "}
            <a href="mailto:ahmadnurrochim11@gmail.com" className="underline">
              ahmadnurrochim11@gmail.com
            </a>
            . Kami akan memverifikasi kepemilikan akun sebelum memproses permohonan Anda.
          </p>
          <p>
            Autentikasi akun Google melalui Supabase digunakan untuk mengidentifikasi pengguna secara aman. Data akun yang diterima mencakup identitas akun, nama, alamat email, dan foto profil publik sesuai izin yang Anda setujui pada dialog Google. Pocket Planner tidak pernah meminta akses ke isi kotak masuk Gmail, Google Drive pribadi, atau kontak Google Anda.
          </p>
          <p>
            Data yang Anda masukkan ke dalam ruang kerja (workspace)—seperti nama calon mempelai, tanggal pernikahan, target anggaran, tabungan bersama, daftar tugas, serta nama, nomor telepon, dan status kehadiran tamu undangan—disimpan secara terenkripsi pada basis data Supabase untuk menjalankan fitur kolaborasi cloud. Anggota pasangan yang menerima tautan undangan resmi dapat mengakses dan menyunting data ruang kerja bersama. Pastikan Anda memiliki persetujuan yang sah saat mencatat data tamu, serta tidak memasukkan dokumen identitas sensitif (KTP/Paspor), data rekam medis, kata sandi perbankan, atau nomor kartu pembayaran ke dalam catatan.
          </p>
          <p>
            Layanan infrastruktur pihak ketiga yang kami gunakan meliputi: Google (autentikasi akun), Supabase (database &amp; otorisasi Row Level Security), Cloudflare (jaringan CDN &amp; hosting web), dan DOKU Checkout (pemrosesan transaksi pembayaran resmi). Basis data cloud saat ini berlokasi di wilayah regional Singapura (ap-southeast-1). Data pengguna tidak pernah dijual atau diserahkan kepada pihak ketiga untuk kepentingan periklanan personal.
          </p>
          <p>
            Data workspace disimpan selama diperlukan untuk menyediakan layanan aktif atau hingga adanya permintaan penghapusan akun yang sah. Anda berhak mencabut izin akses Google atau meminta penutupan ruang kerja kapan saja dengan menghubungi kontak dukungan kami.
          </p>
        </section>

        {/* 2. Syarat Penggunaan */}
        <section id="terms">
          <h2>Syarat Penggunaan (Terms of Service)</h2>
          <p>
            Pocket Planner menyediakan platform cloud manajemen persiapan pernikahan untuk membantu calon pengantin merencanakan hari bahagia secara tenang, teratur, dan transparan. Penggunaan fitur kolaborasi cloud memerlukan login menggunakan akun Google yang valid.
          </p>
          <p>
            Setiap pengguna bertanggung jawab penuh atas keakuratan data yang dimasukkan, keamanan sesi login perangkat pribadi, serta penerima tautan undangan pasangan. Dilarang keras menyalahgunakan sistem, mencoba meretas atau mengakses workspace milik pengguna lain tanpa izin, maupun mengunggah konten yang melanggar norma hukum yang berlaku di Republik Indonesia.
          </p>
          <p>
            <strong>Transaksi Pembayaran Resmi:</strong> Pembelian paket aktivasi workspace diproses secara aman melalui gerbang pembayaran (payment gateway) resmi <strong>DOKU Checkout</strong> sesuai dengan paket, harga transparan, dan durasi masa aktif yang tercantum pada halaman checkout. Pocket Planner tidak memproses atau menyimpan data nomor kartu kredit maupun kredensial perbankan Anda.
          </p>
          <p>
            Pocket Planner berkomitmen menjaga ketersediaan sistem, keandalan server, dan integritas data pengguna. Modul checklist administrasi pernikahan dirancang sebagai panduan persiapan mandiri dan bukan merupakan nasihat hukum formal; pastikan Anda tetap melakukan konfirmasi persyaratan dokumen resmi pada Kantor Urusan Agama (KUA) atau Dinas Kependudukan dan Pencatatan Sipil setempat.
          </p>
          <p>
            Pengelola berhak membatasi atau menangguhkan akun pengguna yang terbukti melakukan pelanggaran berat terhadap syarat penggunaan ini demi melindungi integritas dan keamanan ekosistem pengguna lainnya.
          </p>
        </section>

        {/* 3. Kebijakan Refund */}
        <section id="refund">
          <h2>Kebijakan Pengembalian Dana (Refund)</h2>
          <p>
            Kami ingin Anda merasa nyaman dan percaya diri menggunakan Pocket Planner. Jika terjadi kendala sistem atau aktivasi workspace yang tidak dapat diselesaikan oleh tim dukungan kami dalam kurun waktu 3x24 jam sejak pembayaran berhasil, Anda berhak mengajukan pengembalian dana secara penuh.
          </p>
          <p>
            Permohonan pengembalian dana dapat dikirimkan ke{" "}
            <a href="mailto:ahmadnurrochim11@gmail.com" className="underline">
              ahmadnurrochim11@gmail.com
            </a>{" "}
            dengan melampirkan bukti transfer DOKU dan alamat email akun yang terdaftar.
          </p>
        </section>

        {/* 4. Pengelola & Kontak */}
        <section id="contact">
          <h2>Pengelola &amp; Kontak Resmi</h2>
          <p>
            Layanan ini dikembangkan dan dikelola oleh:
            <br />
            <strong>Ahmad Nur Rochim</strong>
            <br />
            Email: <a href="mailto:ahmadnurrochim11@gmail.com" className="underline">ahmadnurrochim11@gmail.com</a>
            <br />
            Situs Resmi: <a href="https://pocketwedding.id" className="underline">https://pocketwedding.id</a>
          </p>
        </section>

        {/* 5. Atribusi Foto */}
        <section id="credits">
          <h2>Atribusi Foto</h2>
          <p>
            Seluruh fotografi lanskap dan dekorasi bunga yang ditampilkan pada materi publik berasal dari fotografer Unsplash dengan lisensi bebas royalti komersial.
          </p>
        </section>
      </article>
    </div>
  );
}
