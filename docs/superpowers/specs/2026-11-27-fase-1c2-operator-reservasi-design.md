# Fase 1C-2 — Reservasi di Sisi Operator: Desain

| | |
|---|---|
| Tanggal | 27 November 2026 |
| Status | Disetujui pemilik produk, 27 November 2026 |
| Bagian dari | Fase 1 (Web MVP). Fase 1C dipecah tiga: 1C-1 (reservasi pelanggan, selesai), 1C-2 (reservasi di sisi operator, dokumen ini), dan 1C-3 (unit demo, servis, walk-in, showroom). |
| Dasar | [PRD](../../PRD.md) §5, §9.2 (A4), §9.6 (R8, R12, R14), §9.10 (O1, O2, O6, O7), §9.12, §11.1 poin 4, §11.2, §13 · [Desain 1C-1](2026-11-27-fase-1c1-reservasi-design.md) · [Design system](../../../design-system/lantai-dua/MASTER.md) |

> Tanda **[Usulan]** = keputusan penyusun yang belum dikonfirmasi pemilik produk. Yang tidak bertanda sudah diputuskan pemilik produk, atau sudah ada di PRD.

## 1. Maksud

Di 1C-1, pelanggan sudah bisa memesan sesi demo. Tetapi di toko belum ada yang bisa mencatat kedatangannya. 1C-2 menyelesaikan sisi toko dari alur itu.

Contohnya Raka (PRD §10.1). Hari Sabtu operator membuka **Hari ini** dan melihat bahwa pukul 14.00 Raka datang untuk mencoba Ignix F1 Putih dan DeathAdder V3 Pro di Meja Kontrol. Raka datang dan menunjukkan QR. Operator memindainya, menekan **Check-in**, lalu setelah sesi menekan **Selesai**.

Kalau ada pelanggan yang tidak datang, operator menandainya. Kalau operator lupa menutup reservasi, sistem menutupnya sendiri pada malam hari dan meminta koreksi keesokan harinya. Reservasi baru langsung muncul di layar operator tanpa perlu memuat ulang.

## 2. Tujuan, non-tujuan, anti-tujuan

**Tujuan**
- Halaman **Hari ini** (`/operator`) berisi linimasa reservasi hari ini per jam, yang diperbarui secara realtime (O1 untuk bagian reservasi, O6).
- Operator bisa mencari reservasi lewat kode, alat scan genggam, atau kamera, lalu membuka halaman detailnya (O2).
- Operator bisa melakukan check-in, menandai Selesai, menandai Tidak datang, dan membatalkan dengan alasan (R8, O2).
- Reservasi yang lupa ditutup diproses otomatis, lalu bisa dikoreksi keesokan harinya (R12).
- Operator hanya melihat nama dan WhatsApp pelanggan lewat reservasinya (O7).
- Pelanggan wajib punya nomor WhatsApp sebelum membuat reservasi. Kalau belum ada, nomornya diminta di formulir reservasi (A4).
- Halaman reservasi pelanggan menampilkan status baru dan alasan pembatalan dari toko (§9.12, kanal "dashboard").

**Non-tujuan (dikerjakan di bagian lain)**
- 1C-3:
  - papan status unit demo dan ubah status unit (O1 bagian unit, O5);
  - servis dengan perkiraan selesai, beserta pemindahan dan peringatan reservasi terdampak (R6);
  - walk-in (R9);
  - halaman showroom publik dan status unit realtime (S1–S5).
- 1D: antrean pesanan, stok, dan penjualan langsung (O1 bagian pesanan, O3, O4, O8).
- Email pembatalan dari toko. Pengiriman email dipasang saat deploy, sama seperti di 1C-1.
- Halaman profil untuk mengubah nama dan nomor WhatsApp (U6). Di 1C-2, nomor hanya diisi sekali lewat formulir reservasi.
- Nomor WhatsApp untuk pesanan (A4, C3). Itu ikut checkout di 1D.
- Staf membuat reservasi atau mengubah jadwal reservasi. Ubah jadwal tetap dilakukan dengan membatalkan lalu membuat reservasi baru (R5).
- Aturan tidak datang 3 kali (R11, P1) dan pengingat (R10, P1).
- Notifikasi push untuk operator (Fase 3).

**Anti-tujuan**
- Status yang berpindah di luar alur yang sah, misalnya Dibatalkan menjadi Check-in (PRD §11.1 poin 4).
- Operator yang bisa membaca data pelanggan tanpa reservasi, misalnya daftar semua akun beserta WhatsApp-nya (O7).
- Tombol yang tampil padahal pasti ditolak database, atau tombol yang hilang padahal masih boleh ditekan.
- Reservasi yang selamanya tetap Terjadwal karena tidak ada yang menutupnya.
- Linimasa yang diam-diam berhenti diperbarui tanpa memberi tahu operator.
- Penutupan otomatis yang memakai secret key di aplikasi web.

## 3. Batasan

- Semua Global Constraints Fase 0, 1A, 1B, dan 1C-1 tetap berlaku. Di antaranya: Bahasa Indonesia, RLS di semua tabel, secret key tidak pernah dipakai di web, target sentuh 44 px, tanpa scroll horizontal dari 360 px, dan menghormati mode kurangi gerakan.
- Status reservasi hanya berubah lewat fungsi database (PRD §11.2: operator "ubah status lewat fungsi"). Aturan waktu diperiksa database. Web dan aplikasi hanya menampilkan tombol yang sesuai.
- Waktu mengikuti WIB, seperti di 1C-1. "Hari ini" berarti tanggal kalender Asia/Jakarta.
- Logika tombol, normalisasi kode, dan teks galat ditulis di `packages/shared`, supaya Mode Operator di aplikasi Expo (Fase 3) memakai aturan yang sama.
- Realtime sampai ke perangkat lain dalam ±5 detik (PRD §13).

## 4. Pendekatan yang dipertimbangkan

**Pembagian sisa Fase 1C** (dipilih pemilik produk, 27 November 2026)

| Pilihan | Keterangan |
|---|---|
| **Pecah lagi, reservasi operator dulu (dipilih)** | 1C-2 menutup siklus reservasi dari pesan sampai Selesai. Unit, servis, walk-in, dan showroom menyusul di 1C-3. Setiap bagian bisa dicek dan direview dengan ukuran yang wajar. |
| Satu paket 1C-2 | Gambarannya utuh, tetapi R6 (servis) dan realtime showroom membuat rencananya sangat panjang. |

**Pembaruan langsung di Hari ini** (dipilih pemilik produk, 27 November 2026)

| Pilihan | Keterangan |
|---|---|
| **A. Supabase Realtime (dipilih)** | Browser operator berlangganan perubahan tabel `reservations`. RLS tetap berlaku, jadi pelanggan hanya menerima perubahan reservasinya sendiri. Fitur yang sama dipakai untuk status unit di 1C-3. |
| B. Muat ulang berkala | Halaman memuat ulang data setiap 15 detik. Sederhana, tetapi selalu terlambat dan tetap membebani server walaupun tidak ada perubahan. |
| C. Tanpa pembaruan otomatis | Ditolak karena bertentangan dengan O6. |

**Penutupan otomatis R12** (keputusan penyusun, bisa dikoreksi) **[Usulan]**

| Pilihan | Keterangan |
|---|---|
| **A. Job `pg_cron` di database (dipilih penyusun)** | Fungsi database berjalan setiap 15 menit. Tidak butuh server lain dan tidak butuh secret key di web. Job yang sama nantinya dipakai untuk pesanan kedaluwarsa di 1D (PRD §13). `pg_cron` sudah tercantum di PRD §12. |
| B. Cron Vercel memanggil API | Ditolak. API itu butuh secret key di aplikasi web, dan baru bisa diuji setelah deploy. |
| C. Ditutup saat halaman dibuka | Ditolak. Data di database tetap salah sampai ada yang membuka halaman, laporan pemilik di 1E bisa keliru, dan aplikasi Expo harus mengulang logika yang sama. |

**Perubahan status oleh staf** (keputusan penyusun) **[Usulan]**

| Pilihan | Keterangan |
|---|---|
| **Satu fungsi database dengan tabel perpindahan (dipilih penyusun)** | Semua perpindahan dan batas waktunya ada di satu tempat, sehingga PRD §11.1 poin 4 mudah dites. |
| Policy update langsung di tabel | Ditolak. PRD §11.2 meminta perubahan status lewat fungsi, dan policy tidak bisa memeriksa batas waktu dengan rapi. |

## 5. Halaman dan perilaku

### 5.1 Hari ini `/operator`

```
Hari ini · Jum, 27 Nov 2026 · buka 10.00–21.00                      ● Langsung
[ Kode reservasi atau scan QR                 ] [Buka]  [Scan kamera]

⚠ Perlu dikoreksi (1): reservasi yang belum dicatat
  Kam, 26 Nov · 15.00  Sinta Maharani · WA 0813-…   [Datang] [Tidak datang]

6 reservasi · 2 check-in · 1 selesai · 1 tidak datang

14.00
  14.00–14.30  Raka Pratama · WA 0812-3456-7890              Terjadwal  [Check-in]
               VortexSeries Ignix F1 · Putih (DM-0012) · Meja Kontrol
               Razer DeathAdder V3 Pro · Hitam (DM-0007) · Meja Kontrol
               Catatan pelanggan: "Bawa mouse lama buat dibandingin"
  14.30–15.00  Dimas · WA 0857-…                     Check-in  [Selesai]
               HyperX Cloud II (DM-0031) · Meja Kontrol
               🧼 Pasang cover telinga sekali pakai sebelum dipakai pelanggan.
15.00
  15.00–15.30  Nadia · WA 0821-…                    Dibatalkan            (redup)
```

**Isi**
- **Kepala halaman:**
  - tanggal hari ini (WIB) dan jam buka hari ini, atau "Toko tutup hari ini";
  - penanda realtime (§5.6).
- **Kolom kode** dan tombol **Scan kamera** (§5.2).
- **Perlu dikoreksi** (R12): reservasi Tidak tercatat yang mulai dalam 7 hari terakhir, urut dari yang paling lama. Bagian ini hanya tampil kalau ada isinya. **[Usulan]**
- **Ringkasan angka** reservasi hari ini per status.
- **Linimasa:** semua reservasi yang mulai hari ini, dikelompokkan per jam mulai dan diurutkan menurut waktu. Hanya jam yang punya reservasi yang tampil. Kelompok jam yang sedang berjalan diberi tanda "Sekarang". **[Usulan]**

**Isi setiap baris reservasi**
- jam sesi;
- nama pelanggan dan nomor WhatsApp, sebagai tautan `wa.me` (O7);
- status, berupa chip dengan teks;
- setiap unit yang harus disiapkan: nama varian lengkap, kode unit, dan area;
- catatan kebersihan dari kategori unit, masing-masing sekali per reservasi (R14);
- catatan pelanggan, kalau ada;
- label "Baru" untuk reservasi yang dibuat dalam 15 menit terakhir **[Usulan]**;
- tombol aksi yang sedang berlaku (§5.4), kecuali Batalkan;
- tautan ke halaman detail.

**Perilaku lain**
- Batalkan hanya ada di halaman detail, karena butuh alasan. Baris di linimasa cukup memuat aksi yang sering dipakai. **[Usulan]**
- Reservasi Dibatalkan tetap tampil di tempatnya, tetapi diredupkan dan tanpa tombol. Dengan begitu operator tahu bahwa sesi itu batal. **[Usulan]**
- **Hari ini saja.** Reservasi hari lain dibuka lewat kode. Pilihan tanggal lain tidak dibuat di 1C-2. **[Usulan]**
- Kalau belum ada reservasi, tampil "Belum ada reservasi hari ini." Bagian Perlu dikoreksi tetap tampil kalau ada isinya.
- Tombol aksi di baris langsung bekerja tanpa dialog konfirmasi. Kesalahan bisa dikoreksi (§5.4), dan operator sering menangani pelanggan yang sedang berdiri di depannya. **[Usulan]**

### 5.2 Cari dan scan

**Kolom kode**
- Menerima kode yang diketik atau hasil alat scan genggam. Alat scan genggam bekerja seperti keyboard dan menekan Enter sendiri.
- Penulisan apa pun diterima, misalnya `l2d-f6w859e4`, `F6W859E4`, atau `L2D F6W8 59E4`. Huruf diubah menjadi kapital, lalu spasi, tanda hubung, dan awalan `L2D` dibuang. Kalau tersisa 8 karakter dari alfabet kode, hasilnya menjadi `L2D-XXXXXXXX`. **[Usulan]**
- Kode yang sah langsung membuka `/operator/reservasi/<kode>`.
- Isian yang bukan kode menampilkan "Kode tidak dikenali. Contoh: L2D-H7K3QX9P".
- Di layar lebar, kolom ini otomatis difokus saat halaman dibuka, supaya alat scan genggam langsung bisa dipakai. Di HP tidak difokus otomatis, supaya keyboard tidak muncul. **[Usulan]**

**Scan kamera**
- Scan kamera harus bekerja di semua browser modern yang punya kamera, termasuk webcam laptop Windows dan iPhone.
- Kalau browser punya `BarcodeDetector` dengan format `qr_code` (misalnya Chrome di Android), fitur itu yang dipakai. Kalau tidak, gambar kamera dibaca oleh pustaka QR JavaScript. Pustaka ini adalah dependensi baru, misalnya `jsQR`, dan baru dimuat saat dialog dibuka. **[Usulan untuk nama pustakanya]**
- Tombol hanya disembunyikan kalau browser tidak bisa membuka kamera sama sekali.
- Menekan tombol membuka dialog berisi tampilan kamera (kamera belakang di HP) dan teks "Arahkan kamera ke QR reservasi". Ada tombol tutup.
- Begitu QR berisi kode yang sah terbaca, kamera dimatikan dan halaman detail terbuka. QR lain menampilkan "QR ini bukan kode reservasi LANTAI DUA." dan pemindaian berlanjut.
- Kamera juga dimatikan saat dialog ditutup atau halaman ditinggalkan.
- Kalau izin kamera ditolak atau kamera tidak ada, tampil "Kamera tidak bisa dipakai. Ketik kodenya saja."

### 5.3 Detail operator `/operator/reservasi/[kode]`

**Isi**
- kode, status, dan jadwal "Sab, 28 Nov 2026 · 14.00–14.30 WIB";
- nama pelanggan dan tautan WhatsApp (O7);
- daftar unit (varian, kode unit, area) dan catatan kebersihan;
- catatan pelanggan;
- waktu reservasi dibuat;
- alasan pembatalan kalau dibatalkan toko, atau "Dibatalkan pelanggan".

**Aksi**
- Semua aksi yang sedang berlaku sesuai §5.4.
- **Batalkan** membuka dialog dengan kolom alasan yang wajib diisi (3–200 karakter) **[Usulan]**, dan keterangan "Alasan ini tampil di halaman reservasi pelanggan."

**Lain-lain**
- Kode yang tidak ada menghasilkan halaman 404 "Kode reservasi tidak ditemukan", lengkap dengan kolom kode untuk mencoba lagi.
- Tautan kembali ke Hari ini.
- Halaman detail tidak berlangganan realtime. Setelah aksi, halaman dimuat ulang dari server. **[Usulan]**

### 5.4 Aturan perpindahan status

Aktif berarti `scheduled` atau `checked_in`, seperti di 1C-1.

| Dari | Ke | Tombol | Boleh kalau | Oleh |
|---|---|---|---|---|
| Terjadwal | Check-in | **Check-in** | sesi mulai hari ini (WIB), dan sekarang ≥ mulai − 60 menit, dan sekarang < akhir sesi | staf |
| Tidak datang | Check-in | **Check-in** | sekarang < akhir sesi. Untuk pelanggan yang terlambat setelah ditandai Tidak datang. **[Usulan]** | staf |
| Terjadwal | Tidak datang | **Tidak datang** | sekarang ≥ mulai + 15 menit | staf |
| Check-in | Selesai | **Selesai** | kapan saja | staf |
| Check-in | Terjadwal | **Urungkan check-in** | sekarang < akhir sesi. Untuk check-in yang tidak sengaja ditekan. **[Usulan]** | staf |
| Selesai | Check-in | **Urungkan selesai** | masih di hari sesi (WIB). Untuk Selesai yang tidak sengaja ditekan. **[Usulan]** | staf |
| Terjadwal, Check-in | Dibatalkan | **Batalkan** | sekarang < akhir sesi, alasan 3–200 karakter | staf |
| Tidak tercatat | Dibatalkan | **Batalkan** | kapan saja, alasan 3–200 karakter. Misalnya toko ternyata tutup hari itu. **[Usulan]** | staf |
| Terjadwal | Dibatalkan | Batalkan (sudah ada) | sebelum batas batal pelanggan | pelanggan (1C-1) |
| Terjadwal | Tidak tercatat | – | penutupan otomatis (§5.5) | sistem |
| Check-in | Selesai | – | penutupan otomatis (§5.5) | sistem |
| Tidak tercatat | Selesai | **Datang** | kapan saja | staf |
| Tidak tercatat | Tidak datang | **Tidak datang** | kapan saja | staf |

- Perpindahan lain ditolak. Dibatalkan adalah status akhir. Selesai menjadi akhir setelah hari sesi lewat, dan Tidak datang setelah sesinya berakhir.
- Tombol Urungkan tampil kecil di bawah status, bukan sejajar dengan tombol utama, supaya tidak ikut tertekan. **[Usulan]**
- Angka 60 menit dan 15 menit disimpan di `store_settings`, supaya pemilik bisa mengubahnya di 1E, dan dibaca oleh database serta web dari sumber yang sama. **[Usulan]**
- Database memakai jam database (`now()`). Web menghitung tombol yang tampil dengan fungsi yang sama di `packages/shared`, dan menghitungnya ulang setiap 30 detik, supaya tombol Check-in muncul sendiri saat waktunya tiba. **[Usulan]**
- Kalau database menolak, misalnya karena pelanggan baru saja membatalkan, pesan tampil di dekat tombol dan data dimuat ulang. Pesan galat **[Usulan]**:
  - "Status reservasi ini baru saja berubah. Data sudah dimuat ulang."
  - "Check-in baru bisa mulai 60 menit sebelum sesi."
  - "Tidak datang baru bisa ditandai 15 menit setelah sesi mulai."
  - "Sesi ini sudah berakhir."
  - "Tulis alasan pembatalan (3–200 karakter)."
  - "Unit atau meja untuk sesi ini sudah terpakai." (hanya mungkin saat Tidak datang atau Selesai dikembalikan ke Check-in)
  - "Gagal menyimpan. Coba lagi sebentar."
- Setiap perubahan tercatat di `audit_logs` lewat trigger yang sudah ada, termasuk siapa pelakunya. Perubahan oleh sistem tercatat tanpa pelaku.
- Trigger 1C-1 tidak berubah. Hanya Terjadwal dan Check-in yang memegang unit dan kursi. Selesai, Tidak datang, Dibatalkan, dan Tidak tercatat melepasnya. Unit yang dilepas tidak bisa dipesan orang lain untuk sesi yang sudah mulai, karena batas pesan minimal 60 menit sebelum sesi. Constraint tetap menjadi penjaga terakhir saat reservasi diaktifkan lagi.

### 5.5 Penutupan otomatis dan koreksi (R12)

- Job `pg_cron` berjalan setiap 15 menit. **[Usulan]**
- Sebuah reservasi aktif diproses kalau sekarang sudah melewati batas tutupnya:
  - Check-in menjadi Selesai;
  - Terjadwal menjadi Tidak tercatat.
- **Batas tutup** adalah yang paling akhir dari dua waktu ini **[Usulan]**:
  - jam tutup toko pada hari sesi + 2 jam (R12);
  - akhir sesi + 2 jam.

  Untuk reservasi biasa hasilnya selalu jam tutup + 2 jam. Aturan kedua menjaga reservasi di hari yang ternyata tutup (misalnya libur yang ditambahkan setelah reservasi dibuat) dan data tes.
- Job aman dijalankan berulang kali, dan tidak mengunci baris yang sedang diubah staf.
- Keesokan harinya, reservasi Tidak tercatat tampil di bagian **Perlu dikoreksi** di Hari ini (§5.1). Operator memilih **Datang** (dicatat Selesai) atau **Tidak datang**.
- Koreksi tidak punya batas waktu di database. Yang dibatasi 7 hari hanya daftar di layar. **[Usulan]**

### 5.6 Realtime

- Tabel `reservations` dimasukkan ke publikasi `supabase_realtime`.
- Halaman Hari ini membuat klien Supabase di browser dengan publishable key dan sesi login operator, lalu berlangganan perubahan `postgres_changes` (insert dan update) pada tabel itu. **[Usulan]**
- RLS berlaku untuk realtime:
  - staf menerima perubahan semua reservasi;
  - pelanggan hanya menerima perubahan miliknya;
  - tamu tidak menerima apa pun.
- Setiap perubahan memicu `router.refresh()` setelah jeda singkat (sekitar 1 detik), supaya beberapa perubahan beruntun cukup dimuat sekali. Data tetap dibaca ulang dari server, jadi aturan O7 tetap dijaga di satu tempat. **[Usulan]**
- Halaman juga dimuat ulang saat tab kembali aktif, dan saat koneksi realtime tersambung lagi setelah terputus.
- **Penanda koneksi**, dengan ikon dan teks, tidak hanya warna:
  - "Langsung";
  - "Menyambung ulang…";
  - "Terputus", dengan tombol **Muat ulang**.
- Reservasi baru yang masuk lewat realtime diumumkan ke pembaca layar lewat wilayah `aria-live="polite"`, misalnya "1 reservasi baru". **[Usulan]**

### 5.7 Sisi pelanggan

**Detail `/akun/reservasi/[kode]`**
- Status baru memakai label yang sudah ada di `reservationStatusLabel`: Check-in, Selesai, Tidak datang, dan Tidak tercatat.
- Kalau reservasi dibatalkan toko, statusnya ditulis "Dibatalkan toko" dan ada kotak "Alasan dari toko: …". Pembatalan oleh pelanggan tetap ditulis "Dibatalkan".
- Pembatalan dianggap dari toko kalau `cancel_reason` terisi, karena pelanggan tidak pernah mengisi alasan. **[Usulan]**
- QR dan tombol kalender hanya tampil untuk reservasi Terjadwal atau Check-in yang sesinya belum berakhir. Berkas `.ics` untuk reservasi lain menghasilkan 404. Dua catatan kecil dari review 1C-1 ikut selesai di sini. **[Usulan]**

**Reservasi saya dan ringkasan Akun**
- Bagian **Mendatang** dan kartu reservasi terdekat juga memuat reservasi Check-in yang sesinya belum berakhir.

**Tidak berubah**
- Pelanggan tidak menerima pembaruan realtime di 1C-2.

### 5.8 Nomor WhatsApp pelanggan (A4)

```
Catatan   [ opsional                                                    ]
Nomor WhatsApp  [ 0812-3456-7890        ]
          Dipakai toko kalau perlu ngabarin lu soal reservasi ini.
          [Konfirmasi reservasi]
```

**Di formulir `/reservasi/baru`**
- Kolom **Nomor WhatsApp** hanya tampil untuk pelanggan yang login dan profilnya belum punya nomor. Letaknya di atas tombol Konfirmasi.
- Pelanggan yang sudah punya nomor tidak melihat kolom ini.
- Tamu juga tidak melihat kolom ini. Kolomnya muncul setelah login kalau nomornya belum ada.
- Isian diterima dalam bentuk `0812…`, `+62 812…`, atau `62812…`, boleh dengan spasi atau tanda hubung. Hasilnya diubah ke bentuk `62…` sesuai aturan kolom `profiles.whatsapp` (`^62[0-9]{8,13}$`). **[Usulan]**
- Isian yang tidak sah menampilkan "Nomor WhatsApp belum benar. Contoh: 0812-3456-7890", dan Konfirmasi tidak dikirim.
- Nomor tidak disimpan di URL atau `sessionStorage`, karena termasuk data pribadi.

**Saat Konfirmasi**
- Server Action menyimpan nomor ke profil pelanggan lebih dulu, lewat policy "ubah milik sendiri" yang sudah ada, lalu memanggil `create_reservation`. **[Usulan]**
- Kalau reservasinya gagal, nomor tetap tersimpan. Pelanggan tidak perlu mengisinya lagi.

**Di database**
- `create_reservation` menolak pelanggan yang profilnya belum punya nomor, dengan kode galat `whatsapp_required`. Aturan ini berlaku juga untuk aplikasi Expo nanti.
- Teks galatnya: "Isi nomor WhatsApp dulu."

**Di sisi operator**
- Reservasi lama tanpa nomor menampilkan "Belum ada nomor WhatsApp".

## 6. Data dan database

### 6.1 Perubahan skema

- `store_settings` mendapat dua kolom **[Usulan]**:
  - `checkin_open_minutes int not null default 60 check (>= 0)`;
  - `no_show_after_minutes int not null default 15 check (>= 0)`.
- `reservations` masuk publikasi `supabase_realtime`.
- Extension `pg_cron` diaktifkan, lalu job penutupan otomatis dijadwalkan dari migrasi.
- `create_reservation` diganti (`create or replace`) dengan tambahan pemeriksaan nomor WhatsApp (§5.8). Parameternya tidak berubah.
- Tidak ada tabel baru. Tidak ada policy baru di `profiles` (§6.3).

### 6.2 Fungsi

| Fungsi | Untuk siapa | Isi |
|---|---|---|
| `staff_set_reservation_status(p_code text, p_status reservation_status, p_reason text default null)` | staf aktif (operator, pemilik) | Mengunci baris reservasi, memeriksa tabel perpindahan dan batas waktu §5.4, lalu mengubah status. Untuk pembatalan, fungsi ini juga mengisi `cancelled_at`, `cancelled_by` (staf), dan `cancel_reason` (alasan setelah spasi di awal dan akhir dibuang). |
| `reservation_contacts(p_reservation_ids uuid[])` | staf aktif | Mengembalikan `reservation_id`, `full_name`, dan `whatsapp` dari pemilik setiap reservasi yang ada. Maksimal 200 id per panggilan. `security definer` (O7, §6.3). |
| `close_overdue_reservations()` | job `pg_cron`, dan `service_role` untuk tes | Penutupan otomatis §5.5. Mengembalikan jumlah reservasi yang diubah. Tidak bisa dipanggil `anon` atau `authenticated`. |

- Semua fungsi memakai `set search_path = ''`.
- Hak `execute` dicabut dari `public` dan `anon`, lalu diberikan hanya kepada peran yang disebut di tabel.
- Galat memakai kode seperti di 1C-1 (`raise exception '<kode>' using errcode = 'P0001'`), lalu dipetakan ke teks di `packages/shared`:
  - `not_staff`;
  - `not_found`;
  - `invalid_transition`;
  - `checkin_too_early`;
  - `no_show_too_early`;
  - `session_over`;
  - `reason_required`;
  - `slot_conflict` (pelanggaran exclusion constraint saat reservasi diaktifkan lagi).
- Pemeriksaan "sesi mulai hari ini" memakai tanggal WIB dari `starts_at` dan `now()`.
- Fungsi pelanggan `cancel_reservation` dari 1C-1 tidak berubah.

### 6.3 Akses data pelanggan (O7)

- Linimasa dan detail membaca reservasi, item, varian, produk, merek, kategori (termasuk `hygiene_note`), unit, dan area lewat query biasa yang dijaga RLS 1C-1. Staf sudah bisa membaca semua reservasi.
- Nama dan WhatsApp diambil lewat `reservation_contacts`. Policy `profiles` tetap seperti sekarang: pelanggan membaca miliknya sendiri, pemilik membaca semua.
- Akibatnya, operator tidak bisa menelusuri tabel `profiles`. Data kontak hanya didapat lewat id reservasi yang memang bisa ia baca.
- Akun staf yang dinonaktifkan langsung kehilangan akses, karena `is_staff()` memeriksa `is_active`.

### 6.4 Kode bersama `packages/shared/src/reservation`

Semuanya fungsi murni yang dites dengan Vitest:
- `staffActions(reservasi, pengaturan, sekarang)`: daftar tombol yang berlaku sesuai §5.4;
- `normalizeReservationCode(isian)`: kode baku atau `null`, sesuai §5.2;
- normalisasi nomor WhatsApp ke bentuk `62…` dan format tampilannya, misalnya "0812-3456-7890" (§5.8);
- teks galat aksi staf, dan label "Dibatalkan toko";
- pengelompokan linimasa per jam WIB dan ringkasan angka per status;
- pembacaan baris (reservasi untuk operator, kontak, dan kolom pengaturan baru) menjadi tipe aplikasi.

## 7. Tampilan

- Mengikuti design system dan `DashboardShell` yang sudah ada:
  - chip status memakai ikon dan teks;
  - jam memakai huruf mono;
  - tombol Check-in memakai aksen demo;
  - Tidak datang dan Batalkan memakai gaya sekunder.
- Hari ini dirancang untuk HP lebih dulu, karena operator berdiri di lantai toko. Baris reservasi menumpuk di layar sempit dan tombolnya memenuhi lebar.
- Dialog kamera memakai `<dialog>` bawaan seperti di 1C-1. Pratinjau kamera tidak memakai animasi.
- Tidak ada gerak khas baru. Baris yang berubah lewat realtime tidak dianimasikan, cukup label "Baru".

## 8. Kriteria selesai

**Tes database**
- Setiap baris tabel §5.4 diterima pada waktunya dan ditolak di luar waktunya:
  - Check-in 61 menit sebelum mulai ditolak, 59 menit sebelum mulai diterima;
  - Check-in setelah akhir sesi ditolak;
  - Tidak datang 14 menit setelah mulai ditolak, 16 menit setelah mulai diterima;
  - Selesai dari Terjadwal ditolak;
  - Batalkan tanpa alasan ditolak;
  - Batalkan setelah akhir sesi ditolak;
  - Dibatalkan ke status apa pun ditolak;
  - Tidak datang kembali ke Check-in sebelum akhir sesi diterima;
  - Urungkan check-in sebelum akhir sesi diterima, sesudahnya ditolak;
  - Urungkan selesai di hari sesi diterima, keesokan harinya ditolak;
  - koreksi Tidak tercatat menjadi Selesai, Tidak datang, atau Dibatalkan (dengan alasan) diterima.
- Pembatalan staf dan Tidak datang melepas unit dan kursi. Unitnya bisa dipesan lagi untuk jam yang sama.
- Pelanggan, tamu, dan staf nonaktif tidak bisa memanggil `staff_set_reservation_status` maupun `reservation_contacts`.
- `reservation_contacts` hanya mengembalikan kontak pemilik reservasi yang diminta, dan menolak lebih dari 200 id.
- Operator tetap tidak bisa membaca `profiles` pelanggan secara langsung.
- `close_overdue_reservations`:
  - mengubah Check-in menjadi Selesai dan Terjadwal menjadi Tidak tercatat setelah batas tutup;
  - tidak menyentuh reservasi sebelum batasnya, atau reservasi yang sudah berstatus akhir;
  - hasilnya sama kalau dijalankan dua kali;
  - tidak bisa dipanggil `authenticated`.
- Job `pg_cron` terdaftar dengan jadwal `*/15 * * * *`.
- `create_reservation` menolak pelanggan tanpa nomor WhatsApp dengan `whatsapp_required`, dan menerima pelanggan yang punya nomor.
- `reservations` ada di publikasi `supabase_realtime`.

**Tes unit**
- `staffActions`, `normalizeReservationCode`, pengelompokan per jam, dan teks galat.

**E2E**
- Operator melihat reservasi hari ini lengkap dengan:
  - nama dan WhatsApp pelanggan;
  - unit dan area;
  - catatan kebersihan headset;
  - catatan pelanggan.
- Alur Check-in lalu Selesai di linimasa.
- Tidak datang setelah 15 menit.
- Batalkan dengan alasan di halaman detail. Pelanggan lalu melihat "Dibatalkan toko" beserta alasannya.
- Cari kode yang diketik huruf kecil tanpa `L2D-` membuka detail yang benar. Kode asing menghasilkan 404.
- Reservasi yang dibuat dari luar halaman muncul di Hari ini tanpa memuat ulang, dalam 10 detik.
- Tidak tercatat tampil di Perlu dikoreksi dan hilang setelah dikoreksi.
- Pelanggan tanpa nomor WhatsApp:
  - melihat kolom nomor di formulir;
  - mendapat pesan kalau isiannya tidak sah;
  - setelah reservasi berhasil, nomornya tersimpan di profil dan tampil di layar operator;
  - pada reservasi berikutnya, kolom itu tidak tampil lagi.
- Pelanggan tidak bisa membuka `/operator`.
- Tanpa scroll horizontal di 360 px.

**Pemeriksaan proyek**
- `pnpm check`, `pnpm typecheck`, tes unit, tes RLS, dan e2e lulus.
- Scan kamera dicek manual di HP Android dan di webcam laptop Windows, karena tidak bisa diuji otomatis.

## 9. Diputuskan pemilik produk

- Sisa Fase 1C dipecah lagi. 1C-2 berisi reservasi di sisi operator. Unit, servis, walk-in, dan showroom masuk 1C-3 (27 November 2026).
- Alur 1C-2 seperti §5 disetujui (27 November 2026):
  - linimasa Hari ini yang diperbarui langsung;
  - cari lewat kode, alat scan, atau kamera;
  - aturan waktu Check-in, Tidak datang, Selesai, dan Batalkan;
  - penutupan otomatis dan koreksi;
  - O7;
  - status baru dan alasan pembatalan di halaman pelanggan.
- Pembaruan langsung memakai Supabase Realtime (pendekatan A, 27 November 2026).
- Nomor WhatsApp pelanggan diminta di formulir reservasi kalau belum ada, dan reservasi tanpa nomor ditolak database (27 November 2026).
- Scan kamera harus jalan juga di webcam laptop Windows dan iPhone, dengan pustaka QR tambahan sebagai cadangan `BarcodeDetector` (27 November 2026).
- Desain ini disetujui, termasuk keputusan penyusun di §10 (27 November 2026).
- Sisanya mengikuti PRD: alur status R8, penutupan dua jam setelah tutup (R12), catatan kebersihan per kategori (R14), dan batas akses O7.

## 10. Keputusan penyusun (bisa dikoreksi)

1. Penutupan otomatis memakai job `pg_cron` di database setiap 15 menit, bukan cron di Vercel.
2. Semua perubahan status oleh staf lewat satu fungsi dengan tabel perpindahan. Web menampilkan tombol dengan fungsi bersama yang sama aturannya.
3. Angka 60 menit (check-in dibuka) dan 15 menit (tidak datang) disimpan di `store_settings`.
4. Tidak datang bisa dikembalikan ke Check-in selama sesi belum berakhir, untuk pelanggan yang terlambat.
5. Staf bisa membatalkan reservasi Terjadwal atau Check-in sebelum sesi berakhir. Alasannya 3–200 karakter dan tampil di halaman pelanggan.
6. Batas tutup otomatis adalah yang paling akhir dari jam tutup + 2 jam dan akhir sesi + 2 jam.
7. Bagian Perlu dikoreksi menampilkan Tidak tercatat dari 7 hari terakhir.
8. Realtime memakai `postgres_changes` dengan RLS, lalu memuat ulang data dari server. Ada penanda koneksi, dan halaman dimuat ulang saat tab kembali aktif.
9. Pustaka QR cadangan untuk scan kamera adalah `jsQR`, dan baru dimuat saat dialog kamera dibuka.
10. Kontak pelanggan diambil lewat fungsi `reservation_contacts`. Policy `profiles` tidak diubah.
11. Linimasa menampilkan semua reservasi hari ini, termasuk yang dibatalkan (diredupkan). Batalkan hanya ada di halaman detail.
12. Label "Baru" untuk reservasi yang dibuat dalam 15 menit terakhir.
13. Hari ini hanya menampilkan hari ini. Hari lain dibuka lewat kode.
14. Aksi di linimasa tanpa dialog konfirmasi. Check-in dan Selesai yang tidak sengaja ditekan bisa diurungkan (Check-in sampai sesi berakhir, Selesai sampai hari sesi berganti). Tidak datang bisa dikembalikan ke Check-in.
18. Tidak tercatat bisa dibatalkan staf dengan alasan, untuk hari yang ternyata tutup.
19. Nomor WhatsApp disimpan ke profil lebih dulu, baru reservasi dibuat. Kalau reservasinya gagal, nomornya tetap tersimpan.
20. Isian nomor menerima `08…`, `+62…`, dan `62…`, lalu disimpan sebagai `62…`.
15. QR dan tombol kalender pelanggan hanya untuk reservasi aktif yang belum berakhir. `.ics` lain menghasilkan 404.
16. "Dibatalkan toko" ditentukan dari `cancel_reason` yang terisi.
17. Email pembatalan dari toko ditunda sampai deploy, sama seperti 1C-1.

## 11. Menunggu jawaban pemilik produk

Tidak ada.

## 12. Diserahkan ke builder

- SQL persis untuk kolom baru, fungsi, lock, publikasi, dan jadwal `pg_cron`, selama aturan §5.4, §5.5, dan §6 terpenuhi. Cara mengaktifkan `pg_cron` mengikuti dokumentasi Supabase untuk proyek hosted.
- Cara tes database dan e2e membuat reservasi di waktu tertentu (sedang berlangsung, kemarin, dan sebagainya). Fungsi `create_reservation` tidak bisa membuat reservasi yang sudah lewat atau kurang dari 60 menit lagi, jadi tes kemungkinan menyisipkan baris langsung dengan secret key di fixture.
- Ketahanan tes terhadap job yang berjalan di database dev bersama. Job bisa menutup reservasi tes kapan saja. Tes sebaiknya memeriksa hasil akhir, bukan jumlah baris yang diubah.
- Akun tes yang sudah ada (persona tes database dan akun e2e) perlu diberi nomor WhatsApp, supaya tes reservasi 1C-1 tetap lulus setelah `create_reservation` mewajibkan nomor. Satu akun tanpa nomor disiapkan untuk menguji §5.8.
- Ketahanan e2e terhadap jam saat tes dijalankan, termasuk tengah malam WIB, karena aturan Check-in memakai tanggal WIB.
- Pembagian komponen, nama file, dan nama tipe.
- Bentuk klien Supabase di browser (`createBrowserClient` dari `@supabase/ssr`).
- Format tampilan nomor WhatsApp.
- Teks kecil, selama nadanya sama dengan 1C-1.
- Opsional: skrip pengembangan untuk mengisi contoh reservasi hari ini, supaya pemilik bisa mengecek Hari ini secara manual.
