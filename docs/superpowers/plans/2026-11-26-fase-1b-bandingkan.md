# Fase 1B — Bandingkan Mouse: Rencana Implementasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bagian ini menghadirkan halaman `/bandingkan` untuk membandingkan mouse yang dipakai sekarang dengan mouse incaran. Isinya kalimat selisih, kotak ukuran berskala dengan gerak M1, tabel spek, status unit demo, tombol Coba keduanya, Gear gue, sekitar 20 mouse referensi, dan versi ringkas di beranda.

**Architecture:** Database menyediakan view `compare_items` (mouse dijual dan mouse referensi beserta harga dan status demo), tabel `user_gear` dengan RLS milik sendiri, dan dua kolom pasangan contoh di `store_settings`. Server memuat daftar mouse sekali. Pilihan, URL, kalimat, tabel, dan kotak ukuran dihitung di browser oleh fungsi murni di `@lantai-dua/shared/compare`, yang nanti dipakai juga oleh aplikasi Expo. Mouse referensi masuk lewat `@lantai-dua/catalog-data` dan fungsi seed yang sama dengan 1A.

**Tech Stack:** Sama dengan 1A: Next.js 16.4.6, React 19.3.1, TypeScript 6.0.3, Tailwind 4.3.5, Supabase, @supabase/supabase-js 2.119.2, Vitest 5.1.1, Playwright 1.65.1, Biome 2.6.8. Tidak ada dependensi baru.

**Spec:** [`docs/superpowers/specs/2026-11-26-fase-1b-bandingkan-design.md`](../specs/2026-11-26-fase-1b-bandingkan-design.md). Dasarnya [`docs/PRD.md`](../../PRD.md) §5, §7, §9.1, §9.5, §10.1, §11, §11.2, §15, dan [`design-system/lantai-dua/MASTER.md`](../../../design-system/lantai-dua/MASTER.md) (garis ukur, ilustrasi, M1).

## Global Constraints

- Semua Global Constraints Fase 0 dan 1A tetap berlaku. Di antaranya:
  - Bahasa Indonesia di UI;
  - uang disimpan sebagai integer rupiah;
  - RLS di semua tabel;
  - secret key tidak pernah dipakai di web;
  - target sentuh ≥ 44 px;
  - tanpa scroll horizontal dari lebar 360 px;
  - mode kurangi gerakan dihormati;
  - satu commit (atau lebih) per task dengan baris `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`;
  - `db push` selalu memakai `--remote`.
- **Repo bersifat public.** File data hanya berisi nama model, angka spek, dan tautan sumber resmi. Kunci dari `.env.local` tidak boleh di-commit.
- **Angka ukuran tidak boleh dikarang.** Setiap angka mouse referensi disalin dari halaman resmi pabrikan atau toko resmi merek yang dibuka saat itu juga. Model tanpa keempat angka resmi diganti model lain.
- **Status demo dihitung database** dengan aturan `counted_demo_units` dari 1A.
- **Logika Bandingkan ada di `packages/shared`.** Komponen web hanya menampilkan dan memanggil fungsi itu.
- **Sebelum menulis kode web,** baca panduan terkait di `apps/web/node_modules/next/dist/docs/` (aturan `apps/web/AGENTS.md`): `generateMetadata` dengan `searchParams`, Server Action yang dipanggil dari komponen klien, dan `useSearchParams` bersama `window.history.pushState`/`replaceState`.
- **Teks UI** persis seperti desain:
  - label pemilih `Mouse gue sekarang` dan `Mouse incaran`;
  - grup `Dijual di LANTAI DUA` dan `Mouse lain`, opsi `Isi ukuran sendiri`;
  - kalimat sesuai tabel §5.6, misalnya `Incaran lebih ringan 9 g dan lebih pendek 6,2 mm.` dan `Dua pilihan ini mouse yang sama.`;
  - `Ukuran luar, bukan bentuk asli.`, `Putar ulang`, `Tampak atas · skala sama`, `Tampak samping · skala sama`;
  - `Tidak ada di showroom` untuk mouse referensi dan ukuran manual;
  - tombol `Coba keduanya di Surabaya`, alasan nonaktif `Dua mouse ini belum ada unit demonya.`;
  - saran B8 `Mouse lama lu nggak ada di showroom? Bawa aja dari rumah biar bisa dibandingin langsung.`;
  - `Simpan sebagai mouse gue` → `Tersimpan sebagai mouse lu.`;
  - beranda: judul `Bandingkan mouse`, tautan `Buka perbandingan lengkap`, opsi `Ukuran yang lu simpan`.
- **Angka:** mm satu desimal dan gram bilangan bulat di kalimat dan kolom Selisih, dengan ",0" dibuang. Nilai spek di tabel memakai `formatSpecValue` (dua desimal, seperti tabel spek 1A). Tanda selisih memakai `−` (U+2212) dan `+`, warnanya netral.
- **Rentang ukuran manual:** panjang 80–160 mm, lebar 40–100 mm, tinggi 20–60 mm, bobot 20–200 g.
- **Gerak M1** memakai CSS dengan token `--dur-showcase`, `--dur-fast`, dan `--ease-out`. Tidak memakai pustaka Motion.

## Review Focus

1. **URL hasil ketikan tangan atau usang.** Contohnya `sekarang=ukur&panjang=abc`, `panjang=500`, `incaran=<slug referensi>`, `sekarang=zzz`, `panjang=125` tanpa `sekarang=ukur`, kunci ganda, dan parameter asing seperti `utm_source`. Halaman harus tetap tampil dengan nilai tidak sah diabaikan. Dites di Task 4 (unit) dan Task 6 (e2e).
2. **Angka yang tidak lengkap.** Contohnya ukuran manual yang hanya berisi panjang, atau mouse tanpa tinggi. Kalimat, panel, dan tabel harus melewati angka yang hilang tanpa crash dan tanpa menulis "NaN". Dites di Task 5 (unit) dan Task 7 (e2e).
3. **Gear atau pasangan contoh yang menunjuk mouse nonaktif.** Slotnya harus jatuh ke cadangan §5.4, bukan error atau slot berisi mouse yang tidak ada. Dites di Task 4 (unit).
4. **Staf, akun nonaktif, dan tamu.** Staf tidak melihat tombol simpan, tamu diarahkan ke login, dan Server Action menolak siapa pun selain pelanggan aktif walaupun dipanggil langsung. Dites di Task 2 (RLS) dan Task 8 (e2e).
5. **Tombol Back setelah beberapa pilihan,** termasuk setelah URL diganti otomatis dari gear atau contoh, dan setelah pindah ke ukuran manual. Setiap Back harus kembali satu pasangan tanpa memuat ulang. Dites di Task 6.

## Keputusan rencana (beda atau tambahan dari desain)

- **R1. Mouse referensi disimpan di daftar terpisah `CatalogSeed.references`,** bukan sebagai penanda di `SeedProduct`. Daftar itu sendiri yang menjadi penanda tidak dijual. Dengan begitu, tes "16 produk", e2e katalog, dan pintu rak di beranda tidak berubah.
- **R2. "URL tidak memuat parameter apa pun" (§5.4 langkah 3) dibaca sebagai "URL tidak memuat slot yang sah".** Contohnya `?sekarang=zzz` atau `?utm_source=x` tetap diisi pasangan contoh, supaya tautan rusak tidak berakhir di dua slot kosong.
- **R3. Mouse dijual tanpa varian aktif tidak masuk `compare_items`,** sama seperti `catalog_items`. Mouse itu tidak punya halaman dan tidak bisa dibeli, jadi tidak ditawarkan sebagai incaran.
- **R4. Pemeriksaan ulang `user_gear` saat template berubah memakai fungsi `security definer`.** Pemilik yang mengubah template tidak bisa membaca gear pelanggan lewat RLS. Fungsi yang berjalan dengan hak pemilik akan melewati semua baris tanpa memeriksanya.
- **R5. Slug `ukur` dijaga dengan check constraint di `products`,** tidak hanya lewat kesepakatan.
- **R6. Judul halaman memuat nama hanya kalau kedua slot berisi mouse dari daftar.** Untuk ukuran manual atau slot kosong, judulnya `Bandingkan mouse`.
- **R7. Bagian status demo dan tombol Coba keduanya hanya tampil kalau kedua slot terisi.**
- **R8. Kalimat untuk kombinasi yang tidak ada di tabel §5.6 mengikuti pola yang sama.** Contohnya `Incaran lebih panjang 5 mm, bobotnya hampir sama.`, `Incaran lebih ringan 9 g.`, `Bobotnya hampir sama.`, dan `Panjangnya hampir sama.`
- **R9. Selisih yang dibulatkan menjadi nol ditulis `Sama` di kolom Selisih.**
- **R10. Kalau kategori `mouse` tidak aktif, `/bandingkan` menjadi 404 dan bagian beranda tidak tampil.**

---

## Struktur file

```
supabase/migrations/<ts>_compare_items.sql      view compare_items, kolom pasangan contoh, slug ukur dicadangkan
supabase/migrations/<ts>_user_gear.sql          tabel user_gear, trigger, RLS, revalidasi template
packages/db-tests/src/compare-items.test.ts     view + store_settings
packages/db-tests/src/user-gear.test.ts         RLS + aturan user_gear
packages/catalog-data/src/{types,catalog,seed,catalog.test}.ts   references, compareExample, is_for_sale bisnis
packages/db-tests/src/seed-catalog.test.ts      seed referensi + pasangan contoh
packages/shared/src/catalog/format.ts           + formatSpecValue (dipindah dari spec-table.tsx)
packages/shared/src/compare/                    types, manual, rows, query, pair, demo, summary, table, boxes, testing, index (+ *.test.ts)
apps/web/src/lib/compare-data.ts                listCompareItems, getCompareExamples, getMyGear
apps/web/src/app/(public)/bandingkan/{page,actions}.ts(x)
apps/web/src/components/compare/                compare-view, pair-picker, manual-fields, compare-table, demo-panel, size-boxes, save-gear
apps/web/src/components/home/compare-teaser.tsx
apps/web/src/app/globals.css                    keyframes M1
apps/web/e2e/{compare,gear}.spec.ts, e2e/data.ts
```

---

### Task 1: View `compare_items` dan pasangan contoh

**Files:**
- Create: `supabase/migrations/<ts>_compare_items.sql` (lewat `pnpm exec supabase migration new compare_items`)
- Test: `packages/db-tests/src/compare-items.test.ts`
- Modify: `packages/shared/src/database.types.ts` (generate ulang dengan `pnpm db:types`)

**Interfaces:**
- Consumes: `public.counted_demo_units`, tabel katalog, `createCatalogFixture` (punya `pOn`, `pOff`, `pRef`, `pInOffCat`, `vOn`, `vOff`), serta fixture area dan unit seperti di `catalog-views.test.ts`.
- Produces (SQL):

**View `public.compare_items`** (`with (security_invoker = true)`, `grant select` ke `anon, authenticated`)

Satu baris per produk yang memenuhi `p.is_active`, kategori `is_active`, dan salah satu dari:
- `p.is_for_sale` dan punya minimal satu varian aktif (R3);
- `not p.is_for_sale`.

| Kolom | Isi |
|---|---|
| `id`, `slug`, `model_name`, `is_for_sale`, `specs`, `eloshapes_url` | dari produk |
| `brand_slug`, `brand_name` | dari merek |
| `category_slug` | dari kategori |
| `price_min`, `price_max` | min/max `price_idr` varian aktif (left join), null untuk referensi |
| `demo_status` | referensi → `'none'`; kategori `try_mode = 'free'` → `'free'`; selain itu unit terbaik dari `counted_demo_units` (peringkat lalu `code`), atau `'none'` |
| `demo_variant_sku`, `demo_variant_name` | dari unit terbaik; null kalau status `free` atau `none` |

**`store_settings`**
- `compare_example_current_id uuid references public.products (id) on delete set null`
- `compare_example_target_id uuid references public.products (id) on delete set null`
- RLS lama tetap dipakai.

**`products`**
- `constraint products_slug_not_reserved check (slug <> 'ukur')` (R5).

- [ ] **Step 1: Tulis tes yang gagal**

```ts
// compare-items.test.ts — beforeAll: createCatalogFixture(prefix) + area `${prefix}desk` + unit available di vOn,
// + produk dijual aktif tanpa varian `${prefix}p-novar`. afterAll: hapus unit, area, fixture.
const row = async (c: SupabaseClient, id: string) =>
  (await c.from('compare_items').select('*').eq('id', id).maybeSingle()).data;

it('lists for-sale and reference products, skips inactive and variantless ones', async () => {
  const ids = (await anonClient().from('compare_items').select('id').like('slug', `${prefix}%`)).data!.map((r) => r.id);
  expect(ids.sort()).toEqual([f.pOn, f.pRef].sort());
});
it('summarises a for-sale product', async () => {
  expect(await row(anonClient(), f.pOn)).toMatchObject({
    is_for_sale: true, price_min: 1_000_000, price_max: 1_000_000,
    demo_status: 'available', demo_variant_sku: `${prefix}v-on`, demo_variant_name: 'Hitam',
  });
});
it('keeps references without price or demo', async () => {
  expect(await row(anonClient(), f.pRef)).toMatchObject({
    is_for_sale: false, price_min: null, price_max: null, demo_status: 'none', demo_variant_sku: null,
  });
});
it('shows staff exactly what guests see', async () => {
  expect(await row(clientFor('owner'), f.pRef)).toEqual(await row(anonClient(), f.pRef));
  expect(await row(clientFor('owner'), f.pOff)).toBeNull();
});
it('still keeps references out of catalog_items', async () => {
  expect((await anonClient().from('catalog_items').select('id').eq('id', f.pRef)).data).toEqual([]);
});
it('reserves the slug "ukur"', async () => {
  const { error } = await adminClient().from('products')
    .insert({ category_id: f.catId, brand_id: f.brandId, model_name: 'x', slug: 'ukur' });
  expect(error).not.toBeNull();
});
it('lets anyone read the example pair and clears it when the product is deleted', async () => {
  // simpan nilai asli dulu, kembalikan di finally
  // set compare_example_current_id = produk sementara (admin), anon bisa membacanya,
  // hapus produk sementara → kolom menjadi null
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm test:rls`
Expected: FAIL. Relation `compare_items` dan kolom `compare_example_current_id` belum ada.

- [ ] **Step 3: Tulis migrasi sesuai Interfaces, lalu kirim**

Run: `pnpm exec supabase db push --remote`

- [ ] **Step 4: Jalankan tes, lalu generate ulang tipe**

Run: `pnpm test:rls && pnpm db:types && pnpm typecheck`
Expected: PASS. `database.types.ts` memuat `compare_items` di `Views` dan dua kolom baru di `store_settings`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: view compare_items dan pasangan contoh di pengaturan toko"
```

---

### Task 2: Tabel `user_gear`

**Files:**
- Create: `supabase/migrations/<ts>_user_gear.sql`
- Test: `packages/db-tests/src/user-gear.test.ts`
- Modify: `packages/shared/src/database.types.ts`

**Interfaces:**
- Consumes: `public.validate_spec_values`, `public.revalidate_category_values`, `public.current_app_role()`, `public.set_updated_at()`, `createCatalogFixture`, `clientFor`, `userIdOf`.
- Produces (SQL):

**Tabel `public.user_gear`**

| Kolom | Definisi |
|---|---|
| `id` | `uuid primary key default gen_random_uuid()` |
| `user_id` | `uuid not null default auth.uid() references auth.users (id) on delete cascade` |
| `category_id` | `uuid not null references public.categories (id) on delete cascade` |
| `product_id` | `uuid references public.products (id) on delete cascade` |
| `manual_specs` | `jsonb`, `check (jsonb_typeof(manual_specs) = 'object')` |
| `updated_at` | `timestamptz not null default now()`, trigger `set_updated_at` |

Constraint:
- `unique (user_id, category_id)`;
- `check ((product_id is null) <> (manual_specs is null))`;
- `check (manual_specs is null or (manual_specs <> '{}'::jsonb and manual_specs - array['length_mm','width_mm','height_mm','weight_g'] = '{}'::jsonb))`;
- index `user_gear_product_id_idx`.

Trigger `before insert or update` (fungsi `validate_user_gear`, invoker, `set search_path = ''`):
- kalau `product_id` terisi, kategori produk harus sama dengan `category_id`, kalau tidak `raise ... using errcode = '22023'`;
- kalau `manual_specs` terisi, panggil `validate_spec_values(category_id, 'product', manual_specs)`.

Revalidasi template (R4):
- `public.revalidate_gear_values(p_category_id uuid)` bersifat `security definer` dan `set search_path = ''`. Fungsi ini memvalidasi setiap `manual_specs` di kategori itu.
- `create or replace function public.revalidate_category_values` memanggil fungsi di atas setelah memeriksa produk dan varian.
- `revoke execute ... from public, anon`, lalu `grant execute ... to authenticated` (dipanggil lewat trigger dengan hak pemilik).

RLS (`to authenticated`; `mine` = `user_id = auth.uid() and public.current_app_role() = 'customer'`):
- select dan delete: `using (mine)`;
- insert: `with check (mine and (product_id is null or exists (select 1 from public.products p where p.id = product_id)))`;
- update: `using (mine)` dan `with check` sama dengan insert.

Subquery `products` berjalan di bawah RLS pengguna, jadi produk nonaktif atau dari kategori nonaktif tertolak.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
// user-gear.test.ts — beforeAll: createCatalogFixture(prefix) + kategori aktif kedua `${prefix}cat-b` dengan produk `p-b`.
// beforeEach: admin menghapus semua user_gear di catId dan catB.
const gear = (extra: Record<string, unknown>) => ({ category_id: f.catId, ...extra });
const mine = (p: Persona) => clientFor(p).from('user_gear').select('id, product_id, manual_specs');

it('lets a customer save and read their own gear', async () => {
  const { error } = await clientFor('customer').from('user_gear').insert(gear({ product_id: f.pOn }));
  expect(error).toBeNull();
  expect((await mine('customer').eq('category_id', f.catId)).data).toMatchObject([{ product_id: f.pOn, manual_specs: null }]);
});
it('accepts a reference product and manual sizes', async () => { /* pRef ✓; lalu upsert onConflict user_id,category_id ke { product_id: null, manual_specs: { weight_g: 60 } } ✓ */ });
it('hides gear from other customers, staff and guests', async () => {
  // admin insert gear milik customer; customer2, operator, owner: select → []; anon: select → []
  // customer2 update/delete `.eq('id', id).select()` → []; baris tetap ada (cek via admin)
});
it.each(['customer2', 'operator', 'owner'] as const)('blocks %s from writing gear for someone else', async (p) => {
  const { error } = await clientFor(p).from('user_gear').insert(gear({ user_id: userIdOf('customer'), product_id: f.pOn }));
  expect(error).not.toBeNull();
});
it('blocks staff from saving their own gear', async () => { /* operator & owner insert gear({ product_id: f.pOn }) → error */ });
it('blocks guests', async () => { /* anon insert → error */ });
it.each([
  ['an invisible product', () => gear({ product_id: f.pOff })],
  ['a product from another category', () => gear({ product_id: f.pB })],
  ['both product and manual sizes', () => gear({ product_id: f.pOn, manual_specs: { weight_g: 60 } })],
  ['neither', () => gear({})],
  ['empty manual sizes', () => gear({ manual_specs: {} })],
  ['a key outside the four sizes', () => gear({ manual_specs: { sensor: 'x' } })],
  ['a key missing from the template', () => gear({ manual_specs: { length_mm: 120 } })], // fixture catId tidak punya length_mm
  ['a non-number size', () => gear({ manual_specs: { weight_g: 'berat' } })],
])('rejects %s', async (_, row) => {
  expect((await clientFor('customer').from('user_gear').insert(row())).error).not.toBeNull();
});
it('allows one row per category', async () => { /* insert kedua di catId → error */ });
it('deletes gear with its product', async () => { /* produk sementara di catId, gear admin, hapus produk → gear hilang */ });
it('keeps manual sizes valid when the template changes', async () => {
  // admin insert gear customer { manual_specs: { weight_g: 60 } }
  // owner hapus atribut weight_g di catId → error, atribut masih ada
});
```

afterAll menghapus gear fixture, kategori kedua, lalu `deleteCatalogFixture`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm test:rls`
Expected: FAIL. Relation `user_gear` belum ada.

- [ ] **Step 3: Tulis migrasi, lalu kirim**

Run: `pnpm exec supabase db push --remote`

- [ ] **Step 4: Jalankan tes, lalu generate ulang tipe**

Run: `pnpm test:rls && pnpm db:types && pnpm typecheck`
Expected: PASS, termasuk semua tes 1A dan Task 1.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: tabel user_gear dengan RLS milik pelanggan"
```

---

### Task 3: Seed mouse referensi dan pasangan contoh

**Files:**
- Modify: `packages/catalog-data/src/types.ts`, `src/catalog.ts`, `src/seed.ts`, `src/index.ts`, `src/catalog.test.ts`
- Modify: `scripts/seed-catalog.ts` (cetak kolom laporan baru)
- Test: `packages/db-tests/src/seed-catalog.test.ts`

**Interfaces:**
- Consumes: kolom `compare_example_*` dan view `compare_items` (Task 1).
- Produces:

```ts
export type SeedReference = Pick<SeedProduct,
  'slug' | 'brandSlug' | 'categorySlug' | 'modelName' | 'specs' | 'specSources' | 'eloshapesUrl'> & { specSourceUrl: string };
export type CompareExample = { currentSlug: string; targetSlug: string };
export type CatalogSeed = { brands: SeedBrand[]; products: SeedProduct[]; references: SeedReference[]; compareExample: CompareExample | null };
export type SeedReport = { /* kolom 1A */ referencesCreated: number; referencesUpdated: number; examplesSet: number };
```

**Aturan `seedCatalog` (tambahan dari 1A)**
- Referensi diproses seperti produk, dengan `description = ''`, tanpa varian, dan tanpa unit.
- `is_for_sale` dianggap kolom bisnis.
  - Saat insert, produk diisi `true` dan referensi `false`.
  - Saat update, kolom ini tidak disentuh.
  - Dengan `forceBusiness`, nilainya diambil dari daftar asal (bukan selalu `true`), bersama `is_active = true`.
- Slug yang muncul di `products` dan `references` sekaligus → `throw`.
- `compareExample`:
  - kalau null, `store_settings` tidak disentuh;
  - kalau terisi, setiap kolom yang masih null diisi id produk dari slug itu;
  - dengan `forceBusiness`, kedua kolom selalu ditimpa;
  - `examplesSet` menghitung kolom yang ditulis;
  - kalau baris `store_settings` tidak ada → `throw` dengan pesan `Jalankan pnpm db:push dulu.`

**Data di `catalog.ts`**
- `references` hanya berisi **Logitech G102 Lightsync** dulu (slug `logitech-g102-lightsync`), karena mouse ini dipakai pasangan contoh dan e2e. Ke-19 sisanya masuk di Task 10.
  - Panjang, lebar, tinggi, dan bobot disalin dari halaman resmi logitechg.com yang dibuka saat itu.
  - Logitech menulis panjang sebagai "Height" dan tinggi sebagai "Depth". Cocokkan dengan gambar dimensinya.
  - Atribut lain diisi kalau tercantum. EloShapes diisi hanya kalau halamannya terbukti ada.
- `compareExample: { currentSlug: 'logitech-g102-lightsync', targetSlug: 'vortexseries-ignix-f1' }`.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
// catalog.test.ts (offline)
const { references, compareExample } = catalogSeed;
it('has the 16 approved products for sale', () => expect(products).toHaveLength(16)); // tetap
it('gives every reference mouse four official sizes', () => {
  for (const r of references) {
    expect(r.categorySlug, r.slug).toBe('mouse');
    for (const k of ['length_mm', 'width_mm', 'height_mm', 'weight_g']) {
      expect(r.specs[k], `${r.slug}.${k}`).toBeGreaterThan(0);
      expect(r.specSources[k], `${r.slug}.${k}`).toBe('resmi');
    }
    expect(r.specSourceUrl, r.slug).toMatch(/^https:\/\//);
  }
});
it('keeps slugs unique across products and references, and never "ukur"', () => { /* gabungan unik, tidak ada 'ukur' */ });
it('points the example pair at a known mouse and a for-sale mouse', () => {
  const all = [...products, ...references];
  expect(all.some((p) => p.slug === compareExample?.currentSlug && p.categorySlug === 'mouse')).toBe(true);
  expect(products.some((p) => p.slug === compareExample?.targetSlug && p.categorySlug === 'mouse')).toBe(true);
});
// Tes yang sudah ada diperluas ke referensi: 'uses only template keys with valid values',
// 'cites a source for every spec…', 'links eloshapes only for mice', dan 'uses unique slugs prefixed by a known brand'.
// Tes "setiap merek punya produk" menerima produk atau referensi.

// seed-catalog.test.ts (fixture() sekarang berisi references: [satu referensi], compareExample: null)
it('creates references as not for sale without variants', async () => {
  // seed → compare_items(slug ref) is_for_sale false; product_variants untuk produknya kosong
});
it('keeps is_for_sale when re-run, and restores it from data only when forced', async () => {
  // admin set is_for_sale=true pada referensi → seed biasa: tetap true → forceBusiness: kembali false
  // admin set is_for_sale=false pada produk fixture → forceBusiness: kembali true
});
it('fills the example pair only where it is empty', async () => {
  // simpan nilai asli store_settings; di finally kembalikan
  // set dua kolom null → seed dengan compareExample fixture → examplesSet 2, id cocok
  // set current ke pOn lain → seed lagi → examplesSet 0, current tidak berubah
});
it('has the real references seeded', async () => {
  const slugs = catalogSeed.references.map((r) => r.slug);
  const { data } = await anonClient().from('compare_items').select('slug, is_for_sale').in('slug', slugs);
  expect(data).toHaveLength(slugs.length);
  expect(data!.every((r) => r.is_for_sale === false)).toBe(true);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @lantai-dua/catalog-data test && pnpm test:rls`
Expected: FAIL (`references` belum ada di tipe dan data).

- [ ] **Step 3: Implementasikan tipe, data G102, dan aturan seed. Lalu jalankan seed asli dua kali**

Run: `pnpm db:seed-catalog`, lalu sekali lagi.
Expected: run pertama `referencesCreated: 1` dan `examplesSet: 2`. Run kedua `referencesCreated: 0` dan `examplesSet: 0`.

- [ ] **Step 4: Jalankan tes**

Run: `pnpm --filter @lantai-dua/catalog-data test && pnpm test:rls && pnpm typecheck && pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: seed mouse referensi dan pasangan contoh Bandingkan"
```

---

### Task 4: Logika Bandingkan bersama, bagian 1 (data, URL, pasangan, demo)

**Files:**
- Create: `packages/shared/src/compare/{types,manual,rows,query,pair,demo,testing,index}.ts`, ditambah `manual.test.ts`, `rows.test.ts`, `query.test.ts`, `pair.test.ts`, `demo.test.ts`
- Modify: `packages/shared/package.json` (export `"./compare": "./src/compare/index.ts"`)

**Interfaces:**
- Consumes: `Database` (Task 1, 2), `DemoStatus`, `Tone`, `demoLabel`, `SearchParamsLike` dari `@lantai-dua/shared/catalog`.
- Produces (`@lantai-dua/shared/compare`):

```ts
export type ManualKey = 'length_mm' | 'width_mm' | 'height_mm' | 'weight_g';
export type ManualSpecs = Partial<Record<ManualKey, number>>;
export const MANUAL_KEYS: readonly ManualKey[]; // length_mm, width_mm, height_mm, weight_g
export const MANUAL_FIELDS: Record<ManualKey, { param: 'panjang' | 'lebar' | 'tinggi' | 'bobot'; label: string; unit: 'mm' | 'g'; min: number; max: number }>;
export type CompareItem = { id: string; slug: string; modelName: string; brandSlug: string; brandName: string; categorySlug: string;
  isForSale: boolean; specs: Record<string, unknown>; eloshapesUrl: string | null; priceMin: number | null; priceMax: number | null;
  demoStatus: DemoStatus; demoVariantSku: string | null; demoVariantName: string | null };
export type CurrentSlot = { kind: 'item'; item: CompareItem } | { kind: 'manual'; specs: ManualSpecs } | null;
export type ComparePair = { current: CurrentSlot; target: CompareItem | null };
export type Gear = { kind: 'item'; productId: string } | { kind: 'manual'; specs: ManualSpecs };
export type CompareExamples = { currentId: string | null; targetId: string | null };
export const EMPTY_PAIR: ComparePair;

export function parseManualNumber(raw: string, key: ManualKey): { value: number | null; error: string | null };
export function validateManualSpecs(specs: Record<string, unknown>): ManualSpecs | null; // null kalau ada nilai tidak sah atau kosong
export function fromCompareRow(row: Database['public']['Views']['compare_items']['Row']): CompareItem;
export function fromGearRow(row: { product_id: string | null; manual_specs: Json | null }): Gear | null;
export function parseCompareQuery(params: SearchParamsLike, items: CompareItem[]): ComparePair;
export function serializeCompareQuery(pair: ComparePair): string; // '' atau '?…'
export function pickerGroups(items: CompareItem[]): { forSale: CompareItem[]; others: CompareItem[] };
export function gearToSlot(gear: Gear | null, items: CompareItem[]): CurrentSlot;
export function resolveInitialPair(fromUrl: ComparePair, ctx: { items: CompareItem[]; gear: Gear | null; examples: CompareExamples }): ComparePair;
export function slotMatchesGear(slot: CurrentSlot, gear: Gear | null): boolean;
export function slotName(slot: Exclude<CurrentSlot, null> | CompareItem): string; // "Logitech G102 Lightsync" / "Ukuran lu"
export function compareTitle(pair: ComparePair): string; // R6
export function hasDemoUnit(slot: CurrentSlot | CompareItem | null): boolean;
export function slotDemoLabel(slot: Exclude<CurrentSlot, null> | CompareItem): { tone: Tone; text: string };
export function tryBothHref(pair: ComparePair): string | null;
// testing.ts
export function makeCompareItem(overrides?: Partial<CompareItem>): CompareItem;
```

**Aturan**
- `parseManualNumber`:
  - `''` atau spasi → `{ value: null, error: null }`;
  - koma dan titik desimal diterima, dibulatkan ke dua desimal;
  - bukan angka → `Isi dengan angka, misalnya 125 atau 125,5.`;
  - di luar rentang → `<Label> harus antara <min> dan <max> <unit>.`, misalnya `Panjang harus antara 80 dan 160 mm.`
- `parseCompareQuery`:
  - `sekarang` harus slug item mana pun, atau `ukur`. Angka hanya dibaca kalau `sekarang=ukur`, dengan aturan rentang yang sama. Angka di URL hanya memakai titik.
  - `sekarang=ukur` tanpa angka sah menjadi slot manual kosong `{}`.
  - `incaran` harus slug item dengan `isForSale`.
  - Selain itu slot null.
- `serializeCompareQuery`: urutan `sekarang, panjang, lebar, tinggi, bobot, incaran`; angka ditulis `String(n)`; slot null tidak ditulis.
- `pickerGroups`: urut `brandName` lalu `modelName` (`localeCompare` `'id'`).
- `gearToSlot`: produk yang tidak ada di `items` (nonaktif) → null.
- `resolveInitialPair` (R2):
  - `urlEmpty` berarti kedua slot dari URL null;
  - `current = fromUrl.current ?? gearToSlot(gear)`;
  - kalau `urlEmpty`:
    - `current ??=` item contoh sekarang (kalau ada di `items`);
    - `target ??=` item contoh incaran kalau ada dan `isForSale`, atau cadangan.
  - Cadangan adalah mouse dijual teringan yang `hasDemoUnit`, lalu mouse dijual teringan. Bobot kosong di akhir, seri dipecah dengan slug.
- `slotMatchesGear`: item dibandingkan dengan `productId`, manual dibandingkan isi angkanya.
- `hasDemoUnit`: item dengan `demoStatus` `available`/`in_use`/`servicing` dan `demoVariantSku` tidak null.
- `slotDemoLabel`: referensi dan manual → `{ tone: 'none', text: 'Tidak ada di showroom' }`, mouse dijual → `demoLabel(status, variantName)`.
- `tryBothHref`:
  - null kalau salah satu slot kosong atau tidak ada yang `hasDemoUnit`;
  - `varian` berisi SKU sekarang lalu incaran, tanpa duplikat, dipisah koma;
  - `bawa=<slug|ukur>` hanya kalau mouse sekarang tidak `hasDemoUnit`.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
const f1 = makeCompareItem({ slug: 'vortexseries-ignix-f1', brandName: 'VortexSeries', modelName: 'Ignix F1', isForSale: true,
  specs: { weight_g: 51 }, demoStatus: 'available', demoVariantSku: 'L2-VTX-IGNIXF1-WHT', demoVariantName: 'Putih' });
const g102 = makeCompareItem({ slug: 'logitech-g102-lightsync', brandName: 'Logitech', modelName: 'G102 Lightsync', isForSale: false });
const dav3 = makeCompareItem({ slug: 'razer-deathadder-v3-pro', isForSale: true, specs: { weight_g: 63 }, demoStatus: 'in_use', demoVariantSku: 'L2-RZR-DAV3PRO-BLK' });
const items = [f1, g102, dav3];
const p = (s: string) => parseCompareQuery(new URLSearchParams(s), items);

// manual.test.ts
it.each([['125', 125], ['125,5', 125.5], ['125.55', 125.55], ['125,556', 125.56], [' ', null]])('parses %s', (raw, value) =>
  expect(parseManualNumber(raw, 'length_mm')).toEqual({ value, error: null }));
it('rejects non-numbers and out-of-range values', () => {
  expect(parseManualNumber('abc', 'length_mm').error).toBe('Isi dengan angka, misalnya 125 atau 125,5.');
  expect(parseManualNumber('500', 'width_mm').error).toBe('Lebar harus antara 40 dan 100 mm.');
  expect(parseManualNumber('10', 'weight_g').error).toBe('Bobot harus antara 20 dan 200 g.');
});

// query.test.ts
it('reads a pair of slugs', () => expect(p('sekarang=logitech-g102-lightsync&incaran=vortexseries-ignix-f1'))
  .toEqual({ current: { kind: 'item', item: g102 }, target: f1 }));
it('reads manual sizes, ignoring invalid numbers', () =>
  expect(p('sekarang=ukur&panjang=125.5&lebar=abc&tinggi=500&bobot=60').current).toEqual({ kind: 'manual', specs: { length_mm: 125.5, weight_g: 60 } }));
it.each([
  'sekarang=zzz', 'incaran=logitech-g102-lightsync', 'panjang=125', 'incaran=', 'sekarang=ukur&panjang=125,5x', 'utm_source=x',
])('drops invalid %s', (raw) => {
  const pair = p(raw);
  expect(pair.target).toBeNull();
  expect(pair.current === null || (pair.current.kind === 'manual' && Object.keys(pair.current.specs).length === 0)).toBe(true);
});
it('round-trips in a stable order', () => {
  const s = '?sekarang=ukur&panjang=125.5&tinggi=40&bobot=60&incaran=vortexseries-ignix-f1';
  expect(serializeCompareQuery(p(s))).toBe(s);
  expect(serializeCompareQuery(EMPTY_PAIR)).toBe('');
});

// pair.test.ts
const examples = { currentId: g102.id, targetId: f1.id };
it('uses the example pair when the URL has no valid slot', () => {
  expect(resolveInitialPair(p('sekarang=zzz'), { items, gear: null, examples })).toEqual({ current: { kind: 'item', item: g102 }, target: f1 });
});
it('fills the current slot from gear but keeps the URL target', () => {
  const r = resolveInitialPair(p('incaran=razer-deathadder-v3-pro'), { items, gear: { kind: 'item', productId: f1.id }, examples });
  expect(r).toEqual({ current: { kind: 'item', item: f1 }, target: dav3 });
});
it('leaves the current slot empty when the URL only has a target and there is no gear', () => {
  expect(resolveInitialPair(p('incaran=razer-deathadder-v3-pro'), { items, gear: null, examples }).current).toBeNull();
});
it('treats gear pointing at an inactive mouse as empty', () => { /* gear productId 'hilang' → current = contoh g102 */ });
it('falls back to the lightest for-sale mouse with a demo unit', () => {
  // examples.targetId = g102.id (bukan dijual) → target f1 (51 g, ada unit) sebelum dav3 (63 g)
  // tanpa satu pun unit demo → mouse dijual teringan; tanpa mouse dijual → null
});
it('leaves the current slot empty when the example mouse is gone', () => { /* currentId 'hilang' → current null */ });

// demo.test.ts
it('links both demo units and skips bawa when the current mouse has one', () =>
  expect(tryBothHref({ current: { kind: 'item', item: dav3 }, target: f1 })).toBe('/reservasi/baru?varian=L2-RZR-DAV3PRO-BLK,L2-VTX-IGNIXF1-WHT'));
it('adds bawa for a reference or manual current mouse', () => {
  expect(tryBothHref({ current: { kind: 'item', item: g102 }, target: f1 })).toBe('/reservasi/baru?varian=L2-VTX-IGNIXF1-WHT&bawa=logitech-g102-lightsync');
  expect(tryBothHref({ current: { kind: 'manual', specs: { length_mm: 125 } }, target: f1 })).toBe('/reservasi/baru?varian=L2-VTX-IGNIXF1-WHT&bawa=ukur');
});
it('returns null without any demo unit or with an empty slot', () => { /* target tanpa unit + current referensi → null; current null → null */ });
it('labels references and manual sizes as not in the showroom', () =>
  expect(slotDemoLabel(g102)).toEqual({ tone: 'none', text: 'Tidak ada di showroom' }));
it('titles the page with both names only for two listed mice', () => {
  expect(compareTitle({ current: { kind: 'item', item: g102 }, target: f1 })).toBe('Bandingkan Logitech G102 Lightsync vs VortexSeries Ignix F1');
  expect(compareTitle({ current: { kind: 'manual', specs: {} }, target: f1 })).toBe('Bandingkan mouse');
});

// rows.test.ts
it('maps compare_items and user_gear rows', () => { /* snake→camel; price null; manual_specs dengan key asing/negatif dibuang; dua-duanya kosong → null */ });
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @lantai-dua/shared test`
Expected: FAIL, karena modul `compare/*` belum ada.

- [ ] **Step 3: Implementasikan modul sesuai Interfaces dan aturan**

Pemetaan `demo_status` memakai fungsi yang sama dengan `catalog/rows.ts`. Ekspor fungsinya dari sana, jangan disalin.

- [ ] **Step 4: Jalankan semua tes**

Run: `pnpm --filter @lantai-dua/shared test && pnpm typecheck && pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: logika Bandingkan bersama (URL, pasangan awal, demo)"
```

---

### Task 5: Logika Bandingkan bersama, bagian 2 (kalimat, tabel, kotak ukuran)

**Files:**
- Modify: `packages/shared/src/catalog/format.ts`, `format.test.ts`, `catalog/index.ts` (tambah `formatSpecValue`)
- Modify: `apps/web/src/components/product/spec-table.tsx` (pakai `formatSpecValue`, hapus `formatValue` lokal)
- Create: `packages/shared/src/compare/{summary,table,boxes}.ts` + `*.test.ts`. Ekspor dari `compare/index.ts`.

**Interfaces:**
- Consumes: tipe Task 4, `AttributeDef`, `priceLabel`, `formatRupiah`.
- Produces:

```ts
// @lantai-dua/shared/catalog
export function formatSpecValue(attr: AttributeDef, value: unknown): string | null; // isi sama dengan formatValue di spec-table.tsx
// @lantai-dua/shared/compare
export function slotSpecs(slot: CurrentSlot | CompareItem | null): Record<string, unknown>;
export function summarySentence(pair: ComparePair): string | null;
export type CompareTableRow = { key: string; label: string; current: string; target: string; diff: string | null };
export function compareRows(pair: ComparePair, attributes: AttributeDef[]): CompareTableRow[];
export type Box = { x: number; y: number; w: number; h: number };
export type BoxPanel = { width: number; height: number; current: Box; target: Box };
export type BoxPanels = { top: BoxPanel | null; side: BoxPanel | null; topGap: string | null; sideGap: string | null };
export function boxPanels(pair: ComparePair): BoxPanels;
```

**Aturan**
- `summarySentence`: null kalau salah satu slot kosong. Mouse yang sama (item dengan id sama) → `Dua pilihan ini mouse yang sama.` Selisih dihitung `incaran − sekarang`.
  - Bobot: `|d| < 1` berarti hampir sama, selain itu bilangan bulat.
  - Panjang: `|d| < 0,5` berarti hampir sama, selain itu satu desimal dengan ",0" dibuang.
  - Susunan kalimat: tabel §5.6 ditambah R8.
- `compareRows`, urutannya:
  1. empat ukuran (urut template);
  2. `harga` (label `Harga`, nilai `priceLabel`, selisih dari `priceMin`) hanya kalau kedua mouse punya harga;
  3. atribut `isComparable` dengan scope `product` lain, urut `sortOrder`.
  - Nilai kosong ditulis `–`. Baris yang kosong di kedua sisi dilewati.
  - `diff` hanya untuk angka yang ada di kedua sisi, dengan format `−6,2 mm`, `+3 g`, `+Rp150.000`, atau `Sama` (R9).
- `boxPanels`: memakai satuan mm dengan `PAD = 8`.
  - Tampak atas butuh panjang dan lebar kedua mouse. `width = maxL + 2·PAD`, `height = maxW + 2·PAD`. Kotak berada di `x = PAD` dan `y = PAD + (maxW − w) / 2`.
  - Tampak samping butuh panjang dan tinggi. `width` sama dengan tampak atas, `height = maxH + 2·PAD`, dan `y = PAD + maxH − h`.
  - Lebar viewBox yang sama di kedua panel menjamin skalanya sama.
  - Panel yang tidak bisa digambar → null, dengan teks:
    - item: `<Label-label digabung " dan ", huruf awal kapital> <Merek Model> belum tercatat.`, misalnya `Tinggi Logitech G102 Lightsync belum tercatat.`;
    - manual: `Isi <label huruf kecil digabung " dan "> mouse lu untuk melihat tampak <atas|samping>.`;
    - kalau kedua mouse kurang, dua kalimat dipisah spasi (sekarang dulu).

- [ ] **Step 1: Tulis tes yang gagal**

```ts
const cur = (specs: Record<string, unknown>) => ({ kind: 'item', item: makeCompareItem({ id: 'a', specs }) }) as const;
const tgt = (specs: Record<string, unknown>) => makeCompareItem({ id: 'b', specs });

// summary.test.ts
it.each([
  [{ weight_g: 60, length_mm: 127.69 }, { weight_g: 51, length_mm: 121.48 }, 'Incaran lebih ringan 9 g dan lebih pendek 6,2 mm.'],
  [{ weight_g: 60, length_mm: 120 }, { weight_g: 63, length_mm: 120.3 }, 'Incaran lebih berat 3 g, panjangnya hampir sama.'],
  [{ weight_g: 60, length_mm: 120 }, { weight_g: 60.4, length_mm: 119.8 }, 'Bobot dan panjangnya hampir sama.'],
  [{ length_mm: 125 }, { weight_g: 51, length_mm: 121 }, 'Incaran lebih pendek 4 mm.'],
  [{ weight_g: 60, length_mm: 120 }, { weight_g: 60.5, length_mm: 125 }, 'Incaran lebih panjang 5 mm, bobotnya hampir sama.'],
  [{ weight_g: 60 }, { weight_g: 51.4 }, 'Incaran lebih ringan 9 g.'],
  [{ length_mm: 120 }, { length_mm: 120.4 }, 'Panjangnya hampir sama.'],
  [{ length_mm: 120 }, { length_mm: 119.5 }, 'Incaran lebih pendek 0,5 mm.'],
])('%o vs %o', (a, b, text) => expect(summarySentence({ current: cur(a), target: tgt(b) })).toBe(text));
it('handles manual sizes, the same mouse, and missing numbers', () => {
  expect(summarySentence({ current: { kind: 'manual', specs: { length_mm: 125 } }, target: tgt({ length_mm: 121 }) })).toBe('Incaran lebih pendek 4 mm.');
  const same = makeCompareItem({ id: 'x' });
  expect(summarySentence({ current: { kind: 'item', item: same }, target: same })).toBe('Dua pilihan ini mouse yang sama.');
  expect(summarySentence({ current: cur({ sensor: 'x' }), target: tgt({ weight_g: 51 }) })).toBeNull();
  expect(summarySentence({ current: null, target: tgt({ weight_g: 51 }) })).toBeNull();
});

// table.test.ts — attrs = template mouse (length_mm..weight_g, shape, connectivity, sensor, color[variant])
it('orders sizes, price, then other comparable attributes', () => {
  const rows = compareRows({ current: { kind: 'item', item: makeCompareItem({ id: 'a', priceMin: 1_000_000, priceMax: 1_000_000,
    specs: { length_mm: 127.69, width_mm: 67.76, height_mm: 42.84, weight_g: 60, shape: 'Ergonomis kanan', sensor: 'PAW 3395' } }) },
    target: makeCompareItem({ id: 'b', priceMin: 899_000, priceMax: 949_000,
    specs: { length_mm: 121.48, width_mm: 61.27, height_mm: 38.2, weight_g: 51, shape: 'Simetris', sensor: 'PAW 3311' } }) }, attrs);
  expect(rows.map((r) => r.key)).toEqual(['length_mm', 'width_mm', 'height_mm', 'weight_g', 'harga', 'shape', 'sensor']);
  expect(rows[0]).toEqual({ key: 'length_mm', label: 'Panjang', current: '127,69 mm', target: '121,48 mm', diff: '−6,2 mm' });
  expect(rows[4]).toMatchObject({ current: 'Rp1.000.000', target: 'mulai Rp899.000', diff: '−Rp101.000' });
  expect(rows[5]?.diff).toBeNull();
});
it('drops price for references and dashes manual non-size rows', () => { /* referensi → tanpa 'harga'; manual → shape.current '–' */ });
it('writes Sama when the rounded difference is zero', () => { /* 60 vs 60.4 g → diff 'Sama' */ });

// boxes.test.ts
it('aligns the back ends on one shared scale', () => {
  const r = boxPanels({ current: cur({ length_mm: 125, width_mm: 63, height_mm: 40 }), target: tgt({ length_mm: 121.48, width_mm: 61.27, height_mm: 38.2 }) });
  expect(r.top).toMatchObject({ width: 141, height: 79, current: { x: 8, y: 8, w: 125, h: 63 } });
  expect(r.top!.target.y).toBeCloseTo(8.865);
  expect(r.side!.width).toBe(r.top!.width);
  expect(r.side!.target.y).toBeCloseTo(9.8);
});
it('explains a missing panel', () => {
  const r = boxPanels({ current: { kind: 'manual', specs: { length_mm: 125 } },
    target: makeCompareItem({ brandName: 'Logitech', modelName: 'G102 Lightsync', specs: { length_mm: 116, width_mm: 62 } }) });
  expect(r.top).toBeNull();
  expect(r.topGap).toBe('Isi lebar mouse lu untuk melihat tampak atas.');
  expect(r.sideGap).toBe('Isi tinggi mouse lu untuk melihat tampak samping. Tinggi Logitech G102 Lightsync belum tercatat.');
});

// format.test.ts
it('formats spec values like the 1A spec table', () => { /* number+unit "121,48 mm", boolean Ya/Tidak, multi_enum "Kabel, Bluetooth", kosong → null */ });
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @lantai-dua/shared test`
Expected: FAIL (`summarySentence`, `compareRows`, `boxPanels`, dan `formatSpecValue` belum ada).

- [ ] **Step 3: Implementasikan, lalu ganti `formatValue` lokal di `spec-table.tsx` dengan `formatSpecValue`**

- [ ] **Step 4: Jalankan semua tes, termasuk e2e detail produk**

Run: `pnpm --filter @lantai-dua/shared test && pnpm typecheck && pnpm check && pnpm e2e product.spec.ts`
Expected: PASS. Tabel spek 1A tidak berubah.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: kalimat selisih, tabel, dan kotak ukuran Bandingkan"
```

---

### Task 6: Halaman `/bandingkan` (pemilih, kalimat, tabel, demo)

**Files:**
- Create: `apps/web/src/lib/compare-data.ts`
- Create: `apps/web/src/components/compare/{compare-view,pair-picker,manual-fields,compare-table,demo-panel}.tsx`
- Modify: `apps/web/src/app/(public)/bandingkan/page.tsx`
- Modify: `apps/web/e2e/data.ts`
- Test: `apps/web/e2e/compare.spec.ts`

**Interfaces:**
- Consumes: `@lantai-dua/shared/compare` (Task 4, 5), `getCategory`, `getCurrentViewer`, `StatusLine`, `ButtonLink`/`buttonClasses`.
- Produces:

```ts
// lib/compare-data.ts (server)
export async function listCompareItems(category: string): Promise<CompareItem[]>;
export async function getCompareExamples(): Promise<CompareExamples>;
export async function getMyGear(category: string): Promise<Gear | null>; // null kecuali pelanggan aktif
export type CompareViewer = 'guest' | 'customer' | 'other';
export async function loadComparePage(): Promise<{ items: CompareItem[]; attributes: AttributeDef[]; examples: CompareExamples;
  gear: Gear | null; viewer: CompareViewer } | null>; // null kalau kategori mouse tidak aktif (R10)
// components
export function CompareView(props: { items: CompareItem[]; attributes: AttributeDef[]; examples: CompareExamples;
  gear: Gear | null; viewer: CompareViewer }): JSX.Element; // 'use client'
export function PairPicker(props: { items: CompareItem[]; pair: ComparePair; allowManual: boolean;
  savedManual?: ManualSpecs | null; onChange: (pair: ComparePair) => void }): JSX.Element;
export function ManualFields(props: { specs: ManualSpecs; onCommit: (specs: ManualSpecs) => void }): JSX.Element;
export function CompareTable(props: { rows: CompareTableRow[] }): JSX.Element; // data-testid="compare-table"
export function DemoPanel(props: { pair: ComparePair; viewer: CompareViewer }): JSX.Element;
```

**Perilaku `CompareView`**
- Pasangan dihitung dari `resolveInitialPair(parseCompareQuery(useSearchParams(), items), { items, gear, examples })`. Pola `pending`/`seenUrl` sama dengan `CatalogBrowser`.
- Setelah mount, kalau `serializeCompareQuery(pair)` berbeda dengan URL, URL diganti dengan `window.history.replaceState`.
- Setiap perubahan pilihan memakai `window.history.pushState` ke `/bandingkan` + serialisasi.
- `document.title` disamakan dengan `` `${compareTitle(pair)} · LANTAI DUA` `` setiap pasangan berubah.
- Kalimat ada di `<p data-testid="compare-summary" aria-live="polite">`. Kalau slot sekarang kosong, isinya `Pilih mouse yang lu pakai sekarang untuk melihat bedanya.`
- Tempat kotak ukuran dan tombol simpan dibiarkan untuk Task 7 dan Task 8.

**`PairPicker`**
- Dua `<select>` berlabel `Mouse gue sekarang` dan `Mouse incaran`, masing-masing dengan placeholder `Pilih mouse yang lu pakai sekarang` dan `Pilih mouse incaran` (value `''`, `disabled`).
- Slot sekarang punya `<optgroup>` dari `pickerGroups`, lalu opsi `Isi ukuran sendiri` (value `ukur`) kalau `allowManual`, dan opsi `Ukuran yang lu simpan` (value `tersimpan`) kalau `savedManual`. Slot incaran hanya berisi `forSale`.
- Tinggi minimal 44 px.

**`ManualFields`**
- Empat kolom `Panjang (mm)`, `Lebar (mm)`, `Tinggi (mm)`, dan `Bobot (g)` dengan `inputMode="decimal"`.
- Nilai diterapkan saat blur atau Enter lewat `parseManualNumber`. Pesan galat tampil di bawah kolom (`aria-describedby`) dan nilainya tidak diterapkan.
- Isi kolom disamakan dengan URL memakai pola `seen` di `RangeFields`.

**`DemoPanel`** (R7: hanya tampil kalau kedua slot terisi)
- Judul `Unit demo`, lalu `StatusLine` untuk tiap mouse beserta namanya (`slotDemoLabel`).
- Tombol `Coba keduanya di Surabaya` adalah tautan ke `tryBothHref(pair)`. Untuk tamu tujuannya `/masuk?next=<encodeURIComponent(href)>`.
- Kalau `tryBothHref` null, tombol tampil nonaktif (`aria-disabled`, bukan tautan) dengan alasan `Dua mouse ini belum ada unit demonya.`
- Saran B8 tampil kalau mouse sekarang tidak `hasDemoUnit`.
- Tautan EloShapes `Bandingkan bentuknya di EloShapes: <nama>` tampil untuk tiap mouse yang punya `eloshapesUrl` (`target="_blank" rel="noreferrer"`).

**`page.tsx`**
- `generateMetadata` memakai pasangan yang sama dengan halaman (`compareTitle`).
- `notFound()` kalau `loadComparePage()` null.
- Isinya `<h1>Bandingkan mouse</h1>`, lalu `<Suspense><CompareView … /></Suspense>`.

- [ ] **Step 1: Tulis tes e2e yang gagal**

```ts
// e2e/data.ts — tambah
export const references = catalogSeed.references;
export const compareExample = catalogSeed.compareExample!;
export const product = (slug: string) => catalogSeed.products.find((p) => p.slug === slug)!;
export const fullName = (slug: string) => {
  const m = [...catalogSeed.products, ...catalogSeed.references].find((p) => p.slug === slug)!;
  return `${catalogSeed.brands.find((b) => b.slug === m.brandSlug)!.name} ${m.modelName}`;
};

// compare.spec.ts
const current = (page: Page) => page.getByLabel('Mouse gue sekarang');
const target = (page: Page) => page.getByLabel('Mouse incaran');
const summary = (page: Page) => page.getByTestId('compare-summary');
const { currentSlug: ex1, targetSlug: ex2 } = compareExample;

test('opens on the example pair and writes it into the URL', async ({ page }) => {
  await page.goto('/bandingkan');
  await expect(page).toHaveURL(`/bandingkan?sekarang=${ex1}&incaran=${ex2}`);
  await expect(current(page).locator('option:checked')).toHaveText(fullName(ex1));
  await expect(page).toHaveTitle(`Bandingkan ${fullName(ex1)} vs ${fullName(ex2)} · LANTAI DUA`);
  await expect(summary(page)).toHaveText(/^Incaran /);
});
test('keeps the current slot empty when only a target is given', async ({ page }) => {
  await page.goto('/bandingkan?incaran=razer-deathadder-v3-pro');
  await expect(page).toHaveURL('/bandingkan?incaran=razer-deathadder-v3-pro');
  await expect(summary(page)).toHaveText('Pilih mouse yang lu pakai sekarang untuk melihat bedanya.');
});
test('each choice is one step back in history', async ({ page }) => {
  await page.goto('/bandingkan');
  await target(page).selectOption({ label: fullName('razer-deathadder-v3-pro') });
  await expect(page).toHaveURL(/incaran=razer-deathadder-v3-pro/);
  await current(page).selectOption({ label: 'Isi ukuran sendiri' });
  await expect(page).toHaveURL(/sekarang=ukur/);
  await page.goBack();
  await expect(page).toHaveURL(`/bandingkan?sekarang=${ex1}&incaran=razer-deathadder-v3-pro`);
  await page.goBack();
  await expect(page).toHaveURL(`/bandingkan?sekarang=${ex1}&incaran=${ex2}`);
});
test.each([
  ['sekarang=zzz&incaran=logitech-g102-lightsync', `/bandingkan?sekarang=${ex1}&incaran=${ex2}`],
  ['sekarang=ukur&panjang=abc&lebar=63&incaran=vortexseries-ignix-f1', '/bandingkan?sekarang=ukur&lebar=63&incaran=vortexseries-ignix-f1'],
  ['panjang=125&incaran=vortexseries-ignix-f1', '/bandingkan?incaran=vortexseries-ignix-f1'],
])('survives ?%s', async ({ page }, raw, url) => {
  await page.goto(`/bandingkan?${raw}`);
  await expect(page).toHaveURL(url);
});
test('says when both slots hold the same mouse', async ({ page }) => {
  await page.goto('/bandingkan?sekarang=vortexseries-ignix-f1&incaran=vortexseries-ignix-f1');
  await expect(summary(page)).toHaveText('Dua pilihan ini mouse yang sama.');
});
test('applies manual sizes on Enter and rejects out-of-range values', async ({ page }) => {
  await page.goto('/bandingkan?sekarang=ukur&incaran=vortexseries-ignix-f1');
  await page.getByLabel('Panjang (mm)').fill('125,5');
  await page.getByLabel('Panjang (mm)').press('Enter');
  await expect(page).toHaveURL(/panjang=125\.5/);
  await page.getByLabel('Lebar (mm)').fill('500');
  await page.getByLabel('Lebar (mm)').blur();
  await expect(page.getByText('Lebar harus antara 40 dan 100 mm.')).toBeVisible();
  await expect(page).not.toHaveURL(/lebar=/);
});
test('shows price only when both mice are for sale', async ({ page }) => {
  await page.goto(`/bandingkan?sekarang=${ex1}&incaran=${ex2}`);
  await expect(page.getByTestId('compare-table').getByText('Harga')).toHaveCount(0);
  await page.goto('/bandingkan?sekarang=vortexseries-ignix-r1-pro&incaran=razer-deathadder-v3-pro');
  await expect(page.getByTestId('compare-table').getByText('Harga')).toBeVisible();
});
test('sends guests to login with the reservation link, and suggests bringing the old mouse', async ({ page }) => {
  await page.goto(`/bandingkan?sekarang=${ex1}&incaran=${ex2}`);
  const sku = product(ex2).demoUnits[0]!.variantSku;
  const next = `/reservasi/baru?varian=${sku}&bawa=${ex1}`;
  await expect(page.getByRole('link', { name: 'Coba keduanya di Surabaya' })).toHaveAttribute('href', `/masuk?next=${encodeURIComponent(next)}`);
  await expect(page.getByText('Mouse lama lu nggak ada di showroom? Bawa aja dari rumah biar bisa dibandingin langsung.')).toBeVisible();
});
test('links both demo units without bawa for two showroom mice', async ({ page }) => { /* r1 pro vs dav3 pro: next berisi dua SKU, saran B8 tidak tampil */ });
test('reference mice have no product page', async ({ page }) => {
  expect((await page.goto(`/produk/${references[0]!.slug}`))?.status()).toBe(404);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm e2e compare.spec.ts`
Expected: FAIL, karena halaman masih "sedang disiapkan".

- [ ] **Step 3: Implementasikan data, komponen, dan halaman sesuai Interfaces dan perilaku**

- [ ] **Step 4: Jalankan tes**

Run: `pnpm e2e && pnpm typecheck && pnpm check`
Expected: PASS, termasuk semua e2e 1A.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: halaman Bandingkan dengan pemilih, kalimat, tabel, dan status demo"
```

---

### Task 7: Kotak ukuran dan gerak M1

**Files:**
- Create: `apps/web/src/components/compare/size-boxes.tsx`
- Modify: `apps/web/src/components/compare/compare-view.tsx`, `apps/web/src/app/globals.css`
- Test: `apps/web/e2e/compare.spec.ts`

**Interfaces:**
- Consumes: `boxPanels`, `slotName`, `slotSpecs` (Task 5).
- Produces:

```ts
export function SizeBoxes(props: { pair: ComparePair; views: ('top' | 'side')[] }): JSX.Element;
// <figure data-testid="size-boxes" data-play={n}>
```

**Perilaku**
- Satu `<svg viewBox="0 0 {width} {height}" role="img">` per panel, dengan `aria-label` berisi kedua nama dan ukurannya. Keterangan panel `Tampak atas · skala sama` / `Tampak samping · skala sama`.
- Kedua panel berdampingan dari 768 px dengan kolom sama lebar, dan bertumpuk di bawahnya. Lebar viewBox sama, jadi skalanya sama.
- Kotak sekarang: garis putus-putus `ink-subtle` tanpa isi, kelas `m1-current`. Kotak incaran: garis `primary` berisi `primary-soft`, kelas `m1-target`. Ketebalan garis memakai `vector-effect="non-scaling-stroke"`.
- **Garis ukur** untuk panjang dan lebar (atau tinggi) incaran: garis tipis dengan dua ujung tegak dan angka mono di tengah, kelas `m1-after`. Di tampak samping, garis "meja" ada di bawah kotak.
- Legenda di bawah gambar memuat nama dan `formatDimensions` kedua mouse, lalu `Ukuran luar, bukan bentuk asli.`, lalu tombol `Putar ulang`.
- Panel null diganti `<p>` berisi `topGap`/`sideGap`.
- Animasi diputar ulang dengan mengganti `key` grup SVG menjadi `` `${serializeCompareQuery(pair)}-${play}` ``. `Putar ulang` menaikkan `play`, dan `data-play` mencerminkannya.

**CSS (`globals.css`)**

```css
@keyframes m1-from-left { from { transform: translateX(-50%); opacity: 0; } }
@keyframes m1-from-right { from { transform: translateX(50%); opacity: 0; } }
@keyframes m1-fade { from { opacity: 0; } }
.m1-current, .m1-target { transform-box: view-box; animation: var(--dur-showcase) var(--ease-out) both; }
.m1-current { animation-name: m1-from-left; }
.m1-target { animation-name: m1-from-right; }
.m1-after { animation: m1-fade var(--dur-fast) linear var(--dur-showcase) both; }
```

Dalam mode kurangi gerakan, `--dur-showcase` bernilai 0 ms, jadi kotak langsung menumpuk.

- [ ] **Step 1: Tambah tes e2e yang gagal**

```ts
test('draws both views on one scale with the disclaimer', async ({ page }) => {
  await page.goto(`/bandingkan?sekarang=${ex1}&incaran=${ex2}`);
  const fig = page.getByTestId('size-boxes');
  await expect(fig.getByRole('img')).toHaveCount(2);
  await expect(fig.getByText('Ukuran luar, bukan bentuk asli.')).toBeVisible();
  const [a, b] = await fig.locator('svg').evaluateAll((s) => s.map((e) => e.getAttribute('viewBox')!.split(' ')[2]));
  expect(a).toBe(b);
});
test('replaces a panel with a note when sizes are missing', async ({ page }) => {
  await page.goto('/bandingkan?sekarang=ukur&panjang=125&incaran=vortexseries-ignix-f1');
  await expect(page.getByText('Isi lebar mouse lu untuk melihat tampak atas.')).toBeVisible();
});
test('replays M1 and stacks instantly with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/bandingkan?sekarang=${ex1}&incaran=${ex2}`);
  const box = page.locator('.m1-target').first();
  expect(await box.evaluate((e) => getComputedStyle(e).animationDuration)).toBe('0s');
  await page.getByRole('button', { name: 'Putar ulang' }).click();
  await expect(page.getByTestId('size-boxes')).toHaveAttribute('data-play', '1');
});
test('fits a 360 px screen without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`/bandingkan?sekarang=vortexseries-ignix-r1-pro&incaran=razer-deathadder-v3-pro`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm e2e compare.spec.ts`
Expected: FAIL (`size-boxes` belum ada).

- [ ] **Step 3: Implementasikan `SizeBoxes`, CSS, dan sambungkan ke `CompareView`** (`views={['top', 'side']}`)

Periksa juga di browser pane, terang dan gelap, di 360 px dan desktop. Pastikan kotak bergeser masuk lalu menumpuk, dan garis ukur muncul setelahnya.

- [ ] **Step 4: Jalankan tes**

Run: `pnpm e2e && pnpm typecheck && pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: kotak ukuran berskala dengan gerak M1"
```

---

### Task 8: Gear gue

**Files:**
- Create: `apps/web/src/app/(public)/bandingkan/actions.ts`, `apps/web/src/components/compare/save-gear.tsx`
- Modify: `apps/web/src/components/compare/compare-view.tsx`
- Test: `apps/web/e2e/gear.spec.ts`

**Interfaces:**
- Consumes: tabel `user_gear` (Task 2), `validateManualSpecs`, `slotMatchesGear`, `serializeCompareQuery` (Task 4), `getCurrentViewer`.
- Produces:

```ts
// actions.ts ('use server')
export type SaveGearInput = { kind: 'item'; slug: string } | { kind: 'manual'; specs: ManualSpecs };
export type SaveGearResult = { ok: true; gear: Gear } | { ok: false; error: string };
export async function saveMouseGear(input: SaveGearInput): Promise<SaveGearResult>;
// save-gear.tsx ('use client')
export function SaveGear(props: { slot: CurrentSlot; gear: Gear | null; viewer: CompareViewer; pageUrl: string;
  onSaved: (gear: Gear) => void }): JSX.Element | null;
```

**`saveMouseGear`**
- Hanya untuk pelanggan aktif. Selain itu kembalikan `{ ok: false, error: 'Masuk sebagai pelanggan untuk menyimpan mouse lu.' }`.
- Item: cari `compare_items` dengan slug itu dan `category_slug = 'mouse'`. Kalau tidak ada, kembalikan `Mouse ini tidak ditemukan.`
- Manual: harus lolos `validateManualSpecs`. Kalau tidak, kembalikan `Ukuran belum lengkap atau di luar rentang.`
- Upsert `user_gear` dengan `{ user_id, category_id: <id kategori mouse>, product_id, manual_specs }`. Kolom yang tidak dipakai dikirim `null`, supaya constraint "tepat satu" tetap terpenuhi saat berganti jenis. Pakai `onConflict: 'user_id,category_id'`.
- Galat database → `Gagal menyimpan. Coba lagi sebentar.`

**`SaveGear`**
- `null` untuk `viewer === 'other'`, untuk slot kosong, untuk slot manual tanpa angka, dan saat `slotMatchesGear(slot, gear)` (setelah tersimpan, yang tampil adalah teks `Tersimpan sebagai mouse lu.` di tempat yang sama).
- Tamu melihat tautan bergaya tombol `Simpan sebagai mouse gue` ke `/masuk?next=<encodeURIComponent(pageUrl)>`.
- Pelanggan melihat tombol yang memanggil `saveMouseGear` dalam transisi. Saat menyimpan, tombol nonaktif. Hasil sukses memanggil `onSaved`. Galat tampil di bawah tombol (`role="alert"`) dan pilihan tidak berubah.
- `CompareView` menyimpan gear terakhir di state (awal dari prop `gear`) dan menaruh `SaveGear` di bawah pemilih. `pageUrl` adalah `/bandingkan` ditambah serialisasi pasangan.
- Teks `Tersimpan sebagai mouse lu.` hanya tampil kalau isi slot sama dengan gear dan slot itu berasal dari penyimpanan atau gear yang tersimpan.

- [ ] **Step 1: Tulis tes e2e yang gagal**

```ts
// gear.spec.ts — test.describe.configure({ mode: 'serial' }); akun pelanggan2@lantaidua.test
// login(page, email, next?) sama dengan auth.spec.ts
test('guests are sent to login and come back to the same pair', async ({ page }) => {
  await page.goto('/bandingkan?sekarang=vortexseries-ignix-r1-pro&incaran=vortexseries-ignix-f1');
  await page.getByRole('link', { name: 'Simpan sebagai mouse gue' }).click();
  await expect(page).toHaveURL(`/masuk?next=${encodeURIComponent('/bandingkan?sekarang=vortexseries-ignix-r1-pro&incaran=vortexseries-ignix-f1')}`);
  await page.getByLabel('Email').fill(CUSTOMER);
  await page.getByLabel('Kata sandi').fill(password);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL('/bandingkan?sekarang=vortexseries-ignix-r1-pro&incaran=vortexseries-ignix-f1');
  // Tidak tersimpan otomatis setelah login (keputusan penyusun no. 13).
  await expect(page.getByRole('button', { name: 'Simpan sebagai mouse gue' })).toBeVisible();
});
test('a customer saves a listed mouse and it fills the current slot next time', async ({ page }) => {
  await login(page, CUSTOMER, `/bandingkan?sekarang=${references[0]!.slug}&incaran=vortexseries-ignix-f1`);
  await page.getByRole('button', { name: 'Simpan sebagai mouse gue' }).click();
  await expect(page.getByText('Tersimpan sebagai mouse lu.')).toBeVisible();
  await page.goto('/bandingkan?incaran=razer-deathadder-v3-pro');
  await expect(page).toHaveURL(`/bandingkan?sekarang=${references[0]!.slug}&incaran=razer-deathadder-v3-pro`);
});
test('a customer saves manual sizes', async ({ page }) => {
  await login(page, CUSTOMER, '/bandingkan?sekarang=ukur&panjang=125&bobot=60&incaran=vortexseries-ignix-f1');
  await page.getByRole('button', { name: 'Simpan sebagai mouse gue' }).click();
  await expect(page.getByText('Tersimpan sebagai mouse lu.')).toBeVisible();
  await page.goto('/bandingkan');
  await expect(page).toHaveURL(`/bandingkan?sekarang=ukur&panjang=125&bobot=60&incaran=${compareExample.targetSlug}`);
});
test('staff never see the save button', async ({ page }) => {
  await login(page, 'operator1@lantaidua.test', '/bandingkan');
  await expect(page.getByTestId('compare-summary')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Simpan sebagai mouse gue' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Simpan sebagai mouse gue' })).toHaveCount(0);
});
test('a logged-in customer goes straight to the reservation form', async ({ page }) => {
  await login(page, CUSTOMER, `/bandingkan?sekarang=${compareExample.currentSlug}&incaran=${compareExample.targetSlug}`);
  await expect(page.getByRole('link', { name: 'Coba keduanya di Surabaya' })).toHaveAttribute('href', /^\/reservasi\/baru\?varian=/);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm e2e gear.spec.ts`
Expected: FAIL (tombol simpan belum ada).

- [ ] **Step 3: Implementasikan Server Action, `SaveGear`, dan sambungkan ke `CompareView`**

- [ ] **Step 4: Jalankan tes**

Run: `pnpm e2e && pnpm test:rls && pnpm typecheck && pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: simpan mouse gue dari halaman Bandingkan"
```

---

### Task 9: Versi ringkas di beranda

**Files:**
- Create: `apps/web/src/components/home/compare-teaser.tsx`
- Modify: `apps/web/src/app/(public)/page.tsx`
- Test: `apps/web/e2e/home.spec.ts`, `apps/web/e2e/gear.spec.ts`

**Interfaces:**
- Consumes: `loadComparePage` (Task 6), `PairPicker`, `SizeBoxes`, `resolveInitialPair`, `summarySentence`, `serializeCompareQuery`.
- Produces:

```ts
export function CompareTeaser(props: { items: CompareItem[]; examples: CompareExamples; gear: Gear | null }): JSX.Element | null; // 'use client'
```

**Perilaku**
- Pasangan awal `resolveInitialPair(EMPTY_PAIR, { items, gear, examples })` disimpan di state lokal. Mengganti pilihan tidak menyentuh URL.
- Kalau target null, komponen mengembalikan `null`.
- Isinya `<section aria-labelledby>` berjudul `Bandingkan mouse`, lalu `PairPicker` dengan `allowManual={false}` dan `savedManual` (dari gear manual), lalu kalimat, lalu `SizeBoxes views={['top']}`, lalu tautan `Buka perbandingan lengkap` ke `/bandingkan` + `serializeCompareQuery(pair)`.
- Memilih `Ukuran yang lu simpan` mengisi slot dengan ukuran gear.
- Di `page.tsx`, bagian ini ditaruh tepat setelah `<DemoRow>`. Kalau `loadComparePage()` null, bagian ini tidak dirender.

- [ ] **Step 1: Tambah tes e2e yang gagal**

```ts
// home.spec.ts
test('home compares the example pair and opens the full page', async ({ page }) => {
  await page.goto('/');
  const section = page.getByRole('region', { name: 'Bandingkan mouse' });
  await expect(section.getByLabel('Mouse gue sekarang').locator('option:checked')).toHaveText(fullName(compareExample.currentSlug));
  await expect(section.getByRole('img')).toHaveCount(1);
  await section.getByLabel('Mouse incaran').selectOption({ label: fullName('razer-deathadder-v3-pro') });
  await expect(page).toHaveURL('/');
  await section.getByRole('link', { name: 'Buka perbandingan lengkap' }).click();
  await expect(page).toHaveURL(`/bandingkan?sekarang=${compareExample.currentSlug}&incaran=razer-deathadder-v3-pro`);
});
// gear.spec.ts (setelah 'a customer saves manual sizes')
test('home offers the saved manual sizes', async ({ page }) => {
  await login(page, CUSTOMER, '/');
  const section = page.getByRole('region', { name: 'Bandingkan mouse' });
  await expect(section.getByLabel('Mouse gue sekarang').locator('option:checked')).toHaveText('Ukuran yang lu simpan');
  await expect(section.getByRole('link', { name: 'Buka perbandingan lengkap' }))
    .toHaveAttribute('href', `/bandingkan?sekarang=ukur&panjang=125&bobot=60&incaran=${compareExample.targetSlug}`);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm e2e home.spec.ts gear.spec.ts`
Expected: FAIL (region `Bandingkan mouse` belum ada).

- [ ] **Step 3: Implementasikan `CompareTeaser` dan pasang di beranda**

- [ ] **Step 4: Jalankan tes**

Run: `pnpm e2e && pnpm typecheck && pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: versi ringkas Bandingkan di beranda"
```

---

### Task 10: Mouse referensi lengkap

**Files:**
- Modify: `packages/catalog-data/src/catalog.ts`, `src/catalog.test.ts`

**Interfaces:**
- Consumes: `SeedReference` dan seed (Task 3).
- Produces: sekitar 20 referensi di `catalogSeed.references`.

**Isi data**
- Kandidat dari desain §6.4, setelah koreksi pemilik produk kalau ada:
  - Logitech G304 Lightspeed, G502 X, G Pro Wireless;
  - Razer Viper V3 Pro, DeathAdder Essential, Basilisk V3, Viper Mini;
  - Zowie EC2-CW, FK2-C, S2-C;
  - Pulsar X2 V2;
  - Lamzu Atlantis Mini;
  - VXE Dragonfly R1;
  - Attack Shark X3;
  - Fantech Aria XD7;
  - Rexus Daxa Air IV;
  - SteelSeries Aerox 3;
  - HyperX Pulsefire Haste 2;
  - Glorious Model O.
- Untuk setiap model, buka halaman resmi pabrikan (atau toko resmi merek), lalu salin panjang, lebar, tinggi, dan bobot beserta URL-nya.
  - Perhatikan istilah tiap merek (misalnya "Height" Logitech berarti panjang).
  - Kalau satu model punya beberapa versi (kabel/wireless), pakai versi yang namanya sama persis dengan `modelName`.
  - Model yang tidak punya keempat angka resmi diganti model populer lain yang punya, dan penggantiannya dicatat di pesan commit.
- `shape`, `connectivity`, dan `sensor` diisi hanya kalau tertulis di sumber yang sama.
- `eloshapesUrl` hanya diisi kalau halamannya terbukti ada saat dibuka.
- Merek baru, misalnya `zowie`, `pulsar`, `lamzu`, `vxe`, `attack-shark`, `fantech`, `rexus`, `steelseries`, dan `glorious`, ditulis seperti di situs resminya.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
it('has about twenty reference mice, including the example', () => {
  expect(references.length).toBeGreaterThanOrEqual(18);
  expect(references.some((r) => r.slug === compareExample?.currentSlug)).toBe(true);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @lantai-dua/catalog-data test`
Expected: FAIL (baru 1 referensi).

- [ ] **Step 3: Riset dan isi data, lalu seed**

Run: `pnpm db:seed-catalog`
Expected: `referencesCreated` sama dengan jumlah referensi baru, dan `productsCreated: 0`.

- [ ] **Step 4: Jalankan semua tes**

Run: `pnpm --filter @lantai-dua/catalog-data test && pnpm test:rls && pnpm e2e && pnpm typecheck && pnpm check`
Expected: PASS. Termasuk `has the real references seeded`, dan katalog tetap 16 produk.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "data: mouse referensi untuk Bandingkan"
```

---

## Cakupan desain

| Desain | Task |
|---|---|
| §5.1–5.2 susunan dan pemilih | 6 |
| §5.3 URL | 4, 6 |
| §5.4 isi awal dan cadangan | 4, 6, 8, 9 |
| §5.5 kotak ukuran dan M1 | 5, 7 |
| §5.6 kalimat dan tabel | 5, 6 |
| §5.7 status demo dan Coba keduanya | 4, 6 |
| §5.8 Gear gue | 2, 8 |
| §5.9 beranda | 9 |
| §5.10 404 referensi, judul | 4, 6 |
| §6.1 `compare_items` | 1 |
| §6.2 `user_gear` | 2 |
| §6.3 pasangan contoh | 1, 3 |
| §6.4 mouse referensi | 3, 10 |
| §6.5 kode bersama, `formatSpecValue` | 4, 5 |
| §8 kriteria selesai | 1–10 |
