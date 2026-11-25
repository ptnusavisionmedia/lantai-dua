# Fase 1A — Katalog dan Detail Produk: Rencana Implementasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bagian ini menghadirkan katalog, detail produk, dan dua bagian beranda (pintu rak dan "Bisa dicoba di showroom") yang berisi 16 produk asli. Status stok jual dan status unit demo dihitung database dan ditampilkan sesuai aturan desain.

**Architecture:** Database menyediakan dua view baca (`catalog_items`, `variant_availability`) yang sudah menghitung harga, stok, dan status demo. View ini menulis ulang aturan visibilitasnya sendiri, supaya tamu dan staf melihat hal yang sama. Filter, pencarian, urutan, label, dan format adalah fungsi TypeScript murni di `@lantai-dua/shared/catalog`, dipakai server dan browser, dan nanti juga aplikasi mobile. Data produk tinggal di paket `@lantai-dua/catalog-data` dan dimasukkan lewat fungsi seed yang tidak pernah menimpa kolom bisnis.

**Tech Stack:** Sama dengan Fase 0: Next.js 16.4.6, React 19.3.1, TypeScript 6.0.3, Tailwind 4.3.5, Supabase (Postgres, Storage), @supabase/supabase-js 2.119.2, @supabase/ssr 0.12.7, Vitest 5.1.1, Playwright 1.65.1, Biome 2.6.8. Tidak ada dependensi baru.

**Spec:** [`docs/superpowers/specs/2026-11-25-fase-1a-katalog-design.md`](../specs/2026-11-25-fase-1a-katalog-design.md). Dasarnya [`docs/PRD.md`](../../PRD.md) §9.1, §9.3, §9.4, §11, dan [`design-system/lantai-dua/MASTER.md`](../../../design-system/lantai-dua/MASTER.md).

## Global Constraints

- Semua Global Constraints Fase 0 tetap berlaku (lihat `docs/superpowers/plans/2026-11-22-fase-0-fondasi.md` dan README). Di antaranya:
  - Bahasa Indonesia di UI;
  - uang disimpan sebagai integer rupiah;
  - RLS di semua tabel;
  - secret key tidak pernah dipakai di web;
  - target sentuh ≥ 44 px;
  - tanpa scroll horizontal dari lebar 360 px;
  - mode kurangi gerakan dihormati;
  - satu commit per task dengan baris `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`;
  - `db push` selalu memakai `--remote`.
- **Status stok dan demo dihitung database.** Web dan aplikasi hanya menampilkan, menyaring, dan mengurutkan.
- **Foto resmi merek tidak boleh dipakai.** Selama `image_path` kosong, produk tampil sebagai ilustrasi garis.
- **Repo bersifat public.** Data produk tidak boleh berisi apa pun yang rahasia, dan kunci dari `.env.local` tidak boleh di-commit.
- **Teks status** persis seperti desain §5.5:
  - Kartu: `Stok tersedia` / `Sisa N` / `Stok habis`.
  - Detail: `Stok jual: tersedia` / `Stok jual: sisa N` / `Stok jual: habis`.
  - Demo: `Bisa dicoba langsung` / `Demo tersedia · {nama varian}` / `Unit demo sedang dipakai` / `Unit demo sedang diservis` / `Tidak ada unit demo`.
- **Format harga** `Rp1.249.000`, dan `mulai Rp…` kalau harga varian berbeda.
- **Nilai spek tidak boleh dikarang.** Nilai yang tidak ditemukan dan tidak diukur dibiarkan kosong.
- **Gerak:** hover kartu memperbesar gambar 1,02×, dan varian berganti dengan crossfade `dur-base`. Semuanya hilang di mode kurangi gerakan.

## Review Focus

1. **URL yang salah atau usang.** Contohnya `weight_g=abc`, `shape=Bulat`, key yang tidak dikenal, `urut=xyz`, `harga=9-1`, atau `?varian=` yang tidak ada. Halaman harus tetap tampil dengan nilai yang tidak sah diabaikan, bukan error atau kosong. Dites di Task 2 (unit), Task 5, dan Task 6 (e2e).
2. **Staf membuka katalog publik.** Hasilnya harus sama persis dengan tamu: produk nonaktif tidak muncul, dan unit yang pensiun, di area nonaktif, atau di varian nonaktif tidak dihitung. Dites di Task 1.
3. **Produk tanpa nilai untuk atribut yang difilter atau diurutkan,** misalnya mouse tanpa `weight_g`. Produk itu tidak ikut filter rentang dan ditaruh di akhir urutan "teringan", tanpa crash. Dites di Task 2.
4. **Seed dijalankan ulang setelah operator atau pemilik mengubah harga, stok, atau status unit.** Perubahan itu harus tetap ada, sementara deskripsi dan spek ikut diperbarui. Dites di Task 4.
5. **Tombol kembali di browser setelah beberapa kali mengubah filter.** Setiap langkah filter harus kembali tanpa memuat ulang yang terasa, dan tanpa state yang terlewat. Dites di Task 5.

---

## Struktur file

```
supabase/migrations/<ts>_catalog_views.sql      view catalog_items + variant_availability, bucket product-images
packages/shared/src/catalog/                     types.ts, rows.ts, query.ts, filter.ts, labels.ts, format.ts, demo.ts, index.ts (+ *.test.ts)
packages/catalog-data/                           package baru: src/types.ts, src/catalog.ts, src/seed.ts, src/catalog.test.ts,
                                                 PERLU-DIUKUR.md, FASE-4.md
scripts/seed-catalog.ts                          menjalankan seed ke project dev
packages/db-tests/src/catalog-views.test.ts      RLS view + Storage
packages/db-tests/src/seed-catalog.test.ts       semantik upsert + data asli tersedia
apps/web/src/lib/catalog-data.ts                 query Supabase → tipe shared
apps/web/src/components/catalog/                 product-illustration.tsx, product-image.tsx, product-card.tsx, status-line.tsx,
                                                 catalog-browser.tsx, filter-panel.tsx
apps/web/src/components/product/                 product-view.tsx (client), spec-table.tsx
apps/web/src/app/(public)/katalog/page.tsx, katalog/[kategori]/page.tsx, produk/[slug]/page.tsx, keranjang/page.tsx
apps/web/src/app/akun/wishlist/page.tsx, apps/web/src/app/not-found.tsx
apps/web/src/app/(public)/page.tsx               tambah RackDoors + DemoRow
apps/web/e2e/catalog.spec.ts, product.spec.ts, home.spec.ts, e2e/data.ts
```

**Beda dari desain:** data produk dipindah dari `supabase/data/` ke paket `packages/catalog-data`. Alasannya, data itu butuh unit test offline dan dipakai oleh skrip, tes RLS, dan e2e sekaligus. Isi dan aturannya tetap sama dengan desain §6.3.

---

### Task 1: View katalog dan bucket foto

**Files:**
- Create: `supabase/migrations/<ts>_catalog_views.sql` (lewat `pnpm exec supabase migration new catalog_views`)
- Test: `packages/db-tests/src/catalog-views.test.ts`
- Modify: `packages/shared/src/database.types.ts` (generate ulang dengan `pnpm db:types`)

**Interfaces:**
- Consumes: tabel katalog dan showroom dari Fase 0, `public.is_owner()`, serta helper `createCatalogFixture` / `clientFor` / `adminClient` / `anonClient` / `runId`.
- Produces (SQL), keduanya memakai `with (security_invoker = true)` dan `grant select` ke `anon, authenticated`:

**View `public.catalog_items`**

Satu baris per produk yang memenuhi `is_active and is_for_sale`, kategori `is_active`, dan punya minimal satu varian aktif. Kolom:

| Kolom | Isi |
|---|---|
| `id`, `slug`, `model_name` | dari produk |
| `brand_slug`, `brand_name` | dari merek |
| `category_slug`, `category_name`, `try_mode` | dari kategori |
| `group_slug`, `group_name`, `group_sort_order` | dari rak |
| `specs` | jsonb |
| `variant_attributes` | jsonb array berisi `attributes` dari varian aktif |
| `price_min`, `price_max` | int |
| `stock_total` | int, jumlah stok varian aktif |
| `demo_status` | text, lihat aturan di bawah |
| `demo_variant_name`, `demo_variant_sku` | text, null kalau status `free` atau `none` |
| `image_path` | foto `kind = 'main'` dengan `variant_id is null` dan `sort_order` terkecil, atau null |
| `created_at` | dari produk |

**View `public.variant_availability`**

Satu baris per varian aktif dari produk yang ada di `catalog_items`. Kolom:

| Kolom | Isi |
|---|---|
| `id`, `product_id`, `sku`, `name`, `attributes`, `price_idr`, `stock_qty`, `sort_order` | dari varian |
| `demo_status` | aturan yang sama, tapi hanya untuk unit varian ini. Kategori `free` → `'free'`. |
| `image_path` | foto `kind = 'main'` varian ini, atau null |

**Aturan status demo** (ditulis eksplisit di SQL, tidak mengandalkan RLS):
- Unit yang dihitung hanya yang memenuhi `status <> 'retired'`, area `is_active`, dan variannya `is_active`.
- Kategori `try_mode = 'free'` → `'free'`.
- Selain itu, unit diberi peringkat `available` = 1, `in_use` = 2, `servicing` = 3. Ambil peringkat terkecil, dengan `code` terkecil sebagai pemecah seri. Kalau tidak ada unit → `'none'`.

**Storage**
- Bucket `product-images`, `public = true`.
- Policy di `storage.objects` untuk `bucket_id = 'product-images'`:
  - select: semua orang;
  - insert, update, delete: `authenticated` dengan `public.is_owner()`.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
// catalog-views.test.ts — fixture dibuat via adminClient di beforeAll, dihapus di afterAll
// Fixture tambahan di atas createCatalogFixture(prefix):
//   - area `${prefix}desk` aktif dan `${prefix}desk-off` nonaktif
//   - pOn: vOn harga 1_000_000 stok 2, dan vB harga 1_200_000 stok 5 (nama "Gateron Brown (tactile)")
//   - unit di vOn: DM-Y-<n> in_use; DM-Y-<n+1> available di vB; DM-Y-<n+2> available di area nonaktif
//   - unit DM-Y-<n+3> available di vOff (varian nonaktif)
//   - pRef (is_for_sale=false) dan pOff (nonaktif) tidak boleh muncul
const item = async (c: SupabaseClient, id: string) =>
  (await c.from('catalog_items').select('*').eq('id', id).maybeSingle()).data;

it('lists only active for-sale products', async () => {
  const ids = (await anonClient().from('catalog_items').select('id').like('slug', `${prefix}%`)).data!.map((r) => r.id);
  expect(ids).toEqual([f.pOn]);
});
it('aggregates price, stock and the best demo unit', async () => {
  expect(await item(anonClient(), f.pOn)).toMatchObject({
    price_min: 1_000_000, price_max: 1_200_000, stock_total: 7,
    demo_status: 'available', demo_variant_name: 'Gateron Brown (tactile)', demo_variant_sku: `${prefix}v-b`,
  });
});
it('reports per-variant demo status', async () => {
  const rows = (await anonClient().from('variant_availability').select('sku, demo_status').eq('product_id', f.pOn)).data!;
  expect(Object.fromEntries(rows.map((r) => [r.sku, r.demo_status]))).toEqual({
    [`${prefix}v-on`]: 'in_use', [`${prefix}v-b`]: 'available',
  });
});
it('shows staff exactly what guests see', async () => {
  expect(await item(clientFor('operator'), f.pOn)).toEqual(await item(anonClient(), f.pOn));
  expect(await item(clientFor('owner'), f.pOff)).toBeNull();
});
it('falls back to none when the only units are retired', async () => { /* set semua unit pOn → retired via admin */ });
it('marks free categories as free', async () => { /* kategori fixture try_mode free → demo_status 'free', demo_variant_name null */ });

describe('product-images bucket', () => {
  const file = () => new Blob(['x'], { type: 'image/webp' });
  it.each(['customer', 'operator'] as const)('blocks %s from uploading', async (p) => {
    const { error } = await clientFor(p).storage.from('product-images').upload(`tes/${runId()}-${p}.webp`, file());
    expect(error).not.toBeNull();
  });
  it('blocks anon from uploading', async () => {
    expect((await anonClient().storage.from('product-images').upload(`tes/${runId()}-anon.webp`, file())).error).not.toBeNull();
  });
  it('lets the owner upload and anyone read it', async () => {
    const path = `tes/${runId()}-owner.webp`;
    expect((await clientFor('owner').storage.from('product-images').upload(path, file())).error).toBeNull();
    const url = anonClient().storage.from('product-images').getPublicUrl(path).data.publicUrl;
    expect((await fetch(url)).status).toBe(200);
    await adminClient().storage.from('product-images').remove([path]);
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm test:rls`
Expected: FAIL. Pesannya bahwa relation `catalog_items` tidak ditemukan, dan bucket tidak ada.

- [ ] **Step 3: Tulis migrasi `catalog_views` sesuai Interfaces, lalu kirim**

Run: `pnpm exec supabase db push --remote`

- [ ] **Step 4: Jalankan tes, lalu generate ulang tipe**

Run: `pnpm test:rls && pnpm db:types && pnpm typecheck`
Expected: PASS, dan `database.types.ts` sekarang memuat `catalog_items` serta `variant_availability` di bagian `Views`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: view katalog dan status demo, bucket foto produk"
```

---

### Task 2: Logika katalog bersama

**Files:**
- Create: `packages/shared/src/catalog/{types,rows,query,filter,labels,format,demo,index}.ts`, ditambah `*.test.ts` untuk `rows`, `query`, `filter`, `labels`, `format`, dan `demo`
- Modify: `packages/shared/package.json` (tambah export `"./catalog": "./src/catalog/index.ts"`)

**Interfaces:**
- Consumes: tipe `Database` (Task 1).
- Produces (`@lantai-dua/shared/catalog`):

```ts
export type TryMode = 'unit' | 'station' | 'free';
export type DemoStatus = 'free' | 'available' | 'in_use' | 'servicing' | 'none';
export type AttributeType = 'number' | 'enum' | 'multi_enum' | 'boolean' | 'text';
export type AttributeDef = { key: string; label: string; type: AttributeType; scope: 'product' | 'variant';
  unit: string | null; options: string[] | null; isFilterable: boolean; isComparable: boolean; sortOrder: number };
export type CatalogItem = { id: string; slug: string; modelName: string; brandSlug: string; brandName: string;
  categorySlug: string; categoryName: string; tryMode: TryMode; groupSlug: string; groupName: string; groupSortOrder: number;
  specs: Record<string, unknown>; variantAttributes: Record<string, unknown>[]; priceMin: number; priceMax: number;
  stockTotal: number; demoStatus: DemoStatus; demoVariantName: string | null; demoVariantSku: string | null;
  imagePath: string | null; createdAt: string };
export type VariantAvailability = { id: string; productId: string; sku: string; name: string;
  attributes: Record<string, unknown>; priceIdr: number; stockQty: number; sortOrder: number;
  demoStatus: DemoStatus; imagePath: string | null };
export type SortKey = 'terbaru' | 'termurah' | 'termahal' | 'teringan';
export type Range = { min?: number; max?: number };
export type CatalogQuery = { q: string; rak: string | null; merek: string[]; harga: Range | null; demo: boolean;
  stok: boolean; urut: SortKey; attrs: Record<string, string[] | Range | true> };
export type Facet =
  | { key: string; label: string; kind: 'checklist'; options: { value: string; count: number }[] }
  | { key: string; label: string; kind: 'range'; unit: string | null; bounds: { min: number; max: number } | null }
  | { key: string; label: string; kind: 'toggle' };
export type Tone = 'ok' | 'warn' | 'bad' | 'demo' | 'none';

export function fromCatalogRow(row: Database['public']['Views']['catalog_items']['Row']): CatalogItem;
export function fromVariantRow(row: Database['public']['Views']['variant_availability']['Row']): VariantAvailability;
export function fromAttributeRow(row: Database['public']['Tables']['category_attributes']['Row']): AttributeDef;
export function parseCatalogQuery(params: URLSearchParams, attrs: AttributeDef[]): CatalogQuery;
export function serializeCatalogQuery(q: CatalogQuery): string; // '' atau '?…'
export const EMPTY_QUERY: CatalogQuery;
export function filterCatalog(items: CatalogItem[], q: CatalogQuery, attrs: AttributeDef[]): CatalogItem[];
export function sortCatalog(items: CatalogItem[], urut: SortKey): CatalogItem[];
export function facetsFor(attrs: AttributeDef[], items: CatalogItem[]): Facet[];
export function brandFacet(items: CatalogItem[]): Extract<Facet, { kind: 'checklist' }>;
export function stockLabel(stock: number): { tone: Tone; card: string; detail: string };
export function demoLabel(status: DemoStatus, variantName: string | null): { tone: Tone; text: string };
export function priceLabel(min: number, max: number): string;
export function formatRupiah(n: number): string;
export function formatDimensions(specs: Record<string, unknown>): string | null; // "124 × 64 × 38 mm"
export function pickDemoForVariant(item: Pick<CatalogItem, 'demoStatus' | 'demoVariantName' | 'demoVariantSku'>,
  variants: VariantAvailability[], selectedSku: string): { status: DemoStatus; variantName: string | null; sku: string | null };
```

Aturan `serializeCatalogQuery`:
- Urutan key tetap: `q`, `rak`, `merek`, `harga`, `demo`, `stok`, `urut`, lalu key atribut diurutkan abjad.
- Nilai bawaan tidak ditulis: `urut=terbaru`, `demo`/`stok` false, dan string atau array kosong.
- Daftar ditulis dengan koma, rentang ditulis `min-max` (salah satu sisi boleh kosong), dan toggle ditulis `1`.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
const attrs: AttributeDef[] = [
  { key: 'weight_g', label: 'Bobot', type: 'number', scope: 'product', unit: 'g', options: null, isFilterable: true, isComparable: true, sortOrder: 1 },
  { key: 'shape', label: 'Bentuk', type: 'enum', scope: 'product', unit: null, options: ['Simetris', 'Ergonomis kanan'], isFilterable: true, isComparable: true, sortOrder: 2 },
  { key: 'connectivity', label: 'Koneksi', type: 'multi_enum', scope: 'product', unit: null, options: ['Kabel', 'Bluetooth'], isFilterable: true, isComparable: true, sortOrder: 3 },
  { key: 'hot_swap', label: 'Hot-swap', type: 'boolean', scope: 'product', unit: null, options: null, isFilterable: true, isComparable: true, sortOrder: 4 },
  { key: 'switch_type', label: 'Jenis switch', type: 'enum', scope: 'variant', unit: null, options: ['Linear', 'Tactile'], isFilterable: true, isComparable: true, sortOrder: 5 },
];
// item(overrides) membuat CatalogItem lengkap dengan nilai bawaan yang masuk akal

// query.test.ts
it('parses every filter kind', () => {
  const q = parseCatalogQuery(new URLSearchParams('q=ignix&merek=a,b&harga=500000-&demo=1&stok=1&urut=teringan&weight_g=50-70&shape=Simetris&connectivity=Kabel,Bluetooth&hot_swap=1'), attrs);
  expect(q).toEqual({ q: 'ignix', rak: null, merek: ['a', 'b'], harga: { min: 500000 }, demo: true, stok: true, urut: 'teringan',
    attrs: { weight_g: { min: 50, max: 70 }, shape: ['Simetris'], connectivity: ['Kabel', 'Bluetooth'], hot_swap: true } });
});
it.each([
  'weight_g=abc', 'shape=Bulat', 'foo=1', 'urut=xyz', 'harga=9-1', 'hot_swap=yes', 'weight_g=-', 'merek=',
])('ignores invalid %s', (raw) => {
  expect(parseCatalogQuery(new URLSearchParams(raw), attrs)).toEqual(EMPTY_QUERY);
});
it('round-trips through the URL in a stable order', () => {
  const s = '?q=ignix&merek=a,b&demo=1&urut=termurah&shape=Simetris&weight_g=50-70';
  expect(serializeCatalogQuery(parseCatalogQuery(new URLSearchParams(s), attrs))).toBe(s);
  expect(serializeCatalogQuery(EMPTY_QUERY)).toBe('');
});

// filter.test.ts
it('ANDs across filters and ORs within one', () => { /* shape Simetris|Ergonomis + connectivity Bluetooth */ });
it('excludes items without a value from a range filter', () => {
  const q = { ...EMPTY_QUERY, attrs: { weight_g: { min: 50 } } };
  expect(filterCatalog([item({ specs: {} }), item({ id: 'b', specs: { weight_g: 58 } })], q, attrs).map((i) => i.id)).toEqual(['b']);
});
it('matches variant-scope attributes on any variant', () => {
  const kb = item({ variantAttributes: [{ switch_type: 'Linear' }, { switch_type: 'Tactile' }] });
  expect(filterCatalog([kb], { ...EMPTY_QUERY, attrs: { switch_type: ['Tactile'] } }, attrs)).toHaveLength(1);
});
it('treats demo=1 as available or free', () => { /* available ✓, free ✓, in_use ✗, none ✗ */ });
it('searches brand and model case-insensitively', () => { /* "IGNIX" cocok "Ignix F1" */ });
it('filters price by the cheapest variant', () => { /* priceMin 900k ✓ untuk harga=-1000000 */ });
it('sorts lightest first and puts unknown weight last', () => {
  const r = sortCatalog([item({ id: 'x', specs: {} }), item({ id: 'h', specs: { weight_g: 80 } }), item({ id: 'l', specs: { weight_g: 55 } })], 'teringan');
  expect(r.map((i) => i.id)).toEqual(['l', 'h', 'x']);
});
it('sorts by price and by newest', () => { /* termurah pakai priceMin, termahal pakai priceMax, terbaru createdAt desc */ });
it('builds facets from filterable attributes only', () => {
  expect(facetsFor(attrs, [item({ specs: { weight_g: 58 } }), item({ specs: { weight_g: 80 } })]).map((f) => [f.key, f.kind]))
    .toEqual([['weight_g', 'range'], ['shape', 'checklist'], ['connectivity', 'checklist'], ['hot_swap', 'toggle'], ['switch_type', 'checklist']]);
});

// labels.test.ts / format.test.ts
it.each([[0, 'bad', 'Stok habis', 'Stok jual: habis'], [2, 'warn', 'Sisa 2', 'Stok jual: sisa 2'], [3, 'warn', 'Sisa 3', 'Stok jual: sisa 3'], [4, 'ok', 'Stok tersedia', 'Stok jual: tersedia']])(
  'stock %i', (n, tone, card, detail) => expect(stockLabel(n)).toEqual({ tone, card, detail }));
it.each([
  ['free', null, 'demo', 'Bisa dicoba langsung'],
  ['available', 'Gateron Brown (tactile)', 'demo', 'Demo tersedia · Gateron Brown (tactile)'],
  ['in_use', 'Putih', 'warn', 'Unit demo sedang dipakai'],
  ['servicing', null, 'none', 'Unit demo sedang diservis'],
  ['none', null, 'none', 'Tidak ada unit demo'],
] as const)('demo %s', (s, name, tone, text) => expect(demoLabel(s, name)).toEqual({ tone, text }));
it('formats rupiah and price ranges', () => {
  expect(formatRupiah(1249000)).toBe('Rp1.249.000');
  expect(priceLabel(1249000, 1249000)).toBe('Rp1.249.000');
  expect(priceLabel(1149000, 1199000)).toBe('mulai Rp1.149.000');
});
it('formats mouse dimensions only when all three exist', () => {
  expect(formatDimensions({ length_mm: 124, width_mm: 64, height_mm: 38 })).toBe('124 × 64 × 38 mm');
  expect(formatDimensions({ length_mm: 124 })).toBeNull();
});

// demo.test.ts
it('prefers the selected variant when its unit is available', () => { /* hasil = varian terpilih, sku-nya */ });
it('falls back to the product best when the selected variant has no available unit', () => { /* hasil = demoVariantName/Sku produk */ });

// rows.test.ts
it('maps a catalog_items row to CatalogItem', () => { /* snake_case → camelCase, jsonb dipakai apa adanya */ });
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @lantai-dua/shared test`
Expected: FAIL, karena modul `catalog/*` belum ada.

- [ ] **Step 3: Implementasikan modul sesuai Interfaces dan aturan serialisasi**

- `formatRupiah` memakai `Intl.NumberFormat('id-ID')` dengan awalan `Rp` tanpa spasi.
- Pencarian memakai `toLocaleLowerCase('id')` pada `${brandName} ${modelName}`.

- [ ] **Step 4: Jalankan semua tes**

Run: `pnpm --filter @lantai-dua/shared test && pnpm typecheck && pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: logika katalog bersama (query, filter, urutan, label)"
```

---

### Task 3: Data produk asli

**Files:**
- Create: `packages/catalog-data/package.json` (nama `@lantai-dua/catalog-data`, `exports` `"."` → `./src/index.ts`, script `test` dan `typecheck`), `packages/catalog-data/tsconfig.json`
- Create: `packages/catalog-data/src/types.ts`, `src/catalog.ts`, `src/index.ts`, `src/catalog.test.ts`
- Create: `packages/catalog-data/PERLU-DIUKUR.md`, `packages/catalog-data/FASE-4.md`

**Interfaces:**
- Produces:

```ts
export type SpecSource = 'resmi' | 'ukur';
export type SeedVariant = { sku: string; name: string; attributes: Record<string, unknown>; priceIdr: number; stockQty: number; sortOrder: number };
export type SeedDemoUnit = { code: string; variantSku: string; status: 'available' | 'in_use' | 'servicing' };
export type SeedProduct = { slug: string; brandSlug: string; categorySlug: string; modelName: string; description: string;
  specs: Record<string, unknown>; specSources: Record<string, SpecSource>; specSourceUrl: string | null;
  eloshapesUrl: string | null; ownerGear: boolean; variants: SeedVariant[]; demoUnits: SeedDemoUnit[] };
export type SeedBrand = { slug: string; name: string };
export type CatalogSeed = { brands: SeedBrand[]; products: SeedProduct[] };
export const catalogSeed: CatalogSeed;
```

**Isi data**
- **16 produk** sesuai desain §6.3, dengan slug `<merek>-<model>` huruf kecil berstrip, misalnya `vortexseries-ignix-f1`.
- **Spek** hanya memakai key dari template seed (Fase 0 Task 7). Setiap key spek dan atribut varian punya entri di `specSources`.
- **Varian** mengikuti varian yang benar-benar dijual. Nama varian keyboard ditulis `"<switch_name> (<switch_type huruf kecil>)"`.
- **SKU:** `L2-<MEREK3>-<MODEL>-<VAR>` dengan huruf besar, angka, dan strip.
- **Kode unit:** `DM-<huruf kategori>-<3 angka>`, dengan huruf kategori M (mouse), K (keyboard), dan H (headset).
- **Harga** adalah harga contoh pasar Indonesia, kelipatan 1.000.
- **Pad dan deskmat** tidak punya `demoUnits`.
- **`PERLU-DIUKUR.md`** mencantumkan setiap nilai spek gear pemilik yang tidak ditemukan di situs resmi, dalam bentuk tabel `produk | key | satuan | cara ukur`.
- **`FASE-4.md`** mencatat gear Fase 4: Simgot EW300 HBB, Kinera Celest CD2, Fifine K688, dan Xiaomi G24i 2026.

- [ ] **Step 1: Tulis tes yang gagal (offline)**

```ts
const { products } = catalogSeed;
const all = (pred: (p: SeedProduct) => boolean) => products.some(pred);
const units = products.flatMap((p) => p.demoUnits);
const stock = (p: SeedProduct) => p.variants.reduce((s, v) => s + v.stockQty, 0);

it('has the 16 approved products', () => expect(products).toHaveLength(16));
it('fills every launch category with at least two products', () => {
  for (const c of ['mouse', 'keyboard', 'headset', 'mousepad', 'glasspad', 'deskmat'])
    expect(products.filter((p) => p.categorySlug === c).length).toBeGreaterThanOrEqual(2);
});
it('marks the eight owner gear items', () => expect(products.filter((p) => p.ownerGear)).toHaveLength(8));
it('cites a source for every spec and variant attribute', () => {
  for (const p of products) {
    const keys = [...Object.keys(p.specs), ...p.variants.flatMap((v) => Object.keys(v.attributes))];
    for (const k of keys) expect(p.specSources[k], `${p.slug}.${k}`).toMatch(/^(resmi|ukur)$/);
    if (Object.values(p.specSources).includes('resmi')) expect(p.specSourceUrl, p.slug).toMatch(/^https:\/\//);
  }
});
it('uses unique, well-formed SKUs and unit codes', () => { /* /^L2-[A-Z0-9-]+$/, /^DM-[MKH]-\d{3}$/, tidak ada duplikat, variantSku unit ada di produknya */ });
it('names keyboard variants "<switch> (<type>)"', () => {
  for (const v of products.filter((p) => p.categorySlug === 'keyboard').flatMap((p) => p.variants))
    expect(v.name).toBe(`${v.attributes.switch_name} (${String(v.attributes.switch_type).toLowerCase()})`);
});
it('keeps pads and deskmats without demo units', () => { /* kategori mousepad/glasspad/deskmat → demoUnits kosong */ });
it('covers every status combination', () => {
  expect(all((p) => stock(p) > 3)).toBe(true);
  expect(all((p) => stock(p) >= 1 && stock(p) <= 3)).toBe(true);
  expect(all((p) => stock(p) === 0)).toBe(true);
  for (const s of ['available', 'in_use', 'servicing'] as const) expect(units.some((u) => u.status === s)).toBe(true);
  expect(all((p) => ['mouse', 'keyboard', 'headset'].includes(p.categorySlug) && p.demoUnits.length === 0)).toBe(true);
  expect(all((p) => stock(p) === 0 && p.demoUnits.some((u) => u.status === 'available'))).toBe(true); // D5
  expect(all((p) => p.categorySlug === 'keyboard' && p.demoUnits.some((u) => u.variantSku !== p.variants[0]?.sku))).toBe(true); // D4
});
it('uses whole-thousand sample prices', () => { /* semua priceIdr > 0 dan % 1000 === 0 */ });
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm install && pnpm --filter @lantai-dua/catalog-data test`
Expected: FAIL (`catalogSeed` masih berisi `products: []`).

- [ ] **Step 3: Riset spek dan isi `catalog.ts`**

Untuk setiap produk, cari halaman produk resmi pabrikan (atau toko resmi merek kalau situs pabrikan tidak ada). Catat URL-nya di `specSourceUrl`, lalu salin hanya nilai yang tertulis di sana.
- Nilai yang tidak ditemukan **tidak diisi**.
- Untuk gear pemilik, nilai yang hilang dicatat di `PERLU-DIUKUR.md`.
- Setelah pemilik mengirim hasil ukur, nilainya diisi dengan sumber `'ukur'`.

Atur stok dan unit demo sampai tes cakupan lulus.

- [ ] **Step 4: Jalankan tes**

Run: `pnpm --filter @lantai-dua/catalog-data test && pnpm typecheck && pnpm check`
Expected: PASS.

- [ ] **Step 5: Kirim `PERLU-DIUKUR.md` ke pemilik produk, lalu commit**

```bash
git add -A && git commit -m "feat: data 16 produk asli dengan sumber spek"
```

---

### Task 4: Seed katalog yang aman diulang

**Files:**
- Create: `packages/catalog-data/src/seed.ts`, `scripts/seed-catalog.ts`
- Modify: root `package.json` (script `"db:seed-catalog": "node scripts/seed-catalog.ts"`), `packages/catalog-data/package.json` (dependensi `@supabase/supabase-js@2.119.2`)
- Test: `packages/db-tests/src/seed-catalog.test.ts` (tambah dependensi workspace `@lantai-dua/catalog-data` di `packages/db-tests/package.json`)

**Interfaces:**
- Consumes: `CatalogSeed` (Task 3), view `catalog_items` (Task 1).
- Produces:

```ts
export type SeedReport = { brands: number; productsCreated: number; productsUpdated: number;
  variantsCreated: number; variantsUpdated: number; unitsCreated: number; unitsKept: number };
export async function seedCatalog(admin: SupabaseClient, data: CatalogSeed, options?: { forceBusiness?: boolean }): Promise<SeedReport>;
```

**Aturan `seedCatalog`**
- Kategori dicari berdasarkan slug, dan area unit demo diambil dari slug `meja-kontrol`.
- **Merek:** upsert berdasarkan slug, dengan kolom `name`.
- **Produk:** cari berdasarkan slug.
  - Kalau sudah ada, perbarui hanya `brand_id`, `category_id`, `model_name`, `description`, `specs`, `spec_source_url`, dan `eloshapes_url`.
  - Kalau baru, insert lengkap dengan `is_active = true` dan `is_for_sale = true`.
- **Varian:** cari berdasarkan SKU.
  - Kalau sudah ada, perbarui hanya `name`, `attributes`, dan `sort_order`.
  - Kalau baru, insert lengkap dengan `price_idr` dan `stock_qty`.
- **Unit demo:** cari berdasarkan `code`.
  - Kalau sudah ada, tidak disentuh.
  - Kalau baru, insert dengan `status`, `variant_id`, dan `area_id`.
- Dengan `forceBusiness: true`, `price_idr`, `stock_qty`, status unit, dan `is_active` juga ditimpa. Ini hanya untuk development.
- Semua insert multi-baris memakai `{ defaultToNull: false }`.

**Skrip `scripts/seed-catalog.ts`**
- Panggil `process.loadEnvFile('.env.local')`.
- Cetak `Target: <SUPABASE_PROJECT_REF>`.
- Jalankan `seedCatalog` dengan `forceBusiness` aktif kalau argumen `--paksa-bisnis` dipakai.
- Cetak `SeedReport`.
- Import data lewat path relatif `../packages/catalog-data/src/index.ts`.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
// Fixture: CatalogSeed kecil — 1 merek, 1 produk mouse, 2 varian, 1 unit demo — semua slug/sku diawali `rls-${runId()}-sc-`
it('creates everything on the first run', async () => {
  const r = await seedCatalog(adminClient(), fixture());
  expect(r).toMatchObject({ productsCreated: 1, variantsCreated: 2, unitsCreated: 1 });
  expect((await anonClient().from('catalog_items').select('stock_total').eq('slug', slug)).data).toEqual([{ stock_total: 7 }]);
});
it('keeps business fields when re-run', async () => {
  await adminClient().from('product_variants').update({ price_idr: 999_000, stock_qty: 0 }).eq('sku', sku1);
  await adminClient().from('demo_units').update({ status: 'servicing' }).eq('code', code);
  const changed = fixture({ description: 'baru', price: 1_500_000, stock: 9, unitStatus: 'available' });
  const r = await seedCatalog(adminClient(), changed);
  expect(r).toMatchObject({ productsUpdated: 1, unitsKept: 1 });
  const v = (await adminClient().from('product_variants').select('price_idr, stock_qty').eq('sku', sku1).single()).data;
  expect(v).toEqual({ price_idr: 999_000, stock_qty: 0 });
  expect((await adminClient().from('demo_units').select('status').eq('code', code).single()).data).toEqual({ status: 'servicing' });
  expect((await adminClient().from('products').select('description').eq('slug', slug).single()).data).toEqual({ description: 'baru' });
});
it('overwrites business fields only when forced', async () => { /* forceBusiness → price 1_500_000, status available */ });
it('has the real catalog seeded', async () => {
  const slugs = catalogSeed.products.map((p) => p.slug);
  const { data } = await anonClient().from('catalog_items').select('slug').in('slug', slugs);
  expect(data).toHaveLength(16);
});
```

afterAll menghapus produk, varian, unit, dan merek fixture. Unit dihapus duluan, karena FK-nya `restrict`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm install && pnpm test:rls`
Expected: FAIL (`seedCatalog` belum ada).

- [ ] **Step 3: Implementasikan `seedCatalog` dan skrip, lalu jalankan seed asli**

Run: `pnpm db:seed-catalog`, lalu jalankan sekali lagi.
Expected: run kedua melaporkan `productsCreated: 0` dan `unitsCreated: 0`.

- [ ] **Step 4: Jalankan tes**

Run: `pnpm test:rls && pnpm typecheck && pnpm check`
Expected: PASS, termasuk `has the real catalog seeded`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: seed katalog yang tidak menimpa harga, stok, dan status"
```

---

### Task 5: Halaman katalog dengan filter

**Files:**
- Create: `apps/web/src/lib/catalog-data.ts`
- Create: `apps/web/src/components/catalog/{product-illustration,product-image,status-line,product-card,filter-panel,catalog-browser}.tsx`
- Create: `apps/web/src/app/(public)/katalog/[kategori]/page.tsx`, `apps/web/src/app/not-found.tsx`
- Modify: `apps/web/src/app/(public)/katalog/page.tsx`
- Test: `apps/web/e2e/data.ts`, `apps/web/e2e/catalog.spec.ts`

**Interfaces:**
- Consumes: `@lantai-dua/shared/catalog` (Task 2), view dan data asli (Task 1, Task 4).
- Produces:

```ts
// lib/catalog-data.ts (server)
export async function listCatalogItems(opts?: { category?: string }): Promise<CatalogItem[]>;
export async function listCategories(): Promise<{ slug: string; name: string; groupSlug: string; groupName: string; sortOrder: number }[]>;
export async function getCategory(slug: string): Promise<{ slug: string; name: string; tryMode: TryMode; hygieneNote: string | null; attributes: AttributeDef[] } | null>;
export function productImageUrl(path: string | null): string | null; // `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
// components
export function ProductIllustration(props: { category: string; className?: string }): JSX.Element; // mouse, keyboard, headset, mousepad, glasspad, deskmat, lainnya
export function ProductImage(props: { path: string | null; category: string; alt: string }): JSX.Element;
export function StatusLine(props: { tone: Tone; text: string }): JSX.Element; // ikon + teks, warna sesuai tone
export function ProductCard(props: { item: CatalogItem }): JSX.Element; // <a data-testid="product-card" href="/produk/<slug>">
export function CatalogBrowser(props: { items: CatalogItem[]; attributes: AttributeDef[]; basePath: string;
  categoryChips?: { slug: string; name: string }[] }): JSX.Element; // 'use client'
```

Perilaku `CatalogBrowser`:
- State query diturunkan dari `useSearchParams()` + `parseCatalogQuery`.
- Setiap perubahan memanggil `router.push(basePath + serializeCatalogQuery(q), { scroll: false })` di dalam `startTransition`. Dipakai `push`, bukan `replace`, supaya setiap langkah filter masuk riwayat browser (Review Focus 5).
- Hasil = `sortCatalog(filterCatalog(items, q, attributes), q.urut)`.
- Jumlah hasil ditulis "N produk" dalam `aria-live="polite"`.
- Chip filter aktif punya tombol hapus berlabel "Hapus filter <label>".
- Hasil kosong menampilkan "Belum ada produk yang cocok" dan tombol **Hapus semua filter**.
- Di bawah 1024 px, filter dibuka lewat tombol **Filter (n)** sebagai sheet `role="dialog"` berlabel "Filter", dengan tombol **Lihat N produk** untuk menutup.
- `?rak=` hanya berlaku di `/katalog` dan menyaring `groupSlug`.

`/katalog/[kategori]` memanggil `notFound()` kalau `getCategory` mengembalikan null. `not-found.tsx` berjudul "Halaman tidak ditemukan" dan punya tautan "Ke katalog".

- [ ] **Step 1: Tulis tes e2e yang gagal**

```ts
// e2e/data.ts — mengambil ekspektasi langsung dari data asli
import { catalogSeed } from '../../../packages/catalog-data/src/index.ts';
export const byCategory = (c: string) => catalogSeed.products.filter((p) => p.categorySlug === c);

// catalog.spec.ts
const cards = (page: Page) => page.getByTestId('product-card');
test('lists every product on /katalog', async ({ page }) => {
  await page.goto('/katalog');
  await expect(cards(page)).toHaveCount(16);
  await expect(page.getByText('16 produk')).toBeVisible();
});
test('category page shows only that category', async ({ page }) => {
  await page.goto('/katalog/mouse');
  await expect(cards(page)).toHaveCount(byCategory('mouse').length);
});
test('unknown category is a 404', async ({ page }) => {
  const res = await page.goto('/katalog/sepatu');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible();
});
test('brand filter updates results and URL, back restores', async ({ page }) => {
  await page.goto('/katalog/mouse');
  await page.getByRole('checkbox', { name: /VortexSeries/ }).check();
  await expect(page).toHaveURL(/merek=vortexseries/);
  await expect(cards(page)).toHaveCount(byCategory('mouse').filter((p) => p.brandSlug === 'vortexseries').length);
  await page.goBack();
  await expect(page).toHaveURL('/katalog/mouse');
  await expect(cards(page)).toHaveCount(byCategory('mouse').length);
});
test('variant-scope switch filter on keyboards', async ({ page }) => {
  const expected = byCategory('keyboard').filter((p) => p.variants.some((v) => v.attributes.switch_type === 'Tactile')).length;
  await page.goto('/katalog/keyboard?switch_type=Tactile');
  await expect(cards(page)).toHaveCount(expected);
});
test('empty result offers a way out', async ({ page }) => {
  await page.goto('/katalog?q=zzzzzz');
  await expect(page.getByText('Belum ada produk yang cocok')).toBeVisible();
  await page.getByRole('button', { name: 'Hapus semua filter' }).click();
  await expect(cards(page)).toHaveCount(16);
});
test('garbage parameters are ignored', async ({ page }) => {
  const res = await page.goto('/katalog/mouse?weight_g=abc&shape=Bulat&urut=xyz&foo=1');
  expect(res?.status()).toBe(200);
  await expect(cards(page)).toHaveCount(byCategory('mouse').length);
});
test('mobile filter sheet and no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/katalog/mouse');
  await page.getByRole('button', { name: /^Filter/ }).click();
  await expect(page.getByRole('dialog', { name: 'Filter' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});
test('cards show stock and demo status in words', async ({ page }) => {
  await page.goto('/katalog');
  await expect(page.getByText('Stok habis').first()).toBeVisible();
  await expect(page.getByText(/^Demo tersedia · /).first()).toBeVisible();
  await expect(page.getByText('Bisa dicoba langsung').first()).toBeVisible();
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm e2e`
Expected: test baru FAIL (halaman katalog masih "segera hadir"), test lama tetap PASS.

- [ ] **Step 3: Implementasikan data layer, komponen, dan halaman sesuai Interfaces**

Ilustrasi garis mengikuti gaya `design-system/lantai-dua/preview.html`. Kartu memakai token yang sudah ada, tanpa warna baru.

- [ ] **Step 4: Jalankan tes**

Run: `pnpm e2e && pnpm typecheck && pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: halaman katalog dengan filter, pencarian, dan urutan"
```

---

### Task 6: Halaman detail produk

**Files:**
- Modify: `apps/web/src/lib/catalog-data.ts` (tambah `getProductPage`, `getFreeAreaName`)
- Create: `apps/web/src/components/product/product-view.tsx` (client), `apps/web/src/components/product/spec-table.tsx`
- Create: `apps/web/src/app/(public)/produk/[slug]/page.tsx`, `apps/web/src/app/(public)/keranjang/page.tsx`, `apps/web/src/app/akun/wishlist/page.tsx`
- Test: `apps/web/e2e/product.spec.ts`

**Interfaces:**
- Consumes: Task 2 (`pickDemoForVariant`, `stockLabel`, `demoLabel`, `priceLabel`, `formatDimensions`) dan Task 5 (`ProductImage`, `StatusLine`, `getCategory`).
- Produces:

```ts
export async function getProductPage(slug: string): Promise<{ item: CatalogItem; description: string;
  eloshapesUrl: string | null; attributes: AttributeDef[]; variants: VariantAvailability[];
  hygieneNote: string | null; freeAreaName: string | null } | null>;
export async function getFreeAreaName(): Promise<string | null>; // demo_areas aktif kind='free', sort_order terkecil
export function ProductView(props: NonNullable<Awaited<ReturnType<typeof getProductPage>>>): JSX.Element;
export function SpecTable(props: { attributes: AttributeDef[]; specs: Record<string, unknown>; variantAttributes: Record<string, unknown> }): JSX.Element;
```

Perilaku `ProductView`:
- Varian terpilih diambil dari `?varian=`. Kalau tidak dikenal, dipakai varian dengan `sortOrder` terkecil.
- Pemilih varian berbentuk `role="radiogroup"` berlabel "Varian". Mengganti varian memanggil `router.replace(?varian=sku, { scroll: false })`, lalu harga, stok, foto, dan baris demo crossfade `dur-base`.
- Baris stok memakai `stockLabel(variant.stockQty).detail`.
- Baris demo memakai `demoLabel` dari `pickDemoForVariant`.
- Tombol:

| Tombol | Bentuk | Aturan |
|---|---|---|
| **Tambah ke keranjang** | tombol utama | nonaktif kalau stok varian 0, kalau aktif menuju `/keranjang?tambah=<sku>` |
| **Coba di showroom** | tombol demo | muncul kalau status bukan `none`/`free`, menuju `/reservasi/baru?varian=<sku demo>` |
| **Bandingkan** | tombol sekunder | khusus kategori mouse, menuju `/bandingkan?incaran=<slug>` |
| **Simpan ke wishlist** | tombol teks | menuju `/akun/wishlist` |

- Kalimat cara coba:
  - kategori `free`: `Bisa dicoba langsung di {freeAreaName ?? 'showroom'}, tanpa reservasi.`;
  - kategori `unit` dengan `hygieneNote`: catatan itu ditampilkan.
- `SpecTable` menampilkan semua atribut template yang punya nilai, dengan label dan satuan. Atribut varian diambil dari varian terpilih. Mouse menampilkan baris "Dimensi" dari `formatDimensions`.
- Tautan EloShapes muncul kalau `eloshapesUrl` terisi.
- Halaman `keranjang` dan `akun/wishlist` memakai `ComingSoon`. Halaman wishlist otomatis butuh login karena berada di `/akun`.

- [ ] **Step 1: Tulis tes e2e yang gagal**

```ts
const d5 = catalogSeed.products.find((p) => p.variants.every((v) => v.stockQty === 0) && p.demoUnits.some((u) => u.status === 'available'))!;
const multi = catalogSeed.products.find((p) => p.variants.length > 1 && new Set(p.variants.map((v) => v.priceIdr)).size > 1)!;
const freeOne = catalogSeed.products.find((p) => ['mousepad', 'glasspad', 'deskmat'].includes(p.categorySlug))!;
const mouse = catalogSeed.products.find((p) => p.categorySlug === 'mouse' && ['length_mm', 'width_mm', 'height_mm'].every((k) => k in p.specs))!;

test('shows name, price and both statuses', async ({ page }) => {
  await page.goto(`/produk/${multi.slug}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(multi.modelName);
  await expect(page.getByText(/^Stok jual: /)).toBeVisible();
});
test('switching variant updates URL and price', async ({ page }) => {
  await page.goto(`/produk/${multi.slug}`);
  const second = [...multi.variants].sort((a, b) => a.sortOrder - b.sortOrder)[1]!;
  await page.getByRole('radio', { name: second.name }).click();
  await expect(page).toHaveURL(new RegExp(`varian=${second.sku}`));
  await expect(page.getByText(formatRupiah(second.priceIdr)).first()).toBeVisible();
});
test('unknown variant falls back to the first', async ({ page }) => {
  const res = await page.goto(`/produk/${multi.slug}?varian=TIDAK-ADA`);
  expect(res?.status()).toBe(200);
  await expect(page.getByRole('radio', { checked: true })).toHaveAccessibleName([...multi.variants].sort((a, b) => a.sortOrder - b.sortOrder)[0]!.name);
});
test('out of stock with an available demo still offers a trial', async ({ page }) => {
  await page.goto(`/produk/${d5.slug}`);
  await expect(page.getByText('Stok jual: habis')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tambah ke keranjang' })).toBeDisabled();
  const demoSku = d5.demoUnits.find((u) => u.status === 'available')!.variantSku;
  await expect(page.getByRole('link', { name: /Coba di showroom/ })).toHaveAttribute('href', `/reservasi/baru?varian=${demoSku}`);
});
test('free-to-try products name the area', async ({ page }) => {
  await page.goto(`/produk/${freeOne.slug}`);
  await expect(page.getByText('Bisa dicoba langsung di Meja Permukaan, tanpa reservasi.')).toBeVisible();
  await expect(page.getByRole('link', { name: /Coba di showroom/ })).toHaveCount(0);
});
test('mouse spec table shows dimensions', async ({ page }) => {
  await page.goto(`/produk/${mouse.slug}`);
  await expect(page.getByText(`${mouse.specs.length_mm} × ${mouse.specs.width_mm} × ${mouse.specs.height_mm} mm`)).toBeVisible();
});
test('reference, inactive and unknown products are 404', async ({ page }) => {
  expect((await page.goto('/produk/tidak-ada'))?.status()).toBe(404);
});
test('no horizontal scroll on a product page at 360px', async ({ page }) => { /* sama seperti katalog */ });
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm e2e`
Expected: test detail FAIL (rute belum ada).

- [ ] **Step 3: Implementasikan sesuai Interfaces**

- [ ] **Step 4: Jalankan tes**

Run: `pnpm e2e && pnpm typecheck && pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: halaman detail produk dengan varian, status, dan spek"
```

---

### Task 7: Bagian beranda (pintu rak dan "Bisa dicoba")

**Files:**
- Create: `apps/web/src/components/home/{rack-doors,demo-row}.tsx`
- Modify: `apps/web/src/app/(public)/page.tsx`
- Test: `apps/web/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `listCatalogItems`, `ProductCard`.
- Produces:

```ts
export function RackDoors(props: { items: CatalogItem[] }): JSX.Element;
export function DemoRow(props: { items: CatalogItem[] }): JSX.Element;
```

**RackDoors**
- Mengelompokkan item per `groupSlug` dan diurutkan berdasarkan `groupSortOrder`.
- Rak tanpa produk tidak ditampilkan.
- Setiap pintu berupa tautan ke `/katalog?rak=<slug>`, berisi nama rak, daftar kategori (dipisah " · "), dan "N produk".

**DemoRow**
- Judul "Bisa dicoba di showroom".
- Maksimal 8 item berstatus `available`, diurutkan dari `createdAt` terbaru.
- Tautan "Semua yang bisa dicoba" ke `/katalog?demo=1`.
- Kalau tidak ada item, bagian ini tidak dirender.

- [ ] **Step 1: Tulis tes e2e yang gagal**

```ts
test('rack doors link to each rack', async ({ page }) => {
  await page.goto('/');
  for (const [name, slug] of [['Kontrol', 'kontrol'], ['Permukaan', 'permukaan'], ['Audio', 'audio']] as const)
    await expect(page.getByRole('link', { name: new RegExp(`^${name}`) })).toHaveAttribute('href', `/katalog?rak=${slug}`);
});
test('demo row shows only products with an available demo unit', async ({ page }) => {
  await page.goto('/');
  const row = page.getByRole('region', { name: 'Bisa dicoba di showroom' });
  const expected = Math.min(8, catalogSeed.products.filter((p) => p.demoUnits.some((u) => u.status === 'available')).length);
  await expect(row.getByTestId('product-card')).toHaveCount(expected);
  await expect(row.getByText('Bisa dicoba langsung')).toHaveCount(0);
});
test('rack filter on /katalog', async ({ page }) => {
  await page.goto('/katalog?rak=permukaan');
  await expect(page.getByTestId('product-card')).toHaveCount(
    catalogSeed.products.filter((p) => ['mousepad', 'glasspad', 'deskmat'].includes(p.categorySlug)).length);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm e2e` → Expected: tes beranda FAIL.

- [ ] **Step 3: Implementasikan.** Bagian beranda dibungkus `<section aria-labelledby>` supaya bisa ditemukan lewat `getByRole('region')`.

- [ ] **Step 4: Jalankan semua pemeriksaan**

Run: `pnpm check && pnpm typecheck && pnpm test && pnpm test:rls && pnpm e2e`
Expected: semua PASS.

- [ ] **Step 5: Perbarui README dan commit**

Di README, tambahkan `pnpm db:seed-catalog` ke bagian setup dan perintah harian. Jelaskan juga `--paksa-bisnis` (khusus development) dan file `PERLU-DIUKUR.md`.

```bash
git add -A && git commit -m "feat: beranda menampilkan rak dan produk yang bisa dicoba"
```
