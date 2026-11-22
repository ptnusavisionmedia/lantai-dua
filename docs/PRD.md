# PRD — LANTAI DUA

**Toko periferal gaming "coba dulu, baru pilih" di Surabaya**

| | |
|---|---|
| Versi | 0.1 — draf untuk direview |
| Tanggal | 22 November 2026 |
| Pemilik produk | Farel Wisnu Pratama — project magang, SMKN 10 Surabaya |
| Platform | Web (Next.js) + aplikasi mobile, satu database Supabase |

> **Cara membaca dokumen ini.** Bagian bertanda **[Usulan]** adalah keputusan penyusun yang mengubah apa yang dibangun, dan belum dikonfirmasi pemilik produk. Detail turunan yang tidak bertanda, misalnya persona, model data, dan rincian RLS, juga rancangan penyusun. Builder boleh mengubahnya selama aturan dan tujuannya tetap terpenuhi. Asal keputusan-keputusan utama dicatat di §20, dan pertanyaan yang masih menunggu jawaban pemilik produk ada di §19.

---

## Daftar isi

1. Ringkasan
2. Latar belakang dan cerita brand
3. Masalah yang diselesaikan
4. Tujuan, non-tujuan, anti-tujuan
5. Pengguna dan persona
6. Peran dan hak akses
7. Platform dan cakupan
8. Peta halaman
9. Kebutuhan fungsional
10. Alur utama
11. Model data
12. Arsitektur teknis
13. Kebutuhan non-fungsional
14. Identitas visual
15. Konten dan data contoh
16. Tahapan rilis
17. Metrik keberhasilan
18. Risiko dan mitigasi
19. Pertanyaan
20. Catatan keputusan
21. Glosarium

---

## 1. Ringkasan

LANTAI DUA adalah toko periferal gaming fiktif di Surabaya. Toko ini dikenal karena pelanggan boleh mencoba barang sebelum membeli. Produk digitalnya terdiri dari **satu situs web** dan **satu aplikasi mobile** yang memakai **satu database Supabase yang sama**.

Ada tiga jenis pengguna terdaftar, masing-masing dengan dashboard sendiri:

- **Pelanggan** (user): belanja, membandingkan, dan memesan sesi coba.
- **Operator** (staf toko): mengurus stok, unit demo, jadwal kunjungan, dan pesanan.
- **Pemilik** (pemilik usaha): melihat performa toko, mengelola katalog, harga, staf, dan pengaturan toko.

Halaman publik bisa dibuka siapa saja. Fitur khusus hanya untuk pengguna terdaftar, yaitu fitur yang menyimpan data pelanggan atau meminta toko menyiapkan sesuatu, seperti reservasi demo, pesan-ambil, dan menyimpan gear. Dashboard juga hanya untuk pengguna terdaftar.

**Kategori ditambah bertahap.** Versi pertama memuat rak **Kontrol** (mouse, keyboard), rak **Permukaan** (mousepad kain, glasspad, deskmat), dan headset dari rak **Audio**. IEM, DAC / amp, mic, webcam, dan monitor menyusul di Fase 4. Struktur datanya sudah disiapkan sejak awal, jadi kategori baru cukup ditambahkan sebagai data (§9.3).

**Fitur khas: alur "Bandingkan → Coba keduanya".** Pelanggan membandingkan mouse yang dipakainya sekarang dengan mouse incaran, misalnya "incaran lebih ringan 12 g dan lebih pendek 4 mm". Kalau masih ragu, satu tombol langsung memesan sesi untuk mencoba keduanya di showroom.

---

## 2. Latar belakang dan cerita brand

Pemilik toko memulai usahanya kecil-kecilan dengan berjualan mouse dan keyboard. Ruang jualnya sempit, jadi setiap pelanggan yang ingin mencoba barang diarahkan ke atas: *"Kalau mau nyoba, naik aja ke lantai dua."* Kalimat itu kemudian menjadi nama toko sekaligus prinsip layanannya.

Konsep ini diterjemahkan menjadi **showroom dua lantai**:

- **Lantai 1, Belanja:** katalog, harga, stok, keranjang.
- **Lantai 2, Coba:** bandingkan produk, cek unit demo, reservasi meja demo.

Navigasi utama tetap memakai kata yang langsung dipahami: **Katalog · Bandingkan · Showroom**. Metafora dua lantai muncul lewat foto, penunjuk arah (misalnya **↗ Lantai 2** pada tautan menuju fitur coba), dan cara fitur-fiturnya saling terhubung. Label menunya sendiri tidak memakai istilah "lantai".

---

## 3. Masalah yang diselesaikan

**Dari sisi pelanggan**

1. Kenyamanan bentuk dan bobot mouse atau keyboard sangat personal. Spesifikasi di atas kertas tidak cukup untuk memastikannya.
2. Pelanggan yang datang khusus untuk mencoba satu model bisa kecewa karena unit demonya tidak ada atau sedang dipakai.
3. Membandingkan ukuran mouse baru dengan mouse lama butuh banyak tab dan hitungan manual.
4. Barang incaran bisa keburu habis sebelum pelanggan sampai di toko.

**Dari sisi toko**

1. Stok jual dan unit demo tercampur, jadi staf sulit menjawab "ada yang bisa dicoba?".
2. Jadwal kunjungan demo tidak tercatat, sehingga meja demo bisa bentrok.
3. Pemilik tidak punya data produk mana yang paling sering dicoba dan apakah sesi coba berujung pembelian.

---

## 4. Tujuan, non-tujuan, anti-tujuan

### Tujuan

| ID | Tujuan |
|---|---|
| G1 | Pelanggan menemukan produk yang cocok lewat filter yang relevan untuk tiap kategori. |
| G2 | Sebelum berangkat, pelanggan tahu apakah unit demo yang diinginkan tersedia, lalu bisa memesannya. |
| G3 | Pelanggan bisa membandingkan mouse incaran dengan mouse yang dipakainya sekarang dalam satu layar. |
| G4 | Pelanggan bisa memesan barang secara online, lalu mengambil dan membayarnya di toko. |
| G5 | Staf mengelola stok, unit demo, jadwal kunjungan, dan pesanan pickup dari satu dashboard. |
| G6 | Pemilik bisa melihat performa toko, termasuk konversi dari sesi coba ke pembelian. |
| G7 | Web dan aplikasi berperilaku sama karena memakai database dan aturan bisnis yang sama. |

### Non-tujuan (tidak dikerjakan di versi ini)

Dua poin pertama mengikuti konsep "pesan online, ambil dan bayar di toko". Sisanya **[Usulan]**.

- Pembayaran online atau payment gateway. Pembayaran dilakukan di toko.
- Pengiriman barang atau integrasi ekspedisi.
- Banyak cabang atau banyak penjual.
- Poin loyalitas, kupon, dan flash sale.
- Ulasan dan rating produk dari pelanggan.
- Chat langsung pelanggan dengan staf. Cukup tautan WhatsApp (`wa.me`).
- Notifikasi lewat WhatsApp, karena API-nya berbayar.
- Kasir (POS) lengkap. Penjualan langsung di toko tetap dicatat dengan cara sederhana (O8) supaya stok tetap benar.
- Mode gelap.

### Anti-tujuan (dianggap gagal walau secara teknis berjalan)

- Situs terasa seperti template toko online generik, padahal konsep "coba dulu" seharusnya terasa di setiap halaman produk.
- Satu unit demo terpesan dua kali di waktu yang sama, atau pesanan dibuat untuk stok yang sebenarnya sudah habis.
- Web dan aplikasi menampilkan data atau aturan yang berbeda untuk hal yang sama.
- Pelanggan biasa bisa membuka data atau aksi milik operator atau pemilik, termasuk lewat pemanggilan API langsung.
- Status penting seperti stok atau ketersediaan demo hanya dibedakan dengan warna.

---

## 5. Pengguna dan persona

| Persona | Siapa | Yang dibutuhkan |
|---|---|---|
| **Raka, pelanggan yang ragu** | Mahasiswa, main FPS. Mouse lamanya 80 g, sekarang ingin yang lebih ringan. | Membandingkan ukuran, lalu mencoba langsung sebelum mengeluarkan uang. |
| **Nadia, pelanggan yang sudah yakin** | Pekerja kantoran yang sudah tahu keyboard incarannya. | Cek stok, pesan dari HP, ambil sepulang kerja. |
| **Bima, operator** | Staf toko yang bekerja per shift. | Daftar tugas hari ini: siapa datang jam berapa, pesanan mana yang harus disiapkan, unit demo mana yang bermasalah. |
| **Mas Danu, pemilik** | Pemilik usaha. | Ringkasan penjualan, stok menipis, produk yang paling sering dicoba, serta kendali atas harga dan staf. |

---

## 6. Peran dan hak akses

### 6.1 Peran

| Peran | Cara mendapatkan akun |
|---|---|
| **Tamu** | Belum login. |
| **Pelanggan** | Daftar sendiri. Ini satu-satunya peran yang bisa dibuat lewat pendaftaran. |
| **Operator** | Diundang oleh Pemilik lewat email. |
| **Pemilik** | Akun pertama dibuat saat setup awal. Pemilik tambahan ditetapkan manual. **[Usulan]** |

**[Usulan]** Satu akun hanya punya satu peran. Staf yang ingin berbelanja memakai akun pelanggan terpisah.

### 6.2 Matriks akses

| Kemampuan | Tamu | Pelanggan | Operator | Pemilik |
|---|:-:|:-:|:-:|:-:|
| Beranda, halaman showroom, jam buka | ✓ | ✓ | ✓ | ✓ |
| Lihat katalog dan detail produk | ✓ | ✓ | ✓ | ✓ |
| Bandingkan produk tanpa menyimpan | ✓ | ✓ | ✓ | ✓ |
| Lihat slot demo yang masih kosong | ✓ | ✓ | ✓ | ✓ |
| Simpan "Mouse gue sekarang" dan wishlist | – | ✓ | – | – |
| Keranjang dan pesan-ambil | – | ✓ | – | – |
| Reservasi sesi demo | – | ✓ | – | – |
| Dashboard Pelanggan | – | ✓ | – | – |
| Ubah stok dan status unit demo | – | – | ✓ | ✓ |
| Kelola reservasi (check-in, tidak datang) dan pesanan pickup | – | – | ✓ | ✓ |
| Catat penjualan langsung di toko | – | – | ✓ | ✓ |
| Dashboard Operator | – | – | ✓ | ✓ |
| Kelola produk, varian, harga, foto, unit demo | – | – | – | ✓ |
| Kelola akun staf | – | – | – | ✓ |
| Pengaturan toko (jam buka, slot, aturan pickup) | – | – | – | ✓ |
| Laporan bisnis dan log aktivitas | – | – | – | ✓ |
| Dashboard Pemilik | – | – | – | ✓ |

**Alasan katalog, Bandingkan, dan slot demo dibuka untuk tamu (dikonfirmasi pemilik produk):** toko yang menyembunyikan katalognya di balik login akan kehilangan pengunjung dari Google dan dari tautan yang dibagikan. Bandingkan juga menjadi alasan utama orang mau mendaftar. Slot demo yang kosong perlu terlihat supaya orang tahu ada yang bisa dicoba sebelum berangkat (G2). Jadi tamu boleh *melihat*, tetapi semua yang *menyimpan* atau *memesan* membutuhkan akun.

### 6.3 Aturan akses

1. Pembatasan ditegakkan di **database** lewat Row Level Security (RLS) dan fungsi Supabase. Menyembunyikan menu di web atau aplikasi hanya untuk kenyamanan pengguna, bukan pengaman.
2. Tamu yang menekan aksi khusus, misalnya **Coba keduanya** atau **Tambah ke keranjang**, diarahkan ke halaman masuk atau daftar. Setelah itu ia kembali ke halaman dan aksi semula dengan isian yang tetap terjaga, misalnya dua mouse yang sedang dibandingkan.
3. Pelanggan harus memverifikasi email sebelum bisa login pertama kali, sesuai setelan bawaan Supabase. Tautan verifikasi membawa pelanggan kembali ke halaman dan isian semula. **[Usulan]**
4. Peran hanya bisa diubah oleh Pemilik, atau saat setup untuk akun pemilik pertama. Pelanggan tidak bisa menaikkan perannya sendiri.
5. Operator yang dinonaktifkan langsung kehilangan akses, walaupun sesi login-nya masih berjalan.
6. Akun Pemilik wajib memakai verifikasi dua langkah (aplikasi authenticator). **[Usulan]**
7. Setelah login, pengguna diarahkan sesuai peran: pelanggan ke halaman semula atau `/akun`, operator ke `/operator`, pemilik ke `/pemilik`.

---

## 7. Platform dan cakupan

| Area | Web | Aplikasi mobile |
|---|---|---|
| Halaman publik | Semua halaman | Katalog, detail produk, Bandingkan, showroom. Beranda app menggantikan landing page. |
| Pelanggan | Semua fitur | Semua fitur pelanggan, ditambah notifikasi push. |
| Operator | Dashboard lengkap | **Mode Operator ringkas:** jadwal hari ini, scan QR untuk check-in dan pengambilan, ubah status unit demo, ubah stok cepat. |
| Pemilik | Dashboard lengkap | Tidak ada di aplikasi (keputusan pemilik produk). Tabel dan grafik lebih cocok di layar lebar. |

- **Urutan pengerjaan:** web lebih dulu, aplikasi menyusul (lihat §16), karena project dikerjakan satu orang. Database, aturan bisnis, dan login dibangun dari awal untuk dipakai keduanya, jadi aplikasi tinggal memakai yang sudah ada.
- **Perangkat:** web dirancang mobile-first untuk lebar layar 360 px ke atas, di dua versi terakhir browser modern. Aplikasi menyasar **Android** lebih dulu **[Usulan]**. iOS dicoba lewat Expo Go bila ada perangkat.

---

## 8. Peta halaman

Rute web (aplikasi memakai struktur yang setara):

```
PUBLIK
/                         Beranda (landing page)
/katalog                  Semua produk
/katalog/[kategori]       slug kategori, dikelompokkan per rak (§9.3)
/produk/[slug]            Detail produk (?varian=...)
/bandingkan               Bandingkan (?kategori=...&sekarang=...&incaran=...)
/showroom                 Lokasi, jam buka, unit demo saat ini
/masuk  /daftar  /lupa-sandi
/kebijakan-privasi
/reservasi/baru           Formulir reservasi demo: slot terlihat publik,
                          tombol Konfirmasi perlu login

PELANGGAN (perlu login)
/akun                     Ringkasan
/akun/reservasi           Daftar dan detail reservasi
/akun/pesanan             Daftar dan detail pesanan
/akun/gear                "Mouse gue sekarang" dan gear lain
/akun/wishlist
/akun/profil              Profil, keamanan, hapus akun
/keranjang
/checkout

OPERATOR (peran operator atau pemilik)
/operator                 Hari ini
/operator/reservasi
/operator/pesanan
/operator/stok
/operator/unit-demo

PEMILIK (peran pemilik)
/pemilik                  Ringkasan bisnis
/pemilik/produk           Produk, varian, foto, kontur, unit demo
/pemilik/staf
/pemilik/laporan
/pemilik/pengaturan
/pemilik/log
```

Pemilik juga bisa membuka semua halaman `/operator/*`.

---

## 9. Kebutuhan fungsional

Prioritas: **P0** wajib ada di versi pertama, **P1** dikerjakan setelah P0 stabil, **P2** untuk tahap berikutnya.

### 9.1 Beranda (landing page): P0

| ID | Kebutuhan |
|---|---|
| L1 | **Layar pertama:** foto lebar meja demo dengan tangan pelanggan yang sedang mencoba mouse, judul **"Coba dulu. Baru pilih."**, satu kalimat bahwa LANTAI DUA adalah toko periferal gaming di Surabaya, serta tombol **Lihat Katalog** dan **Reservasi Demo**. Kolom pencarian produk ada di header. |
| L2 | **Pilih rak:** pintu masuk berfoto untuk setiap rak (Kontrol, Permukaan, Audio, Layar & Streaming). Yang ditampilkan hanya rak yang sudah berisi produk aktif. Di versi pertama: Kontrol, Permukaan, dan Audio. |
| L3 | **Bisa dicoba di showroom:** deretan produk lengkap dengan nama varian demonya, misalnya "Demo tersedia · tactile switch". |
| L4 | **Bandingkan mouse:** satu contoh perbandingan yang sudah aktif. Pengunjung bisa mengganti salah satu model langsung dari beranda. |
| L5 | **Kunjungi showroom:** foto lantai atas, jam buka, dan status "Buka sekarang", ditambah tombol **Lihat Jadwal Demo**. |
| L6 | **Footer:** alamat, tautan peta, WhatsApp, jam buka, media sosial, kebijakan privasi, dan catatan bahwa toko ini fiktif untuk project magang. |

**Kriteria penerimaan**
- Data di L3, L4, dan L5 diambil dari database, tidak ditulis langsung di kode.
- Tamu yang menekan **Reservasi Demo** atau **Lihat Jadwal Demo** bisa langsung melihat slot di formulir reservasi. Saat ia menekan **Konfirmasi**, ia diarahkan ke login, lalu kembali ke formulir dengan pilihannya tetap terisi.
- Semua bagian terbaca dan bisa dipakai di layar 360 px.

### 9.2 Akun dan login: P0

| ID | Kebutuhan |
|---|---|
| A1 | Daftar dan masuk dengan email + kata sandi. Masuk dengan Google sebagai opsi tambahan **[Usulan]**. |
| A2 | Verifikasi email wajib sebelum login pertama. Tautan verifikasi mengembalikan pengguna ke halaman dan aksi semula (lihat §6.3). |
| A3 | Lupa kata sandi lewat email. |
| A4 | Profil berisi nama lengkap, email, dan nomor WhatsApp. Nomor WhatsApp wajib diisi sebelum reservasi atau pesanan pertama, karena staf mungkin perlu menghubungi pelanggan. |
| A5 | Pelanggan bisa menghapus akun dari halaman profil. Data pribadinya dihapus, sedangkan riwayat pesanan dan reservasinya dianonimkan supaya laporan pemilik tetap utuh. |
| A6 | Undangan staf: Pemilik memasukkan email operator, operator menerima email undangan dan membuat kata sandi, lalu akunnya otomatis berperan operator. |
| A7 | Satu akun berlaku di web dan aplikasi. |
| A8 | Pengalihan setelah login mengikuti peran (lihat §6.3 poin 7). |

### 9.3 Katalog: P0

| ID | Kebutuhan |
|---|---|
| K1 | **Kategori dikelompokkan dalam "rak"** dan ditambah bertahap (lihat tabel di bawah). Versi pertama memuat rak Kontrol, rak Permukaan, dan headset dari rak Audio. |
| K1a | **Template spek per kategori disimpan sebagai data, bukan ditulis di kode.** Setiap kategori punya daftar atribut: nama, jenis (angka / pilihan / ya-tidak / teks), satuan, bisa difilter atau tidak, dan bisa dibandingkan atau tidak. Filter, tabel spesifikasi, dan tabel Bandingkan terbentuk otomatis dari template ini. Akibatnya, kategori baru (misalnya controller atau capture card) cukup ditambahkan Pemilik dari dashboard tanpa mengubah kode. |
| K2 | Pencarian teks berdasarkan merek dan nama model. |
| K3 | Filter umum: merek, rentang harga (anggaran), **Bisa dicoba di showroom**, **Stok tersedia**. |
| K4 | Filter per kategori, diambil dari template spek (lihat tabel di bawah). Saat pengguna pindah kategori, filter khususnya ikut berganti. |
| K5 | Urutan: terbaru, harga terendah, harga tertinggi. Untuk mouse, ada juga urutan paling ringan. |
| K6 | Kartu produk menampilkan foto, merek dan model, harga ("mulai Rp…" jika harga varian berbeda), status stok jual, dan status demo dalam kata-kata. |
| K7 | Filter, urutan, dan halaman tersimpan di URL, jadi bisa dibagikan dan tombol kembali di browser tetap berfungsi. |
| K8 | Ada keterangan yang jelas saat hasil kosong, lengkap dengan tombol untuk menghapus filter. |

**Rak, kategori, dan cara coba**

Pembagian ke dalam rak dan pencicilannya adalah keputusan pemilik produk. Rincian filter dan cara coba di bawah ini adalah **[Usulan]**.

| Rak | Kategori | Masuk di | Cara coba (§9.6) | Filter khusus |
|---|---|---|---|---|
| **Kontrol** | Mouse | Fase 1 | Unit demo, direservasi | Bobot (rentang gram), bentuk (simetris / ergonomis kanan), ukuran (kecil / sedang / besar, dihitung dari panjang), koneksi (kabel / wireless 2.4 GHz / Bluetooth) |
| | Keyboard | Fase 1 | Unit demo, direservasi | Layout (full size / TKL / 75% / 65% / 60%), jenis switch (linear / tactile / clicky / magnetic), koneksi, hot-swap |
| **Permukaan** | Mousepad kain | Fase 1 | Bebas tanpa reservasi | Ukuran (S / M / L / XL / XXL), permukaan (control / speed / hybrid), ketebalan |
| | Glasspad | Fase 1 | Bebas tanpa reservasi | Ukuran, ketebalan, lapisan permukaan |
| | Deskmat | Fase 1 | Bebas tanpa reservasi | Ukuran, bahan |
| **Audio** | Headset / headphone | Fase 1 | Unit demo, direservasi, dengan cover telinga | Koneksi (3.5 mm / USB / wireless 2.4 GHz / Bluetooth), mic (lepas-pasang / tetap / tanpa mic), tipe (closed-back / open-back) |
| | IEM | Fase 4 | Unit demo di stasiun dengar, **eartip baru untuk setiap pelanggan** | Jenis driver, impedansi, sensitivitas, konektor kabel |
| | DAC / amp | Fase 4 | Unit demo di stasiun dengar, dipasangkan dengan headphone atau IEM | Daya output, konektor input dan output, portabel atau meja |
| | Mic | Fase 4 | Bilik mic: rekam suara sendiri lalu dengar ulang | Dinamis / kondenser, USB / XLR, pola tangkap |
| **Layar & Streaming** | Monitor | Fase 4 | Per stasiun di dinding monitor, memutar konten game | Ukuran, resolusi, refresh rate, jenis panel |
| | Webcam | Fase 4 | Per stasiun streaming, dengan preview langsung | Resolusi, fps, sudut pandang, autofocus |

### 9.4 Detail produk: P0

| ID | Kebutuhan |
|---|---|
| D1 | Galeri foto. Produk mouse wajib punya foto samping setinggi meja supaya tinggi punggung mouse terlihat. |
| D2 | Pemilih varian (warna, jenis switch, dan sebagainya). Mengganti varian langsung memperbarui foto, harga, stok jual, dan status unit demo tanpa memuat ulang halaman. Varian yang dipilih tercatat di URL. |
| D3 | **Dua status ketersediaan** ditampilkan terpisah di dekat harga, dalam kata-kata: **Stok jual** ("Tersedia" / "Sisa 2" / "Habis") dan **Unit demo** ("Unit demo tersedia · Gateron Brown" / "Unit demo sedang dipakai" / "Unit demo sedang diservis" / "Tidak ada unit demo"). **[Usulan]** Jumlah stok baru ditampilkan angkanya bila sisa 3 atau kurang. |
| D4 | Status unit demo menyebut varian demo yang sebenarnya, karena varian demo bisa berbeda dengan varian yang sedang dipilih pengguna. |
| D5 | Kombinasi "Stok jual habis · Unit demo tersedia" tetap boleh direservasi. |
| D6 | Tombol aksi: **Tambah ke keranjang** (nonaktif kalau stok habis), **Coba di showroom** (muncul kalau ada unit demo; membuka formulir reservasi dengan produk ini sudah terisi), **Bandingkan** (khusus mouse; membuka Bandingkan dengan produk ini sebagai mouse incaran), dan **Wishlist**. |
| D7 | Tabel spesifikasi lengkap. Untuk mouse, ada panjang × lebar × tinggi (mm) dan bobot (g). |
| D8 | Tautan ke EloShapes untuk mouse, jika tersedia. |
| D9 | **P1:** tombol "Kabari saya" saat stok atau unit demo tersedia lagi. |
| D10 | **P1:** daftar produk serupa. |
| D11 | **Cara coba** tertulis jelas sesuai kategorinya, misalnya "Bisa dicoba langsung di meja permukaan, tanpa reservasi" untuk mousepad, atau "Eartip baru disiapkan untuk setiap pengunjung" untuk IEM. Produk tanpa reservasi tidak menampilkan tombol reservasi. |

### 9.5 Bandingkan: P0 untuk mouse (fitur khas), P1 untuk kategori lain

| ID | Kebutuhan |
|---|---|
| B1 | Dua slot: **Mouse gue sekarang** dan **Mouse incaran**. |
| B2 | "Mouse gue sekarang" dipilih dari daftar mouse yang mencakup **produk referensi**, yaitu model populer yang tidak dijual toko tetapi data ukurannya tersimpan (lihat §11). **[Usulan]** Jika modelnya tidak ada, pengguna bisa mengisi panjang, lebar, tinggi, dan bobot secara manual. |
| B3 | "Mouse incaran" dipilih dari mouse yang dijual toko. |
| B4 | Menampilkan selisih panjang, lebar, tinggi (mm), bobot (g), dan harga. Selisih dihitung dari mouse incaran terhadap mouse sekarang, dan dirangkum dalam kalimat biasa, misalnya "Incaran lebih ringan 12 g dan lebih pendek 4 mm." Selisih harga muncul hanya jika kedua mouse punya harga. |
| B5 | **Siluet kontur atas dan samping** pada skala yang sama, hanya jika kedua model punya data kontur buatan toko. Animasinya: satu kontur bergeser lalu menumpuk di atas kontur lainnya, dan bisa diputar ulang. Jika pengguna mengaktifkan pengaturan kurangi gerakan, siluet langsung tampil bertumpuk tanpa animasi. Kontur diberi label "perkiraan bentuk". |
| B6 | Jika data kontur tidak ada, tampilkan tabel spesifikasi berdampingan beserta tautan EloShapes (jika ada). |
| B7 | Status unit demo kedua mouse ditampilkan di halaman ini. |
| B8 | Tombol **Coba keduanya di Surabaya** aktif jika minimal salah satu mouse punya unit demo. Tombol ini membuka formulir reservasi yang sudah berisi unit demo dari mouse yang tersedia. Jika mouse lama tidak punya unit demo, tampilkan saran: *"Mouse lama lu nggak ada di showroom? Bawa aja dari rumah biar bisa dibandingin langsung."* |
| B9 | Tamu yang menekan B8 diarahkan ke login lalu kembali dengan pilihan yang tetap terisi. |
| B10 | Untuk pelanggan yang login, "Mouse gue sekarang" otomatis terisi dari Gear gue, dan pilihan baru bisa langsung disimpan dari halaman ini. |
| B11 | Kombinasi perbandingan tersimpan di URL, jadi bisa dibagikan. |
| B12 | Beranda memakai versi ringkas komponen ini (L4). |
| B13 | **P1 · Bandingkan semua kategori:** dua produk dari kategori yang sama ditampilkan berdampingan dalam tabel spek yang dibentuk dari template (K1a), lengkap dengan selisih untuk atribut berupa angka. |
| B14 | **P1 · Tumpukan ukuran untuk produk yang ukurannya penting:** mousepad, glasspad, dan deskmat ditumpuk pada skala yang sama di atas tapak keyboard + mouse, supaya terlihat apakah muat di meja. Untuk monitor (Fase 4), ukuran layar ditumpuk dan kerapatan pikselnya (PPI) ditampilkan. Animasinya memakai pola M1. |
| B15 | **P2 · Bandingkan audio:** contoh rekaman untuk mic dan webcam (satu keluarga dengan Keyboard Sound Test, §9.13), grafik respons frekuensi untuk headphone dan IEM, serta cek kecocokan DAC dengan IEM atau headphone. |

### 9.6 Reservasi sesi demo: P0

**Konsep.** Pelanggan memesan satu **sesi** di **area demo** (misalnya Meja Kontrol) pada tanggal dan jam tertentu, lalu memilih produk dan varian demo yang ingin disiapkan staf. **[Usulan]** Pelanggan memilih *varian demo* (misalnya "Keyboard X · Gateron Brown"), bukan kode unit. Saat reservasi dibuat, sistem menugaskan satu unit fisik yang kosong untuk varian itu.

**Area demo dan cara coba [Usulan].** Showroom dibagi menjadi beberapa **area demo**, masing-masing dengan kapasitasnya sendiri. Setiap kategori punya salah satu dari tiga **cara coba**:

| Cara coba | Artinya | Kategori |
|---|---|---|
| **Unit, direservasi** | Pelanggan memesan varian demo, lalu sistem menugaskan unitnya (seperti di atas). | Mouse, keyboard, headset, IEM, DAC / amp, mic |
| **Stasiun, direservasi** | Yang dipesan adalah satu stasiun beserta semua produk yang terpasang di sana. | Monitor, webcam |
| **Bebas** | Selalu bisa dicoba saat toko buka, tanpa reservasi. Halaman produk cukup menampilkan "Bisa dicoba langsung". | Mousepad kain, glasspad, deskmat |

| Area demo | Kapasitas awal | Masuk di |
|---|---|---|
| Meja Kontrol (mouse, keyboard, headset) | 3 meja | Fase 1 |
| Meja Permukaan (pad dan deskmat dijejer, dicoba dengan mouse demo) | Tanpa batas, tanpa reservasi | Fase 1 |
| Stasiun Dengar (IEM, DAC / amp, headphone) | 2 kursi | Fase 4 |
| Bilik Mic | 1 | Fase 4 |
| Dinding Monitor dan Stasiun Streaming | 1 stasiun per monitor atau webcam | Fase 4 |

| ID | Kebutuhan |
|---|---|
| R1 | Formulir reservasi berisi pilihan varian demo (1 sampai 4 **[Usulan]**), tanggal, slot waktu, dan catatan opsional. Formulir bisa dibuka dari detail produk, Bandingkan, beranda, atau dalam keadaan kosong. Tamu boleh membuka formulir dan melihat slot. Tombol **Konfirmasi** meminta login, lalu mengembalikan pelanggan ke formulir dengan pilihannya tetap terisi. |
| R2 | Slot hanya bisa dipilih jika untuk **setiap** varian yang dipilih masih ada unit kosong, dan masih ada meja kosong. Slot lain tetap tampil tetapi nonaktif, disertai alasannya, misalnya "Unit demo Mouse Y sudah dipesan di jam ini", "Meja penuh", atau "Toko tutup". |
| R3 | **[Usulan] Angka awal**, semuanya bisa diubah Pemilik: durasi sesi 30 menit; kapasitas area sesuai tabel di atas; reservasi paling cepat 1 jam sebelum sesi dan paling lambat 14 hari ke depan; maksimal 2 reservasi aktif per pelanggan. |
| R4 | Setelah konfirmasi, pelanggan menerima kode reservasi (misalnya `L2D-H7K3QX9P`) beserta QR, daftar unit dan varian yang akan disiapkan, alamat, dan tombol untuk menambahkan sesi ke kalender. Email konfirmasi juga dikirim. |
| R5 | Pelanggan bisa membatalkan sampai 1 jam sebelum sesi **[Usulan]**. Untuk versi pertama, ubah jadwal dilakukan dengan membatalkan lalu membuat reservasi baru. |
| R6 | **Unit demo diservis [Usulan].** Saat menandai unit Diservis, operator mengisi **perkiraan selesai** (bawaan: akhir hari ini). Hanya reservasi yang jatuh sebelum perkiraan itu yang terdampak. Untuk setiap reservasi terdampak, sistem lebih dulu mencoba memindahkannya ke unit lain dengan varian yang sama yang masih kosong. Jika berhasil, pelanggan tidak perlu diberi tahu. Jika tidak ada pengganti, operator melihat peringatan dan pelanggan diberi tahu lewat email dan halaman detail reservasinya. Pilihan pelanggan: **Ganti jadwal** (reservasi dibatalkan, lalu formulir baru terbuka dengan pilihan yang sama, sesuai R5), **Tetap datang** (hanya ditawarkan jika masih ada minimal satu unit lain dalam reservasi itu), atau **Batalkan**. Jika servis lebih lama dari perkiraan, operator memperpanjangnya dan proses yang sama berjalan lagi. |
| R7 | **Tidak boleh bentrok.** Satu unit demo tidak boleh ada di dua reservasi aktif yang waktunya tumpang tindih, dan jumlah reservasi aktif dalam satu slot tidak boleh melebihi jumlah meja. Aturan ini dijamin oleh database, termasuk ketika dua orang memesan di saat yang sama dari web dan aplikasi. |
| R8 | Status reservasi: **Terjadwal → Check-in → Selesai**. Reservasi juga bisa **Dibatalkan** (oleh pelanggan atau staf), ditandai **Tidak datang**, atau otomatis menjadi **Tidak tercatat** (R12). |
| R9 | **Pengunjung tanpa reservasi (walk-in) [Usulan]:** operator bisa menandai unit "Sedang dipakai" sebagai status langsung. Dashboard Operator menunjukkan unit mana yang aman dipinjamkan sekarang, yaitu unit yang tidak punya reservasi di slot berjalan dan slot berikutnya. Status "Sedang dipakai" tidak membatalkan reservasi yang sudah ada. |
| R10 | **P1:** email pengingat sehari sebelum sesi. Pengingat push di aplikasi menyusul di Fase 3. |
| R11 | **P1 [Usulan]:** pelanggan yang 3 kali tidak datang dalam 30 hari tidak bisa membuat reservasi selama 14 hari. Hanya status **Tidak datang** yang dihitung. |
| R12 | **Reservasi yang lupa ditutup [Usulan].** Dua jam setelah toko tutup, reservasi hari itu yang masih **Check-in** otomatis menjadi **Selesai**. Reservasi yang masih **Terjadwal** menjadi **Tidak tercatat**. Status Tidak tercatat tidak dihitung sebagai reservasi aktif atau sebagai tidak datang, dan tidak ikut dihitung dalam tingkat kehadiran maupun konversi. Keesokan harinya, Dashboard Operator menampilkan daftar reservasi Tidak tercatat agar statusnya bisa dikoreksi. |
| R13 | Satu reservasi bisa mencakup lebih dari satu area, misalnya mouse di Meja Kontrol dan IEM di Stasiun Dengar. Slot hanya bisa dipilih jika semua area yang dibutuhkan masih punya kapasitas. |
| R14 | **Kebersihan [Usulan].** Setiap kategori bisa punya catatan kebersihan yang muncul di daftar persiapan operator. Headset memakai cover telinga sekali pakai. Mulai Fase 4, IEM selalu memakai eartip baru, dan pelanggan bisa memilih ukuran S, M, atau L di formulir reservasi. Mic diberi pelindung busa baru. |

### 9.7 Keranjang dan pesan-ambil di toko: P0

| ID | Kebutuhan |
|---|---|
| C1 | Keranjang tersimpan di database per akun, jadi isinya sama di web dan aplikasi. Jumlah barang bisa diubah dan barang bisa dihapus. |
| C2 | Maksimal 3 unit per varian dalam satu pesanan **[Usulan]**. |
| C3 | Checkout menampilkan ringkasan barang dan total, dengan metode **Ambil dan bayar di toko**. Pelanggan mengisi nama dan nomor WhatsApp pengambil, ditambah catatan opsional. Tidak ada pembayaran online. |
| C4 | Saat pesanan dibuat, stok tiap varian langsung dikunci dalam satu transaksi database. Jika stok tidak cukup, pesanan gagal dengan pesan yang jelas dan keranjang menandai barang yang bermasalah. |
| C5 | Harga dikunci saat pesanan dibuat. Harga yang dibayar di toko sama dengan yang tertera di pesanan. |
| C6 | Pelanggan menerima kode pesanan beserta QR. Kode terdiri dari 8 karakter acak tanpa huruf yang mirip, misalnya `L2-K7Q4M9TX`, supaya sulit ditebak. |
| C7 | Status pesanan: **Menunggu disiapkan → Sedang disiapkan → Siap diambil → Selesai**. Pesanan juga bisa **Dibatalkan** (oleh pelanggan sebelum mulai disiapkan, atau oleh staf dengan alasan) atau **Kedaluwarsa**. Stok dikembalikan setiap kali pesanan batal atau kedaluwarsa. |
| C8 | Pesanan yang tidak diambil dalam **2×24 jam** sejak berstatus Siap diambil otomatis menjadi Kedaluwarsa **[Usulan]**. |
| C9 | Pelanggan mengecek status pesanan di dashboard. Pemberitahuan dikirim lewat email saat pesanan Siap diambil dan saat hampir kedaluwarsa. Notifikasi push menyusul di Fase 3. |
| C10 | Saat serah terima, operator memverifikasi kode atau QR dan mencocokkan nama pengambil, lalu mencatat metode bayar (tunai / QRIS / debit). Ini hanya catatan, tidak ada integrasi pembayaran. |

### 9.8 Halaman showroom: P0

| ID | Kebutuhan |
|---|---|
| S1 | Foto area demo, alamat fiktif di Surabaya, tautan peta, dan petunjuk lokasi (parkir, naik tangga ke lantai 2). |
| S2 | Jam buka dalam WIB, status saat ini ("Buka sekarang" / "Tutup · buka lagi Senin 10.00"), serta hari libur khusus. |
| S3 | Daftar unit demo beserta statusnya saat ini (tersedia / sedang dipakai / diservis), dikelompokkan per area demo dan bisa disaring per kategori. Status ini diperbarui secara realtime, jadi orang bisa mengeceknya dari HP sebelum berangkat. |
| S4 | Tombol **Lihat Jadwal Demo** menuju formulir reservasi. |
| S5 | Tautan WhatsApp toko. |

### 9.9 Dashboard Pelanggan: P0

| ID | Kebutuhan |
|---|---|
| U1 | **Ringkasan:** reservasi terdekat (dengan QR), pesanan aktif dan statusnya, serta pintasan ke Katalog dan Bandingkan. |
| U2 | **Reservasi saya:** daftar reservasi mendatang dan riwayat, halaman detail, dan tombol batal. Jika reservasi terdampak unit yang diservis (R6), halaman detailnya menampilkan pemberitahuan beserta pilihan Ganti jadwal, Tetap datang, atau Batalkan. |
| U3 | **Pesanan saya:** daftar pesanan aktif dan riwayat, linimasa status, QR pengambilan, dan tombol batal (selama pesanan belum mulai disiapkan). |
| U4 | **Gear gue:** "Mouse gue sekarang", ditambah keyboard dan headset secara opsional. Data ini otomatis dipakai di Bandingkan. |
| U5 | **Wishlist.** |
| U6 | **Profil dan keamanan:** nama, WhatsApp, email, kata sandi, dan hapus akun. |
| U7 | **P1:** kotak notifikasi di dalam aplikasi. |

### 9.10 Dashboard Operator: P0

| ID | Kebutuhan |
|---|---|
| O1 | **Hari ini:** linimasa reservasi per jam (nama pelanggan, unit dan area yang harus disiapkan, catatan kebersihan, status), antrean pesanan yang perlu disiapkan, papan status unit demo, dan peringatan. Peringatan mencakup reservasi yang kehilangan unit karena servis, pesanan yang mendekati kedaluwarsa, stok menipis, dan reservasi Tidak tercatat dari hari sebelumnya (R12). |
| O2 | **Reservasi:** cari reservasi lewat kode atau scan QR, check-in, tandai selesai, tandai tidak datang, dan batalkan dengan alasan (pelanggan otomatis diberi tahu). |
| O3 | **Pesanan pickup:** pindahkan status sesuai alur di C7, lihat daftar barang yang harus diambil dari gudang, verifikasi kode atau QR saat serah terima, dan catat metode bayar. |
| O4 | **Stok:** lihat dan ubah stok tiap varian. Setiap perubahan wajib diberi alasan (barang masuk / koreksi stok opname / rusak / terjual di toko) dan tercatat di riwayat stok. |
| O5 | **Unit demo:** ubah status (Tersedia / Sedang dipakai / Diservis) dan beri catatan. Status Diservis wajib disertai perkiraan selesai. Slot unit itu tertutup sampai perkiraan tersebut, dan reservasi yang terdampak diproses sesuai R6. |
| O6 | Setiap perubahan langsung terlihat di perangkat staf lain dan di halaman publik, tanpa perlu memuat ulang. |
| O7 | Operator hanya melihat nama dan nomor WhatsApp pelanggan yang terkait dengan reservasi atau pesanan. Operator **tidak bisa** mengubah harga atau produk, mengelola staf, melihat laporan keuangan, atau mengubah pengaturan toko. |
| O8 | **Catat penjualan langsung:** untuk pembeli yang membeli langsung di toko, termasuk pelanggan yang membeli tepat setelah sesi coba. Operator memilih varian, jumlah, dan metode bayar. Penjualan bisa dikaitkan ke akun pelanggan atau reservasinya, dengan mencari nama, WhatsApp, atau memindai QR reservasi. Stok berkurang dengan alasan "terjual di toko". Ini bukan kasir lengkap: tidak ada struk, diskon, atau laci kas. |

### 9.11 Dashboard Pemilik: P0 untuk versi ringkas, P1 untuk versi lengkap

| ID | Kebutuhan | Prioritas |
|---|---|---|
| PM1 | **Ringkasan bisnis:** pendapatan dari pesanan Selesai dan penjualan langsung (hari ini / 7 hari / 30 hari), jumlah pesanan per status, jumlah reservasi dan tingkat kehadiran, **produk paling sering dicoba**, **konversi coba → beli**, dan stok menipis. | P0 |
| PM2 | **Kelola katalog:** rak, kategori beserta template speknya (K1a) dan cara cobanya, merek, produk, varian, harga, foto, spesifikasi, data kontur (unggah SVG beserta skalanya), tautan EloShapes, penanda produk referensi (tidak dijual), dan status aktif. | P0 |
| PM3 | **Kelola unit dan area demo:** tambah unit, kaitkan dengan varian dan area, pensiunkan unit, serta atur area demo beserta kapasitasnya. | P0 |
| PM4 | **Kelola staf:** undang operator, nonaktifkan operator, dan lihat waktu login terakhirnya. Riwayat aktivitas per operator tersedia lewat PM6. | P0 |
| PM5 | **Pengaturan toko:** jam buka per hari, hari libur, durasi sesi, batas reservasi, batas waktu pengambilan, serta kontak dan alamat. | P0 |
| PM6 | **Log aktivitas:** siapa mengubah apa dan kapan, mencakup stok, harga, status unit demo, status pesanan, dan peran. Pencatatannya sudah berjalan sejak Fase 0, jadi yang dikerjakan di P1 hanya halaman untuk melihatnya. | P1 |
| PM7 | Laporan per periode dengan grafik dan ekspor CSV. | P1 |

**Definisi konversi coba → beli [Usulan]:** persentase reservasi berstatus Selesai di mana pelanggan yang sama membeli produk yang ia coba paling lambat 7 hari setelah sesi. Pembelian dihitung lewat pesanan Selesai atau lewat penjualan langsung yang dikaitkan ke akunnya (O8).

Pemilik juga bisa melakukan semua yang bisa dilakukan Operator.

### 9.12 Notifikasi

| Peristiwa | Penerima | Kanal di web (Fase 1) | Kanal di aplikasi (Fase 3) |
|---|---|---|---|
| Verifikasi email, reset kata sandi | Pelanggan | Email | – |
| Reservasi dikonfirmasi atau dibatalkan | Pelanggan | Email + dashboard | Push |
| Pengingat sesi (P1) | Pelanggan | Email | Push |
| Unit demo dalam reservasi diservis | Pelanggan, operator | Email + dashboard | Push |
| Pesanan siap diambil | Pelanggan | Email + dashboard | Push |
| Pesanan hampir atau sudah kedaluwarsa | Pelanggan | Email | Push |
| Pesanan atau reservasi baru masuk | Operator | Dashboard realtime | Push (Mode Operator) |
| Undangan staf | Calon operator | Email | – |

Di Fase 1, kanal "dashboard" berarti pemberitahuan dan status yang tampil di halaman detail reservasi atau pesanan terkait (P0). Kotak notifikasi terpisah (U7) baru hadir di P1.

### 9.13 Keyboard Sound Test: P2 (Fase 5)

- Rekaman tombol huruf, spasi, dan Enter dari setiap unit demo keyboard. Semua direkam dengan pengaturan yang sama: mic, jarak, ruangan, dan penguatan.
- Pelanggan memutar dan membandingkan suara dua keyboard, lalu memilih yang paling ia suka untuk dicoba langsung. Pilihannya otomatis masuk ke formulir reservasi.
- File audio disimpan di Supabase Storage.

---

## 10. Alur utama

### 10.1 Bandingkan → Coba keduanya

1. Raka membuka **Bandingkan** dari beranda.
2. Ia memilih mouse lamanya sebagai **Mouse gue sekarang** (produk referensi yang tidak dijual toko) dan sebuah mouse ringan sebagai **Mouse incaran**.
3. Halaman menunjukkan bahwa incaran lebih ringan 12 g dan lebih pendek 4 mm, lalu kedua kontur bergeser dan menumpuk.
4. Ia menekan **Coba keduanya di Surabaya**. Karena belum punya akun, ia mendaftar, memverifikasi email, lalu kembali ke formulir reservasi yang sudah berisi mouse incaran. Ada saran untuk membawa mouse lamanya dari rumah.
5. Ia memilih Sabtu pukul 14.00, lalu menerima kode reservasi, QR, dan email konfirmasi.
6. Hari Sabtu, operator memindai QR-nya, melakukan check-in, lalu menandai sesi Selesai.
7. Dalam perjalanan pulang, Raka memesan mouse incaran lewat web (atau lewat aplikasi setelah Fase 3) dan mengambilnya keesokan hari. Konversi coba → beli tercatat. Seandainya ia langsung membeli di toko, operator mencatatnya lewat O8 dan konversinya tetap tercatat.

### 10.2 Pesan-ambil

1. Nadia memasukkan keyboard varian Brown ke keranjang, lalu checkout. Stok terkunci dan kode pesanan terbit.
2. Operator melihat pesanan baru di **Hari ini**, mengubahnya menjadi Sedang disiapkan, lalu Siap diambil. Nadia menerima email.
3. Nadia datang dan menunjukkan QR. Operator memverifikasinya, mencatat pembayaran lewat QRIS, lalu menandai pesanan Selesai.
4. Seandainya pesanan tidak diambil dalam 2×24 jam, statusnya otomatis Kedaluwarsa dan stok kembali.

### 10.3 Unit demo rusak

1. Operator mengubah status sebuah unit menjadi Diservis dengan perkiraan selesai besok pukul 15.00.
2. Slot unit itu tertutup sampai besok pukul 15.00. Ada tiga reservasi yang terdampak di rentang itu.
3. Sistem memindahkan dua reservasi ke unit lain dengan varian yang sama. Satu reservasi tidak punya pengganti, sehingga muncul di daftar peringatan operator.
4. Pelanggan dari reservasi itu menerima email dan melihat pilihan Ganti jadwal, Tetap datang, atau Batalkan di halaman detail reservasinya.

### 10.4 Pemilik menambah produk baru

1. Pemilik membuat produk beserta varian, foto, spesifikasi, dan kontur jika ada, lalu mengaktifkannya.
2. Pemilik menambahkan unit demo untuk varian tertentu.
3. Saat barang masuk, operator mengisi stoknya.

---

## 11. Model data (Supabase / Postgres)

Nama tabel di bawah boleh disesuaikan oleh builder. Yang wajib dipertahankan adalah relasi dan aturannya.

| Entitas | Isi utama | Catatan |
|---|---|---|
| `profiles` | id (sama dengan user Auth), nama, nomor WhatsApp, peran, status aktif | Peran hanya bisa diubah pemilik atau lewat setup |
| `brands` | nama, slug, logo | |
| `category_groups` | nama rak (Kontrol, Permukaan, Audio, Layar & Streaming), urutan, foto | |
| `categories` | rak, nama, slug, cara coba (unit / stasiun / bebas), catatan kebersihan, status aktif | |
| `category_attributes` | kategori, kunci, label, jenis (angka / pilihan / ya-tidak / teks), satuan, daftar pilihan, bisa difilter, bisa dibandingkan, urutan | Template spek (K1a) |
| `products` | kategori, merek, nama model, slug, deskripsi, spesifikasi (divalidasi terhadap template kategorinya), status **dijual**, status aktif, tautan EloShapes, data kontur atas dan samping (SVG + skala mm) | `dijual = false` berarti produk referensi untuk Bandingkan |
| `product_variants` | produk, SKU, nama varian, atribut varian (warna, switch), harga, stok jual | Uang disimpan sebagai bilangan bulat rupiah |
| `product_images` | produk atau varian, lokasi file di Storage, urutan, jenis foto (utama / samping / detail) | |
| `demo_areas` | nama (Meja Kontrol, Stasiun Dengar, dsb.), jenis (meja / stasiun / bebas), kapasitas, bisa direservasi, status aktif | Kapasitas dipakai aturan anti-bentrok |
| `demo_units` | varian, area demo, kode unit (misalnya `DM-M-012`), status (tersedia / dipakai / diservis / pensiun), catatan | Unit demo tidak pernah dihitung sebagai stok jual |
| `store_settings` | alamat, kontak, durasi sesi, batas reservasi, batas waktu pengambilan | Satu baris |
| `opening_hours`, `store_closures` | jam buka per hari, tanggal libur | |
| `reservations` | kode, pelanggan, waktu mulai dan selesai, status, catatan, alasan batal | |
| `reservation_items` | reservasi, varian demo yang dipilih, unit demo yang ditugaskan, rentang waktu | Rentang waktu disalin ke sini supaya aturan anti-bentrok bisa ditegakkan. Unit bisa diganti sistem (R6). |
| `demo_unit_blocks` | unit, rentang waktu, alasan (servis), pelaku | Masa servis diperlakukan sebagai blok waktu yang ikut dicek aturan anti-bentrok |
| `direct_sales`, `direct_sale_items` | operator, pelanggan atau reservasi terkait (opsional), varian, jumlah, harga, metode bayar, waktu | Penjualan langsung di toko (O8) |
| `user_gear` | pelanggan, jenis (mouse sekarang, dsb.), produk **atau** ukuran manual | |
| `wishlists` | pelanggan, produk atau varian | |
| `cart_items` | pelanggan, varian, jumlah | |
| `orders` | kode, pelanggan, status, total, nama dan WhatsApp pengambil, batas ambil, metode bayar, waktu tiap perubahan status | |
| `order_items` | pesanan, varian, jumlah, harga saat dipesan | |
| `stock_movements` | varian, perubahan (+/−), alasan, pelaku, referensi pesanan atau penjualan langsung | Riwayat stok |
| `demo_unit_events` | unit, status lama dan baru, pelaku, catatan | Riwayat unit demo |
| `notifications` | penerima, jenis, isi, sudah dibaca | |
| `audit_logs` | pelaku, aksi, entitas, data sebelum dan sesudah, waktu | |

### 11.1 Aturan yang wajib dijaga database

1. Satu unit demo tidak bisa masuk ke dua reservasi aktif yang waktunya tumpang tindih, dan tidak bisa direservasi selama masa servisnya. Gunakan constraint di database, misalnya exclusion constraint pada rentang waktu.
2. Jumlah reservasi aktif per slot di setiap area demo tidak melebihi kapasitas area itu.
3. Stok jual tidak pernah negatif. Checkout, pembatalan, dan kedaluwarsa mengubah stok di dalam fungsi database (RPC) dalam satu transaksi, tidak dari kode web atau aplikasi.
4. Status pesanan dan reservasi hanya bisa berpindah mengikuti alur yang sah (§9.6 R8 dan §9.7 C7).
5. Kode pesanan dan kode reservasi bersifat unik dan sulit ditebak (8 karakter acak).
6. Perubahan stok dan status unit demo selalu menghasilkan baris riwayat.

### 11.2 Ringkasan Row Level Security

| Data | Tamu | Pelanggan | Operator | Pemilik |
|---|---|---|---|---|
| Katalog dan status unit demo | Baca (yang aktif saja) | Baca | Baca | Baca + tulis |
| `profiles` | – | Baca dan ubah miliknya sendiri, kecuali peran | Baca nama dan WhatsApp pelanggan yang terkait | Semua |
| Reservasi dan pesanan | – | Miliknya sendiri; dibuat lewat fungsi | Baca semua, ubah status lewat fungsi | Semua |
| Keranjang, wishlist, gear | – | Miliknya sendiri | – | – |
| Riwayat stok dan unit demo, blok servis | – | – | Buat (lewat fungsi) + baca | Semua |
| Penjualan langsung | – | – | Buat (lewat fungsi) + baca | Semua |
| Pengaturan toko dan jam buka | Baca | Baca | Baca | Tulis |
| Log aktivitas | – | – | – | Baca |

Catatan: operator mengubah stok hanya lewat fungsi khusus, sehingga ia tidak bisa ikut mengubah harga di tabel varian.

---

## 12. Arsitektur teknis

### 12.1 Pendekatan yang dipertimbangkan

| Pendekatan | Kelebihan | Kekurangan |
|---|---|---|
| **A. Monorepo: Next.js untuk web + Expo (React Native) untuk aplikasi + paket kode bersama** **[Usulan, dipilih]** | Satu bahasa (TypeScript). Tipe database, validasi, dan logika seperti hitung selisih dan format Rupiah/WIB dipakai bersama. Aplikasi terasa native. Expo mempermudah build Android. | Komponen tampilan web dan aplikasi tetap dibuat terpisah. Penyiapan monorepo sedikit lebih rumit. |
| B. Next.js yang dibungkus menjadi aplikasi (Capacitor / PWA) | Paling cepat jadi, satu basis kode. | Terasa seperti web di dalam aplikasi. Scan QR dan notifikasi push lebih repot. Kurang meyakinkan sebagai "aplikasi sendiri". |
| C. Next.js + Flutter | Tampilan mobile Flutter bagus. | Dua bahasa (TypeScript dan Dart), tidak ada kode bersama, harus belajar dua hal sekaligus. |

**Alasan memilih A:** pemilik produk ingin aplikasi yang benar-benar terpisah dan berbagi satu database dengan web. Aturan bisnis yang paling penting disimpan di database, sehingga web dan aplikasi pasti berperilaku sama. Kode TypeScript bersama mencegah keduanya berjalan sendiri-sendiri.

### 12.2 Struktur repositori

```
lantai-dua/
├─ apps/
│  ├─ web/          Next.js (App Router): halaman publik + 3 dashboard
│  └─ mobile/       Expo (Expo Router): pelanggan + Mode Operator
├─ packages/
│  ├─ shared/       tipe hasil generate Supabase, skema validasi, logika bersama,
│  │                format Rupiah dan WIB, konstanta status
│  └─ tokens/       warna, tipografi, jarak (dipakai web dan aplikasi)
└─ supabase/
   ├─ migrations/   skema, RLS, fungsi, constraint
   ├─ seed.sql      data contoh
   └─ functions/    Edge Functions (email, tugas kedaluwarsa)
```

### 12.3 Teknologi

| Lapisan | Pilihan |
|---|---|
| Web | **Next.js + React** (keputusan pemilik produk), TypeScript, Tailwind CSS **[Usulan]**. Halaman publik dirender di server untuk SEO. |
| Aplikasi | Expo + React Native + Expo Router, TypeScript **[Usulan]** |
| Backend | **Supabase** (keputusan pemilik produk): Postgres, Auth, Storage, Realtime, Edge Functions, pg_cron |
| Aturan bisnis | Fungsi Postgres + constraint + RLS sebagai satu sumber kebenaran |
| Email | SMTP sendiri, misalnya Resend, untuk email akun dan notifikasi **[Usulan]** (lihat risiko di §18) |
| Push (Fase 3) | Expo Notifications |
| QR | Dibuat dari kode di sisi klien. Dipindai lewat kamera di aplikasi dan di browser. |
| Hosting | Web di Vercel, database di Supabase Cloud, aplikasi dibuild dan dibagikan lewat EAS (keputusan pemilik produk). APK Android lewat distribusi internal EAS; Play Store opsional |
| Pengelola paket | pnpm workspaces + Turborepo **[Usulan]** |

### 12.4 Prinsip teknis

1. Web dan aplikasi tidak pernah menghitung stok atau ketersediaan sendiri. Semuanya lewat fungsi database.
2. Waktu disimpan sebagai `timestamptz` dan ditampilkan dalam zona Asia/Jakarta (WIB).
3. Uang disimpan sebagai bilangan bulat rupiah.
4. Gambar disimpan di Supabase Storage dan dikirim dalam ukuran yang sudah dioptimasi.
5. Ada dua lingkungan: lokal (Supabase CLI) dan produksi. Kunci *service role* tidak pernah dipakai di web atau aplikasi.

---

## 13. Kebutuhan non-fungsional

| Aspek | Kebutuhan |
|---|---|
| Performa | Halaman publik tampil utuh (LCP) di bawah 2,5 detik di HP kelas menengah dengan 4G. Skor Lighthouse Performance mobile minimal 85 **[Usulan]**. |
| Responsif | Bisa dipakai dari lebar 360 px sampai layar desktop, tanpa scroll horizontal. |
| Aksesibilitas | Target WCAG 2.1 AA: kontras cukup, bisa dinavigasi dengan keyboard, setiap kolom formulir punya label, status tidak hanya dibedakan warna, foto punya teks alternatif, dan pengaturan kurangi gerakan dihormati. |
| Bahasa dan format | Antarmuka berbahasa Indonesia dengan gaya santai tapi jelas **[Usulan]**. Format harga Rp1.250.000. Format tanggal "Sab, 28 Nov 2026 · 14.00 WIB". |
| Keamanan | RLS aktif di semua tabel. Input divalidasi di server atau database. Ada pembatasan percobaan login dan pembuatan reservasi. Kunci rahasia tidak masuk repositori. Staf diundang, tidak mendaftar sendiri. |
| Privasi (UU PDP No. 27/2022) | Data yang dikumpulkan seminimal mungkin (nama, email, WhatsApp). Ada halaman kebijakan privasi, persetujuan saat mendaftar, dan fitur hapus akun. |
| SEO | Metadata dan OpenGraph untuk setiap produk, sitemap, dan URL ramah dengan slug. |
| Realtime | Status unit demo dan antrean pesanan diperbarui di perangkat lain dalam ±5 detik. |
| Tugas terjadwal | Pengecekan pesanan kedaluwarsa berjalan setiap 15 menit **[Usulan]**. |
| Pengujian | Ada tes otomatis untuk aturan kritis: bentrok reservasi, penguncian stok, perpindahan status, dan RLS untuk setiap peran. |

---

## 14. Identitas visual

Aturan lengkapnya ada di **[design system](../design-system/lantai-dua/MASTER.md)**, berikut pratinjau dan tokennya. Ringkasannya:

| Elemen | Arah desain |
|---|---|
| **Arah** | Bersih, minimalis, modern, dengan animasi yang tidak berlebihan dan mulus (keputusan pemilik produk). Suasananya "showroom yang tenang": meja demo abu-abu muda, aluminium, papan petunjuk, dan garis ukur gambar teknik. |
| **Warna** | Palet yang tidak generik, untuk melambangkan kepercayaan dan kualitas (keputusan pemilik produk). Dari tiga opsi, pemilik produk memilih **A · Petrol & Tembaga**: petrol `#0E4B57` untuk belanja dan aksi (Lantai 1), tembaga `#B5612C` untuk demo, reservasi, dan showroom (Lantai 2). Latar `#F5F4F0`, teks `#141719`. Opsi ini menggantikan biru elektrik `#244BFF` dari konsep awal. |
| **Status** | Ditulis dengan kata dan ikon, warna hanya pelengkap. |
| **Tipografi** | **[Usulan]** **Archivo** (lebar 85) untuk judul dan papan kategori, **Instrument Sans** untuk teks, harga, dan filter, serta **Geist Mono** untuk angka ukuran dan kode. Pasangan ini menggantikan Barlow Condensed + DM Sans. Harga dan angka ukuran memakai angka *tabular*. |
| **Foto** | Beranda memakai foto lebar meja demo dengan tangan pelanggan yang sedang mencoba mouse. Di katalog, semua produk difoto dari sudut yang sama di atas latar "meja demo". Halaman detail mouse punya foto samping setinggi meja. |
| **Elemen khas** | Angka **2** berbentuk anak tangga menjadi simbol toko. Tanda **↗ Lantai 2** berwarna aksen dipasang pada tautan menuju fitur coba dan showroom. Garis ukur dengan angka mono dipakai untuk ukuran produk. |
| **Gerakan** | **[Usulan]** Ada token durasi dan easing bersama, ditambah lima gerak khas (M1–M5). Yang terbesar adalah kontur mouse yang bergeser lalu menumpuk di Bandingkan. Mode kurangi gerakan selalu dihormati. |
| **Aplikasi** | Memakai token warna, huruf, jarak, dan gerak yang sama dengan web. |

---

## 15. Konten dan data contoh

**Seed minimal [Usulan]**

| Data | Jumlah |
|---|---|
| Rak dan kategori | 3 rak aktif, 6 kategori: mouse, keyboard, mousepad kain, glasspad, deskmat, headset |
| Template spek | Satu template untuk setiap kategori di atas, mengikuti tabel filter di §9.3 |
| Merek | 6–8 merek asli |
| Produk dijual | ±44 (14 mouse, 10 keyboard, 6 headset, 6 mousepad kain, 4 glasspad, 4 deskmat) |
| Mouse referensi untuk Bandingkan | ±20 |
| Mouse dengan data kontur | 6–8 |
| Area demo | Meja Kontrol (3 meja) dan Meja Permukaan (tanpa reservasi) |
| Unit demo | ±15 di Meja Kontrol, ditambah semua pad dan deskmat di Meja Permukaan |
| Jam buka | Senin–Sabtu 10.00–21.00, Minggu 12.00–20.00 |
| Akun | 1 pemilik, 2 operator, 3 pelanggan |
| Contoh transaksi | Beberapa reservasi dan pesanan dalam berbagai status |

**Aturan konten**

- **Foto:** tidak memakai foto resmi merek tanpa izin. Pilihannya foto sendiri, gambar buatan AI atau render netral, atau placeholder yang rapi.
- **Kontur mouse:** digambar sendiri dalam format SVG dari foto tampak atas dan samping, dengan skala dalam mm. Diberi label "perkiraan bentuk".
- **Alamat:** fiktif, dengan peta yang hanya menunjuk area umum di Surabaya. Jangan memakai alamat rumah atau toko nyata milik orang lain.
- **Penanda fiktif:** footer mencantumkan bahwa LANTAI DUA adalah toko fiktif untuk project magang.
- **Merek dan model produk:** memakai model asli dari merek nyata (keputusan pemilik produk). Data spek diambil dari situs resmi pabrikan, dan sumbernya dicatat di seed. Harga adalah harga contoh. Nama merek hanya dipakai untuk menyebut produk, tidak dipakai sebagai logo atau identitas toko.

---

## 16. Tahapan rilis

Project dikerjakan **satu orang**, **10–20 jam per minggu**, dengan waktu **lebih dari 6 bulan** (keputusan pemilik produk). Karena itu fase dikerjakan berurutan, bukan paralel. Perkiraan jam di bawah ini adalah **[Usulan]**. Angkanya sengaja dibuat longgar, karena di dalamnya ada waktu untuk belajar, debugging, tes, dan dokumentasi, bukan cuma menulis kode.

| Fase | Isi | Selesai jika | Perkiraan jam | Minggu (20 → 10 jam/minggu) |
|---|---|---|---|---|
| **0. Fondasi** | Monorepo, skema Supabase (termasuk rak, template spek, area demo, cara coba), RLS, fungsi, seed, login, token desain, kerangka layout web | Ketiga peran bisa login dan diarahkan ke dashboard masing-masing. Tes RLS per peran lulus. | 60–80 | 3–4 → 6–8 |
| **1. Web MVP** | Semua kebutuhan P0 di §9, di web, untuk rak Kontrol, Permukaan, dan headset. Deploy ke Vercel. | Alur §10.1–10.4 bisa dijalankan dari awal sampai akhir di web produksi dengan data seed. Tes aturan kritis lulus. | 200–260 | 10–13 → 20–26 |
| **2. Pengayaan web (P1)** | "Kabari saya" (D9), produk serupa (D10), email pengingat (R10), aturan tidak datang (R11), kotak notifikasi (U7), halaman log aktivitas (PM6), laporan dan ekspor (PM7), Bandingkan semua kategori (B13), tumpukan ukuran pad (B14) | Per fitur | 60–80 | 3–4 → 6–8 |
| **3. Aplikasi mobile** | Aplikasi Pelanggan + Mode Operator, notifikasi push, build lewat EAS | APK Android bisa dipasang. Alur §10.1 dan §10.2 bisa dijalankan dari aplikasi dengan data yang sama dengan web. | 120–160 | 6–8 → 12–16 |
| **4. Ekspansi kategori** | Rak Audio lengkap (IEM, DAC / amp, mic) dan rak Layar & Streaming (monitor, webcam). Area Stasiun Dengar, Bilik Mic, Dinding Monitor. Aturan kebersihan IEM. Tumpukan ukuran monitor (B14). | Kategori baru tampil di web dan aplikasi tanpa mengubah struktur database, dan bisa direservasi sesuai cara cobanya. | 50–70 | 3–4 → 5–7 |
| **5. Pengayaan P2** | Keyboard Sound Test (§9.13), contoh rekaman mic dan webcam, grafik respons frekuensi, cek kecocokan DAC (B15) | Per fitur | Sisa waktu | – |

**Apa artinya untuk 6 bulan pertama.** Enam bulan (sekitar 26 minggu) dengan 10–20 jam per minggu berarti sekitar 260–520 jam. Fase 0–2 (fondasi, web MVP, pengayaan web) butuh sekitar 320–420 jam, dan aplikasi menambah 120–160 jam.

| Jam per minggu | Posisi setelah ±6 bulan |
|---|---|
| ±20 | Fase 0–2 selesai: web online dan sudah matang. Aplikasi (Fase 3) selesai atau hampir selesai. |
| ±15 | Fase 0–2 selesai atau hampir selesai. Aplikasi belum mulai. |
| ±10 | Fase 0–1 selesai atau hampir selesai (web online). |

Kalau waktu magangnya lebih panjang dari 6 bulan, fase berikutnya ikut masuk. Karena pemilik produk memilih **web yang lebih matang lebih dulu** (Q9), pengayaan web dikerjakan sebelum aplikasi. Garis targetnya **[Usulan]**:
- **Wajib:** Fase 0–1. Web online dengan semua alur utama berjalan.
- **Target:** Fase 2, lalu Fase 3. Web yang matang, kemudian aplikasi Pelanggan + Mode Operator.
- **Bonus:** Fase 4–5.

Setiap akhir fase ditutup dengan demo singkat ke pembimbing tempat magang dan guru pembimbing, supaya masukan datang lebih awal. **[Usulan]**

---

## 17. Metrik keberhasilan

**Metrik produk** (seandainya toko ini nyata; angkanya contoh target):

| Metrik | Target |
|---|---|
| Konversi coba → beli | ≥ 30% |
| Tingkat kehadiran reservasi | ≥ 80% |
| Waktu dari membuka Bandingkan sampai reservasi terkonfirmasi | < 2 menit |
| Pesanan yang kedaluwarsa | < 10% |
| Unit demo terpesan ganda, atau pesanan atas stok kosong | 0 |

**Kriteria keberhasilan project magang.** Project ini dinilai oleh pembimbing di tempat magang dan guru pembimbing sekolah (keputusan pemilik produk), jadi fitur, kode, dokumentasi, dan presentasi sama-sama penting. Rinciannya **[Usulan]**, dan akan disesuaikan kalau ada kriteria tertulis dari sekolah atau tempat magang (Q7):

| Aspek | Dianggap berhasil jika |
|---|---|
| Fitur | Web (Vercel) dan APK (EAS) online dan bisa dibuka penilai kapan saja, dengan data seed yang meyakinkan. Alur §10.1–10.4 berjalan dari awal sampai akhir. |
| Kode | Lint dan format rapi, tes aturan kritis lulus, riwayat commit teratur per fitur, dan README menjelaskan cara menjalankan project. |
| Dokumentasi | PRD, design system, diagram database, dan panduan singkat untuk setiap peran. |
| Presentasi | Skrip demo maksimal 10 menit dengan akun contoh untuk setiap peran, ditambah video demo cadangan seandainya internet bermasalah saat presentasi. |

---

## 18. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Cakupan besar (web + aplikasi + 3 dashboard + 11 kategori) dikerjakan satu orang | Project tidak selesai atau kelelahan di tengah jalan | Fase berurutan dengan kriteria selesai yang jelas, plus garis target wajib / target / bonus (§16). Kategori dicicil. Fase 3–5 boleh dipangkas tanpa merusak fase sebelumnya. Demo ke pembimbing di setiap akhir fase. |
| Kuota build gratis EAS terbatas per bulan (cek angka terbaru) | Build APK tertahan menjelang demo | Selama pengembangan pakai Expo Go atau development build lokal. Build EAS hanya untuk rilis. |
| Data spek model asli salah atau tidak lengkap | Bandingkan menyesatkan dan penilai meragukan datanya | Ambil spek dari situs resmi pabrikan, catat sumbernya di seed, dan tandai kontur sebagai "perkiraan bentuk". |
| Proyek Supabase gratis otomatis dijeda setelah sekitar seminggu tidak aktif (cek kebijakan terbaru) | Demo gagal saat presentasi | Buka proyek beberapa hari sebelum demo, jadwalkan ping rutin, atau upgrade paket. |
| Kuota email bawaan Supabase sangat kecil, dan template email baru bisa diubah setelah memakai SMTP sendiri | Email verifikasi tidak terkirim | Fase 0 memakai akun demo yang dibuat lewat admin, dan halaman verifikasi menerima tautan bawaan Supabase. SMTP sendiri dipasang bersamaan dengan deploy di Fase 1, karena butuh domain. |
| Hak cipta foto dan merek dagang (model asli dipakai) | Masalah karena situs online dan bisa dibuka publik | Foto sendiri atau buatan AI, tanpa logo merek sebagai identitas toko, ditambah penanda fiktif di footer. |
| Celah RLS membuka data antar peran | Kebocoran data | Tes RLS otomatis untuk setiap peran. |
| Pemesanan bersamaan dari web dan aplikasi | Reservasi bentrok, stok minus | Constraint dan transaksi di database (§11.1). |
| Data kontur tidak akurat | Pelanggan salah menilai bentuk | Label "perkiraan bentuk" dan tautan EloShapes. |
| Build iOS butuh akun Apple Developer berbayar | Aplikasi tidak bisa dipasang di iPhone | Fokus Android (APK). iOS cukup lewat Expo Go untuk demo. |

---

## 19. Pertanyaan

### 19.1 Sudah dijawab (22 November 2026)

| # | Pertanyaan | Jawaban pemilik produk | Dampak |
|---|---|---|---|
| Q1 | Penilai, tenggat, dan siapa yang mengerjakan | Dinilai pembimbing tempat magang **dan** guru pembimbing. Waktunya lebih dari 6 bulan. Dikerjakan sendiri. | Fase berurutan (§16), dan kriteria keberhasilan mencakup fitur, kode, dokumentasi, serta presentasi (§17). |
| Q2 | Katalog, Bandingkan, dan slot demo boleh dilihat tamu? | Boleh dilihat. Aksi seperti simpan, pesan, dan reservasi wajib login. | Sesuai §6.2. |
| Q3 | Merek asli atau fiktif? | Model asli, foto dibuat sendiri. | Aturan konten di §15. Risiko merek dagang di §18. |
| Q4 | Pemilik juga ada di aplikasi? | Cukup di web. | Aplikasi berisi Pelanggan + Mode Operator (§7). |
| Q5 | Online atau demo dari laptop? | Online: web di Vercel, aplikasi lewat EAS. | §12.3 dan risiko EAS serta Supabase di §18. |
| Q6 | Ada pembelian langsung di toko? | Ada, dicatat staf secara sederhana. | O8 masuk P0. |
| Q8 | Berapa jam per minggu untuk project ini? | 10–20 jam. | Perkiraan jam dan garis target di §16. |
| Q9 | Kalau waktunya mepet, aplikasi dulu atau web yang lebih matang? | Web yang lebih matang. | Pengayaan web (P1) menjadi Fase 2, aplikasi menjadi Fase 3 (§16). |

### 19.2 Masih terbuka

| # | Pertanyaan | Kenapa penting |
|---|---|---|
| Q7 | Apakah sekolah atau tempat magang punya kriteria penilaian tertulis? | Kalau ada, kriteria di §17 disesuaikan supaya yang dipoles memang yang dinilai. |

---

## 20. Catatan keputusan

| Keputusan | Asal |
|---|---|
| Nama dan lore LANTAI DUA | Pemilik produk |
| Konsep showroom dua lantai, tujuh fitur awal, arah visual, struktur beranda | Diskusi konsep pemilik produk |
| Next.js + React untuk web | Pemilik produk |
| Web + aplikasi mobile terpisah, satu database Supabase | Pemilik produk |
| Dashboard terpisah untuk pelanggan, operator, dan pemilik | Pemilik produk |
| Landing page untuk semua orang; fitur khusus dan dashboard hanya untuk pengguna terdaftar | Pemilik produk |
| Pesan online, ambil dan bayar di toko | Diskusi konsep pemilik produk |
| Keyboard Sound Test sebagai tambahan pertama setelah MVP | Diskusi konsep pemilik produk |
| Katalog, detail, Bandingkan, dan slot demo terbuka untuk tamu (hanya lihat) | Pemilik produk (Q2) |
| Monorepo + Expo untuk aplikasi | **Usulan** |
| Aplikasi berisi Pelanggan + Mode Operator; Pemilik hanya di web | Pemilik produk (Q4) |
| Web lebih dulu, aplikasi menyusul; dikerjakan sendiri, lebih dari 6 bulan | Pemilik produk (Q1) |
| Angka aturan bisnis (30 menit, 3 meja, 2×24 jam, batas reservasi, dst.) | **Usulan** |
| Produk referensi dan input ukuran manual di Bandingkan | **Usulan** |
| Undangan staf, satu peran per akun, verifikasi dua langkah untuk pemilik | **Usulan** |
| Verifikasi email sebelum login pertama | **Usulan** (setelan bawaan Supabase, alur kembali ke halaman semula lebih sederhana) |
| Konfirmasi reservasi perlu login | Pemilik produk (Q2) |
| Pelanggan memilih varian demo, sistem menugaskan unit | **Usulan** |
| Servis unit demo memakai perkiraan selesai, dengan pemindahan otomatis ke unit pengganti | **Usulan** |
| Status Tidak tercatat untuk reservasi yang lupa ditutup | **Usulan** |
| Pencatatan penjualan langsung sederhana (O8) | Pemilik produk (Q6) |
| 10–20 jam per minggu | Pemilik produk (Q8) |
| Web yang matang didahulukan; aplikasi setelah pengayaan web | Pemilik produk (Q9) |
| Urutan fase, perkiraan jam, dan garis target wajib / target / bonus di §16 | **Usulan** |
| Desain clean, minimalis, modern; animasi halus; palet tidak generik yang melambangkan trust dan kualitas | Pemilik produk |
| Palet A · Petrol & Tembaga (dipilih dari 3 opsi) | Pemilik produk |
| Archivo + Instrument Sans + Geist Mono, token gerak M1–M5 | **Usulan** |
| Model asli dari merek nyata, foto dibuat sendiri | Pemilik produk (Q3) |
| Online: web di Vercel, aplikasi lewat EAS | Pemilik produk (Q5) |
| Dinilai pembimbing tempat magang dan guru pembimbing | Pemilik produk (Q1) |
| Kategori dicicil: Kontrol, Permukaan, dan headset dulu; IEM, DAC, mic, webcam, monitor di Fase 4 | Pemilik produk |
| Rak, template spek sebagai data, tiga cara coba, area demo, aturan kebersihan | **Usulan** |
| Kriteria keberhasilan project magang (§17) | **Usulan** |

---

## 21. Glosarium

| Istilah | Arti |
|---|---|
| **Stok jual** | Jumlah barang baru yang bisa dibeli. |
| **Unit demo** | Barang yang dipajang untuk dicoba. Tidak dijual dan tidak dihitung sebagai stok jual. |
| **Produk referensi** | Model mouse yang tidak dijual toko. Data ukurannya disimpan hanya untuk keperluan Bandingkan. |
| **Rak** | Kelompok kategori di katalog: Kontrol, Permukaan, Audio, Layar & Streaming. |
| **Template spek** | Daftar atribut sebuah kategori. Filter, tabel spek, dan Bandingkan dibentuk dari sini. |
| **Area demo** | Bagian showroom dengan kapasitas sendiri, misalnya Meja Kontrol (3 meja) atau Stasiun Dengar. Kapasitasnya membatasi berapa reservasi yang bisa berjalan dalam satu slot. |
| **Cara coba** | Unit direservasi, stasiun direservasi, atau bebas tanpa reservasi. Ditentukan per kategori. |
| **Sesi / slot** | Satu blok waktu reservasi, misalnya 30 menit. |
| **Pesan-ambil** | Pesan online, lalu ambil dan bayar di toko. |
| **Mode Operator** | Bagian ringkas aplikasi mobile untuk staf. |
| **Penjualan langsung** | Pembelian di toko tanpa pesanan online, dicatat operator lewat O8. |
| **Tidak tercatat** | Status otomatis untuk reservasi yang tidak pernah di-check-in atau ditandai tidak datang oleh staf. |
| **RLS (Row Level Security)** | Aturan di database Supabase yang menentukan siapa boleh membaca atau mengubah baris data tertentu. |
| **Kontur** | Siluet bentuk mouse dari atas dan samping, digambar pada skala mm yang sama. |
