# LANTAI DUA

Web dan aplikasi untuk **LANTAI DUA**, toko periferal gaming fiktif di Surabaya yang dikenal karena pelanggannya boleh mencoba barang sebelum membeli. Ini project magang SMKN 10 Surabaya. Spesifikasinya ada di [`docs/PRD.md`](docs/PRD.md), dan desainnya di [`design-system/lantai-dua/MASTER.md`](design-system/lantai-dua/MASTER.md).

Status: **Fase 1A (katalog)**. Sudah ada database dengan aturan akses per peran, login, kerangka tiga dashboard, katalog 16 produk asli dengan filter, halaman detail produk, dan beranda yang menampilkan rak serta produk yang bisa dicoba. Reservasi, keranjang, dan pesanan menyusul di bagian Fase 1 berikutnya.

## Struktur folder

```
apps/web/              Situs Next.js: halaman publik, masuk/daftar, dashboard pelanggan/operator/pemilik
packages/shared/       Kode bersama: peran, aturan akses halaman, tipe database, logika katalog
packages/catalog-data/ Data 16 produk asli (dengan sumber speknya) dan fungsi seed katalog
packages/tokens/       Token desain (warna, huruf, gerak) → theme.css untuk Tailwind
packages/db-tests/     Tes RLS: memastikan setiap peran hanya bisa membaca/mengubah yang boleh
supabase/              Migrasi SQL, seed data, konfigurasi Supabase CLI
scripts/               Skrip bantu: akun demo, data katalog, dan tipe database
docs/                  PRD dan rencana kerja
design-system/         Design system dan pratinjaunya
```

## Prasyarat

- Node.js 26 dan pnpm 12 (`npm install -g pnpm@12.21.0`).
- Project Supabase untuk development. **Project ini tidak memakai Docker**, jadi database-nya ada di Supabase Cloud.
  - Region: Southeast Asia (Singapore).
  - Authentication → URL Configuration: Site URL `http://localhost:3000`, Redirect URLs `http://localhost:3000/**`.
  - Authentication → Sign In / Providers → Email: **Confirm email** aktif.

## Setup pertama kali

```bash
pnpm install

# 1. Isi kunci Supabase (jangan di-commit)
cp .env.example .env.local                 # isi SUPABASE_* dan SEED_PASSWORD
cp apps/web/.env.example apps/web/.env.local   # isi NEXT_PUBLIC_* dan E2E_PASSWORD (= SEED_PASSWORD)

# 2. Hubungkan Supabase CLI ke project (login di browser, lalu ketik password database)
pnpm exec supabase login
pnpm exec supabase link --project-ref <project-ref>

# 3. Buat tabel, isi data awal, buat akun demo, isi katalog, dan generate tipe
pnpm db:push
pnpm db:seed-users
pnpm db:seed-catalog
pnpm db:types

# 4. Pasang browser untuk tes end-to-end
pnpm --filter @lantai-dua/web exec playwright install chromium
```

## Perintah harian

| Perintah                                  | Fungsi                                                       |
| ----------------------------------------- | ------------------------------------------------------------ |
| `pnpm dev`                                | Menjalankan web di http://localhost:3000                     |
| `pnpm check`                              | Lint dan format (Biome)                                      |
| `pnpm format`                             | Merapikan format otomatis                                    |
| `pnpm typecheck`                          | Pengecekan tipe TypeScript                                   |
| `pnpm test`                               | Unit test (aturan akses, logika katalog, data produk, token) |
| `pnpm test:rls`                           | Tes RLS terhadap project Supabase dev (butuh internet)       |
| `pnpm e2e`                                | Tes end-to-end Playwright (login, katalog, detail, beranda)  |
| `pnpm exec supabase migration new <nama>` | Membuat file migrasi baru                                    |
| `pnpm db:push`                            | Mengirim migrasi baru + seed ke project dev                  |
| `pnpm db:seed-catalog`                    | Mengisi atau memperbarui 16 produk asli di project dev       |
| `pnpm db:types`                           | Membuat ulang `packages/shared/src/database.types.ts`        |

## Akun demo

Semua akun memakai kata sandi dari `SEED_PASSWORD` di `.env.local`.

| Email                                                     | Peran                       |
| --------------------------------------------------------- | --------------------------- |
| `pemilik@lantaidua.test`                                  | Pemilik                     |
| `operator1@lantaidua.test`, `operator2@lantaidua.test`    | Operator                    |
| `nonaktif@lantaidua.test`                                 | Operator yang dinonaktifkan |
| `pelanggan1@lantaidua.test` … `pelanggan3@lantaidua.test` | Pelanggan                   |

## Catatan

- Aturan akses dijaga di database (Row Level Security), bukan hanya di tampilan. Web dan aplikasi mobile nanti memakai aturan yang sama.
- `pnpm test:rls` membuat 5 akun tes sementara di project dev, lalu menghapusnya lagi setelah selesai.
- Supabase CLI 3.x defaultnya menargetkan database lokal (Docker), jadi semua perintah `db push` di project ini memakai `--remote`.
- Project Supabase gratis dijeda kalau tidak dipakai sekitar seminggu. Buka dashboard-nya sebelum demo.

## Data katalog

- Data produk ada di [`packages/catalog-data/src/catalog.ts`](packages/catalog-data/src/catalog.ts). Setiap nilai spek diambil dari halaman resmi pabrikan, dan URL sumbernya ikut disimpan. Nilai yang tidak tercantum dibiarkan kosong, tidak dikarang.
- `pnpm db:seed-catalog` aman dijalankan berulang kali. Nama, deskripsi, spek, dan atribut varian selalu disamakan dengan file data. Harga, stok, status aktif, dan status unit demo hanya diisi saat produk, varian, atau unit pertama kali dibuat, supaya perubahan dari operator dan pemilik tidak hilang.
- `pnpm db:seed-catalog --paksa-bisnis` ikut menimpa harga, stok, status aktif, dan status unit demo. **Khusus development**, misalnya untuk mengembalikan data demo ke kondisi awal.
- [`packages/catalog-data/PERLU-DIUKUR.md`](packages/catalog-data/PERLU-DIUKUR.md) berisi spek gear pemilik yang tidak ada di sumber resmi dan perlu diukur sendiri. Setelah diukur, isi nilainya di `catalog.ts` dengan sumber `'ukur'`, lalu jalankan `pnpm db:seed-catalog`.
- Foto produk belum ada. Selama itu, katalog menampilkan ilustrasi garis per kategori. Foto nanti disimpan di Supabase Storage (bucket `product-images`), bukan di repo.
