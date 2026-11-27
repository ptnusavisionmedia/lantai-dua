# Fase 1C-1 — Reservasi Sesi Demo untuk Pelanggan: Desain

| | |
|---|---|
| Tanggal | 27 November 2026 |
| Status | Disetujui pemilik produk, 27 November 2026 |
| Bagian dari | Fase 1 (Web MVP). Fase 1C dipecah dua: 1C-1 (bagian pelanggan, dokumen ini) dan 1C-2 (operator dan showroom). |
| Dasar | [PRD](../../PRD.md) §6.3, §8, §9.6 (R1–R5, R7, R8, R13), §9.9 (U1, U2), §10.1, §11, §11.1, §11.2, §12.4, §13 · [Design system](../../../design-system/lantai-dua/MASTER.md) · [Desain 1B](2026-11-26-fase-1b-bandingkan-design.md) §5.7 |

> Tanda **[Usulan]** = keputusan penyusun yang belum dikonfirmasi pemilik produk. Yang tidak bertanda sudah diputuskan pemilik produk, atau sudah ada di PRD.

## 1. Maksud

Reservasi sesi demo adalah inti janji "Coba dulu. Baru pilih." Pelanggan memilih varian demo yang ingin dicoba, memilih jam yang masih kosong, lalu datang ke lantai dua dan unitnya sudah disiapkan.

Contohnya Raka (PRD §10.1). Dari Bandingkan ia menekan **Coba keduanya**, login, lalu sampai di formulir yang sudah berisi mouse incarannya dan saran membawa mouse lamanya. Ia memilih Sabtu pukul 14.00, lalu menerima kode reservasi beserta QR. Di bagian ini, ia juga bisa melihat dan membatalkan reservasinya sendiri.

Yang paling penting dari sisi teknis: **satu unit tidak pernah dipesan dua orang di jam yang sama, dan meja tidak pernah dipesan melebihi kapasitasnya**, walaupun dua orang menekan Konfirmasi di detik yang sama.

## 2. Tujuan, non-tujuan, anti-tujuan

**Tujuan**
- Formulir `/reservasi/baru` berisi pilihan 1–4 varian demo, tanggal, slot, dan catatan. Formulir bisa dibuka tamu, dan tombol Konfirmasi meminta login (R1).
- Slot yang tidak bisa dipilih tetap tampil, disertai alasannya (R2), dengan angka dari pengaturan toko (R3).
- Kode reservasi, QR, daftar yang disiapkan, alamat, dan tombol tambah ke kalender (R4, tanpa email).
- Pelanggan bisa membatalkan sampai batas waktu yang ditentukan (R5).
- Aturan anti-bentrok dijamin database (R7, PRD §11.1 poin 1–2, 4, 5).
- Halaman **Reservasi saya** (daftar dan detail) dan kartu reservasi terdekat di ringkasan Akun (U1, U2).

**Non-tujuan (dikerjakan di bagian lain)**
- Semua yang dikerjakan staf masuk ke 1C-2:
  - check-in, Selesai, Tidak datang, dan batal oleh staf (R8, O2);
  - linimasa Hari ini (O1);
  - ubah status unit, servis, dan pemindahan reservasi terdampak (O5, R6);
  - walk-in (R9);
  - tutup otomatis (R12);
  - halaman showroom dan pembaruan realtime (S1–S5, O6).
- Email konfirmasi dan pembatalan (R4, §9.12). Pengirimannya butuh SMTP dan domain sendiri, yang dipasang saat deploy (PRD §18). Di 1C-1 pemberitahuan cukup tampil di halaman detail reservasi.
- Pengingat (R10), aturan tidak datang (R11), dan ubah jadwal langsung. Ubah jadwal dilakukan dengan membatalkan lalu membuat reservasi baru (R5).
- Area lain selain Meja Kontrol (Fase 4). Skema tetap disiapkan untuk banyak area (R13).

**Anti-tujuan**
- Satu unit atau satu kursi meja terpakai dua kali di waktu yang tumpang tindih.
- Slot terlihat bisa dipilih padahal pasti ditolak, kecuali kalau keduluan orang lain dalam hitungan detik.
- Alasan slot yang membocorkan siapa yang memesan.
- Jam yang tidak ditampilkan dalam WIB, atau tanggal yang bergeser karena zona waktu.
- Kode reservasi yang mudah ditebak, atau reservasi orang lain yang bisa dibuka lewat kode.
- Isian pelanggan yang hilang setelah ia login.

## 3. Batasan

- Semua Global Constraints Fase 0, 1A, dan 1B tetap berlaku. Di antaranya: Bahasa Indonesia, RLS di semua tabel, secret key tidak pernah dipakai di web, target sentuh 44 px, tanpa scroll horizontal dari 360 px, dan menghormati mode kurangi gerakan.
- **Ketersediaan dihitung database (PRD §12.4 poin 1).** Web dan aplikasi hanya menampilkan hasilnya.
- Waktu disimpan sebagai `timestamptz` dan ditampilkan dalam Asia/Jakarta (WIB, tanpa daylight saving). Format tanggal mengikuti PRD §13: "Sab, 28 Nov 2026 · 14.00 WIB".
- Reservasi dan itemnya hanya dibuat dan diubah lewat fungsi database (PRD §11.2).
- Logika formulir, label alasan, format tanggal, dan berkas kalender ditulis di `packages/shared`, supaya aplikasi Expo bisa memakainya ulang.

## 4. Pendekatan yang dipertimbangkan

**Pembagian Fase 1C** (dipilih pemilik produk, 27 November 2026)

| Pilihan | Keterangan |
|---|---|
| **Pecah, pelanggan dulu (dipilih)** | 1C-1 berisi alur pelanggan dan aturan anti-bentrok. 1C-2 berisi operator dan showroom. Alur Coba keduanya dari 1B langsung lengkap, dan bagian paling berisiko dikerjakan lebih dulu. |
| Pecah, operator dulu | Status unit dan showroom lebih cepat terlihat, tetapi R6 harus dibuka lagi saat reservasi dibuat. |
| Satu paket | Gambarannya utuh, tetapi rencananya sangat panjang dan review baru terjadi di akhir. |

**Penjaga anti-bentrok** (dipilih pemilik produk, 27 November 2026)

| Pilihan | Keterangan |
|---|---|
| **A. Constraint database dan fungsi slot (dipilih)** | Exclusion constraint Postgres menjaga unit dan "kursi" meja bernomor. Satu fungsi database menghitung slot beserta alasannya. Aturan tetap berlaku untuk aplikasi mana pun dan nyambung ke blok servis di 1C-2. |
| B. Tabel slot dibuat duluan | Mudah dibayangkan, tetapi butuh job harian, harus dibangun ulang saat jam buka atau libur berubah, dan blok servis menjadi rumit. |
| C. Hitung di web | Ditolak. Dua pemesanan di detik yang sama bisa lolos, dan PRD §11.1 melarangnya. |

## 5. Halaman dan perilaku

### 5.1 Formulir `/reservasi/baru`

```
Reservasi demo                                     Meja Kontrol · sesi 30 menit
Yang mau disiapin (maks. 4)
 [VortexSeries Ignix F1 · Putih  ✕]  [Razer DeathAdder V3 Pro · Hitam  ✕]  [+ Tambah]
 Mouse lama lu nggak ada di showroom? Bawa aja dari rumah biar bisa dibandingin langsung.

Tanggal   [Hari ini] [Besok] [Sab 29] [Min 30] [Sen 1] …            (hari libur: "Tutup")
Jam       [10.00] [10.30] [11.00 ✕] [11.30] …
          11.00 — Unit demo Razer DeathAdder V3 Pro sudah dipesan di jam ini
Catatan   [ opsional                                                    ]
          [Konfirmasi reservasi]
```

**Pilihan varian**
- Isi awal diambil dari parameter `varian` (daftar SKU dipisah koma), dari detail produk, Bandingkan, atau tautan lain.
- SKU yang tidak dikenal, varian tanpa unit demo sama sekali (atau hanya unit pensiun, atau di area yang tidak bisa direservasi), SKU ganda, dan isian lebih dari 4 diabaikan tanpa error.
- **Varian yang semua unitnya sedang diservis tetap masuk** sebagai pilihan. Semua slotnya nonaktif dengan alasan "Unit demo <nama> sedang diservis", dan pelanggan bisa menghapusnya. Tombol demo di detail produk dan Coba keduanya di 1B juga menautkan varian seperti ini, jadi pelanggan tidak mendarat di formulir kosong. **[Usulan]**
- Tombol **+ Tambah** membuka daftar varian yang bisa direservasi, dikelompokkan per kategori. Varian yang semua unitnya diservis tampil nonaktif dengan label "Sedang diservis". Pad dan deskmat tidak muncul karena bisa dicoba bebas. Satu varian hanya bisa dipilih sekali.
- Setiap pilihan bisa dihapus (`✕`). Kalau sudah ada 4, tombol Tambah nonaktif dengan teks "Maksimal 4 unit demo per reservasi."

**Saran membawa mouse lama**
- Kalau parameter `bawa` berisi slug mouse atau `ukur`, saran B8 tampil persis seperti di 1B.

**Tanggal**
- Deretan tanggal dari hari ini sampai `max_days_ahead` hari ke depan, dalam WIB. Labelnya "Hari ini", "Besok", lalu "Sab 29".
- Tanggal tutup (jam buka kosong atau ada di `store_closures`) tetap tampil, tetapi nonaktif dengan teks "Tutup".
- Isi awalnya tanggal dari URL kalau sah. Kalau tidak, tanggal pertama yang masih punya slot bisa dipilih untuk varian yang dipilih. **[Usulan]**

**Slot**
- Slot dimulai dari jam buka dan berjarak `session_minutes` (30 menit). Slot terakhir harus selesai paling lambat saat toko tutup.
- Setiap slot tampil. Slot yang tidak bisa dipilih menampilkan alasan pertama yang berlaku, dengan urutan **[Usulan]**:
  1. "Toko tutup";
  2. "Sudah lewat";
  3. "Pesan paling lambat 1 jam sebelum sesi" (angka dari `min_lead_minutes`);
  4. "Lu udah punya reservasi di jam ini" (hanya untuk pelanggan yang login);
  5. "Meja penuh";
  6. "Unit demo <nama varian> sedang diservis" (varian tanpa unit yang bisa ditugaskan sama sekali);
  7. "Unit demo <nama varian> sudah dipesan di jam ini".
- Alasan tidak pernah menyebut siapa yang memesan.
- **Satu pelanggan tidak bisa punya dua reservasi aktif yang waktunya tumpang tindih**, supaya satu orang tidak memakai dua meja. Reservasi berurutan, misalnya 14.00 lalu 14.30, tetap boleh. **[Usulan]**
- Tanpa varian terpilih, slot dihitung hanya dari meja, dan tombol Konfirmasi nonaktif dengan teks "Pilih minimal satu unit demo."
- Slot ditampilkan sebagai tombol radio. Alasan slot terpilih atau slot yang sedang difokus dibacakan lewat `aria-describedby`.

**Catatan**
- Opsional, maksimal 500 karakter.
- Tidak disimpan di URL. Isinya disimpan sementara di `sessionStorage`, supaya tidak hilang saat tamu login di tab yang sama, lalu dihapus setelah reservasi berhasil dibuat. **[Usulan]**
- Kalau tamu mendaftar lalu memverifikasi email di tab baru, varian, tanggal, dan jam tetap kembali lewat URL, tetapi catatannya tidak ikut. Ini disengaja: catatan bersifat opsional dan bisa berisi data pribadi, jadi tidak disimpan lebih lama di browser. **[Usulan]**

**URL**
- Bentuk: `/reservasi/baru?varian=<sku>,<sku>&tanggal=2026-11-28&jam=14.00&bawa=<slug|ukur>`. **[Usulan]**
- Setiap perubahan memakai `history.replaceState`, supaya tombol Back keluar dari formulir dan tidak menelusuri setiap klik. **[Usulan]**
- Parameter yang tidak sah diabaikan: tanggal di luar rentang, jam yang tidak ada di jadwal, dan `bawa` yang bukan slug atau `ukur`.

**Konfirmasi**
- **Tamu:** tombol berisi "Masuk untuk konfirmasi" dan mengarah ke `/masuk?next=<URL formulir saat ini>`. Setelah login, pelanggan kembali ke formulir dengan varian, tanggal, jam, dan catatan yang sama (PRD §6.3 poin 2).
- **Pelanggan aktif:** tombol "Konfirmasi reservasi" memanggil Server Action. Kalau berhasil, pelanggan diarahkan ke halaman detail reservasi dengan pemberitahuan "Reservasi berhasil dibuat."
- **Staf dan akun nonaktif:** tombol diganti teks "Reservasi dibuat dari akun pelanggan." **[Usulan]**
- **Kalau database menolak** (misalnya slot baru saja diambil orang lain), pesan tampil di atas tombol, daftar slot dimuat ulang, dan pilihan lain tidak berubah.
- Pesan galat **[Usulan]**:
  - "Slot ini baru saja penuh. Pilih jam lain."
  - "Unit demo <nama> baru saja dipesan orang lain di jam ini."
  - "Lu udah punya 2 reservasi aktif. Batalkan salah satu dulu, atau tunggu sampai sesinya lewat."
  - "Lu udah punya reservasi di jam ini."
  - "Unit demo <nama> sedang diservis."
  - "Terlalu banyak reservasi dibuat hari ini. Coba lagi besok."
  - "Gagal menyimpan. Coba lagi sebentar."

### 5.2 Detail reservasi `/akun/reservasi/[kode]`

- Isinya:
  - kode (misalnya `L2D-H7K3QX9P`) dan QR berisi kode itu;
  - status;
  - jadwal "Sab, 28 Nov 2026 · 14.00–14.30 WIB";
  - area;
  - daftar yang disiapkan (nama varian lengkap dan kode unit);
  - catatan;
  - alamat toko, tautan peta, dan tautan WhatsApp toko.
- **Tambah ke kalender:** berkas `.ics` untuk diunduh dan tautan Google Calendar. **[Usulan]**
- **Batalkan:**
  - Tombol tampil untuk reservasi Terjadwal sampai `cancel_cutoff_minutes` (60 menit) sebelum sesi. Pembatalan meminta konfirmasi lewat dialog.
  - Setelah batas lewat, tombol diganti teks "Batas batal sudah lewat. Hubungi toko lewat WhatsApp."
- Reservasi yang dibatalkan tetap bisa dibuka. Statusnya Dibatalkan, tanpa QR dan tanpa tombol kalender.
- Kode milik orang lain, atau kode yang tidak ada, menghasilkan 404 tanpa membedakan keduanya.

### 5.3 Reservasi saya `/akun/reservasi`

- Dua bagian:
  - **Mendatang**: Terjadwal yang belum selesai, urut dari yang paling dekat;
  - **Riwayat**: sisanya, urut dari yang terbaru.
- Setiap baris berisi jadwal, ringkasan varian (misalnya "Ignix F1 · Putih + 1 lainnya"), status, dan tautan ke detail.
- Kalau kosong, tampil ajakan dan tombol "Reservasi demo".

### 5.4 Ringkasan Akun `/akun`

- Kartu "Reservasi" menampilkan reservasi Terjadwal terdekat beserta QR dan tautan ke detailnya (U1). Kalau tidak ada, tampil ajakan "Belum ada reservasi" dengan tombol "Reservasi demo".

### 5.5 Pintu masuk yang sudah ada

- Tombol "Reservasi Demo" di beranda, tombol demo di detail produk (`?varian=<sku>`), dan Coba keduanya dari Bandingkan (`?varian=…&bawa=…`) tidak berubah.
- Halaman showroom baru menautkan formulir ini di 1C-2.

## 6. Data dan database

### 6.1 Tabel

- Extension `btree_gist` diaktifkan untuk exclusion constraint.
- Enum `reservation_status` langsung berisi semua status R8: `scheduled`, `checked_in`, `completed`, `cancelled`, `no_show`, dan `unrecorded`. Di 1C-1, pelanggan hanya bisa membuat `scheduled` dan mengubahnya menjadi `cancelled`. Perpindahan lain ditambahkan di 1C-2.
- Status **aktif** berarti `scheduled` atau `checked_in`.

| Tabel | Kolom utama | Aturan |
|---|---|---|
| `reservations` | `id`, `code` (unik), `customer_id` (→ `profiles`, cascade), `starts_at`, `ends_at`, `status`, `note` (≤ 500), `cancelled_at`, `cancelled_by`, `cancel_reason`, `created_at`, `updated_at` | `ends_at > starts_at`. Kode berformat `L2D-` + 8 karakter dari alfabet tanpa huruf mirip (tanpa 0, O, 1, I, L). Exclusion: `(customer_id with =, tstzrange(starts_at, ends_at) with &&) where (status in ('scheduled', 'checked_in'))`, jadi satu pelanggan tidak punya dua reservasi aktif yang tumpang tindih. |
| `reservation_items` | `id`, `reservation_id`, `variant_id`, `unit_id`, `period` (`tstzrange`), `is_active` | `unique (reservation_id, variant_id)`. Exclusion: `(unit_id with =, period with &&) where (is_active)`. Unit harus dari varian itu. |
| `reservation_seats` | `id`, `reservation_id`, `area_id`, `seat_no`, `period`, `is_active` | Exclusion: `(area_id with =, seat_no with =, period with &&) where (is_active)`. Saat insert, `seat_no` harus antara 1 dan kapasitas area. Satu kursi per area yang dibutuhkan reservasi (R13). |

- `is_active` pada item dan kursi disamakan otomatis oleh trigger setiap kali status reservasi berubah. Kolom ini ada karena exclusion constraint tidak bisa melihat tabel lain.
- Perubahan status reservasi tercatat di `audit_logs` lewat trigger audit yang sudah ada. **[Usulan]**

### 6.2 Unit yang bisa ditugaskan

Unit bisa ditugaskan kalau memenuhi semua syarat berikut:
- statusnya `available` atau `in_use` (R9: dipakai walk-in tidak membatalkan reservasi);
- area aktif dan `is_reservable`;
- varian aktif;
- produk aktif dan dijual, di kategori aktif dengan cara coba `unit`.

Unit `servicing` tidak ditugaskan sama sekali di 1C-1, karena perkiraan selesainya baru ada di 1C-2. Di 1C-2, syarat ini diganti dengan blok waktu servis. **[Usulan]**

Dari unit yang bisa ditugaskan dan kosong di rentang itu, yang dipilih adalah unit dengan kode terkecil. Kursi yang dipilih adalah nomor kursi kosong terkecil.

### 6.3 Fungsi

| Fungsi | Untuk siapa | Isi |
|---|---|---|
| `reservable_variants()` | tamu, pelanggan | Varian yang bisa direservasi: SKU, nama varian, nama produk dan merek, kategori, area, jumlah unit yang bisa ditugaskan, dan jumlah unit yang sedang diservis. Varian dengan 0 unit yang bisa ditugaskan tetap ikut kalau punya unit diservis (§5.1). |
| `reservation_slots(p_date date, p_variant_ids uuid[])` | tamu, pelanggan | Satu baris per slot di tanggal itu: `starts_at`, `ends_at`, `available`, `reason` (kode alasan), dan `reason_variant_id`. `security definer`, karena harus melihat reservasi orang lain tanpa membuka isinya. Kalau pemanggilnya pelanggan yang login, slot yang bertabrakan dengan reservasi aktifnya sendiri diberi alasan `own_overlap`. Untuk tamu, alasan itu tidak pernah muncul. |
| `create_reservation(p_variant_ids uuid[], p_starts_at timestamptz, p_note text)` | pelanggan aktif | Memeriksa semua aturan, menugaskan unit dan kursi, membuat reservasi, lalu mengembalikan kodenya. |
| `cancel_reservation(p_code text)` | pelanggan pemilik reservasi | Membatalkan reservasi Terjadwal miliknya sendiri sebelum batas waktu. |

**Aturan `create_reservation`**
- Jumlah varian 1–4, tanpa duplikat, dan semuanya bisa direservasi.
- `p_starts_at` harus tepat di salah satu slot jadwal hari itu, dalam jam buka, bukan hari libur, paling cepat `min_lead_minutes` dari sekarang, dan paling lambat `max_days_ahead` hari ke depan.
- Pelanggan belum punya `max_active_reservations` reservasi aktif yang belum lewat.
- Pembatasan pembuatan reservasi (PRD §13): maksimal 10 reservasi dibuat per pelanggan dalam 24 jam, termasuk yang dibatalkan. **[Usulan]**
- Pemilihan unit dan kursi dilakukan setelah lock transaksi per area per slot dan per varian, dengan urutan tetap supaya tidak saling kunci. Exclusion constraint tetap menjadi penjaga terakhir.
- Pelanggan belum punya reservasi aktif yang tumpang tindih dengan slot ini.
- Galat memakai pesan berkode yang dipetakan ke teks di `packages/shared`, misalnya `slot_unavailable`, `desk_full`, `unit_taken`, `unit_servicing`, `own_overlap`, `too_many_active`, `rate_limited`, `invalid_items`, `outside_hours`, `too_soon`, dan `too_far`.

### 6.4 RLS

| Data | Tamu | Pelanggan | Operator | Pemilik |
|---|---|---|---|---|
| `reservations` | – | Baca miliknya | Baca semua | Baca semua |
| `reservation_items` | – | Baca milik reservasinya | Baca semua | Baca semua |
| `reservation_seats` | – | – | Baca semua | Baca semua |

- Tidak ada policy insert, update, atau delete untuk siapa pun. Semua perubahan lewat fungsi di §6.3.
- Operator di 1C-1 baru bisa membaca. Perubahan oleh staf datang di 1C-2.

### 6.5 Kode bersama `packages/shared/src/reservation`

Semuanya fungsi murni yang dites dengan Vitest:
- membaca dan menulis URL formulir (§5.1);
- tanggal dan slot dalam WIB: deretan tanggal, label "Hari ini" / "Besok" / "Sab 29", format "Sab, 28 Nov 2026 · 14.00 WIB", dan parameter `jam`;
- teks alasan slot dan pesan galat;
- format dan pemeriksaan kode reservasi;
- isi berkas `.ics` dan tautan Google Calendar;
- pembacaan baris tabel menjadi tipe aplikasi.

## 7. Tampilan

- Mengikuti design system: tombol demo (aksen tembaga) untuk Konfirmasi, chip status dengan ikon dan teks, dan angka jam dengan huruf mono.
- Deretan tanggal bisa digeser ke samping di dalam wadahnya sendiri tanpa membuat halaman bergeser. Grid slot menyesuaikan lebar layar.
- QR dibuat di server sebagai SVG dengan pustaka `qrcode` (dependensi baru). **[Usulan]**
- Tidak ada gerak khas baru. Perpindahan antartanggal memakai transisi standar yang hilang di mode kurangi gerakan.

## 8. Kriteria selesai

- Formulir bekerja untuk:
  - tamu, termasuk kembali dari login dengan varian, tanggal, jam, dan catatan yang sama;
  - pelanggan yang datang dari detail produk, dari Bandingkan (dengan saran B8), dan dari formulir kosong;
  - URL rusak: SKU asing, tanggal di luar rentang, jam asing, atau lebih dari 4 varian.
- Slot menampilkan alasan sesuai §5.1 untuk hari tutup, slot lewat, batas waktu, reservasi sendiri di jam yang sama, meja penuh, unit diservis, dan unit sudah dipesan.
- Varian yang semua unitnya diservis (misalnya HyperX Cloud II di data seed) tetap muncul di formulir, dan semua slotnya nonaktif dengan alasan diservis.
- Tes database:
  - dua pelanggan yang memesan unit yang sama di slot yang sama secara bersamaan menghasilkan tepat satu reservasi;
  - empat reservasi bersamaan untuk tiga meja menghasilkan tepat tiga;
  - reservasi yang dibatalkan membebaskan unit dan kursinya;
  - satu pelanggan tidak bisa punya dua reservasi aktif yang tumpang tindih, tetapi reservasi berurutan boleh;
  - batas 2 reservasi aktif, batas 10 per 24 jam, jadwal, dan batas waktu ditegakkan.
- Tes RLS:
  - pelanggan tidak bisa membaca reservasi orang lain;
  - tamu, staf, dan akun nonaktif tidak bisa membuat reservasi;
  - tidak ada yang bisa mengubah tabel reservasi secara langsung.
- `reservation_slots` bisa dipanggil tamu dan tidak mengembalikan data pribadi.
- Detail reservasi menampilkan kode, QR, jadwal WIB, daftar unit, alamat, `.ics`, dan tautan Google Calendar. Pembatalan bekerja sebelum batas waktu dan ditolak sesudahnya.
- Reservasi saya dan kartu ringkasan Akun menampilkan data yang benar.
- `/akun/reservasi/<kode orang lain>` menghasilkan 404.
- Tanpa scroll horizontal di 360 px.
- `pnpm check`, `pnpm typecheck`, tes unit, tes RLS, dan e2e lulus.

## 9. Diputuskan pemilik produk

- Fase 1C dipecah dua, dan bagian pelanggan dikerjakan lebih dulu (27 November 2026).
- Alur 1C-1 seperti §5 disetujui (27 November 2026).
- Anti-bentrok memakai constraint database dan fungsi slot (pendekatan A, 27 November 2026).
- Sisanya mengikuti PRD: 1–4 varian, sesi 30 menit, minimal 1 jam sebelumnya, maksimal 14 hari ke depan, maksimal 2 reservasi aktif, dan batal sampai 1 jam sebelum sesi.

## 10. Keputusan penyusun (bisa dikoreksi)

1. Email konfirmasi dan pembatalan ditunda sampai SMTP dipasang saat deploy.
2. Pilihan formulir disimpan di URL dengan `replaceState`. Catatan disimpan di `sessionStorage`, bukan di URL.
3. Tanggal awal adalah tanggal pertama yang masih punya slot bisa dipilih.
4. Urutan alasan slot seperti §5.1, tanpa menyebut siapa yang memesan.
5. Staf dan akun nonaktif tidak bisa membuat reservasi dari formulir ini.
6. Enum status langsung berisi semua status R8, walaupun di 1C-1 hanya dua yang dipakai.
7. Unit `servicing` tidak ditugaskan sampai blok servis hadir di 1C-2. Unit `in_use` tetap bisa ditugaskan untuk jadwal ke depan.
8. Unit dengan kode terkecil dan kursi dengan nomor terkecil dipilih lebih dulu.
9. Batas pembuatan 10 reservasi per pelanggan per 24 jam.
10. QR memakai pustaka `qrcode` dan dibuat di server sebagai SVG.
11. Tambah ke kalender lewat berkas `.ics` dan tautan Google Calendar.
12. Perubahan status reservasi masuk `audit_logs`.
13. Varian yang semua unitnya diservis tetap masuk formulir, dengan semua slot nonaktif dan alasannya.
14. Satu pelanggan tidak bisa punya dua reservasi aktif yang tumpang tindih. Reservasi berurutan boleh.
15. Catatan hanya bertahan di tab yang sama. Alur daftar lalu verifikasi email di tab baru membawa kembali varian, tanggal, dan jam, tetapi tidak membawa catatan.

## 11. Menunggu jawaban pemilik produk

Tidak ada.

## 12. Diserahkan ke builder

- SQL persis untuk tabel, constraint, trigger, fungsi, lock, dan policy, selama aturan §6 terpenuhi.
- Pembagian komponen, nama file, dan bentuk daftar "+ Tambah" (dialog, sheet, atau halaman).
- Teks kecil seperti ajakan halaman kosong, selama nadanya sama dengan 1A dan 1B.
- Cara deretan tanggal dan grid slot menyesuaikan layar sempit.
- Cara tes e2e membersihkan reservasi yang dibuatnya, karena database dev dipakai bersama dan batas 2 reservasi aktif berlaku untuk akun tes.
