# LANTAI DUA — Design System (MASTER)

| | |
|---|---|
| Versi | 0.1 — draf |
| Tanggal | 22 November 2026 |
| Status | Palet dipilih: **A · Petrol & Tembaga** (22 November 2026). |
| Berlaku untuk | Web (Next.js) dan aplikasi (Expo), termasuk ketiga dashboard |
| Pratinjau | [`preview.html`](preview.html): buka di browser untuk melihat palet, komponen, dan animasi |
| Token | [`tokens.css`](tokens.css) (web) dan [`tokens.json`](tokens.json) (format W3C, untuk web dan aplikasi) |

Dokumen ini adalah sumber kebenaran desain. Aturan khusus satu halaman ditulis di `pages/<nama-halaman>.md`. Kalau ada, aturan di sana mengalahkan aturan di sini. Kalau tidak ada, pakai dokumen ini.

---

## 1. Arah desain

**"Showroom yang tenang."** Bersih, minimalis, modern. Bahannya diambil dari ruang toko: aluminium, meja demo abu-abu muda, papan petunjuk, dan garis ukur gambar teknik. Antarmuka sengaja tidak menonjol, karena yang perlu terlihat adalah produk, angka ukurannya, dan status bisa-tidaknya dicoba.

### Lima prinsip

1. **Produk yang bicara.** Foto, nama model, harga, dan status demo mendapat ruang paling besar. Dekorasi tidak boleh bersaing dengan produk.
2. **Presisi yang terlihat.** Angka ukuran memakai huruf mono dan garis ukur. Status selalu ditulis dengan kata. Kesan "berkualitas" muncul dari ketelitian, bukan dari kilau.
3. **Dua lantai, dua warna.** Warna utama dipakai untuk belanja dan aksi (Lantai 1). Warna aksen dipakai khusus untuk mencoba: demo, reservasi, dan showroom (Lantai 2). Pengguna jadi belajar arti warna tanpa perlu dijelaskan.
4. **Gerak yang menenangkan.** Animasi hanya untuk menjelaskan perubahan, bukan untuk menghias. Setiap animasi pendek, mulus, dan bisa dipotong kapan saja.
5. **Satu bahasa di web dan aplikasi.** Kedua platform memakai token yang sama, sehingga warna, huruf, jarak, dan waktu animasinya juga sama.

### Yang dihindari

| Hindari | Alasan |
|---|---|
| Neon, RGB, gradien ungu-biru khas "gaming" | Pasaran, dan bertentangan dengan kesan tenang dan terpercaya |
| Navy + emas, hitam + emas | Rumus "premium" yang paling umum, jadi justru terasa generik |
| Glassmorphism dan efek kaca buram | Sedang tren, menurunkan keterbacaan, berat di HP |
| Bayangan tebal di semua kartu | Membuat halaman terasa ramai. Pakai garis tipis 1 px saja |
| Emoji sebagai ikon | Tampilannya berbeda di tiap perangkat dan tidak konsisten |
| Animasi bounce, loop dekoratif, parallax, scroll-jacking | Melelahkan dan memicu mual pada sebagian orang |
| Teks abu di atas latar abu | Kontras kurang, sulit dibaca |

---

## 2. Warna

### 2.1 Netral (sama untuk semua opsi)

Netral adalah "aluminium hangat", sedikit kekuningan supaya tidak terasa dingin seperti rumah sakit.

| Token | Hex | Dipakai untuk | Kontras |
|---|---|---|---|
| `bg` | `#F5F4F0` | Latar halaman | – |
| `surface` | `#FFFFFF` | Kartu, input, panel | – |
| `surface-sunken` | `#ECEBE6` | "Meja demo": latar foto produk, baris tabel, area tenang | – |
| `border` | `#DDDBD4` | Garis pemisah dan tepi kartu (dekoratif) | – |
| `border-input` | `#8A8E92` | Tepi input, checkbox, dan kontrol lain | 3,30 : 1 di putih ✓ |
| `ink` | `#141719` | Teks utama | 16,4 : 1 di `bg` ✓ |
| `ink-muted` | `#565B5F` | Teks sekunder, label | 6,2 : 1 di `bg` ✓ |
| `ink-subtle` | `#7C8185` | Ikon, teks besar yang tidak penting, placeholder | 3,6 : 1 di `bg` (hanya untuk teks besar dan ikon) |

### 2.2 Palet brand: A · Petrol & Tembaga (dipilih)

Ada tiga opsi yang dipertimbangkan, dan pemilik produk memilih A. Ketiganya sengaja menghindari biru standar, navy-emas, dan hijau-oranye toko online. B dan C tetap dicatat di bawah sebagai arsip keputusan, tetapi tidak dipakai. Semua kombinasi teks sudah lolos WCAG AA.

#### A. Petrol & Tembaga — **dipilih**

| Peran | Token | Hex |
|---|---|---|
| Utama (Lantai 1) | `primary` | `#0E4B57` |
| | `primary-hover` | `#0A3A44` |
| | `primary-soft` | `#E2EDEE` |
| Aksen (Lantai 2) | `accent` | `#B5612C` |
| | `accent-ink` (teks kecil) | `#95491C` |
| | `accent-soft` | `#F6E9DF` |

- **Ceritanya:** petrol adalah biru-kehijauan yang dalam, seperti baja yang dianodisasi. Warna ini memberi kesan stabil, terekayasa, dan bisa dipercaya, tanpa terlihat seperti biru bank. Tembaga adalah warna jalur PCB dan kabel di dalam setiap mouse dan keyboard, jadi kualitasnya ada "di dalam". Tembaga juga hangat dan memberi kesan buatan tangan.
- **Kontras:** putih di atas petrol 9,7 : 1. `accent-ink` di atas `bg` 5,9 : 1.
- **Kelebihan:** paling khas dan ceritanya paling nyambung dengan produk. Petrol tidak bentrok dengan warna status sukses (hijau) maupun bahaya (merah).
- **Kekurangan:** tembaga murni hanya 4,0 : 1 di atas `bg`, jadi teks kecil wajib memakai `accent-ink`.

#### B. Pinus & Kuningan (tidak dipilih)

| Peran | Token | Hex |
|---|---|---|
| Utama | `primary` | `#1F4337` |
| | `primary-hover` | `#183529` |
| | `primary-soft` | `#E4ECE7` |
| Aksen | `accent` | `#A57A2E` |
| | `accent-ink` | `#7F5C1E` |
| | `accent-soft` | `#F3ECDD` |

- **Ceritanya:** hijau pinus seperti mousepad kain dan meja kerja klasik, kuningan seperti perkakas berkualitas. Kesannya tenang dan seperti barang warisan.
- **Kelebihan:** paling kalem dan dewasa.
- **Kekurangan:** warna utamanya hijau, sehingga dekat dengan warna status "Tersedia/Sukses". Status jadi lebih bergantung pada teks dan ikon. Nuansanya juga agak jauh dari dunia gaming.

#### C. Indigo Tinta & Oranye Sinyal (tidak dipilih)

| Peran | Token | Hex |
|---|---|---|
| Utama | `primary` | `#262B6E` |
| | `primary-hover` | `#1D2157` |
| | `primary-soft` | `#E6E7F3` |
| Aksen | `accent` | `#E0561F` |
| | `accent-ink` | `#B0410F` |
| | `accent-soft` | `#FCE9DF` |

- **Ceritanya:** biru elektrik dari konsep awal dibuat lebih dalam dan percaya diri. Oranye diambil dari cat penanda lantai industri, persis seperti papan "↗ Lantai 2".
- **Kelebihan:** paling dekat dengan konsep awal dan paling energik.
- **Kekurangan:** indigo tetap keluarga biru, jadi paling mudah terasa "biasa". Oranye juga dekat dengan warna peringatan.

**Kenapa A:** A satu-satunya opsi yang warna utamanya tidak dipakai sebagai warna status, ceritanya muncul dari produk itu sendiri (jalur tembaga), dan tetap terasa tenang serta terpercaya tanpa ikut rumus "premium" yang pasaran.

### 2.3 Warna status (sama untuk semua opsi)

Status selalu tampil sebagai **ikon + teks + latar lembut**, tidak pernah warna saja.

| Status | Teks | Latar | Contoh |
|---|---|---|---|
| Sukses / tersedia | `#1E7A4E` | `#E3F2EA` | "Stok tersedia", "Siap diambil" |
| Peringatan | `#8A5A00` | `#FBF0D9` | "Sisa 2", "Sedang dipakai" |
| Bahaya / habis | `#B42318` | `#FBE7E5` | "Habis", "Dibatalkan" |
| Info / netral | `primary` | `primary-soft` | "Sedang disiapkan" |
| Demo (khusus Lantai 2) | `accent-ink` | `accent-soft` | "↗ Demo tersedia · tactile" |

Semua teks status di atas latarnya ≥ 4,6 : 1.

### 2.4 Aturan pemakaian warna

1. **Proporsi kasar:** 70% netral terang (`bg`, `surface`), 20% `ink`, 7% `primary`, 3% `accent`. Kalau satu layar terlihat "berwarna", berarti terlalu banyak.
2. **`primary`** hanya untuk aksi utama (Beli, Konfirmasi, Simpan), keadaan terpilih, tautan, dan cincin fokus. Paling banyak satu tombol `primary` penuh per area.
3. **`accent`** hanya untuk hal-hal Lantai 2: ketersediaan demo, tautan "↗ Lantai 2", tombol reservasi, dan halaman showroom. Teks kecil berwarna aksen wajib memakai `accent-ink`.
4. Jangan pernah menaruh teks kecil putih di atas `accent`. Tombol demo memakai garis tepi `accent` dengan teks `accent-ink`, atau latar `accent-soft`.
5. Foto produk selalu di atas `surface-sunken`, supaya terlihat seperti duduk di meja demo yang sama.
6. Gradien hanya boleh dipakai untuk skeleton loading.

### 2.5 Grafik di dashboard

Urutan warna seri: `primary` → `accent` → `#6E8F96` (petrol muda) → `#C9A88D` (tembaga muda) → `ink-subtle`. Garis bantu grafik memakai `border`. Setiap grafik wajib punya legenda dan tooltip berisi angka, tidak cukup hanya warna.

---

## 3. Tipografi

### 3.1 Keluarga huruf

| Peran | Huruf | Alasan |
|---|---|---|
| Judul dan papan kategori | **Archivo**, lebar 85 (agak rapat), tebal 600–700 | Menggemakan papan petunjuk industrial seperti Barlow Condensed di konsep awal, tapi lebih halus dan modern. Sumbu lebarnya bisa diatur, jadi satu file untuk banyak gaya. |
| Teks, harga, filter, UI | **Instrument Sans**, tebal 400–600 | Bersih dan modern, sedikit lebih berkarakter dibanding Inter atau DM Sans yang sudah sangat umum. |
| Angka ukuran, kode, SKU | **Geist Mono**, tebal 400–500 | Memberi kesan presisi pada "124 × 64 × 38 mm" dan kode `L2-K7Q4M9TX`. |

Semuanya dari Google Fonts dan gratis. Di web dimuat lewat `next/font`, di aplikasi lewat `@expo-google-fonts`. Kalau versi lebar 85 Archivo tidak tersedia di aplikasi, pakai Archivo lebar normal.

> **Berubah dari PRD §14.** Konsep awal memakai Barlow Condensed + DM Sans. Gantinya diusulkan karena Barlow Condensed tebal terasa "sporty" dan keras untuk arah yang bersih, sedangkan DM Sans termasuk huruf yang paling sering dipakai. Kalau tetap ingin pasangan awal, cukup tukar tokennya.

### 3.2 Skala (web)

| Token | Ukuran / tinggi baris | Huruf | Dipakai untuk |
|---|---|---|---|
| `display` | clamp(40px → 64px) / 1.02 | Archivo 700, spasi huruf −0,02em | Judul hero |
| `h1` | 40 / 44 | Archivo 700, −0,015em | Judul halaman |
| `h2` | 30 / 36 | Archivo 600, −0,01em | Judul bagian |
| `h3` | 22 / 28 | Archivo 600 | Judul kartu besar, nama produk di halaman detail |
| `h4` | 18 / 24 | Instrument Sans 600 | Judul kecil, label grup |
| `body` | 16 / 24 | Instrument Sans 400 | Teks utama |
| `body-sm` | 14 / 20 | Instrument Sans 400/500 | Teks kartu, tabel, filter |
| `caption` | 12 / 16 | Instrument Sans 500, +0,02em | Meta info saja, bukan teks paragraf |
| `price` | 20 / 24 | Instrument Sans 600, angka tabular | Harga |
| `spec` | 14 / 20 | Geist Mono 400 | Ukuran, bobot, kode |
| `overline` | 12 / 16 | Archivo 600, huruf besar, +0,08em | Label papan, misalnya "LANTAI 2 · COBA" |

Di aplikasi, skalanya sama, dengan `display` maksimal 40 px dan `h1` 30 px.

### 3.3 Aturan tipografi

- Teks paragraf minimal 16 px di HP. 12 px hanya untuk meta info.
- Harga dan angka ukuran selalu memakai angka tabular, supaya digitnya tidak bergeser saat varian berganti.
- Panjang baris paragraf paling banyak sekitar 68 karakter.
- Judul memakai `text-wrap: balance` supaya tidak ada satu kata menggantung di baris terakhir.
- Huruf besar semua hanya untuk `overline` dan label papan.

---

## 4. Jarak, grid, sudut, dan elevasi

| Hal | Nilai |
|---|---|
| Satuan dasar | 4 px |
| Skala jarak | 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 |
| Halaman publik | Lega: jarak antarbagian 64–96 px di desktop, 48 px di HP |
| Dashboard | Rapat: skala 8–32 px, baris tabel setinggi 44 px |
| Grid | Desktop 12 kolom dengan lebar konten maksimal 1200 px dan jarak antarkolom 24 px. HP 4 kolom dengan margin 16 px. |
| Titik patah layar | 360 · 640 · 768 · 1024 · 1280 |
| Sudut | `sm` 6 px (chip, badge) · `md` 10 px (tombol, input) · `lg` 16 px (kartu) · `xl` 24 px (sheet, modal) · `full` (avatar, swatch warna) |
| Elevasi | Kartu tanpa bayangan, cukup garis `border` 1 px. Bayangan hanya untuk lapisan yang melayang: popover, menu, modal, sheet, toast. |
| Bayangan lapisan | `0 1px 2px rgb(20 23 25 / .06), 0 8px 24px rgb(20 23 25 / .08)` |
| Target sentuh | Minimal 44 × 44 px, dengan jarak antartarget minimal 8 px |

---

## 5. Ikon, ilustrasi, dan foto

- **Ikon:** Lucide dengan garis 1,75 px, ukuran 20 px (UI) atau 24 px (navigasi). Di aplikasi pakai `lucide-react-native` supaya bentuknya identik. Ikon tanpa teks wajib punya label untuk pembaca layar. Ikon dekoratif disembunyikan dari pembaca layar.
- **Logo:** angka **2** bersudut yang sekaligus berbentuk anak tangga. Versi di pratinjau masih sementara.
- **Penanda Lantai 2:** panah `↗` dari Lucide (`arrow-up-right`) berwarna `accent`, dipasang di depan atau belakang teks tautan yang menuju fitur coba atau showroom.
- **Garis ukur:** motif khas berupa garis ukur gambar teknik (garis tipis dengan dua ujung tegak, dan angka mono di tengah). Dipakai di detail produk dan di Bandingkan untuk panjang, lebar, dan tinggi.
- **Foto:**
  - Produk difoto dari sudut yang sama, dengan cahaya lembut, di atas latar `surface-sunken`.
  - Mouse wajib punya foto tampak atas dan tampak samping setinggi meja.
  - Foto suasana menampilkan tangan sungguhan di meja demo dengan warna alami. Tidak memakai lampu RGB.
- **Ilustrasi:** garis sederhana satu warna (`ink` atau `primary`). Untuk kontur mouse di Bandingkan, mouse sekarang digambar dengan garis putus-putus `ink-subtle` dan mouse incaran dengan garis `primary` berisi `primary-soft`.

---

## 6. Gerak (animasi)

### 6.1 Prinsip

1. **Bermakna:** setiap animasi menjawab "apa yang baru berubah?". Kalau tidak menjawab apa pun, hapus.
2. **Hemat:** paling banyak 1–2 titik gerak dalam satu layar.
3. **Mulus:** hanya `transform` dan `opacity` yang dianimasikan. Warna boleh dianimasikan untuk hover. Lebar, tinggi, `top`, dan `left` tidak boleh dianimasikan.
4. **Datang pelan, pergi cepat:** animasi keluar memakan sekitar 70% durasi animasi masuk.
5. **Bisa dipotong:** setiap animasi bisa diinterupsi. Klik baru langsung menuju keadaan terakhir, tanpa menunggu animasi lama selesai.
6. **Menghormati pengguna:** kalau perangkat mengaktifkan pengaturan kurangi gerakan, semua pergeseran dan pembesaran diganti fade singkat atau langsung tanpa animasi.

### 6.2 Token

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `dur-instant` | 90 ms | Umpan balik tekan tombol |
| `dur-fast` | 150 ms | Hover, perubahan warna, toggle, checkbox |
| `dur-base` | 220 ms | Ganti varian, tab, popover, tooltip, tombol berubah status |
| `dur-slow` | 320 ms | Sheet, drawer, modal, reveal saat scroll |
| `dur-showcase` | 640 ms | Hanya untuk kontur menumpuk di Bandingkan |
| `ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Semua yang **masuk** atau muncul. Kurva utama yang terasa "fluid". |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Perpindahan di tempat, misalnya indikator tab bergeser |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Semua yang **keluar** atau hilang |
| `spring-ui` | stiffness 380, damping 32 | Tekan tombol, toggle, badge (Motion / Reanimated) |
| `spring-layout` | stiffness 220, damping 28 | Perubahan tata letak dan kontur |
| `stagger` | 40 ms, maksimal 6 item | Daftar kartu saat pertama tampil |

### 6.3 Pola standar

| Pola | Perilaku |
|---|---|
| Hover kartu produk | Garis tepi berubah jadi `border-input`, foto membesar 1,02× dalam `dur-base`. Kartu tidak "terangkat". |
| Tekan tombol | Mengecil ke 0,98× selama `dur-instant`, lalu kembali dengan `spring-ui`. |
| Muncul saat scroll | Hanya sekali per elemen: fade dan geser naik 12 px, `dur-slow` + `ease-out`, jeda bertahap 40 ms. Konten di layar pertama tidak memakai reveal. |
| Pindah halaman | Crossfade 180 ms lewat View Transitions. **P1:** foto kartu produk "terbang" menjadi foto di halaman detail. |
| Skeleton loading | Kilau lembut bergerak tiap 1,6 detik. Ini satu-satunya animasi berulang yang diizinkan. |
| Toast | Masuk dari bawah 8 px + fade dalam `dur-base`, keluar dalam 150 ms. Tetap tampil minimal 4 detik dan berhenti selama disentuh atau di-hover. |
| Sheet / modal | Sheet naik dari bawah di HP, modal fade + skala 0,98 → 1 di desktop. Keduanya `dur-slow` + `ease-out`, keluar dengan `ease-exit`. |

### 6.4 Gerak khas LANTAI DUA

| ID | Momen | Gerakan |
|---|---|---|
| M1 | **Kontur menumpuk** (Bandingkan) | Kontur mouse sekarang masuk dari kiri dan kontur incaran dari kanan, lalu keduanya bertemu dan menumpuk dalam `dur-showcase` + `spring-layout`. Setelah itu, selisih ukurannya muncul dengan fade 150 ms. Ada tombol "Putar ulang". |
| M2 | **Penunjuk ↗ Lantai 2** | Saat di-hover atau difokus, panah bergeser 2 px ke kanan atas dalam `dur-fast`. |
| M3 | **Ganti varian** | Foto crossfade dalam `dur-base`, harga dan status ikut fade 150 ms, dan swatch terpilih mendapat cincin yang membesar dari 0,9×. |
| M4 | **Masuk keranjang** | Label tombol crossfade menjadi "✓ Masuk keranjang" selama 1,6 detik. Angka di ikon keranjang membesar sekali (1 → 1,15 → 1) dengan `spring-ui`. |
| M5 | **Status berubah realtime** | Latar chip status berkedip lembut sekali selama 600 ms, lalu diam. Pembaca layar diberi tahu lewat `aria-live="polite"`. |

### 6.5 Mode kurangi gerakan

| Biasa | Saat kurangi gerakan aktif |
|---|---|
| Geser, skala, kontur bergerak | Langsung tampil di posisi akhir (kontur sudah menumpuk) |
| Crossfade lebih dari 150 ms | Crossfade 120 ms |
| Kedipan status | Tidak ada kedipan. Teks status tetap berubah dan diumumkan ke pembaca layar. |
| Kilau skeleton | Skeleton diam tanpa kilau |

### 6.6 Implementasi

- **Web:** transisi CSS untuk hover, tekan, dan warna. Pustaka **Motion** (`motion/react`) untuk tata letak, kontur, dan elemen yang keluar-masuk. View Transitions untuk pindah halaman.
- **Aplikasi:** **React Native Reanimated** (sudah ikut di Expo) dengan nilai spring dan durasi yang sama.
- Nilai durasi dan easing diambil dari token, tidak ditulis langsung di komponen.

---

## 7. Komponen inti

| Komponen | Aturan |
|---|---|
| **Tombol utama** | Latar `primary`, teks putih, tinggi 44 px (di HP 48 px), sudut `md`. Hover ke `primary-hover`. |
| **Tombol demo** | Garis tepi 1,5 px `accent`, teks `accent-ink`, ikon ↗. Hover memakai latar `accent-soft`. Khusus aksi Lantai 2. |
| **Tombol sekunder** | Garis tepi `border-input`, teks `ink`. Hover memakai latar `surface-sunken`. |
| **Tombol teks** | Teks `primary` bergaris bawah saat hover, untuk aksi ringan. |
| **Chip status** | Tinggi 24 px, sudut `sm`, ikon 14 px + teks `body-sm` 500, warna mengikuti §2.3. |
| **Kartu produk** | Latar `surface`, garis `border`, sudut `lg`, foto 4 : 3 di atas `surface-sunken`. Isinya: merek (`caption`, `ink-muted`), nama model (`h4`), harga (`price`), lalu dua baris status, yaitu stok jual dan demo. |
| **Input** | Label selalu terlihat di atas kolom, tinggi 44 px, garis `border-input`, sudut `md`. Saat fokus, cincin 2 px `primary` dengan jarak 2 px. Teks bantuan dan pesan galat ada di bawah kolom. Galat memakai ikon + teks `danger`. |
| **Pemilih varian** | Swatch bulat 32 px untuk warna dan segmen teks untuk switch atau ukuran. Yang terpilih diberi cincin `primary` 2 px. |
| **Tab / segmen** | Indikator bawah atau latar yang bergeser dengan `ease-in-out` dalam `dur-base`. |
| **Toast** | Latar `ink`, teks putih, sudut `md`, maksimal satu baris aksi. |
| **Navigasi publik** | Header putih tipis dengan logo, **Katalog · Bandingkan · Showroom**, pencarian, keranjang, dan akun. Tautan Showroom diberi ↗ beraksen. |
| **Navigasi aplikasi** | Navigasi bawah dengan 4–5 item: Beranda, Katalog, Bandingkan, Reservasi, Akun. Mode Operator memakai navigasinya sendiri. |
| **Dashboard** | Sidebar kiri 240 px di desktop (laci di HP), header halaman dengan judul dan aksi utama, tabel bergaris tipis tanpa zebra, angka rata kanan dengan angka tabular. |

---

## 8. Nuansa per area

| Area | Nuansa |
|---|---|
| **Situs publik** | Paling lega dan paling banyak foto. Satu momen gerak khas per halaman (misalnya M1 di Bandingkan). |
| **Dashboard Pelanggan** | Lega seperti situs publik. Fokus ke kartu reservasi dan pesanan dengan QR besar. |
| **Dashboard Operator** | Rapat, cepat dipindai, angka besar untuk antrean hari ini. Hampir tanpa animasi, kecuali M5 untuk perubahan realtime. |
| **Dashboard Pemilik** | Rapat dan tenang. Grafik mengikuti §2.5, kartu angka ringkas di atas, tabel di bawah. |
| **Aplikasi** | Token sama. Gerak memakai spring. Target sentuh 48 px. Memperhatikan area aman layar (notch, home indicator). |

---

## 9. Daftar cek aksesibilitas

- [ ] Teks ≥ 4,5 : 1, teks besar dan ikon ≥ 3 : 1, tepi kontrol ≥ 3 : 1
- [ ] Cincin fokus terlihat di semua elemen interaktif dan tidak pernah dihapus
- [ ] Semua status memakai teks, tidak hanya warna
- [ ] Semua ikon tanpa teks punya label
- [ ] Label formulir selalu terlihat, dan pesan galat ada di dekat kolomnya
- [ ] Mode kurangi gerakan dihormati (§6.5)
- [ ] Target sentuh minimal 44 × 44 px
- [ ] Tidak ada scroll horizontal dari lebar 360 px
- [ ] Gambar punya teks alternatif, dan foto produk diberi ruang tetap supaya halaman tidak meloncat saat dimuat

---

## 10. Token

**Sumber kebenaran token sekarang [`packages/tokens/src/tokens.ts`](../../packages/tokens/src/tokens.ts).** Web memakai `packages/tokens/theme.css`, yang dibuat otomatis lewat `pnpm --filter @lantai-dua/tokens build`. Ada tes yang gagal kalau `theme.css` tidak sinkron dengan `tokens.ts`, atau kalau ada pasangan warna yang tidak lolos AA. Aplikasi mobile nanti membaca `tokens.ts` langsung.

File di folder ini sekarang hanya salinan v0.1 untuk pratinjau:
- [`tokens.css`](tokens.css) dan [`tokens.json`](tokens.json): snapshot palet A.
- `preview.html` menyimpan salinan isi `tokens.css` supaya bisa dibuka tanpa server.

Kalau token berubah, ubah `tokens.ts` dulu, lalu perbarui salinan ini kalau pratinjaunya masih dipakai.

---

## 11. Keputusan

| Keputusan | Asal |
|---|---|
| Clean, minimalis, modern; animasi tidak berlebihan dan mulus; palet tidak generik yang melambangkan trust dan kualitas | Pemilik produk |
| Suasana showroom industrial terang dan konsep dua lantai | Diskusi konsep (PRD §2, §14) |
| Palet A · Petrol & Tembaga, dipilih dari tiga opsi | Pemilik produk (22 November 2026) |
| Warna utama untuk Lantai 1 (belanja), aksen untuk Lantai 2 (coba) | Usulan |
| Archivo + Instrument Sans + Geist Mono, menggantikan Barlow Condensed + DM Sans | Usulan |
| Token gerak, pola standar, gerak khas M1–M5 | Usulan |
| Tanpa mode gelap di versi pertama, tetapi token sudah semantik sehingga mode gelap bisa ditambahkan nanti | Usulan (PRD §4) |
