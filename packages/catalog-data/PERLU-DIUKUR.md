# Perlu Diukur

Daftar ini berisi nilai spek gear pemilik yang **tidak tercantum di sumber resmi**, atau yang sumber resminya saling bertentangan.

Setelah diukur atau dicek, isi nilainya di `src/catalog.ts`:

- sumber `'ukur'` dipakai untuk hasil pengukuran atau pemeriksaan langsung pada unit;
- sumber `'resmi'` dipakai untuk nilai dari pabrikan atau toko resmi merek.

Setelah itu jalankan `pnpm db:seed-catalog`. Nilai yang belum pasti boleh tetap kosong. Jangan mengarang.

## Masih perlu dicek

| produk         | key                                             | satuan        | cara ukur                                                                                                                                                                                                                                                          |
| -------------- | ----------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lastpad Hathor | `size`, `length_mm`, `width_mm`, `thickness_mm` | –, mm, mm, mm | Toko INFINITAS mencantumkan varian ritel XL berukuran 490 × 420 × 4,0 mm. Cocokkan dengan label kemasan unitmu. Kalau label tidak memuat ukuran, ukur kedua sisi dengan meteran (sisi terpanjang = panjang), dan ukur ketebalan di tepi pad tanpa menekan busanya. |
| Lastpad Hathor | `surface`                                       | –             | Kesan pemilik: _soft control feel / balance_ dengan _stopping power_ yang cukup untuk _tactical shooter_. Klasifikasi ritel menyebut `Control`. Isi bersamaan dengan ukuran di atas.                                                                               |

## Sudah diisi (26 November 2026)

| produk                    | key                                  | nilai                     | sumber                                                                                                                                    |
| ------------------------- | ------------------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| VortexSeries Ignix R1 Pro | `shape`                              | Ergonomis kanan           | `resmi`. Manual pabrikan menyebut desain ergonomis, dan EloShapes mengelompokkannya sebagai ergonomis kanan. Tautan EloShapes ikut diisi. |
| VortexSeries Ignix F1     | `length_mm`, `width_mm`, `height_mm` | 121,48 × 61,27 × 38,20 mm | `resmi`. Manual memastikan urutan P × L × T. Nilainya tidak berubah.                                                                      |
| VortexSeries Ignix R1 Pro | `length_mm`, `width_mm`, `height_mm` | 127,69 × 67,76 × 42,84 mm | `resmi`. Manual memastikan urutan P × L × T. Nilainya tidak berubah.                                                                      |
| Royal Kludge M75          | `switch_type` (Fast Silver)          | Linear                    | `ukur`, dicek pemilik pada unitnya. Viridian dan Pale Green tetap kosong.                                                                 |
| dbE Kumo GS1X Pro         | `mic`                                | Lepas-pasang              | `resmi`. Toko resmi dbE menjual mic pengganti khusus GS1X Pro.                                                                            |
| dbE Kumo GS1X Pro         | `back_type`                          | Closed-back               | `ukur`, identifikasi visual dari foto resmi earcup.                                                                                       |
| dbE Kumo GS1X Pro         | `color`                              | Hitam                     | `ukur`, dikonfirmasi pemilik. Nama varian sekarang `Hitam`.                                                                               |
| VortexSeries Ignix Glide  | model                                | GLIDE V2                  | Dikonfirmasi pemilik. Data yang dipakai sudah GLIDE V2.                                                                                   |

## Sudah lengkap dari sumber resmi

- **Pressplay Essential 75 HE**: layout, koneksi, hot-swap, switch, dan warna.
- **HyperX Cloud II**: koneksi, mic, tipe, bobot, dan warna.
