# Fase 1A — Katalog dan Detail Produk: Desain

| | |
|---|---|
| Tanggal | 25 November 2026 |
| Status | Draf, menunggu persetujuan pemilik produk |
| Bagian dari | Fase 1 (Web MVP), bagian pertama dari enam |
| Dasar | [PRD](../../PRD.md) §9.1 (L2, L3), §9.3, §9.4, §11, §13, §15 · [Design system](../../../design-system/lantai-dua/MASTER.md) |

> Tanda **[Usulan]** = keputusan penyusun yang belum dikonfirmasi pemilik produk. Yang tidak bertanda sudah diputuskan pemilik produk, atau sudah ada di PRD.

## 1. Maksud

Ini halaman pertama yang dipakai pelanggan sungguhan: katalog dan detail produk berisi data asli. Konsep "coba dulu, baru pilih" harus terasa di setiap kartu dan halaman produk lewat dua status yang terpisah, **stok jual** dan **unit demo**. Bagian ini juga jadi fondasi bagian Fase 1 berikutnya: Bandingkan (1B), reservasi dan showroom (1C), keranjang dan pesan-ambil (1D), serta dashboard (1E).

Isi katalog diambil dari gear yang pernah atau sedang dipakai pemilik produk, ditambah beberapa model populer, supaya tokonya terasa milik pemiliknya sendiri.

## 2. Tujuan, non-tujuan, anti-tujuan

**Tujuan**
- Pelanggan bisa menelusuri produk per rak dan kategori, mencari berdasarkan merek atau model, menyaring dengan filter yang relevan untuk tiap kategori, dan mengurutkan hasil.
- Pelanggan bisa membuka detail produk, memilih varian, lalu langsung melihat harga, stok jual, dan status unit demo varian itu.
- Beranda menampilkan pintu masuk tiap rak dan deretan produk yang bisa dicoba.
- Data produk asli dengan sumber spek tercatat.

**Non-tujuan (dikerjakan di bagian lain)**
- Bandingkan mouse, termasuk mouse referensi dan kontur (1B).
- Formulir reservasi dan halaman showroom (1C).
- Keranjang, checkout, dan wishlist yang tersimpan (1D).
- Pengelolaan produk oleh pemilik lewat dashboard, termasuk upload foto (1E).
- Foto produk asli. Pemilik produk akan memotret gear-nya sendiri nanti.
- "Kabari saya" (D9) dan produk serupa (D10), keduanya P1.
- Status yang berubah realtime. Di 1A belum ada yang bisa mengubah status unit demo atau stok selain seed dan dashboard Supabase, jadi data segar setiap halaman dibuka sudah cukup. Realtime ditambahkan di 1C, bersamaan dengan fitur operator mengubah status unit. **[Usulan]**

**Anti-tujuan**
- Katalog yang terasa seperti template toko online generik. Status demo harus sama menonjolnya dengan harga.
- Kartu atau halaman detail yang menampilkan status stok/demo berbeda dari kondisi database.
- Filter yang menghasilkan halaman kosong tanpa jalan keluar.
- Angka spek tanpa sumber, atau angka karangan.

## 3. Batasan

- Mengikuti semua Global Constraints Fase 0, yang tercatat di rencana Fase 0 dan README. Di antaranya: Bahasa Indonesia, uang dalam integer rupiah, RLS di semua tabel, secret key tidak pernah dipakai di web, target sentuh 44 px, tanpa scroll horizontal dari lebar 360 px, dan menghormati mode kurangi gerakan.
- Status stok dan demo dihitung database (PRD §12.4.1). Kode web dan aplikasi hanya menampilkan dan menyaring.
- Foto resmi merek tidak dipakai. Sampai foto pemilik ada, produk tampil memakai ilustrasi garis.
- Repo bersifat public, jadi file data produk tidak boleh berisi apa pun yang rahasia.

## 4. Pendekatan yang dipertimbangkan

| Pendekatan | Kelebihan | Kekurangan |
|---|---|---|
| **A. Database menyiapkan "kartu produk", filter jalan di web lewat kode bersama (dipilih pemilik produk)** | Filter terasa instan. Logika filter berupa TypeScript biasa yang mudah dites dan dipakai ulang oleh aplikasi. Status stok/demo tetap dihitung database. | Semua produk satu kategori dimuat sekaligus. Perlu pindah ke B kalau produk mencapai ribuan. |
| B. Satu fungsi database menjalankan semua filter | Tetap cepat untuk ribuan produk | Setiap klik filter menunggu server. SQL dinamis untuk template spek yang berbeda-beda lebih rumit dan sulit dirawat. |

Kenapa A: target katalog sekitar 60 produk, arah desainnya "animasi halus, nyaman", dan pemilik produk akan merawat kodenya sendiri.

## 5. Halaman dan perilaku

### 5.1 Beranda

Dua bagian baru ditambahkan di bawah hero yang sudah ada:

- **L2 · Pilih rak:** satu pintu untuk setiap rak yang punya produk aktif (Kontrol, Permukaan, Audio). Setiap pintu menampilkan nama rak, kategori di dalamnya, dan jumlah produk, lalu menuju `/katalog?rak=<slug>`.
- **L3 · Bisa dicoba di showroom:** deretan maksimal 8 produk yang unit demonya **tersedia**, diurutkan dari yang terbaru. Kategori bebas coba (pad dan deskmat) tidak ikut di deretan ini, supaya tidak tertutup produk yang selalu bisa dicoba. **[Usulan]** Kartunya sama dengan kartu katalog. Ada tautan "Semua yang bisa dicoba ↗" ke `/katalog?demo=1`.

### 5.2 Katalog

| Rute | Isi |
|---|---|
| `/katalog` | Semua produk dari semua rak. Filter yang tersedia hanya filter umum (§5.3), ditambah chip kategori yang menuju `/katalog/<kategori>`. Mendukung `?rak=` dan `?q=`. |
| `/katalog/<kategori>` | Produk satu kategori, dengan filter umum ditambah filter khusus dari template spek kategori itu. Slug yang tidak dikenal menampilkan 404. |

Tata letak:
- **Desktop (≥ 1024 px):** filter di kolom kiri 260 px, hasil di kanan dengan 3 kartu per baris.
- **HP:** tombol **Filter (n)** membuka panel dari bawah (sheet), dan hasil tampil 2 kartu per baris.
- **Di atas hasil:** jumlah hasil ("16 produk"), pilihan urutan, dan chip filter aktif yang masing-masing bisa dihapus.

Kartu produk (K6) berisi:
- ilustrasi atau foto di atas latar "meja demo";
- merek dan kategori;
- nama model;
- harga ("mulai Rp…" kalau harga variannya berbeda);
- dua baris status (§5.5).

Seluruh kartu menuju `/produk/<slug>`.

### 5.3 Filter, pencarian, dan urutan

**Filter umum** (semua halaman katalog):

| Filter | Bentuk | Aturan |
|---|---|---|
| Merek | daftar centang | produk cocok kalau mereknya termasuk yang dipilih |
| Harga | rentang min–max (Rp) | cocok kalau harga termurah produk ada di rentang |
| Bisa dicoba di showroom | centang | status demo `available`, atau kategori bebas coba (`free`) |
| Stok tersedia | centang | total stok > 0 |

**Filter khusus** dibentuk otomatis dari atribut template yang `is_filterable`. Aturan pencocokan:

| Tipe atribut | Bentuk | Produk cocok kalau |
|---|---|---|
| number | rentang min–max dengan satuan | nilainya ada di rentang. Produk tanpa nilai tidak cocok. |
| enum | daftar centang dari `options` | nilainya salah satu yang dipilih |
| multi_enum | daftar centang dari `options` | punya **minimal satu** nilai yang dipilih |
| boolean | centang "Ya" | nilainya `true` |
| scope `variant` | sesuai tipenya | **minimal satu** varian aktif cocok, misalnya switch keyboard |

Aturan gabungan:
- Antar filter berbeda: harus cocok **semua** (AND).
- Dalam satu filter: cukup cocok **salah satu** (OR).

**Pencarian (K2):** tidak peka huruf besar-kecil, dan mencocokkan potongan teks di nama merek dan nama model. Contoh: "ignix" menemukan semua produk VortexSeries Ignix.

**Urutan (K5):**
- Terbaru (bawaan)
- Harga terendah
- Harga tertinggi
- Paling ringan, khusus kategori yang punya atribut `weight_g`. Produk tanpa bobot ditaruh di akhir.

**URL (K7):** semua state tersimpan di query string, sehingga bisa dibagikan dan tombol kembali di browser berfungsi.

| Bagian | Format |
|---|---|
| Filter umum | `merek=a,b` · `harga=500000-1500000` · `demo=1` · `stok=1` · `urut=terbaru\|termurah\|termahal\|teringan` · `q=…` · `rak=…` |
| Filter khusus | key atribut apa adanya: `shape=Simetris,Ergonomis%20kanan` · `weight_g=50-70` (salah satu sisi boleh kosong: `50-`, `-70`) · `hot_swap=1` |
| Nilai tidak sah | diabaikan tanpa error, misalnya key yang tidak ada di template atau angka rusak |

Saat filter diubah, URL diganti tanpa memuat ulang halaman. Hasilnya langsung tersaring di browser. Halaman yang dibuka langsung dari URL dirender server dengan filter yang sama.

**Hasil kosong (K8):** tampil "Belum ada produk yang cocok", tombol **Hapus semua filter**, dan, kalau ada, saran menghapus filter terakhir.

**Halaman:** tanpa paginasi di 1A, karena produknya baru 16. Paginasi baru ditambahkan kalau produk sudah lebih dari 48. **[Usulan]**

### 5.4 Detail produk (`/produk/<slug>`)

| ID | Perilaku |
|---|---|
| D1 | Galeri berisi foto utama, ditambah foto samping untuk mouse. Selama foto belum ada, tampil ilustrasi garis kategori itu. |
| D2 | Pemilih varian. Mengganti varian langsung memperbarui harga, stok, foto varian (kalau ada), dan baris demo menurut aturan detail di §5.5, tanpa memuat ulang dan dengan crossfade M3. Varian terpilih tercatat di `?varian=<sku>`. Varian yang tidak dikenal kembali ke varian pertama. |
| D3, D4 | Dua status di dekat harga (§5.5). Status demo menyebut **varian unit demonya**, yang bisa berbeda dari varian yang sedang dipilih. |
| D5 | "Stok habis · Unit demo tersedia" tetap menampilkan tombol coba. |
| D6 | Tombol aksi: **Tambah ke keranjang** (nonaktif kalau stok varian 0), **Coba di showroom**, **Bandingkan** (khusus mouse, menuju `/bandingkan?incaran=<slug>`), dan **Simpan ke wishlist**. **Coba di showroom** muncul kalau produk punya minimal satu unit demo yang terhitung (tersedia, dipakai, atau diservis), karena reservasi bisa untuk jam lain. Tombol ini menuju `/reservasi/baru?varian=<sku varian demo yang ditampilkan>`. Selama fiturnya belum dibuat, keranjang dan wishlist mengarah ke halaman "segera hadir". **[Usulan]** |
| D7 | Tabel spek dibentuk dari template, dengan label dan satuan. Atribut yang tidak punya nilai tidak ditampilkan. Mouse menampilkan dimensi sebagai "124 × 64 × 38 mm" dengan huruf mono. |
| D8 | Tautan EloShapes kalau `eloshapes_url` terisi. |
| D11 | Kalimat cara coba sesuai kategori. Kategori `free`: "Bisa dicoba langsung di {nama area}, tanpa reservasi." Nama area diambil dari area demo aktif ber-`kind = 'free'` dengan `sort_order` terkecil, yaitu "Meja Permukaan". Kalau area itu tidak ada, kalimatnya menjadi "Bisa dicoba langsung di showroom, tanpa reservasi." Kategori `unit` yang punya catatan kebersihan menampilkan catatan itu. |

Produk nonaktif, produk referensi (`is_for_sale = false`), atau slug yang tidak dikenal menampilkan 404.

### 5.5 Aturan status (dipakai kartu dan detail)

**Stok jual.** Total stok untuk kartu, stok varian untuk detail.

| Kondisi | Teks kartu | Teks detail | Warna |
|---|---|---|---|
| 0 | Stok habis | Stok jual: habis | bahaya |
| 1–3 | Sisa N | Stok jual: sisa N | peringatan |
| > 3 | Stok tersedia | Stok jual: tersedia | sukses |

**Unit demo.** Status ini dihitung database per produk dan per varian. Yang tidak dihitung: unit yang pensiun, unit di area nonaktif, dan unit pada varian nonaktif. Kalau statusnya campur, prioritasnya: tersedia > sedang dipakai > diservis > tidak ada.

Di halaman detail, baris demo memilih unit dengan urutan berikut **[Usulan]**:
1. Kalau varian yang sedang dipilih punya unit `available`, yang ditampilkan unit varian itu.
2. Kalau tidak, yang ditampilkan status terbaik produk beserta label variannya.

Tombol **Coba di showroom** memakai SKU varian yang sedang ditampilkan di baris demo. Di kartu katalog, yang tampil selalu status produk.

| Kondisi | Teks | Warna |
|---|---|---|
| Kategori `free` | Bisa dicoba langsung | aksen |
| Ada unit `available` | Demo tersedia · {label varian demo} | aksen |
| Hanya `in_use` | Unit demo sedang dipakai | peringatan |
| Hanya `servicing` | Unit demo sedang diservis | netral |
| Tidak ada unit | Tidak ada unit demo | netral |

Label varian demo **[Usulan]**:
- Label selalu memakai **nama varian**. Tidak ada aturan khusus per kategori di kode, sesuai prinsip "template sebagai data" (PRD K1a).
- Nama varian keyboard di data seed ditulis `"<nama switch> (<jenis>)"`, misalnya "Gateron Brown (tactile)". Dengan begitu, contoh PRD D3 ("Gateron Brown") dan L3 ("tactile") sama-sama terwakili.
- Varian kategori lain memakai warna, misalnya "Putih".
- Kalau ada lebih dari satu unit tersedia, yang dipakai label unit dengan kode terkecil.

Setiap status selalu tampil sebagai ikon + teks (MASTER §2.3).

## 6. Data dan database

### 6.1 Tampilan baca (view) baru

Semua view memakai `security_invoker = true`, jadi RLS tabel asal tetap berlaku.

| View | Isi per baris | Dipakai di |
|---|---|---|
| `catalog_items` | Satu baris per produk **aktif, dijual, di kategori aktif**: id, slug, model, merek (slug, nama), kategori (slug, nama, `try_mode`), rak (slug, nama), specs, atribut varian aktif (array), harga termurah dan termahal, total stok, status demo produk, label dan SKU varian demo, path foto utama, `created_at` | Beranda, katalog |
| `variant_availability` | Satu baris per varian aktif dari produk yang terlihat di `catalog_items`: id, product_id, sku, nama, atribut, harga, stok, status demo varian, path foto varian | Detail produk |

**View mengulang sendiri semua aturan visibilitas.** RLS memberi staf akses ke data nonaktif, jadi view tidak boleh mengandalkan RLS untuk menyembunyikannya. Aturan yang ditulis eksplisit di view:
- produk `is_active` dan `is_for_sale`;
- kategori `is_active`;
- varian `is_active`;
- unit demo: status bukan `retired`, area `is_active`, dan variannya aktif.

Dengan begitu, staf yang membuka katalog publik melihat status dan jumlah yang persis sama dengan tamu. Ada tes RLS khusus untuk memastikan ini.

### 6.2 Foto

- Bucket Storage `product-images`: bisa dibaca semua orang, dan hanya pemilik yang bisa menulis, memperbarui, atau menghapus.
- Path: `products/<product_id>/<variant_id atau "produk">/<kind>-<n>.webp`. Memakai id, bukan slug, supaya path tidak rusak kalau slug diganti, dan foto varian tidak bentrok dengan foto produk. **[Usulan]**
- Web membentuk URL publik dari path itu. Kalau path kosong, yang tampil ilustrasi garis kategori.
- Upload baru dilakukan lewat dashboard di 1E. Sampai saat itu, pemilik bisa mengunggah lewat dashboard Supabase.

### 6.3 Data produk asli

Data disimpan di file TypeScript `supabase/data/catalog.ts`, lalu dimasukkan dengan skrip `scripts/seed-catalog.ts` (`pnpm db:seed-catalog`). Aturan skrip **[Usulan]**:
- **Kolom deskriptif diperbarui berdasarkan slug/sku/kode.** Yang termasuk: nama, merek, deskripsi, specs, atribut varian, `spec_source_url`, dan `eloshapes_url`.
- **Kolom bisnis hanya diisi saat baris pertama kali dibuat** dan tidak pernah ditimpa saat skrip dijalankan ulang. Yang termasuk: `price_idr`, `stock_qty`, `is_active`, status dan area unit demo. Alasannya, perubahan dari operator (1C), checkout (1D), dan pemilik (1E) tidak boleh hilang.
- Sebelum menulis, skrip mencetak project ref tujuan.
- Skrip tidak menyentuh produk yang dibuat pemilik di luar file ini.
- Seed struktural (`supabase/seed.sql`) tidak diubah.

**Daftar produk (16)**

| # | Produk | Kategori | Asal |
|---|---|---|---|
| 1 | VortexSeries Ignix F1 | mouse | gear pemilik |
| 2 | VortexSeries Ignix R1 Pro | mouse | gear pemilik |
| 3 | Pressplay Essential 75 HE | keyboard | gear pemilik |
| 4 | Royal Kludge M75 | keyboard | gear pemilik |
| 5 | DBE Kumo GS1X Pro | headset | gear pemilik |
| 6 | HyperX Cloud II | headset | gear pemilik |
| 7 | VortexSeries Ignix Glide | glasspad | gear pemilik |
| 8 | Lastpad Hathor | mousepad | gear pemilik |
| 9 | Logitech G Pro X Superlight 2 | mouse | disetujui pemilik · simetris, wireless ringan |
| 10 | Razer DeathAdder V3 Pro | mouse | disetujui pemilik · ergonomis kanan, supaya filter bentuk kepakai |
| 11 | Keychron K8 Pro | keyboard | disetujui pemilik · TKL, supaya layout bervariasi |
| 12 | Royal Kludge RK61 | keyboard | disetujui pemilik · 60% |
| 13 | Artisan Hien | mousepad | disetujui pemilik |
| 14 | SkyPAD Glass 3.0 | glasspad | disetujui pemilik |
| 15 | Logitech Desk Mat Studio Series | deskmat | disetujui pemilik · bahan kain |
| 16 | Orbitkey Desk Mat | deskmat | disetujui pemilik · kulit sintetis |

Gear pemilik untuk Fase 4 (Simgot EW300 HBB, Kinera Celest CD2, Fifine K688, Xiaomi G24i 2026) dicatat di `supabase/data/catalog-fase-4.md`. File itu tidak di-seed.

**Aturan data**
- Setiap nilai spek punya sumber. Sumbernya dicatat per nilai di `catalog.ts`, sebagai peta `key → 'resmi' | 'ukur'`. Database hanya menyimpan URL halaman resmi di `spec_source_url`, dan halaman detail tidak menampilkan baris sumber. **[Usulan]** Ini sudah cukup memenuhi PRD §15 ("sumbernya dicatat di seed") tanpa perlu migrasi tambahan.
- Nilai yang tidak ditemukan dan tidak bisa diukur **dibiarkan kosong**, tidak dikarang.
- Ukuran mouse gear pemilik yang tidak tercantum di situs resmi diukur pemilik produk sendiri: panjang, lebar, dan tinggi dalam mm, bobot dalam gram.
- Harga adalah **harga contoh** yang mendekati harga pasar Indonesia, dibulatkan ke ribuan.
- Varian mengikuti varian yang benar-benar ada, misalnya warna dan switch.
- Stok dan unit demo diatur supaya **semua kombinasi status muncul minimal sekali**:
  - stok tersedia, sisa 1–3, dan habis;
  - demo tersedia, sedang dipakai, diservis, tidak ada unit, dan bebas coba;
  - minimal satu produk "Stok habis · Unit demo tersedia" (D5);
  - minimal satu keyboard yang unit demonya memakai switch berbeda dari varian pertamanya (D4).
- Unit demo kategori `unit` ditempatkan di Meja Kontrol.
- Pad dan deskmat **tidak dibuatkan baris unit demo**. Kategorinya `free`, jadi barangnya cukup dipajang di Meja Permukaan. **[Usulan]** PRD §15 disesuaikan, dan halaman showroom di 1C menampilkan produk kategori `free` langsung dari katalog.
- Cakupan semua kombinasi status dites di **file data** (`catalog.ts`) lewat unit test, bukan di database. Status di database boleh berubah karena operasi toko.

### 6.4 Kode bersama (`packages/shared/catalog`)

Fungsi murni (tanpa I/O) yang dipakai server, browser, dan nanti aplikasi:
- **Query:** `parseCatalogQuery`, `serializeCatalogQuery`
- **Filter dan urutan:** `filterCatalog`, `sortCatalog`, `facetsFor` (bentuk filter dari template)
- **Label:** `stockLabel`, `demoLabel`, `priceLabel`
- **Format:** `formatRupiah`, `formatDimensions`

## 7. Tampilan dan gerak

- Mengikuti design system (palet A, Archivo/Instrument Sans/Geist Mono). Tidak ada warna baru.
- Gerak:
  - hover kartu (garis tepi berubah, ilustrasi atau foto membesar 1,02×, sesuai MASTER §6.3);
  - varian berganti dengan crossfade M3;
  - sheet filter di HP masuk dalam `dur-slow`;
  - daftar hasil berganti dengan fade singkat, tanpa geseran.
- Semua gerak hilang atau diganti fade singkat saat mode kurangi gerakan aktif.
- Jumlah hasil diumumkan ke pembaca layar (`aria-live="polite"`).
- Ilustrasi garis per kategori: mouse (tampak atas), keyboard, headset, mousepad, glasspad, dan deskmat. Gayanya mengikuti `preview.html`.

## 8. Kriteria selesai

- Beranda menampilkan pintu rak dan deretan "Bisa dicoba di showroom" dari data asli.
- Setiap kategori Fase 1 berisi minimal 2 produk, dan semua filter khususnya bisa dipakai.
- Filter, pencarian, dan urutan mengubah hasil serta URL. Tombol kembali di browser mengembalikan state sebelumnya. Hasil kosong menawarkan jalan keluar.
- Detail produk: mengganti varian memperbarui harga, stok, status demo, dan URL. Semua kombinasi status di §5.5 bisa ditemukan di data seed.
- Tidak ada scroll horizontal di lebar 360 px pada beranda, katalog, dan detail.
- Tes lulus:
  - unit test untuk kode bersama katalog;
  - tes RLS untuk view dan Storage: tamu hanya melihat produk publik; staf melihat status dan jumlah yang sama dengan tamu; unit yang pensiun, di area nonaktif, atau di varian nonaktif tidak dihitung; tamu dan pelanggan tidak bisa mengunggah foto, sedangkan pemilik bisa;
  - unit test data (`catalog.ts` lolos validasi template, dan semua kombinasi status di §6.3 ada);
  - tes seed (16 produk, setiap kategori Fase 1 terisi minimal 2, skrip aman dijalankan ulang tanpa menimpa kolom bisnis);
  - e2e untuk alur di atas.

## 9. Diputuskan pemilik produk

- Mengikuti urutan fase: rak Kontrol, Permukaan, dan headset dulu. Gear Fase 4 menunggu.
- Data diambil dari gear pemilik, ditambah model populer.
- Foto menyusul, difoto sendiri lalu dirapikan dengan AI (hapus background) tanpa mengubah bentuk produk.
- Pendekatan A.
- Delapan model tambahan (#9–16) di §6.3 disetujui.

## 10. Keputusan penyusun (bisa dikoreksi)

- Tanpa paginasi sampai produk lebih dari 48.
- Filter "ukuran mouse (kecil/sedang/besar)" dari PRD K4 **tidak** dibuat. Filter bobot dan bentuk sudah cukup, dan ukuran turunan tidak cocok dengan template berbasis data.

- Tombol keranjang dan wishlist sementara mengarah ke halaman "segera hadir".
- Detail aturan URL, prioritas status demo, dan label varian demo seperti di §5.
- Baris demo di halaman detail mendahulukan unit varian yang sedang dipilih. Tombol coba memakai SKU varian demo yang ditampilkan.
- Label demo selalu memakai nama varian. Nama varian keyboard ditulis "Gateron Brown (tactile)".
- Status realtime ditunda ke 1C. Di 1A, data segar setiap halaman dibuka.
- Deretan L3 hanya berisi produk dengan unit demo tersedia, tanpa kategori bebas coba.
- Seed katalog tidak pernah menimpa harga, stok, status, dan area yang sudah ada.
- Sumber spek dicatat per nilai di `catalog.ts`, tidak ditampilkan di halaman detail, dan tidak butuh migrasi.
- Pad dan deskmat tanpa baris unit demo. PRD §15 disesuaikan.
- Path foto memakai id produk dan varian.
- Unit demo di varian nonaktif tidak dihitung, sejalan dengan RLS.

## 11. Menunggu jawaban pemilik produk

1. ~~Apakah 8 model tambahan disetujui?~~ Sudah disetujui pemilik produk (25 November 2026).
2. Dari 8 gear pemilik, mana yang **masih dimiliki**? Pertanyaan ini dijawab saat riset spek: penyusun mengirim daftar nilai yang kosong, lalu pemilik mengukur yang barangnya masih ada. Ukuran yang tidak tercantum di situs resmi, terutama untuk dua mouse VortexSeries, perlu diukur langsung. Tanpa ukuran itu, kedua mouse tidak ikut filter bobot dan urutan "paling ringan", dan nanti tidak bisa dipakai di Bandingkan (1B).

## 12. Diserahkan ke builder

- Tata letak persis dalam batas design system.
- Bentuk ilustrasi garis.
- Komponen yang dibuat ulang dari `preview.html`.
- Nama komponen React.
- Cara sinkronisasi URL di Next 16 (`router.replace` + `useTransition`, atau yang setara).
