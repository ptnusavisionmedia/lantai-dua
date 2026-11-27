# Fase 1C-1 — Reservasi Sesi Demo untuk Pelanggan: Rencana Implementasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bagian ini menghadirkan reservasi sesi demo untuk pelanggan. Isinya formulir dengan slot dan alasannya, kode reservasi beserta QR, berkas kalender, pembatalan, Reservasi saya, dan kartu di ringkasan Akun. Semuanya dijaga aturan anti-bentrok di database.

**Architecture:** Database menyimpan `reservations`, `reservation_items`, dan `reservation_seats`.
- Exclusion constraint menjaga unit, kursi meja, dan reservasi pelanggan agar tidak tumpang tindih.
- Satu perencana SQL internal memutuskan unit dan kursi. Perencana ini dipakai bersama oleh `reservation_slots` (ketersediaan beserta alasannya) dan `create_reservation`, jadi keduanya tidak pernah berbeda pendapat.
- Web hanya memanggil fungsi itu, lalu menampilkan hasilnya dengan logika murni di `@lantai-dua/shared/reservation`.

**Tech Stack:** Sama dengan 1B, ditambah `qrcode@1.5.4` dan `@types/qrcode@1.5.6` untuk QR. Extension Postgres `btree_gist` diaktifkan.

**Spec:** [`docs/superpowers/specs/2026-11-27-fase-1c1-reservasi-design.md`](../specs/2026-11-27-fase-1c1-reservasi-design.md). Dasarnya [`docs/PRD.md`](../../PRD.md) §6.3, §9.6, §9.9, §11, §12.4, §13.

## Global Constraints

- Semua Global Constraints Fase 0, 1A, dan 1B tetap berlaku. Di antaranya:
  - Bahasa Indonesia di UI;
  - RLS di semua tabel;
  - secret key tidak pernah dipakai di kode web;
  - target sentuh ≥ 44 px;
  - tanpa scroll horizontal dari 360 px;
  - mode kurangi gerakan dihormati;
  - commit dengan baris `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`;
  - `db push` memakai `--remote`;
  - `.claude/` tidak pernah di-commit.
- **Ketersediaan dihitung database.** Web tidak pernah memutuskan sendiri apakah sebuah slot kosong.
- **Waktu dalam Asia/Jakarta (WIB, UTC+7, tanpa DST).** Tanggal `YYYY-MM-DD` di URL dan di fungsi database selalu berarti tanggal WIB. Format tampilan: `Sab, 28 Nov 2026 · 14.00–14.30 WIB`. Parameter `jam` berbentuk `14.00`.
- **Angka dari `store_settings`:** `session_minutes` 30, `min_lead_minutes` 60, `max_days_ahead` 14, `max_active_reservations` 2, `cancel_cutoff_minutes` 60. Tidak boleh ada angka itu yang ditulis langsung di kode, kecuali sebagai nilai contoh di tes.
- **Maksimal 4 varian per reservasi.** Batas pembuatan 10 reservasi per pelanggan per 24 jam, termasuk yang dibatalkan.
- **Kode reservasi:** `L2D-` + 8 karakter dari alfabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ`.
- **Teks UI** persis seperti desain §5. Contohnya:
  - `Masuk untuk konfirmasi`, `Konfirmasi reservasi`, `Pilih minimal satu unit demo.`, `Maksimal 4 unit demo per reservasi.`, `Reservasi dibuat dari akun pelanggan.`;
  - alasan slot: `Toko tutup`, `Sudah lewat`, `Pesan paling lambat 1 jam sebelum sesi`, `Lu udah punya reservasi di jam ini`, `Meja penuh`, `Unit demo <nama> sedang diservis`, `Unit demo <nama> sudah dipesan di jam ini`;
  - pesan galat sesuai daftar §5.1;
  - `Reservasi berhasil dibuat.`, `Batas batal sudah lewat. Hubungi toko lewat WhatsApp.`
- **Nama varian di formulir dan alasan:** `<Merek> <Model> · <nama varian>`, misalnya `VortexSeries Ignix F1 · Putih`.

## Review Focus

1. **Dua orang menekan Konfirmasi untuk unit atau meja terakhir di detik yang sama.** Tepat satu yang berhasil, dan yang kalah mendapat pesan jelas. Dites di Task 1 (DB, bersamaan) dan Task 4 (e2e, slot keduluan).
2. **Batas tanggal dan zona waktu.** Contohnya jam 00.30 WIB, yang di UTC masih tanggal kemarin. "Hari ini", deretan tanggal, slot pertama setelah jam buka, dan `.ics` harus memakai WIB atau UTC dengan benar. Dites di Task 2 (DB, tanggal WIB) dan Task 3 (unit, `now` tetap).
3. **URL hasil ketikan tangan.** Contohnya 5 SKU atau lebih, SKU asing atau ganda, `jam=14.15`, tanggal di luar rentang, dan `bawa` aneh. Formulir tetap tampil dan nilai yang tidak sah diabaikan. Dites di Task 3 (unit) dan Task 4 (e2e).
4. **Tamu kembali dari login.** Varian, tanggal, jam, dan catatan di tab yang sama harus utuh. Dites di Task 4.
5. **Batas waktu tepat di tepinya.** Contohnya batal tepat 60 menit sebelum sesi, slot yang baru masuk batas pemesanan, dan pelanggan dengan 2 reservasi aktif yang salah satunya sudah lewat. Dites di Task 1 dan Task 2.

## Keputusan rencana (tambahan dari desain)

- **R1. `reservation_slots` menerima rentang tanggal** (`p_from`, `p_to`), bukan satu tanggal. Formulir mengambil seluruh jendela sekali, jadi berganti tanggal tidak perlu ke server lagi.
- **R2. Satu perencana internal** (`plan_reservation`) dipakai `reservation_slots` dan `create_reservation`. Fungsi ini memilih unit (kode terkecil) dan memeriksa kursi per area unit yang terpilih. Slot yang tampil bisa dipilih dijamin lolos, kecuali kalau keduluan orang lain.
- **R3. Tanpa varian terpilih,** ketersediaan meja dihitung dari area meja yang bisa direservasi dengan `sort_order` terkecil, yaitu Meja Kontrol.
- **R4. Mengganti varian memakai `router.replace`,** supaya server menghitung ulang slot. Mengganti tanggal atau jam hanya memakai `history.replaceState`. Keduanya tidak menambah riwayat browser.
- **R5. Tes e2e membersihkan reservasi akun tes** lewat helper `e2e/admin.ts`. Helper ini membaca secret key dari `.env.local` root dan hanya dipakai tes, tidak pernah diimpor kode aplikasi. Tanpa ini, batas 10 per 24 jam akan memblokir run e2e berikutnya.
- **R6. Kode reservasi dibuat dari byte `gen_random_uuid()`,** jadi tidak butuh extension `pgcrypto`.
- **R7. Audit reservasi hanya menyimpan `code`, `status`, `starts_at`, dan `cancelled_by`.** Catatan pelanggan tidak masuk log.
- **R8. Menu Akun mendapat item "Reservasi".**
- **R9. Reservasi Terjadwal yang waktunya sudah lewat** (sebelum ada tutup otomatis di 1C-2) tampil di Riwayat dengan label `Sudah lewat`. Reservasi seperti ini tidak dihitung aktif.

---

## Struktur file

```
supabase/migrations/<ts>_reservations.sql          tabel, constraint, trigger, RLS, audit, plan_reservation, create/cancel
supabase/migrations/<ts>_reservation_slots.sql     reservable_variants, reservation_slots
packages/db-tests/src/reservation-fixture.ts       kategori/area/varian/unit tes + slot WIB + helper RPC
packages/db-tests/src/reservations.test.ts         anti-bentrok, aturan, RLS
packages/db-tests/src/reservation-slots.test.ts    slot, alasan, varian
packages/shared/src/reservation/                   types, time, query, messages, code, calendar, status, rows, index (+ tes)
apps/web/src/lib/reservation-data.ts               pengaturan, varian, slot, reservasi saya
apps/web/src/app/(public)/reservasi/baru/{page.tsx,actions.ts}
apps/web/src/components/reservation/               reservation-form, variant-picker, date-strip, slot-grid,
                                                    reservation-qr, cancel-reservation, reservation-card
apps/web/src/app/akun/reservasi/{page.tsx,[kode]/page.tsx,[kode]/kalender/route.ts,actions.ts}
apps/web/src/app/akun/{layout.tsx,page.tsx}        menu dan kartu reservasi
apps/web/e2e/{admin.ts,reservation.spec.ts,reservation-account.spec.ts}
```

---

### Task 1: Tabel reservasi, anti-bentrok, buat dan batal

**Files:**
- Create: `supabase/migrations/<ts>_reservations.sql` (lewat `pnpm exec supabase migration new reservations`)
- Create: `packages/db-tests/src/reservation-fixture.ts`
- Test: `packages/db-tests/src/reservations.test.ts`
- Modify: `packages/shared/src/database.types.ts` (`pnpm db:types`)

**Interfaces:**
- Consumes: `demo_units`, `demo_areas`, `product_variants`, `products`, `categories`, `store_settings`, `opening_hours`, `store_closures`, `profiles`, `public.current_app_role()`, `public.is_staff()`, `public.audit_row_change(text)`, `public.set_updated_at()`, `createCatalogFixture`, `clientFor`, `userIdOf`.
- Produces (SQL):

**Struktur**
- `create extension if not exists btree_gist with schema extensions;`
- Enum `public.reservation_status`: `scheduled`, `checked_in`, `completed`, `cancelled`, `no_show`, `unrecorded`.
- `reservations`, `reservation_items`, dan `reservation_seats` sesuai desain §6.1, ditambah:
  - `reservation_items.unit_id` dan `variant_id` mengacu ke tabel masing-masing (`on delete restrict`). Trigger memastikan unit milik varian itu.
  - `reservation_seats.seat_no` dicek trigger: antara 1 dan `demo_areas.capacity` saat insert.
  - Trigger `after update of status on reservations` menyamakan `is_active` item dan kursi dengan `status in ('scheduled','checked_in')`. `period` item dan kursi diisi `tstzrange(starts_at, ends_at, '[)')`.
  - Trigger `set_updated_at` dan audit `audit_row_change('code,status,starts_at,cancelled_by')` (R7).

**Unit yang bisa ditugaskan** (desain §6.2): status `available` atau `in_use`; area aktif dan `is_reservable`; varian aktif; produk aktif dan dijual; kategori aktif dengan `try_mode = 'unit'`.

**`public.plan_reservation(p_variant_ids uuid[], p_period tstzrange, p_customer uuid)`**
- Bersifat internal: `security definer`, `set search_path = ''`, dan execute dicabut dari `public`, `anon`, dan `authenticated`.
- Mengembalikan `(reason text, reason_variant_id uuid, plan jsonb)`. Kalau bisa direncanakan, `reason` null dan `plan` berisi `[{variant_id, unit_id, area_id}]` dalam urutan input. Kalau tidak, `reason` berisi alasan pertama yang berlaku, dengan urutan:
  1. `own_overlap` (hanya kalau `p_customer` tidak null);
  2. `desk_full` untuk area tanpa varian (R3), atau untuk area unit yang terpilih;
  3. `unit_servicing` untuk varian tanpa unit yang bisa ditugaskan tetapi punya unit `servicing`;
  4. `unit_taken` untuk varian yang semua unit bisa-ditugaskannya bertabrakan.
- Varian kosong: hanya memeriksa kursi area bawaan (R3).

**`public.create_reservation(p_variant_ids uuid[], p_starts_at timestamptz, p_note text) returns text`**
- `security definer`. Execute untuk `authenticated` saja.
- Galat memakai `raise exception '<kode>' using errcode = 'P0001', detail = <variant_id atau null>`. Kode yang dipakai:
  - `not_customer` kalau `current_app_role()` bukan `customer`;
  - `invalid_items` untuk 0 atau lebih dari 4 varian, duplikat, atau varian yang tidak bisa direservasi;
  - `outside_hours` untuk jam yang tidak tepat di slot jadwal hari itu, di luar jam buka, atau hari libur;
  - `too_soon` dan `too_far` untuk batas waktu;
  - `rate_limited` kalau pelanggan sudah membuat 10 reservasi dalam 24 jam;
  - `too_many_active` kalau jumlah aktif yang `ends_at > now()` sudah mencapai batas;
  - kode dari `plan_reservation`.
- `p_note` dipangkas lalu dibatasi 500 karakter. String kosong menjadi null.
- Sebelum merencanakan, ambil `pg_advisory_xact_lock` per area (dari unit kandidat dan area bawaan) dan per varian, dalam urutan id yang tetap.
- Setelah itu: insert `reservations` dengan kode acak (R6, ulangi kalau bentrok), lalu item dan kursi (nomor kursi kosong terkecil per area).
- Pelanggaran exclusion (`23P01`) ditangkap dan diubah menjadi `unit_taken`, `desk_full`, atau `own_overlap`.

**`public.cancel_reservation(p_code text) returns void`**
- `security definer`. Execute untuk `authenticated`.
- Galat: `not_found` untuk reservasi yang bukan milik pemanggil atau tidak ada, `not_cancellable` untuk status selain `scheduled`, dan `cancel_too_late` kalau `now() >= starts_at - cancel_cutoff_minutes`.
- Kalau berhasil, set `status = 'cancelled'`, `cancelled_at = now()`, dan `cancelled_by = auth.uid()`.

**RLS** sesuai desain §6.4:
- `reservations` select: `customer_id = (select auth.uid()) or public.is_staff()`;
- `reservation_items` select: kalau reservasinya terlihat;
- `reservation_seats` select: `public.is_staff()`.

Tidak ada policy tulis untuk siapa pun.

**`reservation-fixture.ts`**
- `createReservationFixture(admin, prefix)` membuat kategori aktif `try_mode='unit'` (di atas `createCatalogFixture`), dan:
  - area A (`desk`, kapasitas 2, `sort_order` 900) dan area B (kapasitas 1, `sort_order` 901);
  - varian `vSolo` dengan 1 unit di A;
  - varian `vDuo` dengan 2 unit di A;
  - varian `vSoloB` dan `vSoloB2`, masing-masing dengan 1 unit di B;
  - varian `vServ` dengan satu unit `servicing` di A.
- `slotAt(daysAhead: number, hhmm: string): string` menghasilkan ISO `timestamptz` untuk tanggal WIB hari ini + `daysAhead` pada jam itu. Gunakan `daysAhead` yang jatuh di hari Senin–Sabtu (10.00–21.00).
- `wibDay(daysAhead: number): string` menghasilkan `YYYY-MM-DD` WIB, dan `toWibTime(iso: string): string` menghasilkan `HH.MM` WIB. Keduanya helper tes.
- `reserve(persona, variantIds, startsAt, note?)` memanggil `create_reservation` dan mengembalikan `{ code, error }`.
- `deleteReservationsOf(userIds)` membersihkan reservasi lewat admin.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
// reservations.test.ts — beforeAll: createReservationFixture; afterEach: hapus reservasi customer & customer2 via admin
describe('anti-bentrok', () => {
  it('gives the last unit to exactly one of two simultaneous customers', async () => {
    const at = slotAt(2, '14.00');
    const [a, b] = await Promise.all([reserve('customer', [f.vSolo], at), reserve('customer2', [f.vSolo], at)]);
    expect([a.error, b.error].filter((e) => e === null)).toHaveLength(1);
    expect([a.error?.message, b.error?.message]).toContain('unit_taken');
  });
  it('never seats more people than desks', async () => {
    const at = slotAt(2, '15.00');
    // Unit berbeda, tetapi area B hanya punya 1 meja: yang menentukan adalah kursinya.
    const [a, b] = await Promise.all([reserve('customer', [f.vSoloB], at), reserve('customer2', [f.vSoloB2], at)]);
    expect([a.error, b.error].filter((e) => e === null)).toHaveLength(1);
    expect([a.error?.message, b.error?.message]).toContain('desk_full');
  });
  it('uses the second unit of a variant before refusing', async () => {
    const at = slotAt(2, '16.00');
    const [a, b] = await Promise.all([reserve('customer', [f.vDuo], at), reserve('customer2', [f.vDuo], at)]);
    expect(a.error).toBeNull(); expect(b.error).toBeNull(); // 2 unit, kapasitas A 2
  });
  it('frees the unit and the seat when cancelled', async () => { /* customer pesan vSolo 17.00, batal, customer2 pesan vSolo 17.00 → berhasil */ });
  it('keeps one customer out of two places at once but allows back-to-back', async () => {
    expect((await reserve('customer', [f.vSolo], slotAt(3, '14.00'))).error).toBeNull();
    expect((await reserve('customer', [f.vDuo], slotAt(3, '14.00'))).error?.message).toBe('own_overlap');
    expect((await reserve('customer', [f.vDuo], slotAt(3, '14.30'))).error).toBeNull();
  });
});
describe('aturan', () => {
  it('limits active reservations, ignoring ones already over', async () => {
    // 2 reservasi → yang ketiga 'too_many_active'; admin mundurkan satu ke kemarin (starts/ends + item/kursi) → yang ketiga berhasil
  });
  it('limits creations to 10 per 24 hours, cancelled included', async () => { /* admin insert 10 reservasi cancelled milik customer2 → 'rate_limited' */ });
  it.each([
    ['not on the grid', () => slotAt(2, '14.15'), 'outside_hours'],
    ['before opening', () => slotAt(2, '09.30'), 'outside_hours'],
    ['too far ahead', () => slotAt(20, '14.00'), 'too_far'],
  ])('rejects a slot %s', async (_, at, code) => { expect((await reserve('customer', [f.vDuo], at())).error?.message).toBe(code); });
  it('rejects a closed day', async () => { /* admin insert store_closures tanggal (hari ini+4); hapus di finally → 'outside_hours' */ });
  it('rejects too-soon slots using the stored lead time', async () => { /* simpan min_lead_minutes; set 5 hari; slotAt(2) → 'too_soon'; kembalikan di finally */ });
  it.each([
    ['no variants', () => []], ['five variants', () => [f.vSolo, f.vDuo, f.vSoloB, f.vServ, f.vSolo]],
    ['a duplicate', () => [f.vDuo, f.vDuo]], ['an unknown variant', () => [crypto.randomUUID()]],
  ])('rejects %s', async (_, ids) => { expect((await reserve('customer', ids(), slotAt(2, '18.00'))).error?.message).toBe('invalid_items'); });
  it('reports a variant whose only unit is being serviced', async () => {
    const r = await reserve('customer', [f.vServ], slotAt(2, '18.00'));
    expect(r.error).toMatchObject({ message: 'unit_servicing', details: f.vServ });
  });
  it('returns a well-formed code and stores a trimmed note', async () => { /* /^L2D-[2-9A-HJKMNP-Z]{8}$/, note '  halo  ' → 'halo' */ });
});
describe('batal', () => {
  it('lets the owner cancel before the cut-off', async () => { /* status cancelled, cancelled_by = userIdOf('customer') */ });
  it('refuses at the cut-off and for other customers', async () => {
    // admin geser reservasi ke now()+60 menit tepat → 'cancel_too_late'; customer2 batal kode customer → 'not_found'
  });
});
describe('RLS', () => {
  it('shows customers only their own reservations', async () => { /* customer2 select by id → [] ; operator & owner → 1 */ });
  it.each(['operator', 'owner', 'operatorInactive'] as const)('blocks %s from creating', async (p) => {
    expect((await reserve(p, [f.vDuo], slotAt(2, '19.00'))).error?.message).toBe('not_customer');
  });
  it('blocks guests from creating', async () => { /* anonClient rpc → error */ });
  it('blocks direct writes', async () => { /* customer insert/update/delete langsung ke reservations, items, seats → error atau 0 baris */ });
  it('hides seats from customers and the planner from everyone', async () => { /* customer select reservation_seats → []; rpc plan_reservation → error */ });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @lantai-dua/db-tests exec vitest run src/reservations.test.ts`
Expected: FAIL, karena `create_reservation` tidak ditemukan.

- [ ] **Step 3: Tulis migrasi, lalu kirim**

Run: `pnpm exec supabase db push --remote --yes`

- [ ] **Step 4: Jalankan tes dan generate ulang tipe**

Run: `pnpm test:rls && pnpm db:types && pnpm typecheck`
Expected: PASS. `database.types.ts` memuat ketiga tabel dan kedua fungsi.

- [ ] **Step 5: Commit**

```bash
git add -A && git restore --staged .claude && git commit -m "feat: tabel reservasi dengan anti-bentrok, buat, dan batal"
```

---

### Task 2: Varian yang bisa direservasi dan slot beserta alasannya

**Files:**
- Create: `supabase/migrations/<ts>_reservation_slots.sql`
- Test: `packages/db-tests/src/reservation-slots.test.ts`
- Modify: `packages/shared/src/database.types.ts`

**Interfaces:**
- Consumes: `plan_reservation` dan aturan unit dari Task 1, ditambah fixture Task 1.
- Produces (SQL, keduanya `security definer`, `stable`, dan execute untuk `anon, authenticated`):

**`public.reservable_variants()`** mengembalikan satu baris per varian yang punya unit bisa-ditugaskan atau unit `servicing` di area yang bisa direservasi. Kolomnya: `variant_id`, `sku`, `variant_name`, `product_slug`, `model_name`, `brand_name`, `category_slug`, `category_name`, `category_sort`, `area_id`, `area_name`, `assignable_units int`, dan `servicing_units int`.

**`public.reservation_slots(p_from date, p_to date, p_variant_ids uuid[])`** (R1) mengembalikan `starts_at`, `ends_at`, `available boolean`, `reason text`, dan `reason_variant_id uuid`.
- Mencakup setiap tanggal WIB dari `p_from` sampai `p_to`. Batasnya maksimal `max_days_ahead + 1` hari, dan sisanya dipotong.
- Hari libur atau tanpa jam buka menghasilkan satu baris `closed` per tanggal, dengan `starts_at` di jam 00.00 WIB.
- Selain itu, satu baris per slot, dari `opens_at` dengan langkah `session_minutes`, selama `slot + session ≤ closes_at`.
- Alasan diperiksa berurutan:
  1. `past` kalau `starts_at ≤ now()`;
  2. `too_soon`;
  3. `too_far`;
  4. `plan_reservation(p_variant_ids, periode, auth.uid() kalau pelanggan aktif, null untuk tamu)`.
- `p_variant_ids` lebih dari 4 dipotong menjadi 4. Id asing diabaikan.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
// reservation-slots.test.ts
const slots = async (c: SupabaseClient, ids: string[], daysAhead = 2) =>
  (await c.rpc('reservation_slots', { p_from: wibDay(daysAhead), p_to: wibDay(daysAhead), p_variant_ids: ids })).data!;
const at = (rows, hhmm) => rows.find((r) => toWibTime(r.starts_at) === hhmm);

it('lays out the day on the session grid in WIB', async () => {
  const rows = await slots(anonClient(), []);
  expect(toWibTime(rows[0].starts_at)).toBe('10.00');           // Senin–Sabtu seed 10.00–21.00
  expect(toWibTime(rows.at(-1).starts_at)).toBe('20.30');
  expect(rows).toHaveLength(22);
});
it('marks a taken unit only for that variant and slot', async () => {
  await reserve('customer2', [f.vSolo], slotAt(2, '14.00'));
  const rows = await slots(anonClient(), [f.vSolo, f.vDuo]);
  expect(at(rows, '14.00')).toMatchObject({ available: false, reason: 'unit_taken', reason_variant_id: f.vSolo });
  expect(at(rows, '14.30')).toMatchObject({ available: true, reason: null });
});
it('reports a full desk', async () => { /* customer2 pesan vSoloB 15.00 (area B kapasitas 1) → slots([vSoloB2]) 15.00 'desk_full' */ });
it('reports a serviced-only variant on every slot', async () => {
  expect((await slots(anonClient(), [f.vServ])).every((r) => r.reason === 'unit_servicing')).toBe(true);
});
it('tells a customer about their own booking, but never a guest', async () => {
  await reserve('customer', [f.vDuo], slotAt(2, '16.00'));
  expect(at(await slots(clientFor('customer'), [f.vSolo]), '16.00')?.reason).toBe('own_overlap');
  expect(at(await slots(anonClient(), [f.vSolo]), '16.00')?.reason).toBeNull();
});
it('marks closed days, past slots, and lead time', async () => { /* store_closures hari+4 → 1 baris 'closed'; hari ini → slot sebelum now 'past'; lead 5 hari → 'too_soon' */ });
it('cuts the window at max_days_ahead + 1 days', async () => { /* p_from hari ini, p_to hari ini+30 → tanggal unik ≤ 15 */ });
it('returns no personal data', async () => { /* kunci baris persis: starts_at, ends_at, available, reason, reason_variant_id */ });
it('lists reservable variants with unit counts', async () => {
  const rows = (await anonClient().rpc('reservable_variants')).data!;
  expect(rows.find((r) => r.variant_id === f.vServ)).toMatchObject({ assignable_units: 0, servicing_units: 1 });
  expect(rows.find((r) => r.variant_id === f.vDuo)).toMatchObject({ assignable_units: 2 });
  // varian tanpa unit, varian di kategori free, dan varian nonaktif tidak muncul
});
```

`wibDay(n)` dan `toWibTime(iso)` adalah helper tes di `reservation-fixture.ts` (Task 1).

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @lantai-dua/db-tests exec vitest run src/reservation-slots.test.ts`
Expected: FAIL, karena `reservation_slots` tidak ditemukan.

- [ ] **Step 3: Tulis migrasi, lalu kirim**

Run: `pnpm exec supabase db push --remote --yes`

- [ ] **Step 4: Jalankan tes dan generate ulang tipe**

Run: `pnpm test:rls && pnpm db:types && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git restore --staged .claude && git commit -m "feat: slot reservasi beserta alasannya dan daftar varian yang bisa dicoba"
```

---

### Task 3: Logika reservasi bersama

**Files:**
- Create: `packages/shared/src/reservation/{types,time,query,messages,code,calendar,status,rows,index}.ts` + `*.test.ts` untuk `time`, `query`, `messages`, `code`, `calendar`, `status`, `rows`
- Modify: `packages/shared/package.json` (export `"./reservation"`)

**Interfaces:**
- Consumes: `Database` (Task 1–2), `SearchParamsLike` dan `Tone` dari `@lantai-dua/shared/catalog`.
- Produces (`@lantai-dua/shared/reservation`):

```ts
export type ReservationStatus = 'scheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show' | 'unrecorded';
export type SlotReason = 'closed' | 'past' | 'too_soon' | 'too_far' | 'own_overlap' | 'desk_full' | 'unit_servicing' | 'unit_taken';
export type ReservableVariant = { id: string; sku: string; name: string; productSlug: string; productName: string; // "VortexSeries Ignix F1"
  categorySlug: string; categoryName: string; categorySort: number; areaId: string; areaName: string; assignableUnits: number; servicingUnits: number };
export type Slot = { startsAt: string; endsAt: string; date: string; time: string; available: boolean; reason: SlotReason | null; reasonVariantId: string | null };
export type ReservationSettings = { sessionMinutes: number; minLeadMinutes: number; maxDaysAhead: number; maxActiveReservations: number; cancelCutoffMinutes: number };
export type ReservationQuery = { skus: string[]; tanggal: string | null; jam: string | null; bawa: string | null };
export type ReservationItemView = { name: string; unitCode: string | null };
export type ReservationView = { id: string; code: string; status: ReservationStatus; startsAt: string; endsAt: string;
  note: string | null; areaName: string | null; items: ReservationItemView[] };
/** Bentuk hasil select `reservations` dengan item, varian, produk, merek, unit, dan area tersemat. */
export type ReservationRowWithItems = { id: string; code: string; status: ReservationStatus; starts_at: string; ends_at: string; note: string | null;
  reservation_items: { variant: { name: string; product: { model_name: string; brand: { name: string } | null } | null } | null;
    unit: { code: string; area: { name: string } | null } | null }[] };
export const MAX_ITEMS = 4;

export function variantLabel(v: Pick<ReservableVariant, 'productName' | 'name'>): string; // "VortexSeries Ignix F1 · Putih"
export function wibDate(at: Date): string;                      // 'YYYY-MM-DD' di WIB
export function addDays(date: string, n: number): string;
export function dateWindow(today: string, maxDaysAhead: number): string[]; // today..today+maxDaysAhead
export function dayLabel(date: string, today: string): string;   // 'Hari ini' | 'Besok' | 'Sab 29'
export function slotTime(iso: string): string;                  // '14.00'
export function formatSession(startsAt: string, endsAt: string): string; // 'Sab, 28 Nov 2026 · 14.00–14.30 WIB'
export function formatDuration(minutes: number): string;          // 60 → '1 jam', 30 → '30 menit', 90 → '1 jam 30 menit'
export function parseReservationQuery(params: SearchParamsLike, variants: ReservableVariant[], window: string[]): ReservationQuery;
export function serializeReservationQuery(q: ReservationQuery): string; // '' atau '?varian=…&tanggal=…&jam=…&bawa=…'
export function slotReasonText(slot: Slot, variants: ReservableVariant[], s: ReservationSettings): string | null;
export function createErrorText(code: string, variantName: string | null, s: ReservationSettings): string;
export function cancelErrorText(code: string, s: ReservationSettings): string;
export const RESERVATION_CODE: RegExp;                          // /^L2D-[2-9A-HJKMNP-Z]{8}$/
export function reservationStatusLabel(status: ReservationStatus, endsAt: string, now: Date): { tone: Tone; text: string };
export function canCancel(r: Pick<ReservationView, 'status' | 'startsAt'>, s: ReservationSettings, now: Date): boolean;
export function buildIcs(r: { code: string; startsAt: string; endsAt: string; items: string[]; address: string }, now: Date): string;
export function googleCalendarUrl(r: { code: string; startsAt: string; endsAt: string; items: string[]; address: string }): string;
export function fromReservableRow(row: ReservableRow): ReservableVariant;
export function fromSlotRow(row: SlotRow): Slot;
export function fromSettingsRow(row: Pick<StoreSettingsRow, 'session_minutes' | 'min_lead_minutes' | 'max_days_ahead' | 'max_active_reservations' | 'cancel_cutoff_minutes'>): ReservationSettings;
export function fromReservationRow(row: ReservationRowWithItems): ReservationView; // nama item = `${merek} ${model} · ${varian}`, areaName dari unit pertama
```

**Aturan**
- `parseReservationQuery`:
  - `varian` adalah SKU dipisah koma. Hanya SKU yang ada di `variants` yang dipakai, tanpa duplikat, dengan urutan URL, maksimal 4.
  - `tanggal` hanya dipakai kalau ada di `window`.
  - `jam` hanya `HH.MM` yang sah.
  - `bawa` hanya slug (`^[a-z0-9]+(-[a-z0-9]+)*$`) atau `ukur`.
- `serializeReservationQuery`: urutan `varian`, `tanggal`, `jam`, `bawa`. Koma di `varian` ditulis apa adanya.
- `slotReasonText`:
  - `closed` → `Toko tutup`;
  - `past` → `Sudah lewat`;
  - `too_soon` → `Pesan paling lambat ${formatDuration(minLead)} sebelum sesi`;
  - `too_far` → `Paling jauh ${maxDays} hari ke depan`;
  - `own_overlap` → `Lu udah punya reservasi di jam ini`;
  - `desk_full` → `Meja penuh`;
  - `unit_servicing` → `Unit demo ${variantLabel} sedang diservis`;
  - `unit_taken` → `Unit demo ${variantLabel} sudah dipesan di jam ini`;
  - slot yang tersedia → null.
- `createErrorText`:
  - `desk_full` dan `slot_unavailable` → `Slot ini baru saja penuh. Pilih jam lain.`;
  - `unit_taken` → `Unit demo <nama> baru saja dipesan orang lain di jam ini.`;
  - `unit_servicing` → `Unit demo <nama> sedang diservis.`;
  - `own_overlap` → `Lu udah punya reservasi di jam ini.`;
  - `too_many_active` → `Lu udah punya ${max} reservasi aktif. Batalkan salah satu dulu, atau tunggu sampai sesinya lewat.`;
  - `rate_limited` → `Terlalu banyak reservasi dibuat hari ini. Coba lagi besok.`;
  - `too_soon`, `too_far`, dan `outside_hours` → `Jam ini sudah tidak bisa dipesan. Pilih jam lain.`;
  - `not_customer` → `Reservasi dibuat dari akun pelanggan.`;
  - selain itu → `Gagal menyimpan. Coba lagi sebentar.`
- `cancelErrorText`:
  - `cancel_too_late` → `Batas batal sudah lewat. Hubungi toko lewat WhatsApp.`;
  - `not_cancellable` → `Reservasi ini sudah tidak bisa dibatalkan.`;
  - selain itu → `Gagal membatalkan. Coba lagi sebentar.`
- `reservationStatusLabel`:
  - `scheduled` yang `endsAt ≤ now` → `Sudah lewat` (`none`, R9);
  - `scheduled` → `Terjadwal` (`demo`);
  - `checked_in` → `Check-in` (`ok`);
  - `completed` → `Selesai` (`ok`);
  - `cancelled` → `Dibatalkan` (`none`);
  - `no_show` → `Tidak datang` (`bad`);
  - `unrecorded` → `Tidak tercatat` (`warn`).
- `buildIcs`:
  - baris dipisah CRLF;
  - `DTSTART` dan `DTEND` dalam UTC `YYYYMMDDTHHMMSSZ`;
  - `UID:<code>@lantaidua`;
  - `SUMMARY:Sesi demo LANTAI DUA (<code>)`;
  - `LOCATION` dan `DESCRIPTION` di-escape (`\\`, `\;`, `\,`, `\n`).
- `googleCalendarUrl`: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=…&dates=<start>/<end>&details=…&location=…`, dengan tanggal dalam format UTC yang sama.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
const now = new Date('2026-11-27T17:30:00Z'); // 28 Nov 2026 00.30 WIB — di UTC masih tanggal 27
it('uses the WIB calendar date', () => expect(wibDate(now)).toBe('2026-11-28'));
it('labels days relative to today', () => {
  expect(['2026-11-28', '2026-11-29', '2026-11-30'].map((d) => dayLabel(d, '2026-11-28'))).toEqual(['Hari ini', 'Besok', 'Sen 30']);
});
it('formats a session in WIB', () => expect(formatSession('2026-11-28T07:00:00Z', '2026-11-28T07:30:00Z')).toBe('Sab, 28 Nov 2026 · 14.00–14.30 WIB'));
it.each([[30, '30 menit'], [60, '1 jam'], [90, '1 jam 30 menit']])('formats %i minutes', (m, t) => expect(formatDuration(m)).toBe(t));
it('builds the date window inclusively', () => expect(dateWindow('2026-11-28', 14)).toHaveLength(15));
// query.test.ts — variants: F1 putih (sku A), R1 hitam (sku B), C, D, E
it('keeps known SKUs in order, drops unknown, duplicates, and the fifth', () => {
  expect(parseReservationQuery(new URLSearchParams('varian=B,X,A,B,C,D,E'), variants, window).skus).toEqual(['B', 'A', 'C', 'D']);
});
it.each(['tanggal=2026-12-31', 'tanggal=kemarin', 'jam=14.15x', 'jam=25.00', 'bawa=../evil', 'bawa=Ukur'])('ignores %s', (raw) => {
  const q = parseReservationQuery(new URLSearchParams(raw), variants, window);
  expect([q.tanggal, q.jam, q.bawa]).toEqual([null, null, null]);
});
it('round-trips in a stable order', () => {
  const s = '?varian=A,B&tanggal=2026-11-30&jam=14.00&bawa=ukur';
  expect(serializeReservationQuery(parseReservationQuery(new URLSearchParams(s), variants, window))).toBe(s);
});
// messages.test.ts
it.each([
  ['unit_taken', 'Unit demo VortexSeries Ignix F1 · Putih sudah dipesan di jam ini'],
  ['too_soon', 'Pesan paling lambat 1 jam sebelum sesi'],
  ['own_overlap', 'Lu udah punya reservasi di jam ini'],
  ['desk_full', 'Meja penuh'], ['closed', 'Toko tutup'], ['past', 'Sudah lewat'],
])('explains %s', (reason, text) => expect(slotReasonText(slot(reason, idA), variants, settings)).toBe(text));
it('maps create errors', () => {
  expect(createErrorText('too_many_active', null, settings)).toBe('Lu udah punya 2 reservasi aktif. Batalkan salah satu dulu, atau tunggu sampai sesinya lewat.');
  expect(createErrorText('aneh', null, settings)).toBe('Gagal menyimpan. Coba lagi sebentar.');
});
// code.test.ts: L2D-H7K3QX9P ✓, L2D-H7K3QX9 ✗, L2D-H7K3QX0P ✗ (0), l2d-… ✗
// status.test.ts: tabel label di atas + canCancel tepat di batas → false, 1 menit sebelum → true
// calendar.test.ts
it('writes an ics event in UTC with escaped text', () => {
  const ics = buildIcs({ code: 'L2D-H7K3QX9P', startsAt: '2026-11-28T07:00:00Z', endsAt: '2026-11-28T07:30:00Z',
    items: ['VortexSeries Ignix F1 · Putih'], address: 'Jl. Contoh Raya No. 2, Surabaya' }, now);
  expect(ics).toContain('DTSTART:20261128T070000Z\r\n');
  expect(ics).toContain('LOCATION:Jl. Contoh Raya No. 2\\, Surabaya\r\n');
  expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
});
it('links to Google Calendar with the same times', () => expect(googleCalendarUrl(r)).toContain('dates=20261128T070000Z%2F20261128T073000Z'));
// rows.test.ts: snake→camel; productName = `${brand_name} ${model_name}`; Slot.date/time dihitung dari starts_at dalam WIB
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @lantai-dua/shared test`
Expected: FAIL, karena modul `reservation/*` belum ada.

- [ ] **Step 3: Implementasikan**

Tanggal memakai `Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', … })`. Jangan memakai zona waktu mesin.

- [ ] **Step 4: Jalankan tes**

Run: `pnpm --filter @lantai-dua/shared test && pnpm typecheck && pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git restore --staged .claude && git commit -m "feat: logika reservasi bersama (URL, waktu WIB, alasan, kalender)"
```

---

### Task 4: Formulir `/reservasi/baru`

**Files:**
- Create: `apps/web/src/lib/reservation-data.ts`, `apps/web/src/app/(public)/reservasi/baru/actions.ts`
- Create: `apps/web/src/components/reservation/{reservation-form,variant-picker,date-strip,slot-grid}.tsx`
- Modify: `apps/web/src/app/(public)/reservasi/baru/page.tsx`
- Create: `apps/web/e2e/admin.ts` (R5), `apps/web/e2e/reservation.spec.ts`

**Interfaces:**
- Consumes: `@lantai-dua/shared/reservation` (Task 3), fungsi database (Task 1–2), `getCurrentViewer`, dan teks B8 `Mouse lama lu nggak ada di showroom? Bawa aja dari rumah biar bisa dibandingin langsung.`
- Produces:

```ts
// lib/reservation-data.ts (server)
export type StoreInfo = ReservationSettings & { address: string; mapsUrl: string | null; whatsapp: string | null };
export const getStoreInfo: () => Promise<StoreInfo>;
export const listReservableVariants: () => Promise<ReservableVariant[]>;
export async function listSlots(from: string, to: string, variantIds: string[]): Promise<Slot[]>;
export type ReservationViewer = 'guest' | 'customer' | 'other';
// actions.ts ('use server')
export type CreateResult = { ok: true; code: string } | { ok: false; error: string };
export async function createReservationAction(input: { skus: string[]; startsAt: string; note: string }): Promise<CreateResult>;
// components
export function ReservationForm(props: { variants: ReservableVariant[]; slots: Slot[]; settings: ReservationSettings;
  today: string; window: string[]; query: ReservationQuery; viewer: ReservationViewer }): JSX.Element; // 'use client'
export function VariantPicker(props: { variants: ReservableVariant[]; selected: string[]; onChange: (skus: string[]) => void }): JSX.Element;
export function DateStrip(props: { window: string[]; today: string; closedDates: Set<string>; value: string; onChange: (d: string) => void }): JSX.Element;
export function SlotGrid(props: { slots: Slot[]; value: string | null; reasonText: (s: Slot) => string | null; onChange: (time: string) => void }): JSX.Element;
// e2e/admin.ts (hanya tes)
export function adminClient(): SupabaseClient;           // membaca ../../.env.local
export async function clearReservations(emails: string[]): Promise<void>;
export async function reserveAs(email: string, skus: string[], startsAt: string): Promise<string>; // login lewat publishable key + E2E_PASSWORD, panggil RPC
export function wibDateIn(days: number): string;          // 'YYYY-MM-DD' WIB hari ini + days
// e2e/data.ts (tambahan)
export async function login(page: Page, email: string, next?: string): Promise<void>; // dipindah dari auth.spec.ts
export async function fillLogin(page: Page, email: string): Promise<void>;           // mengisi form login di halaman saat ini
```

**Perilaku `page.tsx`** (server)
1. Ambil `today = wibDate(new Date())` dan `window = dateWindow(today, maxDaysAhead)`, lalu jalankan `listReservableVariants()` dan `parseReservationQuery()`.
2. Ambil `slots = listSlots(window[0], window.at(-1), variantIds)`.
3. Tanggal awal: `query.tanggal` kalau ada. Kalau tidak, tanggal pertama di `window` yang punya slot `available`. Kalau tidak ada juga, `today`.
4. Render `<h1>Reservasi demo</h1>`, subjudul area dan durasi sesi, lalu `<Suspense><ReservationForm … /></Suspense>`.

**Perilaku `ReservationForm`**
- **Varian:**
  - Tampil sebagai chip `variantLabel` dengan tombol hapus berlabel `Hapus <nama>`.
  - **+ Tambah** membuka `VariantPicker` sebagai dialog (`role="dialog"`) berisi daftar per kategori. Varian dengan `assignableUnits = 0` tampil nonaktif dengan `Sedang diservis`, dan varian yang sudah dipilih tidak tampil.
  - Setelah 4 varian, tombol Tambah nonaktif dengan teks `Maksimal 4 unit demo per reservasi.`
  - Perubahan varian memakai `router.replace(url, { scroll: false })` di dalam transisi (R4). Selama menunggu, grid slot diberi `aria-busy`.
- **Saran B8:** tampil kalau `query.bawa` tidak null.
- **Tanggal:**
  - `DateStrip` berisi tombol radio. Setiap tanggal punya `data-date`, label `dayLabel`, dan tanggal tutup (semua slotnya `closed`) nonaktif dengan teks `Tutup`.
  - Wadahnya bisa digeser horizontal tanpa membuat halaman bergeser.
- **Jam:** `SlotGrid` berisi tombol radio berlabel `slot.time`. Slot nonaktif tetap tampil, dan alasan slot yang difokus atau dipilih ditulis di bawah grid lewat `aria-describedby`.
- **URL:** tanggal dan jam disamakan dengan `history.replaceState` (R4).
- **Catatan:** `<textarea maxLength={500}>` berlabel `Catatan`. Isinya disimpan di `sessionStorage['l2-reservasi-catatan']` setiap berubah, dibaca saat mount, dan dihapus setelah berhasil.
- **Tombol:**
  - Tamu: tautan `Masuk untuk konfirmasi` ke `/masuk?next=<encodeURIComponent(path + query)>`.
  - `other`: teks `Reservasi dibuat dari akun pelanggan.`
  - Pelanggan: tombol `Konfirmasi reservasi` (varian demo). Tombol nonaktif tanpa varian (`Pilih minimal satu unit demo.`) atau tanpa jam terpilih.
- **Konfirmasi:**
  - Memanggil `createReservationAction` dalam transisi, dengan `try/catch` seperti pelajaran 1B.
  - Kalau berhasil: `router.push('/akun/reservasi/<kode>?baru=1')`.
  - Kalau gagal: pesan `role="alert"` di atas tombol, lalu `router.refresh()` supaya slot dimuat ulang. Pilihan lain tidak berubah.
- **`createReservationAction`:** memetakan SKU ke id lewat `listReservableVariants()`, lalu memanggil RPC. Galat diubah lewat `createErrorText(error.message, <nama varian dari error.details>, settings)`.

- [ ] **Step 1: Tulis tes e2e yang gagal**

```ts
// reservation.spec.ts — serial; beforeAll/afterAll: clearReservations([CUSTOMER, OTHER]) (pelanggan3 & pelanggan2)
const F1 = product('vortexseries-ignix-f1').demoUnits[0]!.variantSku;      // satu unit, available
const R1 = product('vortexseries-ignix-r1-pro').demoUnits[0]!.variantSku;
const SERV = product('hyperx-cloud-ii').demoUnits[0]!.variantSku;          // satu-satunya unit diservis
const day = wibDateIn(3);   // helper di admin.ts, tanggal WIB 3 hari lagi
const startsAt = (hhmm: string) => `${day}T${hhmm.replace('.', ':')}:00+07:00`;

test('a guest picks a slot, logs in, and comes back to the same form', async ({ page }) => {
  await page.goto(`/reservasi/baru?varian=${F1}`);
  await expect(page.getByRole('button', { name: `Hapus ${fullName('vortexseries-ignix-f1')} · Putih` })).toBeVisible();
  await page.locator(`[data-date="${day}"]`).click();
  await page.getByRole('radio', { name: '14.00' }).check();
  await page.getByLabel('Catatan').fill('Bawa mouse sendiri');
  await expect(page).toHaveURL(new RegExp(`tanggal=${day}&jam=14\\.00`));
  await page.getByRole('link', { name: 'Masuk untuk konfirmasi' }).click();
  await fillLogin(page, CUSTOMER); // sudah di /masuk?next=…
  await expect(page).toHaveURL(new RegExp(`/reservasi/baru\\?varian=${F1}&tanggal=${day}&jam=14\\.00`));
  await expect(page.getByLabel('Catatan')).toHaveValue('Bawa mouse sendiri');
  await page.getByRole('button', { name: 'Konfirmasi reservasi' }).click();
  await expect(page).toHaveURL(/\/akun\/reservasi\/L2D-[2-9A-HJKMNP-Z]{8}\?baru=1$/);
});
test('shows the bring-your-own hint from Bandingkan', async ({ page }) => { /* ?varian=F1&bawa=logitech-g102-lightsync → teks B8 */ });
test('survives a hand-made URL', async ({ page }) => {
  await page.goto('/reservasi/baru?varian=ZZZ,' + F1 + ',' + F1 + '&tanggal=1999-01-01&jam=99.99&bawa=../x');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Reservasi demo');
  await expect(page.getByRole('button', { name: /^Hapus / })).toHaveCount(1);
});
test('keeps a serviced-only variant and explains every slot', async ({ page }) => {
  await page.goto(`/reservasi/baru?varian=${SERV}&tanggal=${day}`);
  const first = page.getByRole('radio').first();
  await expect(first).toBeDisabled();
  await first.focus();
  await expect(page.getByText(/sedang diservis$/)).toBeVisible();
});
test('explains a slot taken by someone else, without saying who', async ({ page }) => {
  await reserveAs(OTHER, [F1], startsAt('15.00'));
  await page.goto(`/reservasi/baru?varian=${F1}&tanggal=${day}`);
  await expect(page.getByRole('radio', { name: '15.00' })).toBeDisabled();
  // fokus slot 15.00 → teks "Unit demo VortexSeries Ignix F1 · Putih sudah dipesan di jam ini", tanpa nama pelanggan lain
});
test('tells the loser of a race what happened and refreshes the slots', async ({ page }) => {
  await login(page, CUSTOMER, `/reservasi/baru?varian=${R1}&tanggal=${day}&jam=16.00`);
  await reserveAs(OTHER, [R1], startsAt('16.00'));       // diambil orang lain setelah halaman terbuka
  await page.getByRole('button', { name: 'Konfirmasi reservasi' }).click();
  await expect(page.getByRole('alert')).toContainText('baru saja dipesan orang lain di jam ini');
  await expect(page.getByRole('radio', { name: '16.00' })).toBeDisabled();
});
test('staff see that reservations come from customer accounts', async ({ page }) => { /* login operator1 → teks itu, tanpa tombol Konfirmasi */ });
test('limits the picker to four variants', async ({ page }) => { /* ?varian=4 SKU → tombol Tambah nonaktif + teks maksimal */ });
test('fits 360 px without horizontal scroll', async ({ page }) => { /* scrollWidth ≤ 360 */ });
```

`product` dan `fullName` dipakai ulang dari `e2e/data.ts`. `login` dipindah ke sana dari `auth.spec.ts`, ditambah `fillLogin`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm e2e reservation.spec.ts`
Expected: FAIL, karena halaman masih "sedang disiapkan".

- [ ] **Step 3: Implementasikan data, aksi, komponen, dan halaman**

Periksa juga di browser pane: desktop dan 360 px, deretan tanggal bisa digeser, dan alasan slot terbaca.

- [ ] **Step 4: Jalankan tes**

Run: `pnpm e2e && pnpm typecheck && pnpm check`
Expected: PASS, termasuk semua e2e 1A dan 1B.

- [ ] **Step 5: Commit**

```bash
git add -A && git restore --staged .claude && git commit -m "feat: formulir reservasi demo dengan slot dan alasannya"
```

---

### Task 5: Detail, Reservasi saya, batal, QR, kalender, dan kartu Akun

**Files:**
- Modify: `apps/web/package.json` (dependensi `qrcode@1.5.4`, dev `@types/qrcode@1.5.6`), `pnpm-lock.yaml`
- Create: `apps/web/src/app/akun/reservasi/{page.tsx,actions.ts}`, `apps/web/src/app/akun/reservasi/[kode]/page.tsx`, `apps/web/src/app/akun/reservasi/[kode]/kalender/route.ts`
- Create: `apps/web/src/components/reservation/{reservation-qr,cancel-reservation,reservation-card}.tsx`
- Modify: `apps/web/src/lib/reservation-data.ts`, `apps/web/src/app/akun/layout.tsx` (menu `Reservasi`, R8), `apps/web/src/app/akun/page.tsx`
- Test: `apps/web/e2e/reservation-account.spec.ts`

**Interfaces:**
- Consumes: Task 1–4.
- Produces:

```ts
// lib/reservation-data.ts (tambahan, server)
export async function listMyReservations(): Promise<ReservationView[]>;          // RLS: hanya milik sendiri, urut starts_at
export async function getMyReservation(code: string): Promise<ReservationView | null>; // null kalau bukan RESERVATION_CODE atau tidak terlihat
// akun/reservasi/actions.ts ('use server')
export async function cancelReservationAction(code: string): Promise<{ ok: true } | { ok: false; error: string }>; // revalidatePath detail, daftar, /akun
// components
export async function ReservationQr(props: { code: string; size?: number }): Promise<JSX.Element>; // server, SVG dari qrcode, role="img" aria-label="QR <kode>"
export function CancelReservation(props: { code: string }): JSX.Element;    // 'use client', dialog konfirmasi
export function ReservationCard(props: { reservation: ReservationView; withQr?: boolean }): JSX.Element;
```

**Perilaku**
- **Detail** (`notFound()` kalau null):
  - Isinya kode (mono, besar), `ReservationQr` (hanya untuk `scheduled` dan `checked_in`), chip `reservationStatusLabel`, dan `formatSession`.
  - Area dari `areaName`.
  - Daftar `<nama varian lengkap> · <kode unit>`, catatan, alamat, tautan peta (`maps_url`), dan WhatsApp `https://wa.me/<nomor>`.
  - `?baru=1` menampilkan notice `Reservasi berhasil dibuat.`
  - Tautan `Unduh ke kalender (.ics)` ke rute kalender, dan `Tambah ke Google Calendar` (`target="_blank"`). Keduanya hanya untuk `scheduled`.
  - `CancelReservation` tampil kalau `canCancel`. Kalau tidak dan status masih `scheduled` yang belum lewat, tampil teks batas.
- **Rute kalender:** `GET` mengembalikan `buildIcs(...)` dengan `content-type: text/calendar; charset=utf-8` dan `content-disposition: attachment; filename="lantai-dua-<kode>.ics"`. Kalau tidak terlihat, kembalikan 404.
- **Daftar:**
  - Bagian `Mendatang` berisi `scheduled` yang `endsAt > now`, urut naik.
  - Bagian `Riwayat` berisi sisanya, urut turun.
  - Kosong: `Belum ada reservasi.` dengan tombol `Reservasi demo`.
- **Ringkasan Akun:** kartu `Reservasi` dengan reservasi Mendatang terdekat (`withQr`) dan tautan detail. Kalau tidak ada, tampil teks kosong dan tombol `Reservasi demo`.
- **Batal:** dialog `Batalkan reservasi ini?` dengan tombol `Ya, batalkan` dan `Tidak`. Galat tampil `role="alert"` lewat `cancelErrorText`. Setelah berhasil, halaman menampilkan status `Dibatalkan`.

- [ ] **Step 1: Tulis tes e2e yang gagal**

```ts
// reservation-account.spec.ts — serial; CUSTOMER = pelanggan3; beforeAll clearReservations + reserveAs(CUSTOMER, [F1], startsAt('14.00')) → code
test('shows the code, QR, schedule, items and address', async ({ page }) => {
  await login(page, CUSTOMER, `/akun/reservasi/${code}?baru=1`);
  await expect(page.getByText('Reservasi berhasil dibuat.')).toBeVisible();
  await expect(page.getByText(code, { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: `QR ${code}` })).toBeVisible();
  await expect(page.getByText(/· 14\.00–14\.30 WIB$/)).toBeVisible();
  await expect(page.getByText(/VortexSeries Ignix F1 · Putih · DM-M-\d{3}/)).toBeVisible();
});
test('offers an ics file and a Google Calendar link', async ({ page, request }) => {
  // tautan .ics → page.request.get → status 200, content-type text/calendar, isi memuat `UID:${code}@lantaidua`
  // tautan Google → href berisi calendar.google.com dan dates=
});
test('lists the reservation as upcoming and on the account summary', async ({ page }) => { /* /akun/reservasi → bagian Mendatang memuat kode; /akun → kartu dengan QR */ });
test('cancels after confirming', async ({ page }) => {
  // tombol Batalkan → dialog → Ya, batalkan → chip Dibatalkan, QR hilang, kode pindah ke Riwayat
});
test("another customer's code is a 404", async ({ page }) => {
  const otherCode = await reserveAs(OTHER, [R1], startsAt('17.00'));
  await login(page, CUSTOMER);
  expect((await page.goto(`/akun/reservasi/${otherCode}`))?.status()).toBe(404);
  expect((await page.goto('/akun/reservasi/L2D-AAAAAAAA'))?.status()).toBe(404);
});
test('guests are sent to login', async ({ page }) => { /* /akun/reservasi → /masuk?next=%2Fakun%2Freservasi */ });
test('fits 360 px without horizontal scroll', async ({ page }) => { /* detail di 360 px */ });
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm e2e reservation-account.spec.ts`
Expected: FAIL, karena rute `/akun/reservasi` belum ada.

- [ ] **Step 3: Pasang dependensi, implementasikan, lalu periksa di browser pane**

Run: `pnpm --filter @lantai-dua/web add qrcode@1.5.4 && pnpm --filter @lantai-dua/web add -D @types/qrcode@1.5.6`

Sebelum memasang, pastikan dengan `pnpm view <pkg> time` bahwa kedua versi dirilis ≥ 2 minggu lalu. Kalau belum, pakai versi stabil sebelumnya.

- [ ] **Step 4: Jalankan semua tes**

Run: `pnpm test && pnpm test:rls && pnpm e2e && pnpm typecheck && pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git restore --staged .claude && git commit -m "feat: detail reservasi dengan QR, kalender, pembatalan, dan Reservasi saya"
```

---

## Cakupan desain

| Desain | Task |
|---|---|
| §5.1 formulir: varian, saran B8, tanggal, slot, catatan, URL, konfirmasi | 3, 4 |
| §5.1 alasan slot dan pesan galat | 1, 2, 3, 4 |
| §5.2 detail, QR, kalender, batal | 1, 3, 5 |
| §5.3 Reservasi saya | 5 |
| §5.4 kartu ringkasan Akun | 5 |
| §6.1 tabel, constraint, `is_active`, audit | 1 |
| §6.2 unit yang bisa ditugaskan | 1, 2 |
| §6.3 fungsi | 1, 2 |
| §6.4 RLS | 1 |
| §6.5 kode bersama | 3 |
| §7 tampilan, QR | 4, 5 |
| §8 kriteria selesai | 1–5 |
