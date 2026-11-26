# Fase 1B — Bandingkan Mouse: Desain

| | |
|---|---|
| Tanggal | 26 November 2026 |
| Status | Draf, menunggu persetujuan pemilik produk |
| Bagian dari | Fase 1 (Web MVP), bagian kedua dari enam |
| Dasar | [PRD](../../PRD.md) §5, §7, §9.1 (L4), §9.5 (B1–B12), §10.1, §11, §11.2, §15 · [Design system](../../../design-system/lantai-dua/MASTER.md) (garis ukur, ilustrasi, M1) · [Desain 1A](2026-11-25-fase-1a-katalog-design.md) |

> Tanda **[Usulan]** = keputusan penyusun yang belum dikonfirmasi pemilik produk. Yang tidak bertanda sudah diputuskan pemilik produk, atau sudah ada di PRD.

## 1. Maksud

Bandingkan adalah fitur khas LANTAI DUA (PRD §5, G3). Pelanggan menaruh mouse yang dipakainya sekarang di samping mouse incaran. Ia langsung melihat bedanya dalam angka dan dalam gambar berskala, lalu bisa memesan sesi untuk mencoba keduanya di showroom.

Contoh penggunanya adalah Raka (PRD §7). Mouse lamanya 80 g, ia ingin yang lebih ringan, dan ia ingin yakin sebelum mengeluarkan uang. Halaman ini harus menjawab "seberapa beda?" dalam satu kalimat, lalu mengajaknya datang untuk mencoba.

## 2. Tujuan, non-tujuan, anti-tujuan

**Tujuan**
- Halaman `/bandingkan` dengan dua slot, **Mouse gue sekarang** dan **Mouse incaran** (B1–B3).
- Selisih panjang, lebar, tinggi, bobot, dan harga, dirangkum dalam satu kalimat biasa (B4).
- Gambar **kotak ukuran** berskala sama untuk tampak atas dan tampak samping, dengan gerak khas M1.
- Tabel spek berdampingan dan tautan EloShapes (B6).
- Status unit demo kedua mouse dan tombol **Coba keduanya di Surabaya** (B7, B8).
- Sekitar 20 **mouse referensi** (tidak dijual) dengan ukuran dari sumber resmi (B2, PRD §15).
- Ukuran manual untuk mouse yang tidak ada di daftar (B2).
- **Gear gue** untuk mouse: simpan dari halaman ini, terisi otomatis saat login (B10).
- Pasangan yang dibandingkan tersimpan di URL dan bisa dibagikan (B11).
- Versi ringkas di beranda (L4, B12).

**Non-tujuan (dikerjakan di bagian lain)**
- Kontur mouse asli (B5). Belum ada SVG-nya, dan unggahnya baru ada di dashboard pemilik (PM2, 1E). Lihat §5.5.
- Formulir reservasi (1C). Di 1B, tombol Coba keduanya hanya membuka `/reservasi/baru` dengan pilihannya terbawa.
- Halaman `/akun/gear` dan gear keyboard atau headset (U4, 1E).
- Bandingkan kategori lain (B13, P1, Fase 2).
- Mengelola mouse referensi lewat dashboard (PM2, 1E). Di 1B, mouse referensi ditambahkan lewat file data, sama seperti produk 1A.

**Anti-tujuan**
- Gambar yang terlihat seperti bentuk asli padahal bukan. Kotak ukuran selalu diberi label.
- Angka ukuran karangan. Mouse referensi tanpa ukuran resmi tidak dimasukkan.
- URL rusak atau hasil ketikan tangan yang membuat halaman error.
- Mouse referensi muncul di katalog, punya halaman produk, atau bisa masuk keranjang.
- Selisih yang diberi warna "baik" dan "buruk". Lebih ringan belum tentu lebih cocok.

## 3. Batasan

- Semua Global Constraints Fase 0 dan aturan 1A tetap berlaku. Di antaranya: Bahasa Indonesia, uang dalam integer rupiah, RLS di semua tabel, secret key tidak pernah dipakai di web, target sentuh 44 px, tanpa scroll horizontal dari lebar 360 px, dan menghormati mode kurangi gerakan.
- Status unit demo tetap dihitung database (PRD §12.4.1), dengan aturan yang sama dengan `catalog_items`.
- Aturan selisih, kalimat, dan URL ditulis di `packages/shared`, supaya aplikasi Expo bisa memakainya ulang.
- Repo bersifat public. File data hanya berisi nama model, angka spek, dan tautan sumber resmi.

## 4. Pendekatan yang dipertimbangkan

**Cara kerja halaman**

| Pendekatan | Kelebihan | Kekurangan |
|---|---|---|
| **A. Server memuat daftar mouse sekali, pilihan berganti di browser [Usulan]** | Ganti pilihan terasa instan, dan animasi M1 tidak terputus oleh muat ulang. Logikanya berupa TypeScript biasa yang mudah dites. Polanya sama dengan filter katalog 1A. | Seluruh daftar mouse (sekitar 25 baris ringan) ikut dimuat. Perlu pencarian di server kalau mouse mencapai ratusan. |
| B. Setiap ganti pilihan memuat ulang dari server | Data per halaman kecil | Setiap pilihan menunggu server, animasi diputar ulang dari awal, dan pemilih tetap butuh daftar lengkap. |
| C. Fungsi database menghitung selisih | Satu sumber hitungan | Aturan kalimat dan pembulatan pindah ke SQL, sulit dites, dan tidak bisa dipakai ulang aplikasi untuk tampilan. |

**Gambar perbandingan** (dipilih pemilik produk)

| Pilihan | Keterangan |
|---|---|
| **Kotak ukuran (dipilih)** | Setiap mouse digambar sebagai kotak dari angkanya sendiri. Muncul di semua perbandingan yang punya angka. |
| Kontur asli saja | Kontur hanya bisa digambar dari foto sendiri, dan pemilik hanya punya F1 dan R1 Pro. Gambarnya jarang muncul. |
| Tanpa gambar | Paling cepat, tetapi fitur khasnya kurang terasa. |

**Mouse referensi** disimpan sebagai `products` dengan `is_for_sale = false` (PRD §11). Kolomnya sudah ada sejak Fase 0, jadi tabel terpisah tidak dipertimbangkan.

## 5. Halaman dan perilaku

### 5.1 Susunan `/bandingkan`

```
Bandingkan mouse
[Mouse gue sekarang ▾ Logitech G102 Lightsync]  [Mouse incaran ▾ VortexSeries Ignix F1]
[Simpan sebagai mouse gue]

Incaran lebih ringan … g dan lebih pendek … mm.

Tampak atas · skala sama            Tampak samping · skala sama
┌──────────────┐                    ┌──────────────┐
│ ┌──────────┐ │                    │ ┌──────────┐ │
│ └──────────┘ │                    └─┴──────────┴─┘
└──────────────┘
Ukuran luar, bukan bentuk asli.  [Putar ulang]

| Spek    | Mouse sekarang | Incaran | Selisih |
| Panjang | …              | …       | …       |
| …       |                |         |         |

Unit demo: G102 — Tidak ada di showroom · Ignix F1 — ● Bebas
[Coba keduanya di Surabaya ↗]
Mouse lama lu nggak ada di showroom? Bawa aja dari rumah biar bisa dibandingin langsung.
Bandingkan bentuknya di EloShapes: Ignix F1
```

Di layar sempit, tampak atas dan tampak samping disusun ke bawah.

### 5.2 Pemilih

- **Mouse gue sekarang** memakai `<select>` bawaan browser **[Usulan]** dengan dua grup: "Dijual di LANTAI DUA" dan "Mouse lain". Isinya diurutkan menurut merek lalu model. Opsi terakhir adalah **Isi ukuran sendiri**. `<select>` bawaan dipilih karena nyaman di HP, aksesibel, dan daftar sekitar 25 mouse masih mudah dipindai.
- **Mouse incaran** memakai `<select>` yang hanya berisi mouse dijual.
- **Isi ukuran sendiri** membuka empat kolom angka: panjang, lebar, dan tinggi (mm), serta bobot (g). Kolom boleh diisi sebagian. Nilai diterapkan saat kolom kehilangan fokus atau saat Enter ditekan, sama dengan kolom rentang di katalog 1A. Koma dan titik desimal sama-sama diterima.
- Rentang wajar **[Usulan]**: panjang 80–160 mm, lebar 40–100 mm, tinggi 20–60 mm, bobot 20–200 g. Nilai di luar rentang ditolak dengan pesan di bawah kolomnya.
- Kedua slot boleh berisi mouse yang sama. Kalimatnya menjadi "Dua pilihan ini mouse yang sama." **[Usulan]**

### 5.3 URL (B11)

- Bentuk: `/bandingkan?sekarang=<slug>&incaran=<slug>`.
- Ukuran manual: `/bandingkan?sekarang=ukur&panjang=125&lebar=63&tinggi=40&bobot=60&incaran=<slug>`. Angka di URL selalu memakai titik desimal. Kata `ukur` dicadangkan dan tidak boleh dipakai sebagai slug produk. **[Usulan]**
- Urutan kunci tetap: `sekarang`, `panjang`, `lebar`, `tinggi`, `bobot`, `incaran`. Parameter yang kosong tidak ditulis.
- Parameter yang tidak sah diabaikan tanpa error:
  - slug yang tidak dikenal membuat slotnya kosong;
  - slug mouse referensi di `incaran` membuat slot incaran kosong;
  - angka di luar rentang atau bukan angka diabaikan;
  - `panjang`, `lebar`, `tinggi`, dan `bobot` diabaikan kalau `sekarang` bukan `ukur`.
- Parameter `kategori` di PRD §8 belum dipakai. Saat B13 datang, URL tanpa `kategori` berarti mouse. **[Usulan]**
- Mengganti pilihan memakai `history.pushState`, jadi tombol Back kembali ke pasangan sebelumnya. Ini sama dengan filter katalog 1A.
- **URL selalu mencerminkan pasangan yang tampil [Usulan].** Kalau slot terisi dari Gear gue atau dari pasangan contoh (§5.4), URL diperbarui dengan `history.replaceState` setelah halaman dimuat. Dengan begitu, menyalin URL selalu membagikan apa yang sedang dilihat.

### 5.4 Isi awal slot

Urutan prioritas:

1. Isi URL.
2. Untuk pelanggan yang login dan punya Gear gue, slot **sekarang** diisi dari gear kalau URL tidak memuat `sekarang` (B10).
3. Kalau URL tidak memuat parameter apa pun, slot yang masih kosong diisi **pasangan contoh** dari pengaturan toko (§6.3). PRD §9.1 mensyaratkan data beranda L4 diambil dari database, bukan ditulis di kode. Nilai awalnya **[Usulan]**: Logitech G102 Lightsync (referensi) dan VortexSeries Ignix F1 (dijual).
4. Kalau URL hanya memuat `incaran` (misalnya dari tombol Bandingkan di detail produk) dan tidak ada gear, slot sekarang dibiarkan kosong dengan ajakan "Pilih mouse yang lu pakai sekarang".

Cadangan kalau data tidak tersedia **[Usulan]**:
- Kalau mouse di gear sudah tidak aktif, gear dianggap kosong.
- Kalau mouse contoh incaran kosong, tidak aktif, atau bukan mouse dijual, slot incaran diisi mouse dijual paling ringan yang punya unit demo, atau mouse dijual paling ringan kalau tidak ada yang punya unit demo.
- Kalau mouse contoh sekarang kosong atau tidak aktif, slot sekarang dibiarkan kosong dengan ajakan.

### 5.5 Gambar kotak ukuran dan gerak M1

- Ada dua panel: **tampak atas** (panjang × lebar) dan **tampak samping** (panjang × tinggi).
- Kedua mouse dan kedua panel memakai **skala yang sama**, dihitung dari ukuran terbesar yang tampil.
- Penjajaran **[Usulan]**: ujung belakang (bagian telapak) kedua kotak disejajarkan. Di tampak atas, kotak dipusatkan pada sumbu lebar. Di tampak samping, alasnya disejajarkan di "meja".
- Gaya mengikuti design system: mouse sekarang memakai garis putus-putus `ink-subtle`, mouse incaran memakai garis `primary` berisi `primary-soft`.
- Motif **garis ukur** menunjukkan panjang dan lebar (atau tinggi) mouse incaran dengan angka mono. Angka mouse sekarang tampil di legenda. **[Usulan]**
- Label "Ukuran luar, bukan bentuk asli." selalu tampil di bawah gambar.
- Panel hanya digambar kalau kedua mouse punya angka yang dibutuhkan. Kalau tidak, panel diganti teks pendek, misalnya "Tinggi Logitech G102 belum tercatat."
- **Gerak M1**: kotak mouse sekarang masuk dari kiri, kotak incaran masuk dari kanan, lalu keduanya bertemu dan menumpuk dalam `dur-showcase` (640 ms). Setelah itu angka selisih muncul dengan fade 150 ms. Gerak diputar saat halaman dimuat, saat pasangan berganti, dan saat tombol **Putar ulang** ditekan.
- Dengan mode kurangi gerakan, kotak langsung tampil menumpuk tanpa geser. Token `dur-showcase` sudah bernilai 0 ms dalam mode itu.
- **Animasi memakai CSS [Usulan]**, bukan pustaka Motion yang disebut MASTER. Gerakannya hanya geser kotak, token CSS sudah menangani mode kurangi gerakan, dan tidak perlu dependensi baru. Pustaka Motion bisa ditambahkan saat kontur asli dikerjakan.
- **Kontur asli belum digambar di 1B [Usulan].** Kolom SVG kontur sudah ada di `products`, tetapi belum ada skala mm-nya, belum ada datanya, dan belum ada cara mengunggahnya. Pergantian kotak menjadi kontur saat kedua mouse punya kontur dikerjakan bersama unggah kontur di dashboard pemilik (PM2, 1E). Komponen gambar dirancang supaya isinya bisa diganti kontur tanpa mengubah tata letak halaman.

### 5.6 Kalimat dan tabel (B4)

**Kalimat**
- Arahnya selalu dari incaran terhadap mouse sekarang, dengan kata "Incaran" seperti contoh PRD.
- Kalimat hanya menyebut **bobot dan panjang [Usulan]**, karena dua angka itu yang paling terasa di tangan. Selisih lainnya ada di tabel.
- Kata yang dipakai: lebih ringan / lebih berat, lebih pendek / lebih panjang.
- Pembulatan: mm satu desimal, gram bilangan bulat, dan ",0" dibuang.
- Selisih bobot di bawah 1 g dan selisih panjang di bawah 0,5 mm disebut "hampir sama". **[Usulan]**
- Angka yang tidak ada di salah satu mouse dilewati. Kalau bobot dan panjang sama-sama tidak bisa dihitung, kalimat tidak tampil.

| Kondisi | Kalimat |
|---|---|
| −9 g, −6,21 mm | Incaran lebih ringan 9 g dan lebih pendek 6,2 mm. |
| +3 g, +0,3 mm | Incaran lebih berat 3 g, panjangnya hampir sama. |
| +0,4 g, −0,2 mm | Bobot dan panjangnya hampir sama. |
| bobot tidak ada di mouse sekarang, −4 mm | Incaran lebih pendek 4 mm. |
| mouse yang sama | Dua pilihan ini mouse yang sama. |

**Tabel**
- Baris: Panjang, Lebar, Tinggi, Bobot, Harga, lalu atribut lain dari template mouse yang `is_comparable` (Bentuk, Koneksi, Sensor). Label dan format nilainya memakai fungsi tabel spek 1A.
- Kolom: Spek, Mouse sekarang, Incaran, Selisih. Selisih hanya diisi untuk atribut angka, dengan tanda − atau +, dan warnanya netral.
- Harga memakai harga varian termurah. Kalau harga variannya berbeda-beda, ditulis "mulai Rp…". **[Usulan]**
- Baris harga dan selisih harga hanya tampil kalau kedua mouse punya harga. Mouse referensi dan ukuran manual tidak punya harga.
- Untuk ukuran manual, baris selain empat angka berisi "–".

### 5.7 Status demo dan Coba keduanya (B7, B8, B9)

- Status unit demo kedua mouse memakai komponen status 1A. Mouse referensi dan ukuran manual ditulis "Tidak ada di showroom".
- Tombol **Coba keduanya di Surabaya** aktif kalau minimal satu mouse punya unit demo, apa pun statusnya. Reservasi dipesan untuk jadwal ke depan, jadi unit yang sedang dipakai tetap bisa dipesan. **[Usulan]**
- Tujuan tombol adalah `/reservasi/baru?varian=<sku>[,<sku>]&bawa=<slug|ukur>`. Formulir 1C membaca parameter ini, dan sampai 1C selesai halaman itu masih "sedang disiapkan".
  - `varian` berisi SKU varian demo terbaik (`demo_variant_sku`) dari setiap mouse yang punya unit demo.
  - `bawa` hanya ditulis kalau mouse sekarang tidak punya unit demo. Isinya slug mouse itu, atau `ukur` untuk ukuran manual. Dengan begitu formulir 1C bisa menampilkan saran membawa mouse lama (PRD §10.1 langkah 4). **[Usulan]**
- Kalau tidak ada mouse yang punya unit demo, tombol nonaktif dengan alasan "Dua mouse ini belum ada unit demonya."
- Kalau mouse sekarang tidak punya unit demo, tampil saran persis seperti B8: *"Mouse lama lu nggak ada di showroom? Bawa aja dari rumah biar bisa dibandingin langsung."*
- **Tamu** yang menekan tombol diarahkan ke `/masuk?next=<tujuan tombol>`, sesuai PRD §6.3 poin 2, B9, dan §10.1. Setelah login, daftar, atau verifikasi email, ia sampai di formulir reservasi dengan pilihannya terbawa. Pelanggan yang sudah login langsung menuju formulir.
- Tautan EloShapes tampil untuk setiap mouse yang punya `eloshapes_url`, dengan nama mousenya.

### 5.8 Gear gue (B10)

- Tombol **Simpan sebagai mouse gue** tampil di bawah pemilih mouse sekarang kalau slotnya terisi dan isinya berbeda dari gear yang tersimpan. Setelah disimpan, tombol berganti menjadi teks "Tersimpan sebagai mouse lu."
- Yang bisa disimpan: mouse dari daftar, atau ukuran manual.
- **Tamu**: tombol tetap tampil. Menekannya membuka `/masuk?next=<URL bandingkan saat ini>`. Setelah login, pelanggan kembali ke pasangan yang sama dan menekan tombol sekali lagi. Penyimpanan tidak berjalan otomatis setelah login, supaya tidak ada data yang tersimpan tanpa ditekan. **[Usulan]**
- **Operator dan pemilik**: tombol tidak tampil, karena gear hanya milik pelanggan (PRD §11.2).
- Penyimpanan memakai Server Action. Kalau gagal, pesan tampil di dekat tombol dan pilihan di halaman tidak berubah.

### 5.9 Versi ringkas di beranda (L4, B12)

- Bagian **Bandingkan mouse** ditaruh setelah deretan produk yang bisa dicoba. **[Usulan]**
- Isinya: dua pemilih, kalimat selisih, panel tampak atas saja, dan tautan **Buka perbandingan lengkap** ke `/bandingkan` dengan pasangan yang sedang dipilih. **[Usulan]**
- Pasangan awal mengikuti §5.4, tanpa langkah URL: gear pelanggan kalau ada, lalu pasangan contoh beserta cadangannya.
- Tanpa kolom ukuran manual, tabel, status demo, dan tombol simpan. Mengganti pilihan tidak mengubah URL beranda.
- Kalau gear pelanggan berupa ukuran manual, pemilih mouse sekarang di beranda punya opsi **Ukuran yang lu simpan** yang hanya bisa dipilih, tanpa kolom isian. **[Usulan]**
- Kalau slot incaran tetap kosong setelah cadangan (tidak ada mouse dijual sama sekali), bagian ini tidak ditampilkan.

### 5.10 Halaman lain yang terdampak

- Tombol **Bandingkan** di detail produk mouse sudah mengarah ke `/bandingkan?incaran=<slug>` dan tidak berubah.
- Mouse referensi tidak punya halaman detail. `/produk/<slug-referensi>` menghasilkan 404, karena view katalog hanya memuat produk dijual. Perilaku ini dites.
- Judul halaman menjadi "Bandingkan <sekarang> vs <incaran>" kalau kedua slot terisi, supaya tautan yang dibagikan terbaca jelas. **[Usulan]**

## 6. Data dan database

### 6.1 View `compare_items` [Usulan]

- Memakai `security_invoker`, sama dengan view 1A.
- Isinya produk aktif dari kategori aktif, **baik yang dijual maupun referensi**. Di 1B, halaman hanya memintanya untuk kategori mouse. Kolom `category_slug` disertakan supaya B13 bisa memakai view yang sama.
- Kolom: `id`, `slug`, `model_name`, `brand_slug`, `brand_name`, `category_slug`, `is_for_sale`, `specs`, `eloshapes_url`, `price_min`, `price_max`, `demo_status`, `demo_variant_sku`, `demo_variant_name`.
- Harga dihitung dari varian aktif. Varian di-join dengan left join, karena mouse referensi tidak punya varian. Untuk referensi, harganya null.
- Status demo dihitung dengan aturan yang sama dengan `catalog_items` (memakai `counted_demo_units`). Untuk referensi nilainya `none`.
- `catalog_items` tidak berubah, jadi katalog tetap tanpa mouse referensi.

### 6.2 Tabel `user_gear` (PRD §11)

| Kolom | Keterangan |
|---|---|
| `id` | uuid |
| `user_id` | Pemilik gear. Bawaannya `auth.uid()`. Terhapus bersama akunnya. |
| `category_id` | Jenis gear (PRD: "jenis"). Di 1B hanya mouse. Memakai kategori supaya keyboard dan headset (U4) cukup menjadi data. |
| `product_id` | Produk dari daftar, boleh kosong |
| `manual_specs` | Ukuran manual (jsonb), boleh kosong |
| `updated_at` | Waktu terakhir diubah |

Aturan:
- Tepat satu dari `product_id` dan `manual_specs` terisi.
- Satu baris per pengguna per kategori (`unique (user_id, category_id)`), jadi menyimpan ulang berarti menimpa.
- Produk harus berasal dari kategori yang sama.
- `manual_specs` divalidasi terhadap template kategori memakai `validate_spec_values`, dan hanya boleh berisi `length_mm`, `width_mm`, `height_mm`, dan `weight_g`.
- Kalau produknya dihapus, baris gear ikut terhapus. Produk biasanya dinonaktifkan, bukan dihapus.
- Kalau template kategori diubah, `manual_specs` ikut diperiksa ulang, sama seperti spek produk dan atribut varian (lihat migrasi `spec_integrity`).

RLS (PRD §11.2: "Keranjang, wishlist, gear → pelanggan, miliknya sendiri"):
- Baca, buat, ubah, dan hapus hanya untuk baris dengan `user_id = auth.uid()` dan peran `customer`.
- Saat membuat atau mengubah, `product_id` harus mengarah ke produk yang terlihat oleh pengguna itu.
- Tamu, operator, dan pemilik tidak punya akses.

### 6.3 Pasangan contoh di pengaturan toko [Usulan]

- Dua kolom baru di `store_settings`: mouse contoh sekarang dan mouse contoh incaran. Keduanya mengarah ke `products` dan boleh kosong.
- Nilainya diisi skrip seed hanya kalau masih kosong, jadi perubahan pemilik tidak tertimpa. Pemilik bisa mengubahnya lewat pengaturan toko di dashboard (PM5, 1E).
- Kalau produknya dihapus, kolomnya menjadi kosong, lalu cadangan di §5.4 berlaku.
- Kebijakan RLS `store_settings` yang sudah ada tetap dipakai: semua orang boleh membaca, hanya pemilik yang menulis.

### 6.4 Mouse referensi

- Ditambahkan di `packages/catalog-data` dengan penanda tidak dijual, **tanpa varian** dan tanpa unit demo.
- Panjang, lebar, tinggi, dan bobot **wajib**, dan harus berasal dari sumber resmi pabrikan atau toko resmi merek, dicatat di `specSources` dan `spec_source_url`. Model yang tidak punya keempat angka resmi diganti model lain. Atribut lain (bentuk, koneksi, sensor) diisi kalau sumbernya ada.
- Tautan EloShapes diisi kalau halamannya ada.
- Merek baru ditambahkan seperlunya.
- Skrip seed memperlakukan `is_for_sale` sebagai kolom bisnis: hanya diisi saat baris pertama kali dibuat, sama dengan `is_active`. Perubahan pemilik dari dashboard nanti tidak boleh tertimpa. Opsi `--paksa-bisnis` memakai nilai dari file data, bukan selalu `true`.
- Tes data: setiap mouse referensi punya keempat angka beserta sumbernya dan tidak punya varian. Tes 1A yang menghitung 16 produk dan mewajibkan varian dipisah menjadi aturan untuk produk dijual dan aturan untuk referensi. Produk dijual tetap 16.

**Kandidat (pemilik produk boleh mencoret atau menambah)**

| Merek | Model |
|---|---|
| Logitech | G102 Lightsync, G304 Lightspeed, G502 X, G Pro Wireless |
| Razer | Viper V3 Pro, DeathAdder Essential, Basilisk V3, Viper Mini |
| Zowie | EC2-CW, FK2-C, S2-C |
| Pulsar | X2 V2 |
| Lamzu | Atlantis Mini |
| VXE | Dragonfly R1 |
| Attack Shark | X3 |
| Fantech | Aria XD7 |
| Rexus | Daxa Air IV |
| SteelSeries | Aerox 3 |
| HyperX | Pulsefire Haste 2 |
| Glorious | Model O |

Nama persis tiap model dicocokkan dengan situs resmi saat riset data.

### 6.5 Kode bersama `packages/shared/src/compare`

- Membaca dan menulis URL Bandingkan (§5.3), dengan bentuk yang sama dengan `parseCatalogQuery` dan `serializeCatalogQuery`.
- Format nilai spek yang sekarang ada di `spec-table.tsx` dipindah ke `packages/shared`, supaya tabel spek 1A dan tabel Bandingkan memakai fungsi yang sama.
- Menghitung selisih per atribut angka (§5.6).
- Menyusun kalimat ringkas (§5.6).
- Menghitung skala dan posisi kotak (§5.5).
- Membaca baris `compare_items` dan `user_gear` menjadi tipe aplikasi.
- Semuanya fungsi murni yang dites dengan Vitest.

## 7. Tampilan dan gerak

- Mengikuti design system: garis ukur, gaya ilustrasi (garis putus-putus untuk mouse sekarang, `primary` untuk incaran), dan satu gerak khas per halaman (M1).
- Selisih ditulis dengan warna netral (§2, anti-tujuan).
- Di layar 360 px, tabel tetap muat tanpa scroll horizontal. Builder boleh memindahkan kolom Selisih ke bawah nilai di layar sempit.
- Pemilih dan tombol memenuhi target sentuh 44 px.

## 8. Kriteria selesai

- `/bandingkan` bekerja untuk:
  - dua mouse dijual;
  - mouse referensi melawan mouse dijual;
  - ukuran manual, baik lengkap maupun sebagian;
  - URL rusak, slug tidak dikenal, dan referensi di slot incaran;
  - mouse yang sama di dua slot.
- Kalimat dan tabel sesuai contoh di §5.6.
- Gerak M1 berjalan, bisa diputar ulang, dan langsung menumpuk dalam mode kurangi gerakan.
- Tombol Back kembali ke pasangan sebelumnya.
- Tombol Coba keduanya membawa SKU dan `bawa` yang benar, nonaktif kalau tidak ada unit demo, dan mengarahkan tamu ke login dengan `next` berisi tujuan tombol. Saran B8 tampil di kondisi yang tepat.
- Pasangan contoh diambil dari pengaturan toko, dan cadangannya berlaku kalau mouse contoh tidak aktif.
- Gear gue:
  - pelanggan bisa menyimpan mouse dari daftar dan ukuran manual;
  - slot terisi otomatis saat membuka `/bandingkan` atau beranda;
  - tamu diarahkan ke login lalu kembali ke pasangan yang sama;
  - operator dan pemilik tidak melihat tombol simpan.
- Tes RLS `user_gear`:
  - pelanggan lain tidak bisa membaca atau menulis gear orang lain;
  - tamu, operator, dan pemilik tidak punya akses;
  - produk yang tidak terlihat atau dari kategori lain ditolak;
  - baris dengan produk dan ukuran manual sekaligus, atau tanpa keduanya, ditolak.
- Tes view `compare_items`: mouse referensi muncul, produk nonaktif tidak, dan `catalog_items` tetap tanpa referensi.
- `/produk/<slug-referensi>` menghasilkan 404.
- Beranda menampilkan versi ringkas, dan tautannya membuka pasangan yang sama.
- Seed memasukkan mouse referensi dan aman dijalankan ulang.
- Tanpa scroll horizontal di 360 px.
- `pnpm check`, `pnpm typecheck`, tes unit, tes RLS, dan e2e lulus.

## 9. Diputuskan pemilik produk

- Gambar perbandingan memakai **kotak ukuran** (26 November 2026).
- **Gear gue** untuk mouse dibuat di 1B (26 November 2026).
- Sisanya mengikuti PRD: Bandingkan terbuka untuk tamu, menyimpan butuh akun, dan model produk asli dengan spek dari sumber resmi.

## 10. Keputusan penyusun (bisa dikoreksi)

1. Pendekatan A: daftar mouse dimuat sekali, pilihan berganti di browser.
2. Pemilih memakai `<select>` bawaan dengan grup "Dijual di LANTAI DUA" dan "Mouse lain".
3. Ukuran manual boleh sebagian, dengan rentang wajar di §5.2.
4. Bentuk URL ukuran manual (`sekarang=ukur&panjang=…`), dan kata `ukur` dicadangkan.
5. URL selalu mencerminkan pasangan yang tampil, termasuk yang terisi dari gear atau contoh.
6. Pasangan contoh disimpan di `store_settings` dengan nilai awal Logitech G102 Lightsync dan VortexSeries Ignix F1, beserta aturan cadangannya (§5.4, §6.3).
7. Penjajaran kotak di ujung belakang, garis ukur untuk incaran, dan angka mouse sekarang di legenda.
8. Animasi M1 memakai CSS, bukan pustaka Motion.
9. Kontur asli belum digambar di 1B. Pergantian ke kontur dikerjakan bersama unggah kontur di 1E.
10. Kalimat hanya menyebut bobot dan panjang, dengan batas "hampir sama" 1 g dan 0,5 mm.
11. Harga memakai varian termurah ("mulai Rp…").
12. Tombol Coba keduanya aktif untuk unit demo dengan status apa pun, dan membawa parameter `bawa` untuk mouse lama yang tidak ada di showroom.
13. Simpan gear tidak berjalan otomatis setelah tamu login.
14. Versi beranda: setelah deretan bisa dicoba, hanya tampak atas, tanpa kolom ukuran manual, dan dengan opsi "Ukuran yang lu simpan" untuk gear manual.
15. Judul halaman memuat nama kedua mouse.
16. Nama view `compare_items`, dan `user_gear` memakai `category_id` sebagai jenis.

## 11. Menunggu jawaban pemilik produk

- Daftar mouse referensi di §6.4: coret, tambah, atau setujui.
- Nilai awal pasangan contoh di §5.4. Nilai ini nanti bisa diganti pemilik di dashboard.

## 12. Diserahkan ke builder

- Ukuran, jarak, dan detail visual kotak serta garis ukur, selama mengikuti design system.
- Pembagian komponen dan nama file.
- SQL persis untuk view, tabel, trigger, dan policy.
- Teks kecil seperti ajakan slot kosong dan pesan galat, selama nadanya sama dengan 1A.
- Cara tabel menyesuaikan diri di layar sempit.
