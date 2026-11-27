# Fase 1C-2 — Reservasi di Sisi Operator: Rencana Implementasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bagian ini menutup siklus reservasi di toko. Isinya:
- halaman Hari ini untuk operator, yang diperbarui secara realtime;
- pencarian lewat kode, alat scan, atau kamera;
- check-in, Selesai, Tidak datang, dan Batalkan, beserta urungkannya;
- penutupan otomatis dan koreksinya;
- kontak pelanggan sesuai O7;
- nomor WhatsApp wajib sebelum reservasi;
- status baru dan alasan pembatalan dari toko di halaman pelanggan.

**Architecture:**
- **Database.** Satu fungsi `staff_set_reservation_status` memegang semua perpindahan status staf beserta batas waktunya. `reservation_contacts` menjadi satu-satunya jalan operator ke nama dan WhatsApp pelanggan. Job `pg_cron` memanggil `close_overdue_reservations` setiap 15 menit.
- **Realtime.** Tabel `reservations` masuk publikasi `supabase_realtime`. Halaman Hari ini berlangganan perubahannya, lalu memuat ulang data dari server.
- **Kode bersama.** Logika tombol, kode, nomor WhatsApp, dan teks ada di `@lantai-dua/shared`, dengan aturan yang sama persis dengan database.

**Tech Stack:** Sama dengan 1C-1, ditambah `jsqr@1.4.0` untuk scan kamera cadangan, dan extension Postgres `pg_cron`.

**Spec:** [`docs/superpowers/specs/2026-11-27-fase-1c2-operator-reservasi-design.md`](../specs/2026-11-27-fase-1c2-operator-reservasi-design.md). Desain 1C-1 dan PRD §9.2, §9.6, §9.10, §11, dan §13 ikut menjadi dasar.

## Global Constraints

- Semua Global Constraints Fase 0, 1A, 1B, dan 1C-1 tetap berlaku. Di antaranya:
  - Bahasa Indonesia di UI;
  - RLS di semua tabel;
  - secret key tidak pernah dipakai di kode web;
  - target sentuh ≥ 44 px;
  - tanpa scroll horizontal dari 360 px;
  - mode kurangi gerakan dihormati;
  - commit dengan baris `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`;
  - `db push` memakai `--remote`;
  - `.claude/` tidak pernah di-commit (`git restore --staged .claude` setelah `git add -A`).
- **Status hanya berubah lewat fungsi database.** Web tidak pernah memutuskan sendiri apakah sebuah perpindahan boleh. `staffActions` di shared hanya menentukan tombol yang tampil, dan isinya harus sama dengan tabel desain §5.4.
- **Waktu dalam WIB.** "Hari ini" dan "hari sesi" berarti tanggal Asia/Jakarta dari `starts_at` dan dari jam sekarang.
- **Angka dari `store_settings`:**
  - `checkin_open_minutes` 60;
  - `no_show_after_minutes` 15;
  - angka 1C-1 tetap dipakai.

  Angka tetap yang tidak masuk pengaturan:
  - penutupan otomatis 2 jam (R12);
  - job setiap 15 menit;
  - daftar koreksi 7 hari;
  - label "Baru" 15 menit;
  - alasan batal 3–200 karakter;
  - `reservation_contacts` maksimal 200 id.
- **O7:**
  - tidak ada policy baru di `profiles`;
  - nama dan WhatsApp pelanggan untuk staf hanya lewat `reservation_contacts`.
- **Nomor WhatsApp:**
  - disimpan `62…` sesuai `^62[0-9]{8,13}$`;
  - ditampilkan `0812-3456-7890`;
  - ditautkan ke `https://wa.me/62…`.
- **Teks UI** persis seperti desain §5. Contohnya:
  - `Kode reservasi atau scan QR`, `Buka`, `Scan kamera`, `Kode tidak dikenali. Contoh: L2D-H7K3QX9P`, `Arahkan kamera ke QR reservasi`, `QR ini bukan kode reservasi LANTAI DUA.`, `Kamera tidak bisa dipakai. Ketik kodenya saja.`;
  - `Perlu dikoreksi`, `Belum ada reservasi hari ini.`, `Toko tutup hari ini`, `Sekarang`, `Baru`, `Belum ada nomor WhatsApp`;
  - tombol `Check-in`, `Selesai`, `Tidak datang`, `Batalkan`, `Urungkan check-in`, `Urungkan selesai`, `Datang`;
  - `Alasan ini tampil di halaman reservasi pelanggan.`, `Kode reservasi tidak ditemukan`;
  - penanda koneksi `Langsung`, `Menyambung ulang…`, `Terputus`, `Muat ulang`;
  - di sisi pelanggan `Dibatalkan toko`, `Alasan dari toko: …`, `Nomor WhatsApp`, `Dipakai toko kalau perlu ngabarin lu soal reservasi ini.`, `Nomor WhatsApp belum benar. Contoh: 0812-3456-7890`, `Isi nomor WhatsApp dulu.`
- **Akun e2e:**
  - `operator.spec.ts` memakai `operator1@` dan `pelanggan1@`;
  - `reservation.spec.ts` tetap memakai `pelanggan2@` dan `pelanggan3@`.

  Kedua file berjalan paralel (2 worker), jadi keduanya tidak boleh memakai pelanggan yang sama.

## Review Focus

1. **Dua staf menekan tombol berbeda untuk reservasi yang sama di detik yang sama**, misalnya operator menekan Check-in dan pemilik menekan Tidak datang. Hanya satu yang berhasil. Yang lain mendapat "Status reservasi ini baru saja berubah…" dan datanya dimuat ulang. Dites di Task 1 (DB, bersamaan).
2. **Batas waktu ±1 menit dan jam browser yang berbeda dari jam database.** Tombol boleh muncul beberapa detik lebih awal, asalkan penolakan database tampil sebagai pesan dan bukan halaman rusak. Dites di Task 1 (DB, 59 dan 61 menit) dan Task 3 (unit, tepi waktu dengan `now` tetap).
3. **Nomor WhatsApp yang diketik dengan berbagai cara**, misalnya `+62 0812…`, `(0812) 3456.7890`, huruf, terlalu pendek, atau terlalu panjang. Nomor yang sah disimpan sebagai `62…`. Isian lain ditolak sebelum dikirim. Dites di Task 3 (unit) dan Task 4 (e2e).
4. **Koneksi realtime putus**, misalnya laptop tidur atau Wi-Fi hilang. Penanda berubah menjadi Menyambung ulang… lalu Terputus, dan data dimuat ulang saat tersambung lagi atau saat tab kembali aktif. Dites di Task 3 (unit `liveState`) dan Task 6 (e2e penanda Langsung).
5. **Kamera ditolak, tidak ada, atau browser tanpa `BarcodeDetector`.** Pesan jelas tampil, dan kolom kode tetap bisa dipakai. Dites di Task 6 (e2e izin kamera ditolak).

## Keputusan rencana (tambahan dari desain)

- **P1. Dua migrasi:**
  - `reservation_staff` berisi kolom pengaturan, nomor WhatsApp wajib, fungsi status staf, dan kontak;
  - `reservation_auto_close` berisi penutupan otomatis, `pg_cron`, publikasi realtime, dan fungsi pemeriksaan.
- **P2. Cara tes membuat reservasi di waktu tertentu.** Reservasi dibuat lewat `create_reservation` di slot masa depan, lalu `starts_at` dan `ends_at` digeser dengan admin. Trigger 1C-1 ikut menggeser periode item dan kursi. Tes tidak pernah menyisipkan item atau kursi langsung.
  - Dua reservasi yang akan digeser ke jam yang sama harus dibuat di slot yang sama juga, supaya nomor kursinya berbeda.
- **P3. `reservation_ops_check()`.** Fungsi pemeriksaan ini hanya untuk `service_role`, dan mengembalikan jadwal job serta status publikasi. Skema `cron` dan `pg_publication_tables` tidak terbuka lewat API, jadi tes tidak bisa membacanya langsung.
- **P4. Teks galat memakai `formatDuration`.** Hasilnya "Check-in baru bisa mulai 1 jam sebelum sesi." dan "Tidak datang baru bisa ditandai 15 menit setelah sesi mulai." Contoh "60 menit" di desain mengikuti format 1C-1 ("1 jam").
- **P5. `ReservationSettings` mendapat `checkinOpenMinutes` dan `noShowAfterMinutes`.** Setiap select `store_settings` di web ikut menambahkan kedua kolom itu.
- **P6. Helper WhatsApp ada di modul baru `@lantai-dua/shared/whatsapp`,** karena checkout di 1D juga akan memakainya.
- **P7. Akun e2e diberi nomor:**
  - `scripts/seed-users.ts` mengisi nomor fiktif `6281234500001`–`6281234500003` untuk ketiga akun pelanggan;
  - e2e menyamakan nomor lewat `setWhatsapp` di `beforeAll`, supaya tidak bergantung pada seed yang sudah dijalankan ulang;
  - persona tes database `customer` dan `customer2` diberi `6281200000001` dan `6281200000002`.
- **P8. Server mengirim `nowIso` ke komponen klien.** Komponen menghitung ulang tombol dengan `useNow(nowIso, 30_000)`, supaya render server dan klien sama, lalu tombol tetap ikut waktu.
- **P9. Aksi staf memakai Server Action di `app/operator/actions.ts`.** Setelah berhasil, aksi memanggil `refresh()` dari `next/cache`.
- **P10. Muat ulang realtime ditunda 1000 ms.** Status Terputus muncul setelah 20 detik tanpa `SUBSCRIBED`, atau saat channel `CLOSED`. Tombol Muat ulang memanggil `window.location.reload()`.
- **P11. Linimasa dan kartu koreksi memakai komponen baris yang sama,** dengan varian `timeline` dan `correction`.
- **P12. Menu operator tetap hanya "Hari ini".** Detail ada di `/operator/reservasi/[kode]`.

---

## Struktur file

```
supabase/migrations/<ts>_reservation_staff.sql        kolom pengaturan, WA wajib di create_reservation,
                                                      staff_set_reservation_status, reservation_contacts
supabase/migrations/<ts>_reservation_auto_close.sql   close_overdue_reservations, pg_cron, publikasi, reservation_ops_check
packages/db-tests/src/global-setup.ts                 nomor WA persona pelanggan
packages/db-tests/src/clients.ts                      + realtimeFor(persona)
packages/db-tests/src/reservation-fixture.ts          + shiftReservation, setStatusAsAdmin, staffSet, minutesFromNow
packages/db-tests/src/reservation-staff.test.ts       perpindahan, siapa yang boleh, kontak, WA wajib
packages/db-tests/src/reservation-auto-close.test.ts  tutup otomatis, job, publikasi, realtime + RLS
packages/shared/src/whatsapp.ts (+ .test.ts)          normalisasi, format, tautan
packages/shared/src/reservation/staff.ts (+ .test.ts) staffActions, kode, teks galat, linimasa, liveState
packages/shared/src/reservation/{types,rows,status,messages,testing,index}.ts
apps/web/src/lib/reservation-data.ts                  kolom pengaturan baru, cancel_reason, getMyWhatsapp
apps/web/src/lib/operator-data.ts                     data Hari ini, koreksi, detail, jam buka hari ini
apps/web/src/lib/use-now.ts                           useNow
apps/web/src/lib/supabase/browser.ts                  klien browser
apps/web/src/app/(public)/reservasi/baru/{page.tsx,actions.ts}
apps/web/src/components/reservation/{reservation-form.tsx,reservation-card.tsx}
apps/web/src/app/akun/{page.tsx,reservasi/page.tsx,reservasi/[kode]/page.tsx,reservasi/[kode]/kalender/route.ts}
apps/web/src/app/operator/{page.tsx,actions.ts}
apps/web/src/app/operator/reservasi/[kode]/{page.tsx,not-found.tsx}
apps/web/src/components/operator/{code-search,reservation-row,staff-actions,cancel-dialog,live-refresh,code-scanner}.tsx
scripts/seed-users.ts
apps/web/e2e/{admin.ts,reservation.spec.ts,operator.spec.ts}
```

---

### Task 1: Status oleh staf, kontak pelanggan, dan nomor WhatsApp wajib

**Files:**
- Create: `supabase/migrations/<ts>_reservation_staff.sql` (`pnpm exec supabase migration new reservation_staff`)
- Modify: `packages/db-tests/src/global-setup.ts`, `packages/db-tests/src/reservation-fixture.ts`
- Test: `packages/db-tests/src/reservation-staff.test.ts`
- Modify: `packages/shared/src/database.types.ts` (`pnpm db:types`)

**Interfaces:**
- Consumes:
  - dari 1C-1: `reservations`, `reservation_items`, `reservation_seats`, `store_settings`, `profiles`, `public.is_staff()`, `public.current_app_role()`, dan trigger `sync_reservation_children` serta `audit_reservations`;
  - isi lengkap `create_reservation` dari `20261127073352_reservations.sql`, untuk disalin lalu diganti.
- Produces (SQL):

**Kolom baru** `store_settings`:
- `checkin_open_minutes int not null default 60 check (checkin_open_minutes >= 0)`;
- `no_show_after_minutes int not null default 15 check (no_show_after_minutes >= 0)`.

**`create or replace function public.create_reservation(...)`**
- Isinya sama dengan 1C-1, ditambah satu pemeriksaan tepat setelah `not_customer`. Kalau `profiles.whatsapp` milik `auth.uid()` masih null, fungsi memanggil `raise exception 'whatsapp_required' using errcode = 'P0001'`.
- Hak akses tidak berubah, karena `create or replace` mempertahankannya.

**`public.staff_set_reservation_status(p_code text, p_status public.reservation_status, p_reason text default null) returns void`**
- `volatile`, `security definer`, `set search_path = ''`.
- Urutan galat:
  1. `not_staff` kalau `not public.is_staff()`;
  2. `not_found` (baris dikunci `for update`);
  3. aturan perpindahan.
- Tabel perpindahan. `now` adalah `now()`, `hari(x)` adalah `(x at time zone 'Asia/Jakarta')::date`, `open` adalah `checkin_open_minutes`, dan `late` adalah `no_show_after_minutes`.

| Dari → ke | Syarat (galat kalau gagal) |
|---|---|
| `scheduled → checked_in` | `now < ends_at` (`session_over`), lalu `hari(starts_at) = hari(now)` dan `now >= starts_at - open` (`checkin_too_early`) |
| `no_show → checked_in` | `now < ends_at` (`session_over`) |
| `checked_in → scheduled` | `now < ends_at` (`session_over`) |
| `completed → checked_in` | `hari(starts_at) = hari(now)` (`session_over`) |
| `scheduled → no_show` | `now >= starts_at + late` (`no_show_too_early`) |
| `unrecorded → no_show` | – |
| `checked_in → completed` | – |
| `unrecorded → completed` | – |
| `scheduled, checked_in → cancelled` | alasan dulu (`reason_required`), lalu `now < ends_at` (`session_over`) |
| `unrecorded → cancelled` | alasan (`reason_required`) |
| lainnya, termasuk status yang sama | `invalid_transition` |

- Alasan dianggap sah kalau, setelah `btrim`, panjangnya 3–200 karakter.
- Pembatalan menyimpan `cancelled_at = now()`, `cancelled_by = auth.uid()`, dan `cancel_reason` (alasan yang sudah dipangkas). Perpindahan lain tidak mengubah kolom batal.
- `23P01` dari exclusion constraint diubah menjadi `slot_conflict`.
- Execute dicabut dari `public` dan `anon`, lalu diberikan ke `authenticated`.

**`public.reservation_contacts(p_reservation_ids uuid[]) returns table (reservation_id uuid, full_name text, whatsapp text)`**
- `stable`, `security definer`, `set search_path = ''`.
- Galat:
  - `not_staff`;
  - `too_many_ids` kalau `coalesce(array_length(p_reservation_ids, 1), 0) > 200`.
- Isi: `reservations r join profiles p on p.id = r.customer_id where r.id = any (p_reservation_ids)`.
- Execute untuk `authenticated` saja.

**Fixture** (`reservation-fixture.ts`):
- `minutesFromNow(m: number): Date`.
- `shiftReservation(code: string, startsAt: Date, minutes = 30): Promise<void>`: admin mengubah `starts_at` dan `ends_at`.
- `setStatusAsAdmin(code: string, status: string, extra: Record<string, unknown> = {}): Promise<void>`.
- `staffSet(who: Persona | 'anon', code: string, status: string, reason?: string): Promise<{ error: { message: string } | null }>`.
- `booked` dan `bookedPair` adalah helper lokal di file tes (lihat Step 1).
- `global-setup.ts`: `PROFILE_PATCH` bertipe `{ role?: string; is_active?: boolean; whatsapp?: string }`. Isinya `customer: { whatsapp: '6281200000001' }` dan `customer2: { whatsapp: '6281200000002' }`.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
// reservation-staff.test.ts — beforeAll: createReservationFixture(prefix 'rls-<run>-st-'), D = weekdayAhead(2)
// afterEach: deleteReservationsOf([customer, customer2])
// booked(startMin, variant = f.vDuo, who = 'customer'): reserve di slot berikutnya yang belum dipakai pada hari D
//   (10.00, 10.30, …; supaya tidak own_overlap), lalu shiftReservation(code, minutesFromNow(startMin))
// bookedPair([startA, startB]): customer (vDuo) dan customer2 (vSolo) dibuat di slot YANG SAMA, lalu digeser.
//   Pakai ini setiap kali satu tes butuh dua reservasi yang waktunya tumpang tindih setelah digeser (misalnya 59 & 61,
//   14 & 16, −5 & −31). Satu pelanggan tidak boleh punya dua reservasi aktif yang tumpang tindih, dan kursi harus beda (P2).
// Tes yang butuh "hari sesi = hari ini" memakai it.skipIf(nearMidnight) (sisa hari WIB < 90 menit atau sudah lewat < 35 menit).
describe('check-in', () => {
  it.skipIf(nearMidnight)('opens 60 minutes before the session', async () => {
    const [early, onTime] = await bookedPair([61, 59]);
    expect((await staffSet('operator', early, 'checked_in')).error?.message).toBe('checkin_too_early');
    expect((await staffSet('operator', onTime, 'checked_in')).error).toBeNull();
  });
  it('closes when the session ends', async () => { /* booked(-31) → 'session_over' */ });
  it('only opens on the day of the session (WIB)', async () => {
    /* checkin_open_minutes = 3 hari (simpan & kembalikan di finally); reservasi besok → 'checkin_too_early' */
  });
  it('lets a customer marked no-show check in late', async () => { /* booked(-20): no_show ok → checked_in ok */ });
  it.skipIf(nearMidnight)('undoes a check-in until the session ends', async () => {
    /* booked(-5): checked_in → scheduled ok; booked(-31, vSolo) + setStatusAsAdmin checked_in → scheduled 'session_over' */
  });
});
describe('tidak datang', () => {
  it('waits 15 minutes after the start', async () => { /* booked(-14) → 'no_show_too_early'; booked(-16, vSolo) → ok */ });
  it('frees the unit and the seat', async () => { /* setelah no_show: semua item & kursi is_active = false (admin) */ });
});
describe('selesai', () => {
  it('needs a check-in first', async () => { /* booked(-5) scheduled → completed: 'invalid_transition' */ });
  it.skipIf(nearMidnight)('can be undone on the day of the session only', async () => {
    /* booked(-5) checked_in → completed → checked_in ok; reservasi kemarin 14.00 + admin completed → checked_in 'session_over' */
  });
});
describe('batal oleh staf', () => {
  it.each([[undefined], ['  ab  '], ['x'.repeat(201)]])('needs a 3–200 character reason (%#)', async (reason) => {
    expect((await staffSet('operator', await booked(90), 'cancelled', reason)).error?.message).toBe('reason_required');
  });
  it('stores the trimmed reason and who cancelled', async () => {
    /* '  Unit sedang dibersihkan  ' → cancel_reason 'Unit sedang dibersihkan', cancelled_by = operator, cancelled_at terisi */
  });
  it('frees the unit for another customer at the same time', async () => {
    /* reservasi customer vSolo di slotAt(D, '15.00') (tidak digeser) → operator batalkan → reserve('customer2', [vSolo], sama) ok */
  });
  it('works from check-in and from unrecorded, but not after the session', async () => {
    /* booked(-5) checked_in → cancelled ok; kemarin + admin unrecorded → cancelled ok; booked(-31, vSolo) → 'session_over' */
  });
  it('never revives a cancelled reservation', async () => { /* cancelled → checked_in / scheduled: 'invalid_transition' */ });
});
describe('koreksi tidak tercatat', () => {
  it.each(['completed', 'no_show'])('corrects to %s', async (status) => { /* kemarin + admin unrecorded → status ok */ });
});
describe('siapa yang boleh', () => {
  it.each(['customer', 'operatorInactive'] as const)('blocks %s', async (p) => {
    expect((await staffSet(p, await booked(-20), 'no_show')).error?.message).toBe('not_staff');
  });
  it('blocks guests', async () => { /* staffSet('anon', …) → error tidak null */ });
  it('lets the owner act and reports unknown codes', async () => { /* owner no_show ok; kode acak → 'not_found' */ });
  it('lets only one of two simultaneous actions win', async () => {
    const code = await booked(-20);
    const [a, b] = await Promise.all([staffSet('operator', code, 'checked_in'), staffSet('owner', code, 'no_show')]);
    expect([a.error, b.error].filter((e) => e === null)).toHaveLength(1);
    expect([a.error?.message, b.error?.message]).toContain('invalid_transition');
  });
  it('blocks direct status updates', async () => { /* operator update reservations langsung → 0 baris / error */ });
});
describe('kontak pelanggan (O7)', () => {
  it('gives staff the name and WhatsApp of each reservation owner', async () => {
    /* operator rpc reservation_contacts([id]) → [{ reservation_id, full_name: 'Tes customer', whatsapp: '6281200000001' }] */
  });
  it.each(['customer', 'operatorInactive'] as const)('refuses %s', async (p) => { /* 'not_staff' */ });
  it('refuses more than 200 ids', async () => { /* 201 uuid acak → 'too_many_ids' */ });
  it('keeps profiles closed to operators', async () => { /* operator select profiles eq id customer → [] */ });
});
describe('nomor WhatsApp wajib', () => {
  it('refuses a customer without a number', async () => {
    /* admin set whatsapp customer2 null; reserve('customer2') → 'whatsapp_required'; kembalikan nomor di finally */
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @lantai-dua/db-tests exec vitest run src/reservation-staff.test.ts`
Expected: FAIL, karena `staff_set_reservation_status` tidak ditemukan.

- [ ] **Step 3: Tulis migrasi, lalu kirim**

Run: `pnpm exec supabase db push --remote --yes`

- [ ] **Step 4: Jalankan semua tes database dan generate ulang tipe**

Run: `pnpm test:rls && pnpm db:types && pnpm typecheck`
Expected: PASS. Tes reservasi 1C-1 tetap lulus karena persona pelanggan sudah punya nomor. `database.types.ts` memuat kedua kolom dan kedua fungsi baru.

- [ ] **Step 5: Commit**

```bash
git add -A && git restore --staged .claude && git commit -m "feat: status reservasi oleh staf, kontak pelanggan, dan nomor WhatsApp wajib"
```

---

### Task 2: Tutup otomatis, job terjadwal, dan publikasi realtime

**Files:**
- Create: `supabase/migrations/<ts>_reservation_auto_close.sql`
- Modify: `packages/db-tests/src/clients.ts`
- Test: `packages/db-tests/src/reservation-auto-close.test.ts`
- Modify: `packages/shared/src/database.types.ts`

**Interfaces:**
- Consumes: semua helper fixture dari Task 1, `opening_hours`, dan `store_closures`.
- Produces (SQL):
  - `create extension if not exists pg_cron with schema pg_catalog;` Kalau Supabase hosted meminta cara lain, ikuti dokumentasinya dan catat sebagai ruling.
  - **`public.close_overdue_reservations() returns int`**:
    - `security definer`, `set search_path = ''`. Execute dicabut dari `public`, `anon`, dan `authenticated`, lalu diberikan ke `service_role`.
    - Memproses reservasi `scheduled` dan `checked_in` dengan `starts_at < now()` dan `now() >= batas`. **Batas** adalah `greatest(tutup + interval '2 hours', ends_at + interval '2 hours')`, dengan `tutup = (hari(starts_at) + opening_hours.closes_at) at time zone 'Asia/Jakarta'` untuk `isodow` hari itu. Kalau `closes_at` null, `tutup` diganti `ends_at`.
    - Baris dikunci dengan `for update skip locked`. `checked_in` menjadi `completed`, dan `scheduled` menjadi `unrecorded`.
    - Mengembalikan jumlah baris yang diubah.
  - `select cron.schedule('tutup-reservasi-terlewat', '*/15 * * * *', $$select public.close_overdue_reservations()$$);`
  - `alter publication supabase_realtime add table public.reservations;`
  - **`public.reservation_ops_check() returns table (job_schedule text, job_active boolean, realtime_published boolean)`**: `security definer`, hanya untuk `service_role` (P3). Isinya membaca `cron.job` dengan nama job di atas, dan `pg_publication_tables` untuk `supabase_realtime` / `public.reservations`.
- Produces (TS): `realtimeFor(persona: Persona): SupabaseClient` di `clients.ts`. Isinya `clientFor(persona)` ditambah `realtime.setAuth(accessToken)`.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
// reservation-auto-close.test.ts — fixture sendiri (prefix 'rls-<run>-ac-'), afterEach hapus reservasi customer & customer2
// yesterday(hhmm) = new Date(slotAt(-1, hhmm)); close() = adminClient().rpc('close_overdue_reservations')
// Job asli juga berjalan di database dev, jadi tes hanya memeriksa status akhir, bukan jumlah baris.
it('completes check-ins and marks scheduled as unrecorded after closing time', async () => {
  // customer vSolo & customer2 vDuo dibuat di slot yang SAMA, lalu keduanya digeser ke kemarin 14.00 (P2)
  // admin: yang pertama → checked_in; close(); status: completed & unrecorded; semua item is_active = false
});
it('leaves sessions that ended less than two hours ago', async () => {
  /* shift ke minutesFromNow(-40) → close() → tetap 'scheduled' */
});
it('leaves final statuses alone and gives the same result twice', async () => {
  /* kemarin + admin cancelled → close() dua kali → tetap 'cancelled'; reservasi kemarin lain → 'unrecorded' setelah dua kali */
});
it('cannot be run by signed-in users', async () => {
  /* clientFor('owner').rpc('close_overdue_reservations') → error */
});
it('runs every 15 minutes and publishes reservations for realtime', async () => {
  const { data } = await adminClient().rpc('reservation_ops_check');
  expect(data).toEqual([{ job_schedule: '*/15 * * * *', job_active: true, realtime_published: true }]);
});
it('sends reservation changes to staff but not to other customers', async () => {
  // realtimeFor('operator') dan realtimeFor('customer2') berlangganan postgres_changes UPDATE public.reservations
  // tunggu keduanya SUBSCRIBED (≤ 10 dtk); admin ubah note reservasi milik customer
  // operator menerima event dengan new.id itu (≤ 10 dtk); customer2 tidak menerima apa pun dalam 5 dtk
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @lantai-dua/db-tests exec vitest run src/reservation-auto-close.test.ts`
Expected: FAIL, karena `close_overdue_reservations` tidak ditemukan.

- [ ] **Step 3: Tulis migrasi, lalu kirim**

Run: `pnpm exec supabase db push --remote --yes`

- [ ] **Step 4: Jalankan semua tes database dan generate ulang tipe**

Run: `pnpm test:rls && pnpm db:types && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git restore --staged .claude && git commit -m "feat: tutup otomatis reservasi lewat pg_cron dan publikasi realtime"
```

---

### Task 3: Logika bersama untuk operator, status, dan nomor WhatsApp

**Files:**
- Create: `packages/shared/src/whatsapp.ts`, `packages/shared/src/whatsapp.test.ts`
- Modify: `packages/shared/package.json` (export `"./whatsapp": "./src/whatsapp.ts"`)
- Create: `packages/shared/src/reservation/staff.ts`, `packages/shared/src/reservation/staff.test.ts`
- Modify: `packages/shared/src/reservation/{types,rows,status,messages,testing,index}.ts` beserta tesnya
- Modify: `apps/web/src/lib/reservation-data.ts`, yaitu select `store_settings` (P5) dan `RESERVATION_SELECT` ditambah `cancel_reason`

**Interfaces:**
- Consumes: `database.types.ts` dari Task 1 dan 2, serta `formatDuration` dan `wibDate`.
- Produces:

```ts
// @lantai-dua/shared/whatsapp
export function normalizeWhatsapp(input: string): string | null; // → '62…' atau null
export function formatWhatsapp(stored: string): string;          // '6281234567890' → '0812-3456-7890'
export function whatsappLink(stored: string): string;            // 'https://wa.me/6281234567890'
export const WHATSAPP_INVALID = 'Nomor WhatsApp belum benar. Contoh: 0812-3456-7890';

// types.ts (tambahan)
ReservationSettings: + checkinOpenMinutes: number; noShowAfterMinutes: number;
ReservationView: + cancelReason: string | null;
ReservationRowWithItems: + cancel_reason: string | null;
export type StaffAction = 'check_in' | 'complete' | 'no_show' | 'cancel' | 'undo_check_in' | 'undo_complete' | 'attended';
export type OperatorItem = { name: string; unitCode: string | null; areaName: string | null };
export type OperatorReservation = Omit<ReservationView, 'items'> & {
  items: OperatorItem[]; customerName: string; whatsapp: string | null; hygieneNotes: string[]; createdAt: string;
};
export type OperatorReservationRow = ReservationRowWithItems & { created_at: string;
  reservation_items: { variant: { name: string; product: { model_name: string; brand: { name: string } | null;
    category: { hygiene_note: string | null } | null } | null } | null;
    unit: { code: string; area: { name: string } | null } | null }[] };
export type LiveState = 'live' | 'reconnecting' | 'offline';

// staff.ts
export const STAFF_ACTION: Record<StaffAction, { to: ReservationStatus; label: string; minor: boolean }>;
export function staffActions(r: Pick<ReservationView, 'status' | 'startsAt' | 'endsAt'>, s: ReservationSettings, now: Date): StaffAction[];
export function normalizeReservationCode(input: string): string | null;
export const CODE_INVALID = 'Kode tidak dikenali. Contoh: L2D-H7K3QX9P';
export function cleanCancelReason(input: string): string | null;   // btrim, 3–200, selain itu null
export function staffErrorText(code: string, s: ReservationSettings): string;
export function groupByHour<T extends { startsAt: string }>(list: T[]): { hour: string; items: T[] }[]; // "14.00", urut
export function statusCounts(list: { status: ReservationStatus }[]): Record<ReservationStatus, number>;
export function isRecent(createdAt: string, now: Date): boolean;   // < 15 menit → label "Baru"
export function liveState(channelStatus: string, notLiveForMs: number): LiveState;
export const LIVE_TEXT: Record<LiveState, string>;                 // Langsung / Menyambung ulang… / Terputus

// status.ts
export function isLive(r: Pick<ReservationView, 'status' | 'endsAt'>, now: Date): boolean; // aktif dan belum berakhir
reservationStatusLabel(status, endsAt, now, cancelReason: string | null = null) // cancelled + alasan → 'Dibatalkan toko'

// messages.ts: createErrorText('whatsapp_required') → 'Isi nomor WhatsApp dulu.'
// rows.ts
fromSettingsRow(row) // + checkin_open_minutes, no_show_after_minutes
fromReservationRow(row) // + cancelReason
export function fromOperatorRow(row: OperatorReservationRow, contact: { full_name: string; whatsapp: string | null } | undefined): OperatorReservation;
// testing.ts: SETTINGS + checkinOpenMinutes: 60, noShowAfterMinutes: 15
```

Aturan `staffActions` meniru tabel Task 1. Urutannya: aksi utama, lalu `cancel`, lalu aksi `minor`.
- `scheduled`: `check_in` (hari sesi = hari ini, `now ≥ start − open`, `now < end`), `no_show` (`now ≥ start + late`), dan `cancel` (`now < end`).
- `checked_in`: `complete`, `cancel` (`now < end`), dan `undo_check_in` (`now < end`).
- `completed`: `undo_complete` (hari sesi = hari ini).
- `no_show`: `check_in` (`now < end`).
- `unrecorded`: `attended`, `no_show`, dan `cancel`.
- `cancelled`: tidak ada.

Label `STAFF_ACTION`: Check-in, Selesai, Tidak datang, Batalkan, Urungkan check-in, Urungkan selesai, dan Datang. `minor` bernilai true hanya untuk `undo_*`.

Teks `staffErrorText`:

| Kode | Teks |
|---|---|
| `invalid_transition` | Status reservasi ini baru saja berubah. Data sudah dimuat ulang. |
| `checkin_too_early` | Check-in baru bisa mulai `<formatDuration(open)>` sebelum sesi. |
| `no_show_too_early` | Tidak datang baru bisa ditandai `<formatDuration(late)>` setelah sesi mulai. |
| `session_over` | Sesi ini sudah berakhir. |
| `reason_required` | Tulis alasan pembatalan (3–200 karakter). |
| `slot_conflict` | Unit atau meja untuk sesi ini sudah terpakai. |
| `not_staff` | Aksi ini hanya untuk staf toko. |
| `not_found` | Kode reservasi tidak ditemukan. |
| lainnya | Gagal menyimpan. Coba lagi sebentar. |

`fromOperatorRow`:
- `customerName` diambil dari `contact.full_name`, atau `'Pelanggan'` kalau kosong.
- `hygieneNotes` berisi `hygiene_note` unik yang tidak null, dalam urutan item.
- `areaName` diambil per unit.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
// whatsapp.test.ts
it.each([
  ['0812-3456-7890'], ['+62 812 3456 7890'], ['62812 3456 7890'], ['+62 0812-3456-7890'], ['(0812) 3456.7890'],
])('normalizes %s', (input) => expect(normalizeWhatsapp(input)).toBe('6281234567890'));
it.each([[''], ['12345'], ['0812-abc-7890'], ['812345678'], ['0812345'], ['0812345678901234']])(
  'rejects %j', (input) => expect(normalizeWhatsapp(input)).toBeNull());
it.each([['6281234567890', '0812-3456-7890'], ['628123456789', '0812-3456-789'], ['6281234567', '0812-3456-7']])(
  'formats %s as %s', (stored, shown) => expect(formatWhatsapp(stored)).toBe(shown));
it('links to wa.me', () => expect(whatsappLink('6281234567890')).toBe('https://wa.me/6281234567890'));

// staff.test.ts — sesi Sab 28 Nov 2026 14.00–14.30 WIB; at('13.01') = Date WIB hari itu
const r = (status: ReservationStatus) => ({ status, startsAt: '2026-11-28T07:00:00Z', endsAt: '2026-11-28T07:30:00Z' });
it.each([
  ['scheduled', '12.59', ['cancel']],
  ['scheduled', '13.01', ['check_in', 'cancel']],
  ['scheduled', '14.16', ['check_in', 'no_show', 'cancel']],
  ['scheduled', '14.31', ['no_show']],
  ['checked_in', '14.10', ['complete', 'cancel', 'undo_check_in']],
  ['checked_in', '14.31', ['complete']],
  ['completed', '20.00', ['undo_complete']],
  ['no_show', '14.20', ['check_in']],
  ['no_show', '14.31', []],
  ['unrecorded', '20.00', ['attended', 'no_show', 'cancel']],
  ['cancelled', '14.10', []],
] as const)('%s at %s offers %j', (status, time, expected) =>
  expect(staffActions(r(status), SETTINGS, at(time))).toEqual(expected));
it('offers no undo for a completed session the next day', () => { /* now = 29 Nov 10.00 WIB → [] */ });
it('does not open check-in for tomorrow even within the hour', () => {
  /* sesi 29 Nov 00.30 WIB, now 28 Nov 23.45 WIB → ['cancel'] */
});
it('reads the windows from settings', () => { /* checkinOpenMinutes 30: 13.20 → ['cancel'] */ });
it.each([['l2d-f6w859e4'], ['F6W859E4'], ['L2D F6W8 59E4'], [' l2df6w859e4 ']])('normalizes code %j', (input) =>
  expect(normalizeReservationCode(input)).toBe('L2D-F6W859E4'));
it.each([['L2D-F6W859E'], ['L2D-F6W859E0'], ['hello'], ['']])('rejects code %j', (input) =>
  expect(normalizeReservationCode(input)).toBeNull());
it('trims and limits a cancel reason', () => { /* '  ab ' → null; ' Unit rusak ' → 'Unit rusak'; 201 → null; 200 → ok */ });
it('words errors with the stored windows', () => {
  expect(staffErrorText('checkin_too_early', SETTINGS)).toBe('Check-in baru bisa mulai 1 jam sebelum sesi.');
  expect(staffErrorText('no_show_too_early', SETTINGS)).toBe('Tidak datang baru bisa ditandai 15 menit setelah sesi mulai.');
  expect(staffErrorText('apa-ini', SETTINGS)).toBe('Gagal menyimpan. Coba lagi sebentar.');
});
it('groups by WIB hour and counts statuses', () => { /* 14.00 & 14.30 → satu grup '14.00'; 09.00 UTC → '16.00'; urut */ });
it('marks reservations made in the last 15 minutes as new', () => { /* 14 mnt → true, 16 mnt → false */ });
it.each([
  ['SUBSCRIBED', 0, 'live'], ['CHANNEL_ERROR', 5_000, 'reconnecting'], ['TIMED_OUT', 19_999, 'reconnecting'],
  ['CHANNEL_ERROR', 20_000, 'offline'], ['CLOSED', 0, 'offline'],
] as const)('maps %s after %d ms to %s', (s, ms, expected) => expect(liveState(s, ms)).toBe(expected));

// status.test.ts (tambahan)
it('calls a cancellation with a reason "Dibatalkan toko"', () => { /* cancelled + 'Unit rusak' → 'Dibatalkan toko' */ });
it('treats only active, unfinished reservations as live', () => { /* scheduled & checked_in sebelum akhir → true; setelah akhir, completed, cancelled → false */ });
// rows.test.ts (tambahan)
it('maps an operator row with contact, areas, and unique hygiene notes', () => { /* dua item headset → satu catatan; tanpa kontak → 'Pelanggan', whatsapp null */ });
it('reads the new settings columns and the cancel reason', () => { /* … */ });
// messages.test.ts (tambahan)
it('asks for a WhatsApp number', () => expect(createErrorText('whatsapp_required', null, SETTINGS)).toBe('Isi nomor WhatsApp dulu.'));
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @lantai-dua/shared test`
Expected: FAIL, karena `whatsapp.ts` dan `staff.ts` belum ada.

- [ ] **Step 3: Tulis modul, ekspor, dan sesuaikan select di `reservation-data.ts`**

- [ ] **Step 4: Jalankan tes dan pemeriksaan tipe**

Run: `pnpm --filter @lantai-dua/shared test && pnpm typecheck && pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git restore --staged .claude && git commit -m "feat: logika bersama operator, status baru, dan nomor WhatsApp"
```

---

### Task 4: Sisi pelanggan: nomor WhatsApp, status baru, dan pembatalan dari toko

**Files:**
- Modify: `apps/web/src/lib/reservation-data.ts`, ditambah `getMyWhatsapp(): Promise<string | null>` (null juga untuk tamu)
- Modify: `apps/web/src/app/(public)/reservasi/baru/{page.tsx,actions.ts}`, `apps/web/src/components/reservation/reservation-form.tsx`
- Modify: `apps/web/src/app/akun/reservasi/[kode]/page.tsx`, `.../[kode]/kalender/route.ts`, `apps/web/src/app/akun/reservasi/page.tsx`, `apps/web/src/app/akun/page.tsx`, `apps/web/src/components/reservation/reservation-card.tsx`
- Modify: `scripts/seed-users.ts`, `apps/web/e2e/admin.ts`
- Test: `apps/web/e2e/reservation.spec.ts`

**Interfaces:**
- Consumes: `normalizeWhatsapp`, `WHATSAPP_INVALID`, `isLive`, `reservationStatusLabel(…, cancelReason)`, dan `createErrorText('whatsapp_required')` dari Task 3.
- Produces:
  - `createReservationAction(input: { skus: string[]; startsAt: string; note: string; whatsapp?: string })`. Kalau `whatsapp` ada:
    1. dinormalisasi; kalau tidak sah, aksi mengembalikan `WHATSAPP_INVALID`;
    2. disimpan dengan `update profiles set whatsapp where id = <sub>` (policy "ubah milik sendiri"); kalau gagal, aksi mengembalikan "Gagal menyimpan. Coba lagi sebentar.";
    3. baru setelah itu `create_reservation` dipanggil.
  - `ReservationForm` mendapat prop `needsWhatsapp: boolean`. Halaman mengisinya `viewer === 'customer' && (await getMyWhatsapp()) === null`.
    - Kolom `Nomor WhatsApp` memakai `type="tel"`, `inputMode="tel"`, dan `autoComplete="tel"`. Letaknya di atas tombol Konfirmasi, dengan bantuan "Dipakai toko kalau perlu ngabarin lu soal reservasi ini."
    - Isian diperiksa `normalizeWhatsapp` sebelum aksi dipanggil. Kalau tidak sah, `aria-invalid` dipasang dan pesannya ditautkan lewat `aria-describedby`.
    - Isian tidak masuk URL atau `sessionStorage`.
  - Detail pelanggan:
    - label memakai `cancelReason`;
    - kotak `Alasan dari toko: <alasan>` tampil kalau `cancelReason` ada;
    - QR dan kedua tautan kalender tampil hanya kalau `isLive`.
  - Rute `.ics` mengembalikan 404 kalau `!isLive`.
  - Mendatang (`/akun/reservasi`), kartu `/akun`, dan hitungan aktif di `/reservasi/baru` memakai `isLive`.
  - `e2e/admin.ts`:
    - `setWhatsapp(email: string, whatsapp: string | null): Promise<void>`;
    - `shiftReservation(code: string, startsAt: Date, minutes = 30): Promise<void>`;
    - `updateReservation(code: string, patch: Record<string, unknown>): Promise<void>`;
    - `minutesFromNow(m: number): Date`;
    - `reserveAs(email, skus, startsAt, note?: string)`, dengan parameter `note` yang baru.
  - `seed-users.ts`: pelanggan1–3 mendapat `whatsapp` `6281234500001`–`6281234500003` (P7). Jalankan `pnpm db:seed-users`.

- [ ] **Step 1: Tulis tes e2e yang gagal**

```ts
// reservation.spec.ts — beforeAll file: setWhatsapp(pelanggan2 → '6281234500002', pelanggan3 → '6281234500003')
test.describe('nomor WhatsApp', () => {
  test.describe.configure({ mode: 'serial' });
  // beforeAll: clearReservations([CUSTOMER]); setWhatsapp(CUSTOMER, null). afterAll: setWhatsapp(CUSTOMER, '6281234500003'); clearReservations
  test('asks for a number before the first reservation', async ({ page }) => {
    // login CUSTOMER → /reservasi/baru?varian=<sku>&tanggal=wibDateIn(5) → pilih jam kosong pertama
    // isi 'Nomor WhatsApp' '0812-abc' → Konfirmasi → teks 'Nomor WhatsApp belum benar. Contoh: 0812-3456-7890'
    // isi '0812 3450 0003' → Konfirmasi → URL /akun/reservasi/L2D-… ; admin: profiles.whatsapp = '6281234500003'
  });
  test('does not ask again once saved', async ({ page }) => {
    // /reservasi/baru → getByLabel('Nomor WhatsApp') tidak ada
  });
});
test.describe('status dari toko', () => {
  test.describe.configure({ mode: 'serial' });
  // akun OTHER (pelanggan2); reservasi dibuat lewat reserveAs di wibDateIn(6)
  test('shows a store cancellation with its reason and no QR', async ({ page }) => {
    // updateReservation(code, { status: 'cancelled', cancelled_at: now, cancel_reason: 'Unit sedang dibersihkan' })
    // detail: 'Dibatalkan toko', 'Alasan dari toko: Unit sedang dibersihkan', tanpa img QR, tanpa 'Unduh ke kalender (.ics)'
    // request GET /akun/reservasi/<code>/kalender → 404
  });
  test('keeps a checked-in session in Mendatang with its QR', async ({ page }) => {
    // reservasi baru → shiftReservation ke minutesFromNow(-5) → updateReservation({ status: 'checked_in' })
    // /akun/reservasi: kode ada di bagian Mendatang; detail: label 'Check-in' dan QR tampil
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @lantai-dua/web exec playwright test e2e/reservation.spec.ts`
Expected: FAIL, karena kolom `Nomor WhatsApp` dan teks `Dibatalkan toko` belum ada. Tes 1C-1 yang lain tetap lulus.

- [ ] **Step 3: Terapkan perubahan halaman, aksi, seed, dan helper e2e; jalankan `pnpm db:seed-users`**

- [ ] **Step 4: Jalankan tes**

Run: `pnpm --filter @lantai-dua/web exec playwright test e2e/reservation.spec.ts && pnpm typecheck && pnpm check`
Expected: PASS, termasuk semua tes 1C-1 di file itu.

- [ ] **Step 5: Commit**

```bash
git add -A && git restore --staged .claude && git commit -m "feat: nomor WhatsApp di formulir reservasi dan status dari toko di sisi pelanggan"
```

---

### Task 5: Halaman operator Hari ini, cari kode, detail, dan aksi status

**Files:**
- Create: `apps/web/src/lib/operator-data.ts`, `apps/web/src/lib/use-now.ts`
- Create: `apps/web/src/app/operator/actions.ts`, `apps/web/src/app/operator/reservasi/[kode]/page.tsx`, `apps/web/src/app/operator/reservasi/[kode]/not-found.tsx`
- Modify: `apps/web/src/app/operator/page.tsx`
- Create: `apps/web/src/components/operator/{code-search,reservation-row,staff-actions,cancel-dialog}.tsx`
- Test: `apps/web/e2e/operator.spec.ts`

**Interfaces:**
- Consumes: semua fungsi Task 3, `getStoreInfo`, `formatSession`, `slotTime`, `addDays`, `wibDate`, `DashboardTitle`, `Notice`, `Button`, `StatusLine`, dan helper e2e Task 4.
- Produces:

```ts
// lib/operator-data.ts (server)
export async function listTodayForOperator(today: string): Promise<OperatorReservation[]>;   // starts_at di [today 00.00, besok 00.00) WIB, urut
export async function listUnrecorded(today: string): Promise<OperatorReservation[]>;          // status unrecorded, starts_at ≥ today−7 hari, paling lama dulu
export async function getOperatorReservation(code: string): Promise<OperatorReservation | null>; // null untuk kode tidak sah / tidak ada
export async function getOpeningToday(today: string): Promise<{ opens: string; closes: string } | null>; // "10.00", null kalau tutup/libur
// select: OPERATOR_SELECT = RESERVATION_SELECT + created_at, cancel_reason, product.category:categories(hygiene_note)
// kontak: satu panggilan reservation_contacts untuk semua id dalam daftar
// lib/use-now.ts (client)
export function useNow(initialIso: string, intervalMs: number): Date;
// app/operator/actions.ts
export async function runStaffAction(input: { code: string; action: StaffAction; reason?: string }):
  Promise<{ ok: true } | { ok: false; error: string }>; // STAFF_ACTION[action].to → rpc; berhasil atau gagal → refresh(); galat → staffErrorText
// components/operator
CodeSearch()                                            // client; label "Kode reservasi"; Enter/Buka → router.push; fokus otomatis ≥ 768 px
ReservationRow({ r, settings, nowIso, variant: 'timeline' | 'correction' })
StaffActions({ code, status, startsAt, endsAt, settings, nowIso, place: 'row' | 'detail' }) // row tanpa cancel; minor kecil di bawah
CancelDialog({ code, onDone })                          // <dialog>, textarea maxLength 200, cleanCancelReason di klien
```

**Halaman `/operator`:**
- Isinya sesuai desain §5.1:
  - kepala dengan tanggal `formatSession`-style ("Jum, 27 Nov 2026") dan jam buka dari `getOpeningToday`;
  - `CodeSearch`;
  - bagian `Perlu dikoreksi (n)` kalau ada isinya;
  - ringkasan dari `statusCounts`;
  - linimasa dari `groupByHour`. Grup yang memuat jam sekarang diberi label `Sekarang`.
- Baris berstatus `cancelled` memakai `opacity-60` tanpa tombol.
- Pelanggan tanpa nomor menampilkan `Belum ada nomor WhatsApp`, tanpa tautan.
- Linimasa kosong menampilkan `Belum ada reservasi hari ini.`
- Aksi di linimasa dan detail dijalankan dalam `startTransition` dengan try/catch, lalu pesan galat tampil di `Notice` dekat tombol.

**Halaman detail:**
- Isinya sesuai desain §5.3, dengan tautan `← Hari ini`. Pembatalan oleh pelanggan ditulis `Dibatalkan pelanggan`.
- `notFound()` menampilkan `not-found.tsx` berisi "Kode reservasi tidak ditemukan" dan `CodeSearch`.

- [ ] **Step 1: Tulis tes e2e yang gagal**

```ts
// operator.spec.ts — serial; OPERATOR = operator1@, CUSTOMER = pelanggan1@ (Raka Pratama)
// beforeAll: clearReservations([CUSTOMER]); setWhatsapp(CUSTOMER, '6281234500001'). afterAll: clearReservations([CUSTOMER])
// at(min) = max(now + min menit, awal hari ini WIB) — supaya sesi "sedang berjalan" tetap hari ini setelah tengah malam
// make(skus, startDate, note?) = reserveAs(CUSTOMER, skus, startsAtOn(wibDateIn(9), '12.00'), note) lalu shiftReservation
// Satu pelanggan hanya boleh punya satu reservasi aktif di satu waktu: tes berurutan dan menutup reservasinya sendiri.
const HEADSET = 'L2-DBE-GS1XPRO-STD';
test('shows today\'s reservation with contact, units, hygiene note, and note', async ({ page }) => {
  // make([HEADSET, 'L2-KCH-K8PRO-BRN'], at(-5), 'Bawa mouse lama') → login OPERATOR → /operator
  // baris berisi: 'Raka Pratama', tautan wa.me/6281234500001 bertuliskan '0812-3450-0001',
  // variantLabelOf(HEADSET), 'DM-H-001', 'Meja Kontrol', 'Pasang cover telinga sekali pakai sebelum dipakai pelanggan.',
  // 'Bawa mouse lama', status 'Terjadwal', label 'Baru'
});
test('checks in and completes from the timeline, with undo', async ({ page }) => {
  // reservasi tes sebelumnya: Check-in → status 'Check-in'; Selesai → 'Selesai'; tombol 'Urungkan selesai' tampil
});
test('marks a no-show on the detail page and still lets a late customer in', async ({ page }) => {
  // make(['L2-RKG-M75-BLK-VIR'], at(-20)) → /operator/reservasi/<kode> → Tidak datang → 'Tidak datang'; tombol 'Check-in' tampil
  // lalu updateReservation(code, { status: 'cancelled', cancel_reason: 'bersih-bersih tes' }) supaya tidak menghalangi tes berikutnya
});
test('cancels with a reason that the customer can read', async ({ page, browser }) => {
  // make(['L2-RZR-DAV3PRO-BLK'], at(90)) → detail → Batalkan → kirim kosong → 'Tulis alasan pembatalan (3–200 karakter).'
  // isi 'Unit sedang dibersihkan' → status 'Dibatalkan'; konteks baru login CUSTOMER → /akun/reservasi/<kode>
  // → 'Dibatalkan toko' dan 'Alasan dari toko: Unit sedang dibersihkan'
});
test('opens a reservation from a typed code and explains bad ones', async ({ page }) => {
  // ketik kode tes huruf kecil tanpa 'L2D-' + Enter → URL /operator/reservasi/L2D-…
  // ketik 'zzz' → 'Kode tidak dikenali. Contoh: L2D-H7K3QX9P'; buka /operator/reservasi/L2D-22222222 → 'Kode reservasi tidak ditemukan'
});
test('lists unrecorded reservations for correction', async ({ page }) => {
  // make(['L2-PRS-ESS75HE-SBK'], kemarin 14.00 WIB) → updateReservation({ status: 'unrecorded' })
  // /operator: bagian 'Perlu dikoreksi' memuat 'Raka Pratama' → Datang → bagian itu tidak memuat kode lagi; admin: status 'completed'
});
test('keeps customers out of the operator pages', async ({ page }) => {
  // login CUSTOMER → goto /operator → URL /akun
});
test('fits a 360 px screen', async ({ page }) => {
  // viewport 360×800 → /operator → document.documentElement.scrollWidth ≤ 360
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @lantai-dua/web exec playwright test e2e/operator.spec.ts`
Expected: FAIL, karena `/operator` masih menampilkan EmptyState.

- [ ] **Step 3: Tulis data, aksi, halaman, dan komponen**

Sebelum menulis kode web, baca `apps/web/node_modules/next/dist/docs/` untuk `not-found`, `useRouter` / `refresh`, dan Server Actions.

- [ ] **Step 4: Jalankan tes**

Run: `pnpm --filter @lantai-dua/web exec playwright test e2e/operator.spec.ts e2e/auth.spec.ts && pnpm typecheck && pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git restore --staged .claude && git commit -m "feat: Hari ini untuk operator dengan cari kode, detail, dan aksi status"
```

---

### Task 6: Pembaruan realtime dan scan kamera

**Files:**
- Create: `apps/web/src/lib/supabase/browser.ts`
- Create: `apps/web/src/components/operator/{live-refresh,code-scanner}.tsx`
- Modify: `apps/web/src/app/operator/page.tsx` (pasang `LiveRefresh` dan `CodeScanner`), `apps/web/package.json` (`jsqr@1.4.0`)
- Test: `apps/web/e2e/operator.spec.ts`

**Interfaces:**
- Consumes: `liveState`, `LIVE_TEXT`, `normalizeReservationCode`, `CODE_INVALID`, `publicEnv()`, dan helper e2e.
- Produces:
  - `createBrowserSupabase()`: satu instance `createBrowserClient<Database>(url, key)` untuk tab ini.
  - `LiveRefresh()`:
    - berlangganan channel `operator-hari-ini`, `postgres_changes` `{ event: '*', schema: 'public', table: 'reservations' }`;
    - setiap event memicu `router.refresh()` setelah jeda 1000 ms;
    - INSERT yang `starts_at`-nya hari ini menambah hitungan, yang dibacakan lewat `aria-live="polite"` ("1 reservasi baru");
    - penanda koneksi dari `liveState` (P10). Saat Terputus tampil tombol Muat ulang;
    - `visibilitychange` ke `visible` dan kembalinya status `SUBSCRIBED` setelah tidak live memicu `router.refresh()`;
    - channel dilepas saat unmount.
  - `CodeScanner()`:
    - tombol `Scan kamera` tampil setelah mount, kalau `window.isSecureContext && navigator.mediaDevices?.getUserMedia`;
    - dialog berisi `<video playsInline muted>` dari `getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })`;
    - setiap 250 ms, gambar dibaca `BarcodeDetector` (kalau ada dan mendukung `qr_code`) atau `import('jsqr')` lewat canvas;
    - hasil `normalizeReservationCode` yang sah menghentikan semua track, lalu `router.push('/operator/reservasi/<kode>')`;
    - hasil lain menampilkan `QR ini bukan kode reservasi LANTAI DUA.` dan pemindaian berlanjut;
    - galat `getUserMedia` apa pun menampilkan `Kamera tidak bisa dipakai. Ketik kodenya saja.`;
    - track berhenti saat dialog ditutup atau saat unmount.

- [ ] **Step 1: Tulis tes e2e yang gagal**

```ts
// operator.spec.ts (tambahan, tetap serial)
test('shows a new reservation without reloading', async ({ page }) => {
  // login OPERATOR → /operator → tunggu 'Langsung' (≤ 15 dtk)
  // make(['L2-VTX-IGNIXR1PRO-BLK'], at(-5)) dari tes (admin) → kode itu muncul di linimasa ≤ 10 dtk, tanpa page.reload()
  // bersihkan: updateReservation(code, { status: 'cancelled', cancel_reason: 'bersih-bersih tes' })
});
test('explains a blocked camera and keeps the code field usable', async ({ page }) => {
  // context tanpa izin kamera → Scan kamera → 'Kamera tidak bisa dipakai. Ketik kodenya saja.' → tutup dialog
  // kolom 'Kode reservasi' tetap bisa diisi dan Buka bekerja
});
test('opens the camera dialog with a fake camera', async ({ browser }) => {
  // browser.newContext({ permissions: ['camera'] }) dengan project/launch args --use-fake-device-for-media-stream
  // (atur di test.use untuk tes ini saja) → Scan kamera → 'Arahkan kamera ke QR reservasi' dan elemen video tampil → Tutup
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @lantai-dua/web exec playwright test e2e/operator.spec.ts`
Expected: FAIL, karena teks `Langsung` dan tombol `Scan kamera` belum ada.

- [ ] **Step 3: Tambah `jsqr@1.4.0`, lalu tulis klien browser dan kedua komponen**

Run: `pnpm --filter @lantai-dua/web add jsqr@1.4.0`

- [ ] **Step 4: Jalankan seluruh pemeriksaan proyek**

Run: `pnpm check && pnpm typecheck && pnpm test && pnpm test:rls && pnpm e2e`
Expected: semuanya PASS.

- [ ] **Step 5: Cek manual**

- Scan QR reservasi dari layar HP lewat webcam laptop Windows (jalur jsQR), lalu lewat Chrome Android kalau tersedia. Catat hasilnya di ledger.
- Buka `/operator` di dua tab, lalu ubah status di satu tab. Tab lain ikut berubah dalam ±5 detik.

- [ ] **Step 6: Commit**

```bash
git add -A && git restore --staged .claude && git commit -m "feat: Hari ini diperbarui realtime dan scan QR lewat kamera"
```

---

## Cakupan desain

| Desain | Task |
|---|---|
| §5.1 Hari ini (isi, baris, redup, hari ini saja, tanpa dialog) | 5 |
| §5.2 Kolom kode dan alat scan | 3 (normalisasi), 5 |
| §5.2 Scan kamera (BarcodeDetector + jsQR) | 6 |
| §5.3 Detail operator, Batalkan dengan alasan, 404 | 5 |
| §5.4 Tabel perpindahan, angka di pengaturan, tombol ikut waktu, teks galat, audit | 1, 3, 5 |
| §5.5 Tutup otomatis dan koreksi | 2, 5 |
| §5.6 Realtime, penanda, `aria-live` | 2 (publikasi dan RLS), 3 (`liveState`), 6 |
| §5.7 Sisi pelanggan (Dibatalkan toko, QR dan kalender hanya aktif, Mendatang) | 3, 4 |
| §5.8 Nomor WhatsApp (formulir, simpan dulu, `whatsapp_required`, tanpa nomor di operator) | 1, 3, 4, 5 |
| §6.3 O7 (`reservation_contacts`, `profiles` tetap tertutup) | 1, 5 |
| §8 Kriteria selesai | 1–6. Scan kamera di HP dicek manual di Task 6. |
