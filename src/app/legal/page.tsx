import Link from "next/link";

export default function Legal() {
  return (
    <div className="everrae">
      <article className="er-legal">
        <Link className="er-text-link" href="/">← Pocket Planner</Link>
        <h1 className="my-8">Privasi, Syarat & Kebijakan Pengembalian Dana</h1>

        <nav className="my-6 p-4 bg-[#f8f5ef] rounded border border-[#dedbd0] flex flex-wrap gap-4 text-xs font-medium">
          <a href="#privacy" className="underline hover:text-[#786442]">Kebijakan Privasi</a>
          <span>·</span>
          <a href="#terms" className="underline hover:text-[#786442]">Syarat Penggunaan</a>
          <span>·</span>
          <a href="#refund" className="underline hover:text-[#786442]">Kebijakan Pengembalian Dana (Refund)</a>
          <span>·</span>
          <a href="#contact" className="underline hover:text-[#786442]">Pengelola & Kontak Resmi</a>
          <span>·</span>
          <a href="#credits" className="underline hover:text-[#786442]">Atribusi Foto</a>
        </nav>

        {/* 1. Kebijakan Privasi */}
        <section id="privacy">
          <h2>Kebijakan Privasi</h2>
          <p>
            Pocket Planner dikelola secara resmi oleh Ahmad Nur Rochim. Pertanyaan mengenai privasi, permintaan akses, koreksi, atau penghapusan data dapat disampaikan melalui surat elektronik ke{" "}
            <a href="mailto:ahmadnurrochim11@gmail.com" className="underline">ahmadnurrochim11@gmail.com</a>. Kami akan memverifikasi kepemilikan akun sebelum memproses permohonan Anda.
          </p>
          <p>
            Autentikasi akun Google melalui Supabase digunakan untuk mengidentifikasi pengguna secara aman. Data akun yang diterima mencakup identitas akun, nama, alamat email, dan foto profil publik sesuai izin yang Anda setujui pada dialog Google. Pocket Planner tidak pernah meminta akses ke isi kotak masuk Gmail, Google Drive pribadi, atau kontak Google Anda.
          </p>
          <p>
            Data yang Anda masukkan ke dalam ruang kerja (workspace)—seperti nama calon mempelai, tanggal pernikahan, target anggaran, tabungan bersama, daftar tugas, serta nama, nomor telepon, dan status kehadiran tamu undangan—disimpan secara terenkripsi pada basis data Supabase untuk menjalankan fitur kolaborasi cloud. Anggota pasangan yang menerima tautan undangan resmi dapat mengakses dan menyunting data ruang kerja bersama. Pastikan Anda memiliki persetujuan yang sah saat mencatat data tamu, serta tidak memasukkan dokumen identitas sensitif (KTP/Paspor), data rekam medis, kata sandi perbankan, atau nomor kartu pembayaran ke dalam catatan.
          </p>
          <p>
            Layanan infrastruktur pihak ketiga yang kami gunakan meliputi: Google (autentikasi akun), Supabase (database & otorisasi Row Level Security), Cloudflare (jaringan CDN & hosting web), dan DOKU Checkout (pemrosesan transaksi pembayaran resmi). Basis data cloud saat ini berlokasi di wilayah regional Singapura (ap-southeast-1). Data pengguna tidak pernah dijual atau diserahkan kepada pihak ketiga untuk kepentingan periklanan personal.
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
            <strong>Transaksi Pembayaran Resmi:</strong> Pembelian paket aktivasi workspace diproses secara aman melalui gerbang pembayaran (payment gateway) resmi <strong>DOKU Checkout</strong> sesuai dengan paket, harga transparan, dan durasi masa aktif (365 hari kalender) yang tercantum pada halaman checkout. Pocket Planner tidak memproses atau menyimpan data nomor kartu kredit maupun kredensial perbankan Anda.
          </p>
          <p>
            Pocket Planner berkomitmen menjaga ketersediaan sistem, keandalan server, dan integritas data pengguna. Modul checklist administrasi pernikahan dirancang sebagai panduan persiapan mandiri dan bukan merupakan nasihat hukum formal; pastikan Anda tetap melakukan konfirmasi persyaratan dokumen resmi pada Kantor Urusan Agama (KUA) atau Dinas Kependudukan dan Pencatatan Sipil setempat.
          </p>
          <p>
            Pengelola berhak membatasi atau menangguhkan akun pengguna yang terbukti melakukan pelanggaran berat terhadap syarat penggunaan ini demi melindungi integritas dan keamanan ekosistem pengguna lainnya.
          </p>
        </section>

        {/* 3. Kebijakan Pengembalian Dana & Pembatalan (Refund & Cancellation) */}
        <section id="refund">
          <h2>Kebijakan Pengembalian Dana & Pembatalan (Refund Policy)</h2>
          <p>
            Kepuasan dan ketenangan Anda adalah prioritas utama kami. Untuk memenuhi standar perlindungan konsumen dan regulasi gerbang pembayaran nasional, Pocket Planner memberlakukan kebijakan pengembalian dana (refund) yang adil dan transparan:
          </p>
          <div className="my-4 space-y-3">
            <p><strong>1. Kriteria Pengembalian Dana yang Memenuhi Syarat:</strong></p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm">
              <li>
                <strong>Kegagalan Aktivasi Sistem:</strong> Pembayaran telah dinyatakan berhasil dan terverifikasi oleh DOKU Checkout, namun status ruang kerja (workspace) tidak aktif dalam waktu lebih dari 1×24 jam kerja dan tim bantuan kami tidak berhasil mengatasinya.
              </li>
              <li>
                <strong>Kesalahan Pemotongan Ganda (Double Debit):</strong> Terjadi pemotongan saldo lebih dari satu kali oleh penyedia pembayaran untuk nomor pesanan/faktur yang sama.
              </li>
              <li>
                <strong>Kendala Teknis Mayor:</strong> Layanan terbukti mengalami gangguan teknis fatal yang membuat fitur utama tidak dapat diakses sama sekali dalam 7 (tujuh) hari kalender sejak tanggal transaksi awal.
              </li>
            </ul>

            <p className="pt-2"><strong>2. Ketentuan Non-Refundable:</strong></p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm">
              <li>Permintaan pengembalian dana yang diajukan setelah masa garansi 7 hari kalender terlampaui.</li>
              <li>Perubahan keputusan pribadi pembeli (seperti pembatalan atau penundaan rencana pernikahan pribadi) saat fitur layanan berfungsi normal tanpa kendala teknis.</li>
            </ul>

            <p className="pt-2"><strong>3. Prosedur dan Alur Pengajuan Refund:</strong></p>
            <p>
              Untuk mengajukan permohonan pengembalian dana, kirimkan email resmi ke{" "}
              <a href="mailto:ahmadnurrochim11@gmail.com" className="underline font-medium">ahmadnurrochim11@gmail.com</a>{" "}
              dengan subjek <code>[Pengajuan Refund] - Nomor Pesanan DOKU / Email Akun</code>, serta melampirkan:
            </p>
            <ol className="list-decimal pl-6 space-y-1 text-sm">
              <li>Alamat email akun Google yang digunakan saat mendaftar.</li>
              <li>Bukti transaksi resmi / DOKU Invoice ID.</li>
              <li>Penjelasan singkat mengenai kendala yang dialami.</li>
            </ol>
            <p>
              Tim kami akan memverifikasi permohonan Anda dalam kurun waktu <strong>1×24 jam kerja</strong>. Jika pengajuan disetujui, pengembalian dana akan diproses kembali ke rekening atau metode pembayaran asal dalam waktu <strong>3 hingga 7 hari kerja perbankan</strong> sesuai ketentuan kliring perbankan.
            </p>
          </div>
        </section>

        {/* 4. Pengelola & Kontak Resmi */}
        <section id="contact">
          <h2>Pengelola, Identitas Usaha & Kontak Resmi</h2>
          <p>
            Layanan <strong>Pocket Planner</strong> (domain resmi: <code>pocketwedding.id</code>) dikelola secara sah oleh <strong>Ahmad Nur Rochim</strong> sebagai usaha perorangan pengembangan perangkat lunak dan layanan digital berbasis di Indonesia.
          </p>
          <div className="bg-[#fcfaf6] p-4 rounded border border-[#e8e4d8] text-sm space-y-2">
            <div><strong>Nama Platform:</strong> Pocket Planner (pocketwedding.id)</div>
            <div><strong>Pengelola Resmi:</strong> Ahmad Nur Rochim (Pocket Wedding Studio)</div>
            <div><strong>Bidang Usaha:</strong> Aktivitas Pengembangan Aplikasi Perdagangan Elektronik & Produk Digital</div>
            <div><strong>Wilayah Domisili Operasional:</strong> D.I. Yogyakarta, Indonesia</div>
            <div>
              <strong>Email Dukungan & Bantuan:</strong>{" "}
              <a href="mailto:ahmadnurrochim11@gmail.com" className="underline font-medium">ahmadnurrochim11@gmail.com</a>
            </div>
            <div>
              <strong>Layanan Pesan Pelanggan:</strong> Hubungi admin via WhatsApp melalui tombol kontak resmi pada aplikasi.
            </div>
            <div><strong>Jam Operasional Bantuan:</strong> Senin – Sabtu, pukul 09.00 – 17.00 WIB</div>
          </div>
        </section>

        {/* 5. Atribusi Fotografi */}
        <section id="credits">
          <h2>Atribusi Fotografi</h2>
          <p>
            Lanskap visual utama: Taylor Beach — Lake Chelan.{" "}
            <a className="underline" href="https://unsplash.com/photos/cVfJ62cBZX4" target="_blank" rel="noopener noreferrer">
              Foto sumber
            </a>.
          </p>
          <p>
            Detail dekorasi bunga: Erin Palos — rangkaian bunga ivory dan sage.{" "}
            <a className="underline" href="https://unsplash.com/photos/y6Qj8MmFn_Y" target="_blank" rel="noopener noreferrer">
              Foto sumber
            </a>.
          </p>
          <p>
            Seluruh aset visual dipilih dengan cermat tanpa figur manusia yang tampak demi kenyamanan visual dan estetika netral, serta digunakan secara legal berdasarkan{" "}
            <a className="underline" href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer">
              Unsplash License
            </a>.
          </p>
        </section>
      </article>
    </div>
  );
}
