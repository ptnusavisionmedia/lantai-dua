# Fase 0 — Fondasi: Rencana Implementasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fase ini menyiapkan monorepo, database Supabase dengan RLS yang teruji (identitas, katalog, showroom, audit), token desain, dan kerangka web Next.js. Fase selesai kalau pelanggan, operator, dan pemilik bisa login dan langsung diarahkan ke dashboard masing-masing.

**Architecture:** Monorepo pnpm + Turborepo. Aturan akses dijaga di Postgres lewat RLS, fungsi `security definer`, dan trigger, sehingga web sekarang dan aplikasi nanti berperilaku sama. Database development memakai project **Supabase Cloud** (tanpa Docker). Migrasi ditulis sebagai file SQL lalu dikirim dengan `supabase db push`. Tes RLS ditulis di Vitest dan menyerang project dev dengan akun tes sungguhan. Web memakai Next.js App Router, `@supabase/ssr`, dan `proxy.ts` untuk menjaga rute.

**Tech Stack:** Node 26, pnpm 12.21.0, Turborepo 2.11.13, Next.js 16.4.6, React 19.3.1, TypeScript 6.0.3, Tailwind CSS 4.3.5, @supabase/supabase-js 2.119.2, @supabase/ssr 0.12.7, Supabase CLI 3.2.0 (npm), Vitest 5.1.1, Playwright 1.65.1, Biome 2.6.8.

**Spec:** [`docs/PRD.md`](../../PRD.md) (terutama §6, §8, §9.2, §9.3, §9.6, §11, §12, §16) dan [`design-system/lantai-dua/MASTER.md`](../../../design-system/lantai-dua/MASTER.md).

## Cakupan Fase 0

**Masuk:**
- Monorepo dan tooling.
- Token desain.
- Skema identitas: profil, peran, dan aturan peran.
- Skema katalog: rak, kategori, template spek, merek, produk, varian, foto.
- Skema showroom: area demo, unit demo, pengaturan toko, jam buka, hari libur.
- Log audit.
- RLS untuk semua tabel di atas, beserta tesnya.
- Seed struktural dan akun demo.
- Kerangka web: header, footer, beranda, halaman placeholder, masuk, daftar, verifikasi email, keluar, halaman akun nonaktif, dan tiga kerangka dashboard.

**Ditunda ke Fase 1:**
- Reservasi, keranjang, pesanan, dan penjualan langsung.
- Riwayat stok dan riwayat unit demo, beserta fungsinya. Sampai saat itu, operator belum bisa mengubah apa pun.
- Undangan staf (A6 / PM4), lupa kata sandi (A3), hapus akun (A5), login Google, dan verifikasi dua langkah untuk pemilik.
- Upload foto dan isi katalog asli (±44 produk).
- SMTP sendiri, project Supabase produksi, dan deploy ke Vercel.

## Global Constraints

- Versi paket dikunci persis seperti di Tech Stack. TypeScript **6.0.3**, bukan 7.x: proses build dan plugin editor Next.js masih bergantung pada API compiler versi JavaScript.
- Tanpa Docker. Database dev adalah project Supabase Cloud `lantai-dua-dev`. Tipe database dibuat dengan `supabase gen types typescript --project-id`.
- Teks UI memakai Bahasa Indonesia yang santai tapi jelas, dan sebisa mungkin tanpa kata ganti orang. Path URL memakai Bahasa Indonesia (PRD §8). Nama kode dan database memakai Bahasa Inggris.
- Nilai peran di database: `customer` / `operator` / `owner`. Labelnya Pelanggan / Operator / Pemilik. Halaman awal masing-masing: `/akun`, `/operator`, `/pemilik`.
- Pendaftaran mandiri selalu menghasilkan `customer`. Hanya pemilik (atau skrip dengan secret key) yang boleh mengubah `role` dan `is_active`. Pemilik tidak bisa mengubah peran atau status akunnya sendiri.
- Semua tabel di `public` memakai RLS. Secret key hanya ada di `.env.local` di root, dan hanya dipakai skrip dan tes, tidak pernah oleh kode web.
- Fungsi `security definer` memakai `set search_path = ''` dan menulis nama objek secara lengkap.
- Uang disimpan sebagai `integer` rupiah (`price_idr`), waktu sebagai `timestamptz`, dan ditampilkan dalam zona Asia/Jakarta.
- Nilai token mengikuti palet A di MASTER.md §2. Huruf: Archivo (lebar 85 untuk judul), Instrument Sans, dan Geist Mono.
- Aksesibilitas:
  - Setiap input punya label yang terlihat.
  - Cincin fokus 2 px `primary` dengan jarak 2 px.
  - Target sentuh minimal 44 px.
  - Tidak ada scroll horizontal dari lebar 360 px.
  - Status tidak hanya dibedakan warna.
  - `prefers-reduced-motion` dihormati.
- Email akun tes memakai domain `.test`. Kata sandi diambil dari env `SEED_PASSWORD` dan tidak pernah di-commit.
- Semua kerja dilakukan di branch `fase-0-fondasi`, dengan satu commit per task. Format pesan commit: `feat:` / `test:` / `chore:` / `docs:`.

## Review Focus

1. **Open redirect lewat `next`.** Contohnya `/masuk?next=https://evil.example`, `//evil.example`, atau `/\evil.example`. Pengguna harus selalu mendarat di halaman internal. Dites di Task 1 (`safeNextPath`) dan Task 9 (e2e).
2. **Staf yang dinonaktifkan tapi sesinya masih hidup.** Akses stafnya harus langsung hilang, lalu ia diarahkan ke `/akun-nonaktif` tanpa redirect berputar-putar. Dites di Task 1 (`resolveAccess` untuk viewer `inactive`), Task 3 (`current_app_role` = null), Task 4 (tidak bisa melihat produk nonaktif), dan Task 9 (e2e akun `nonaktif@`).
3. **Menaikkan peran sendiri lewat API.** Pelanggan atau operator yang mencoba `update profiles set role/is_active` harus ditolak dengan `42501`. Pemilik juga tidak boleh mengunci dirinya sendiri. Dites di Task 3.
4. **Spek produk yang salah bentuk.** Contohnya `weight_g: "58g"`, key yang tidak ada di template, nilai di luar daftar pilihan, atau atribut varian yang diisi di level produk. Semuanya harus ditolak database, supaya filter di Fase 1 tidak pernah menerima data kotor. Dites di Task 4.
5. **Email belum diverifikasi atau kata sandi salah saat login.** Harus muncul pesan yang jelas dalam Bahasa Indonesia, bukan halaman kosong atau error mentah. Dites di Task 9 (unit `authErrorMessage` dan e2e kata sandi salah).

---

## Struktur file

```
lantai-dua/
├─ package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json, biome.json
├─ .gitignore, .env.example, README.md
├─ scripts/
│  ├─ db-types.ts            generate tipe DB ke packages/shared
│  └─ seed-users.ts          buat / perbarui 7 akun demo
├─ packages/
│  ├─ shared/src/            roles.ts, access.ts, database.types.ts (+ tes)
│  ├─ tokens/                src/tokens.ts, src/contrast.ts, src/theme-css.ts, scripts/write-theme.ts, theme.css (+ tes)
│  └─ db-tests/src/          env.ts, clients.ts, global-setup.ts, *.test.ts  (tes RLS)
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/            *_identity.sql, *_catalog.sql, *_showroom.sql, *_audit.sql
│  └─ seed.sql
└─ apps/web/
   ├─ next.config.ts, postcss.config.mjs, playwright.config.ts, vitest.config.ts, tsconfig.json
   ├─ e2e/                   public.spec.ts, auth.spec.ts
   └─ src/
      ├─ proxy.ts
      ├─ app/                globals.css, layout.tsx, (public)/…, (auth)/…, auth/konfirmasi/route.ts,
      │                      akun-nonaktif/, akun/, operator/, pemilik/
      ├─ components/         logo.tsx, button.tsx, text-field.tsx, site-header.tsx, site-footer.tsx,
      │                      coming-soon.tsx, dashboard-shell.tsx
      └─ lib/                supabase/server.ts, supabase/proxy-client.ts, viewer.ts, auth.ts, auth-errors.ts
```

---

### Task 0: Prasyarat (dikerjakan pemilik project)

Langkah-langkah ini harus dikerjakan sendiri oleh pemilik project, karena menyangkut akun dan kata sandi pribadi. Executor cukup memandu dan memeriksa hasilnya.

- [ ] **Step 1: Pasang pnpm**

Run: `npm install -g pnpm@12.21.0` lalu `pnpm --version`
Expected: `12.21.0`

- [ ] **Step 2: Buat project Supabase dev**

Login ke supabase.com, lalu buat project baru:
- Nama: `lantai-dua-dev`
- Region: Southeast Asia (Singapore)
- Database password: simpan di tempat aman, jangan dimasukkan ke repo.

- [ ] **Step 3: Atur Auth di dashboard project**

- Authentication → URL Configuration: Site URL `http://localhost:3000`, dan Redirect URLs `http://localhost:3000/**`.
- Authentication → Sign In / Providers → Email: pastikan **Confirm email** aktif.
- Template email **tidak perlu diubah**. Supabase hanya mengizinkan edit template kalau sudah memakai SMTP sendiri, jadi Fase 0 memakai template bawaan. Halaman `/auth/konfirmasi` (Task 9) menangani tautan bawaan itu.

- [ ] **Step 4: Catat kunci project**

Dari Project Settings → API Keys dan General, catat: Project ref, Project URL, publishable key (`sb_publishable_…`), dan secret key (`sb_secret_…`). Nilai-nilai ini nanti diisikan ke `.env.local` di Task 3 dan Task 8.

---

### Task 1: Monorepo + aturan akses bersama

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `biome.json`, `.gitignore`
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/roles.ts`, `packages/shared/src/access.ts`
- Test: `packages/shared/src/roles.test.ts`, `packages/shared/src/access.test.ts`

**Interfaces:**
- Produces (`@lantai-dua/shared/roles`):
  - `ROLES = ['customer','operator','owner'] as const`
  - `type Role`
  - `ROLE_LABEL: Record<Role, string>` (`Pelanggan` / `Operator` / `Pemilik`)
  - `homePathForRole(role: Role): '/akun' | '/operator' | '/pemilik'`
- Produces (`@lantai-dua/shared/access`):
  - `type Viewer = { kind: 'guest' } | { kind: 'inactive' } | { kind: 'active'; role: Role }`
  - `type AccessDecision = { kind: 'allow' } | { kind: 'redirect'; to: string }`
  - `resolveAccess(pathname: string, viewer: Viewer, search?: string): AccessDecision`
  - `safeNextPath(next: string | null | undefined): string | null`

- [ ] **Step 1: Buat repo git dan branch kerja**

```bash
git init
git add docs design-system
git commit -m "docs: PRD, design system, dan rencana Fase 0"
git switch -c fase-0-fondasi
```

- [ ] **Step 2: Buat file root**

- **`package.json`:**
  - `"private": true`, `"type": "module"`, `"packageManager": "pnpm@12.21.0"`, `"engines": { "node": ">=26" }`.
  - devDependencies: `turbo@2.11.13`, `@biomejs/biome@2.6.8`, `typescript@6.0.3`, `supabase@3.2.0`, `@supabase/supabase-js@2.119.2`.
  - scripts:
    - `check`: `biome check .`
    - `format`: `biome check --write .`
    - `typecheck`: `turbo run typecheck`
    - `test`: `turbo run test`
    - `test:rls`: `pnpm --filter @lantai-dua/db-tests test:rls`
    - `e2e`: `pnpm --filter @lantai-dua/web e2e`
    - `dev`: `pnpm --filter @lantai-dua/web dev`
    - `db:push`: `supabase db push --include-seed`
    - `db:types`: `node scripts/db-types.ts`
    - `db:seed-users`: `node scripts/seed-users.ts`
- **`pnpm-workspace.yaml`:** packages `apps/*` dan `packages/*`, plus `onlyBuiltDependencies: [supabase]`, karena paket npm Supabase CLI mengunduh binary saat postinstall.
- **`turbo.json`:**
  - task `typecheck`: `{}`
  - task `test`: `{}`
  - task `build`: `{ outputs: [".next/**", "!.next/cache/**"] }`
  - task `dev`: `{ cache: false, persistent: true }`
- **`tsconfig.base.json`:** `strict`, `noUncheckedIndexedAccess`, `target ES2023`, `module ESNext`, `moduleResolution Bundler`, `verbatimModuleSyntax`, `skipLibCheck`.
- **`biome.json`:**
  - Format: indentasi 2 spasi, `lineWidth` 100, kutip tunggal, titik koma selalu, trailing comma `all`.
  - Abaikan: `docs/**`, `design-system/**`, `**/database.types.ts`, `packages/tokens/theme.css`, `**/.next/**`.
- **`.gitignore`:** `node_modules`, `.next`, `.turbo`, `*.local`, `.env*.local`, `playwright-report`, `test-results`, `supabase/.temp`, `supabase/.branches`.

- [ ] **Step 3: Buat paket `@lantai-dua/shared`**

- `package.json`:
  - `exports`: `"./roles": "./src/roles.ts"`, `"./access": "./src/access.ts"`, `"./database": "./src/database.types.ts"`.
  - scripts: `test`: `vitest run`, `typecheck`: `tsc --noEmit`.
  - devDependencies: `vitest@5.1.1`, `typescript@6.0.3`.
- `tsconfig.json` meng-extend `../../tsconfig.base.json`.

- [ ] **Step 4: Tulis tes yang gagal**

```ts
// roles.test.ts
it('maps each role to its home page', () => {
  expect(homePathForRole('customer')).toBe('/akun');
  expect(homePathForRole('operator')).toBe('/operator');
  expect(homePathForRole('owner')).toBe('/pemilik');
});

// access.test.ts
const guest = { kind: 'guest' } as const;
const inactive = { kind: 'inactive' } as const;
const as = (role: Role) => ({ kind: 'active', role }) as const;
const allow = { kind: 'allow' };
const to = (path: string) => ({ kind: 'redirect', to: path });

it('allows public pages for everyone', () => {
  expect(resolveAccess('/', guest)).toEqual(allow);
  expect(resolveAccess('/katalog/mouse', inactive)).toEqual(allow);
});
it('sends guests from dashboards to /masuk with next', () => {
  expect(resolveAccess('/operator', guest)).toEqual(to('/masuk?next=%2Foperator'));
  expect(resolveAccess('/akun', guest, '?tab=pesanan')).toEqual(to('/masuk?next=%2Fakun%3Ftab%3Dpesanan'));
});
it('matches path segments, not prefixes', () => {
  expect(resolveAccess('/akunting', guest)).toEqual(allow);
  expect(resolveAccess('/operatorx', guest)).toEqual(allow);
});
it('sends a wrong role to its own home', () => {
  expect(resolveAccess('/pemilik', as('customer'))).toEqual(to('/akun'));
  expect(resolveAccess('/pemilik/staf', as('operator'))).toEqual(to('/operator'));
  expect(resolveAccess('/akun', as('owner'))).toEqual(to('/pemilik'));
});
it('lets the owner use operator pages', () => {
  expect(resolveAccess('/operator', as('owner'))).toEqual(allow);
});
it('sends signed-in users away from /masuk and /daftar', () => {
  expect(resolveAccess('/masuk', as('customer'))).toEqual(to('/akun'));
  expect(resolveAccess('/daftar', as('owner'))).toEqual(to('/pemilik'));
});
it('routes inactive accounts to /akun-nonaktif without loops', () => {
  expect(resolveAccess('/operator', inactive)).toEqual(to('/akun-nonaktif'));
  expect(resolveAccess('/masuk', inactive)).toEqual(to('/akun-nonaktif'));
  expect(resolveAccess('/akun-nonaktif', inactive)).toEqual(allow);
  expect(resolveAccess('/akun-nonaktif', guest)).toEqual(to('/masuk'));
  expect(resolveAccess('/akun-nonaktif', as('operator'))).toEqual(to('/operator'));
});

describe('safeNextPath', () => {
  it.each(['/akun', '/operator?tab=1'])('accepts %s', (p) => expect(safeNextPath(p)).toBe(p));
  it.each(['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', 'akun', '', null, undefined])(
    'rejects %s',
    (p) => expect(safeNextPath(p)).toBeNull(),
  );
});
```

- [ ] **Step 5: Jalankan tes, pastikan gagal**

Run: `pnpm install` lalu `pnpm --filter @lantai-dua/shared test`
Expected: FAIL, karena modul `roles` dan `access` belum ada.

- [ ] **Step 6: Implementasikan `roles.ts` dan `access.ts`**

Aturan area, dicocokkan per segmen path:

| Path | Peran yang boleh |
|---|---|
| `/akun` | `customer` |
| `/operator` | `operator`, `owner` |
| `/pemilik` | `owner` |

`/masuk` dan `/daftar` hanya untuk tamu. `/akun-nonaktif` hanya untuk viewer `inactive`. Semua path lain bebas dibuka.

- [ ] **Step 7: Jalankan tes, pastikan lulus, lalu cek format**

Run: `pnpm --filter @lantai-dua/shared test && pnpm check && pnpm typecheck`
Expected: semua PASS, Biome tanpa error.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: monorepo dan aturan akses per peran"
```

---

### Task 2: Paket token desain

**Files:**
- Create: `packages/tokens/package.json`, `packages/tokens/tsconfig.json`, `packages/tokens/src/tokens.ts`, `packages/tokens/src/contrast.ts`, `packages/tokens/src/theme-css.ts`, `packages/tokens/scripts/write-theme.ts`, `packages/tokens/theme.css` (hasil generate, ikut di-commit)
- Test: `packages/tokens/src/contrast.test.ts`, `packages/tokens/src/theme-css.test.ts`

**Interfaces:**
- Produces (`@lantai-dua/tokens/tokens`):
  - `tokens`: objek `as const` dengan isi:
    - `color`: 21 token dari MASTER §2.1–§2.3
    - `radius`: `sm` 6px, `md` 10px, `lg` 16px, `xl` 24px
    - `shadow.overlay`
    - `duration` dalam ms angka: instant 90, fast 150, base 220, slow 320, showcase 640, stagger 40
    - `easing` sebagai tuple 4 angka: `out` [0.22,1,0.36,1], `in-out` [0.65,0,0.35,1], `exit` [0.4,0,1,1]
    - `spring`: `ui` {stiffness 380, damping 32}, `layout` {stiffness 220, damping 28}
    - `fontFamily`: display `Archivo`, text `Instrument Sans`, mono `Geist Mono`
  - `contrastRatio(a: string, b: string): number`
  - `buildThemeCss(t: typeof tokens): string`
- Produces (`@lantai-dua/tokens/theme.css`): CSS untuk Tailwind v4, terdiri dari:
  - `@theme { --color-*, --radius-*, --shadow-overlay, --ease-* }`
  - `@theme inline { --font-display: var(--font-archivo), …; --font-text: var(--font-instrument-sans), …; --font-mono: var(--font-geist-mono), … }`
  - `:root { --font-display-stretch: 85%; --dur-*; --stagger }`
  - blok `prefers-reduced-motion` sesuai MASTER §6.5: base 120ms, slow 120ms, showcase 0ms, stagger 0ms

- [ ] **Step 1: Tulis tes yang gagal**

```ts
// contrast.test.ts
it('computes WCAG ratios', () => {
  expect(contrastRatio('#FFFFFF', '#0E4B57')).toBeCloseTo(9.71, 1);
});
it.each([
  ['on-primary', 'primary', 4.5], ['primary', 'bg', 4.5], ['ink', 'bg', 4.5],
  ['ink-muted', 'bg', 4.5], ['ink-muted', 'surface-sunken', 4.5],
  ['accent-ink', 'bg', 4.5], ['accent-ink', 'accent-soft', 4.5], ['accent-ink', 'surface', 4.5],
  ['success', 'success-soft', 4.5], ['warning', 'warning-soft', 4.5], ['danger', 'danger-soft', 4.5],
  ['accent', 'bg', 3], ['border-input', 'surface', 3],
] as const)('%s on %s reaches %d:1', (fg, bg, min) => {
  expect(contrastRatio(tokens.color[fg], tokens.color[bg])).toBeGreaterThanOrEqual(min);
});

// theme-css.test.ts
const css = buildThemeCss(tokens);
it('exposes palette A to Tailwind', () => {
  expect(css).toContain('--color-primary: #0E4B57;');
  expect(css).toContain('--color-accent-ink: #95491C;');
  expect(css).toContain('--ease-out: cubic-bezier(0.22, 1, 0.36, 1);');
  expect(css).toContain('--dur-showcase: 640ms;');
});
it('honours reduced motion', () => {
  expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*--dur-showcase: 0ms;/);
});
it('keeps theme.css in sync with tokens.ts', () => {
  expect(readFileSync(new URL('../theme.css', import.meta.url), 'utf8')).toBe(css);
});
```

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `pnpm --filter @lantai-dua/tokens test`
Expected: FAIL, karena modul belum ada.

- [ ] **Step 3: Implementasikan `tokens.ts`, `contrast.ts`, `theme-css.ts`, dan `scripts/write-theme.ts`**

- `contrast.ts` memakai rumus luminans WCAG 2.x, sama seperti fungsi `lum` di `design-system/lantai-dua/preview.html`.
- `write-theme.ts` menulis `buildThemeCss(tokens)` ke `theme.css`. Jalankan dengan `node scripts/write-theme.ts` (type-stripping bawaan Node 26).
- `package.json`:
  - script `build`: `node scripts/write-theme.ts`
  - `exports`: `"./tokens": "./src/tokens.ts"`, `"./theme.css": "./theme.css"`

- [ ] **Step 4: Generate `theme.css`, lalu jalankan tes**

Run: `pnpm --filter @lantai-dua/tokens build && pnpm --filter @lantai-dua/tokens test`
Expected: PASS, semua kasus kontras dan sinkronisasi lulus.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: paket token desain palet Petrol & Tembaga"
```

---

### Task 3: Supabase + migrasi identitas + harness tes RLS

**Files:**
- Create: `supabase/config.toml` (lewat `supabase init`), `supabase/migrations/<ts>_identity.sql`, `.env.example`
- Create: `packages/db-tests/package.json`, `packages/db-tests/tsconfig.json`, `packages/db-tests/vitest.config.ts`, `packages/db-tests/src/env.ts`, `packages/db-tests/src/clients.ts`, `packages/db-tests/src/global-setup.ts`
- Test: `packages/db-tests/src/identity.test.ts`

**Interfaces:**
- Produces (SQL):
  - enum `public.app_role` ('customer','operator','owner')
  - tabel `public.profiles`
  - fungsi:
    - `public.set_updated_at()`: trigger generik
    - `public.current_app_role() returns public.app_role`: peran dari profil aktif `auth.uid()`, atau null
    - `public.is_staff() returns boolean`
    - `public.is_owner() returns boolean`: keduanya `false`, bukan null, kalau tidak ada peran
- Produces (`packages/db-tests/src/clients.ts`):
  - `type Persona = 'customer' | 'customer2' | 'operator' | 'operatorInactive' | 'owner'`
  - `adminClient(): SupabaseClient`
  - `anonClient(): SupabaseClient`
  - `clientFor(p: Persona): SupabaseClient`
  - `userIdOf(p: Persona): string`
  - `runId(): string`: ID unik per eksekusi tes, dibuat di global setup dan dibagikan lewat `provide('runId', …)` / `inject('runId')`
- Produces (`global-setup.ts`): `provide('sessions', …)` dan `provide('runId', …)`. Tipenya dideklarasikan lewat `declare module 'vitest' { interface ProvidedContext { … } }`.
- Produces (env, di root `.env.local`, gitignored; contohnya di `.env.example`):
  `SUPABASE_PROJECT_REF`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SEED_PASSWORD`

- [ ] **Step 1: Inisialisasi dan hubungkan Supabase (pemilik project mengetik sendiri kata sandinya)**

Run: `pnpm exec supabase --version` → Expected: `3.2.0`. Kalau binary belum ada, cek kunci `onlyBuiltDependencies` di dokumentasi pnpm 12.
Run: `pnpm exec supabase init` (jawab "no" untuk pengaturan VS Code dan Deno)
Run: `pnpm exec supabase login`. Langkah ini membuka browser, dan pemilik project yang login.
Run: `pnpm exec supabase link --project-ref <ref>`. Pemilik project mengetik sendiri database password-nya.
Lalu isi `.env.local` di root berdasarkan `.env.example`.

- [ ] **Step 2: Siapkan paket `@lantai-dua/db-tests`**

- `package.json`:
  - script `test:rls`: `vitest run`
  - script `typecheck`: `tsc --noEmit`
  - devDependencies: `vitest@5.1.1`, `@supabase/supabase-js@2.119.2`, `typescript@6.0.3`
- `vitest.config.ts`:
  - panggil `process.loadEnvFile(<root>/.env.local)`
  - `globalSetup: './src/global-setup.ts'`, `fileParallelism: false`, `testTimeout: 30_000`
- `global-setup.ts`:
  - Buat 5 akun lewat `auth.admin.createUser({ email: \`rls-${persona}-${runId}@lantaidua.test\`, password: <acak>, email_confirm: true, user_metadata: { full_name: \`Tes ${persona}\` } })`.
  - Atur peran lewat admin client: `operator` dan `owner`, sedangkan `operatorInactive` = operator dengan `is_active=false`.
  - Login sekali untuk setiap persona, lalu `provide('sessions', Record<Persona, { userId, accessToken }>)`.
  - Kembalikan fungsi teardown yang menghapus kelima akun.
- `clientFor` mengirim header `Authorization: Bearer <accessToken>` dengan publishable key.

- [ ] **Step 3: Tulis tes yang gagal (`identity.test.ts`)**

```ts
it('hides all profiles from anon', async () => {
  const { data } = await anonClient().from('profiles').select('id');
  expect(data).toEqual([]);
});
it('creates a customer profile with the signup name', async () => {
  const { data } = await adminClient().from('profiles').select('role, full_name').eq('id', userIdOf('customer')).single();
  expect(data).toEqual({ role: 'customer', full_name: 'Tes customer' });
});
it('shows a customer only their own profile', async () => {
  const { data } = await clientFor('customer').from('profiles').select('id');
  expect(data?.map((r) => r.id)).toEqual([userIdOf('customer')]);
});
it('lets a customer edit name and WhatsApp', async () => {
  const { error } = await clientFor('customer').from('profiles')
    .update({ full_name: 'Raka', whatsapp: '6281234567890' }).eq('id', userIdOf('customer'));
  expect(error).toBeNull();
});
it('rejects a malformed WhatsApp number', async () => {
  const { error } = await clientFor('customer').from('profiles').update({ whatsapp: '0812' }).eq('id', userIdOf('customer'));
  expect(error?.code).toBe('23514');
});
it.each(['customer', 'operator'] as const)('blocks %s from raising their own role', async (p) => {
  const { error } = await clientFor(p).from('profiles').update({ role: 'owner' }).eq('id', userIdOf(p));
  expect(error?.code).toBe('42501');
});
it('blocks a customer from editing someone else', async () => {
  const { data } = await clientFor('customer').from('profiles')
    .update({ full_name: 'X' }).eq('id', userIdOf('customer2')).select('id');
  expect(data).toEqual([]);
});
it('lets the owner read everyone and change roles', async () => {
  const owner = clientFor('owner');
  const { data } = await owner.from('profiles').select('id');
  expect(data?.map((r) => r.id)).toContain(userIdOf('customer2'));
  expect((await owner.from('profiles').update({ role: 'operator' }).eq('id', userIdOf('customer2'))).error).toBeNull();
  expect((await owner.from('profiles').update({ role: 'customer' }).eq('id', userIdOf('customer2'))).error).toBeNull();
});
it('stops the owner from locking themself out', async () => {
  const { error } = await clientFor('owner').from('profiles').update({ is_active: false }).eq('id', userIdOf('owner'));
  expect(error?.code).toBe('42501');
});
it('reports the effective role, null when inactive', async () => {
  expect((await clientFor('owner').rpc('current_app_role')).data).toBe('owner');
  expect((await clientFor('operator').rpc('current_app_role')).data).toBe('operator');
  expect((await clientFor('operatorInactive').rpc('current_app_role')).data).toBeNull();
  expect((await anonClient().rpc('current_app_role')).data).toBeNull();
});
```

- [ ] **Step 4: Jalankan tes, pastikan gagal**

Run: `pnpm test:rls`
Expected: FAIL, karena tabel `profiles` belum ada.

- [ ] **Step 5: Tulis migrasi identitas**

Run: `pnpm exec supabase migration new identity`

Kolom `public.profiles`:

| Kolom | Definisi |
|---|---|
| `id` | `uuid` PK, references `auth.users(id) on delete cascade` |
| `full_name` | `text not null default ''` |
| `whatsapp` | `text null check (whatsapp ~ '^62[0-9]{8,13}$')` |
| `role` | `public.app_role not null default 'customer'` |
| `is_active` | `boolean not null default true` |
| `created_at`, `updated_at` | `timestamptz not null default now()` |

Trigger dan fungsi:
- `handle_new_user()` (`security definer`), dipasang `after insert on auth.users`: insert profil dengan `full_name` dari `raw_user_meta_data->>'full_name'`.
- `set_updated_at` dipasang `before update` di `profiles`.
- `guard_profile_privileges()` dipasang `before update` di `profiles`. Aturannya berlaku kalau `role` atau `is_active` berubah dan `auth.uid() is not null`:
  - Bukan pemilik → `raise exception 'Hanya pemilik yang boleh mengubah peran atau status akun.' using errcode = '42501'`.
  - Pemilik mengubah dirinya sendiri → pesan `'Pemilik tidak bisa mengubah peran atau status akunnya sendiri.'` dengan errcode yang sama.

RLS `profiles`:

| Aksi | Siapa |
|---|---|
| select | `id = auth.uid()`, atau `public.is_owner()` |
| update | `id = auth.uid()`, atau `public.is_owner()` |
| insert / delete | Tidak ada policy. Insert hanya lewat trigger. |

Terakhir, `grant execute` ketiga fungsi peran ke `anon` dan `authenticated`.

- [ ] **Step 6: Kirim migrasi, lalu jalankan tes**

Run: `pnpm exec supabase db push`, lalu `pnpm test:rls`
Expected: PASS, dan kelima akun tes terhapus setelah tes selesai. Cek di dashboard → Authentication.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: profil, peran, dan RLS identitas dengan tes"
```

---

### Task 4: Migrasi katalog + validasi template spek

**Files:**
- Create: `supabase/migrations/<ts>_catalog.sql`
- Test: `packages/db-tests/src/catalog.test.ts`

**Interfaces:**
- Consumes: `public.is_staff()`, `public.is_owner()`, `public.set_updated_at()` dari Task 3, serta `clientFor` / `adminClient` / `runId`.
- Produces:
  - enum `try_mode` ('unit','station','free'), `attribute_type` ('number','enum','multi_enum','boolean','text'), `attribute_scope` ('product','variant'), dan `image_kind` ('main','side','detail')
  - tabel `category_groups`, `categories`, `category_attributes`, `brands`, `products`, `product_variants`, dan `product_images`
  - fungsi `public.validate_spec_values(p_category_id uuid, p_scope public.attribute_scope, p_values jsonb) returns void`, yang melempar error dengan errcode `22023`

Kolom setiap tabel. Semua tabel ber-`id uuid default gen_random_uuid()`, dan tabel yang bisa diubah punya `created_at` / `updated_at`:

| Tabel | Kolom penting |
|---|---|
| `category_groups` | `slug text unique not null`, `name text not null`, `sort_order int not null default 0` |
| `categories` | `group_id` → `category_groups` (restrict), `slug unique`, `name`, `try_mode not null`, `hygiene_note text null`, `is_active bool not null default false`, `sort_order` |
| `category_attributes` | `category_id` → `categories` (cascade), `key text check (key ~ '^[a-z][a-z0-9_]*$')`, `label`, `type attribute_type`, `scope attribute_scope default 'product'`, `unit text null`, `options text[] null`, `is_filterable bool default false`, `is_comparable bool default false`, `sort_order`, `unique (category_id, key)`. Ada juga check: `options` wajib tidak kosong jika dan hanya jika `type in ('enum','multi_enum')`. |
| `brands` | `slug unique`, `name` |
| `products` | `category_id` (restrict), `brand_id` (restrict), `model_name`, `slug unique`, `description text default ''`, `specs jsonb not null default '{}'` (harus objek), `is_for_sale bool default true`, `is_active bool default false`, `eloshapes_url`, `contour_top_svg`, `contour_side_svg`, `spec_source_url` (semua `text null`) |
| `product_variants` | `product_id` (cascade), `sku unique`, `name`, `attributes jsonb not null default '{}'` (harus objek), `price_idr integer not null check (>= 0)`, `stock_qty integer not null default 0 check (>= 0)`, `is_active bool default true`, `sort_order` |
| `product_images` | `product_id` (cascade), `variant_id null` (cascade), `storage_path text not null`, `kind image_kind default 'main'`, `alt text default ''`, `sort_order` |

Aturan `validate_spec_values`:
- Setiap key harus ada di template kategori dengan `scope` yang sama. Kalau tidak: `'Atribut "%" tidak ada di template kategori ini.'`.
- Nilai harus cocok dengan tipenya:
  - `number` → JSON number
  - `boolean` → JSON boolean
  - `text` → JSON string
  - `enum` → string yang ada di `options`
  - `multi_enum` → array string yang semuanya ada di `options`
- JSON `null` ditolak. Kalau nilainya tidak diketahui, key-nya cukup tidak diisi.
- Pesan error untuk nilai yang tidak cocok: `'Nilai atribut "%" tidak sesuai tipe %.'`.

Trigger:
- `products`: `before insert or update of specs, category_id` → validasi scope `product`.
- `product_variants`: `before insert or update of attributes, product_id` → validasi scope `variant`, memakai kategori dari produknya.

RLS. Yang dimaksud "terlihat publik": produk `is_active` dan kategorinya `is_active`.

| Tabel | Baca: semua orang | Baca: staf | Tulis |
|---|---|---|---|
| `category_groups`, `brands` | semua baris | semua | pemilik |
| `categories` | `is_active` | semua | pemilik |
| `category_attributes` | kategorinya aktif | semua | pemilik |
| `products` | terlihat publik | semua | pemilik |
| `product_variants` | `is_active` dan produknya terlihat publik | semua | pemilik |
| `product_images` | produknya terlihat publik | semua | pemilik |

- [ ] **Step 1: Tulis tes yang gagal (`catalog.test.ts`)**

Fixture dibuat lewat `adminClient()` di `beforeAll`, dengan slug berawalan `const prefix = \`rls-${runId()}-\``, lalu dihapus di `afterAll`. Isinya:
- grup + kategori aktif `cat` beserta atribut: `weight_g` number, `shape` enum [Simetris, Ergonomis kanan], `connectivity` multi_enum [Kabel, Bluetooth], `wireless` boolean, `sensor` text, `color` text (scope variant)
- kategori nonaktif `catOff`
- merek `brand`
- produk aktif `pOn`, produk nonaktif `pOff`, produk referensi aktif `pRef` (`is_for_sale=false`), dan produk aktif `pInOffCat` di `catOff`
- varian aktif `vOn` dan varian nonaktif `vOff` di bawah `pOn`

```ts
it('shows anon only what is public', async () => {
  const ids = (await anonClient().from('products').select('id').like('slug', `${prefix}%`)).data!.map((r) => r.id);
  expect(ids.sort()).toEqual([pOn, pRef].sort());
  const v = (await anonClient().from('product_variants').select('id').eq('product_id', pOn)).data!;
  expect(v.map((r) => r.id)).toEqual([vOn]);
});
it('shows staff inactive products', async () => {
  const ids = (await clientFor('operator').from('products').select('id').like('slug', `${prefix}%`)).data!.map((r) => r.id);
  expect(ids).toContain(pOff);
});
it('treats a deactivated operator as public', async () => {
  const ids = (await clientFor('operatorInactive').from('products').select('id').like('slug', `${prefix}%`)).data!.map((r) => r.id);
  expect(ids).not.toContain(pOff);
});
it.each(['customer', 'operator'] as const)('blocks %s from writing the catalog', async (p) => {
  expect((await clientFor(p).from('brands').insert({ slug: `${prefix}x`, name: 'X' })).error?.code).toBe('42501');
  expect((await clientFor(p).from('products').update({ model_name: 'X' }).eq('id', pOn).select('id')).data).toEqual([]);
});
it('lets the owner write the catalog', async () => {
  expect((await clientFor('owner').from('products').update({ description: 'ok' }).eq('id', pOn)).error).toBeNull();
});
it('accepts specs that match the template', async () => {
  const { error } = await adminClient().from('products').update({
    specs: { weight_g: 58, shape: 'Simetris', connectivity: ['Kabel', 'Bluetooth'], wireless: true, sensor: 'PAW3395' },
  }).eq('id', pOn);
  expect(error).toBeNull();
});
it.each([
  [{ weight_g: '58g' }, 'weight_g'],
  [{ warna_casing: 'merah' }, 'warna_casing'],
  [{ shape: 'Bulat' }, 'shape'],
  [{ connectivity: 'Kabel' }, 'connectivity'],
  [{ sensor: null }, 'sensor'],
  [{ color: 'Hitam' }, 'color'], // variant-scope key on a product
])('rejects product specs %j', async (specs, key) => {
  const { error } = await adminClient().from('products').update({ specs }).eq('id', pOn);
  expect(error?.code).toBe('22023');
  expect(error?.message).toContain(key);
});
it('validates variant attributes against variant scope', async () => {
  expect((await adminClient().from('product_variants').update({ attributes: { color: 'Hitam' } }).eq('id', vOn)).error).toBeNull();
  expect((await adminClient().from('product_variants').update({ attributes: { weight_g: 60 } }).eq('id', vOn)).error?.code).toBe('22023');
});
it('rejects negative price and stock', async () => {
  expect((await adminClient().from('product_variants').update({ price_idr: -1 }).eq('id', vOn)).error?.code).toBe('23514');
  expect((await adminClient().from('product_variants').update({ stock_qty: -1 }).eq('id', vOn)).error?.code).toBe('23514');
});
```

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `pnpm test:rls`
Expected: FAIL, karena tabel katalog belum ada.

- [ ] **Step 3: Tulis migrasi `catalog` sesuai tabel di atas**

Run: `pnpm exec supabase migration new catalog`

- [ ] **Step 4: Kirim migrasi, lalu jalankan tes**

Run: `pnpm exec supabase db push && pnpm test:rls`
Expected: PASS, termasuk semua tes dari Task 3.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: skema katalog dengan template spek dan RLS"
```

---

### Task 5: Migrasi showroom dan pengaturan toko

**Files:**
- Create: `supabase/migrations/<ts>_showroom.sql`
- Test: `packages/db-tests/src/showroom.test.ts`

**Interfaces:**
- Consumes: helper peran dari Task 3, dan `product_variants` dari Task 4.
- Produces:
  - enum `demo_area_kind` ('desk','station','free') dan `demo_unit_status` ('available','in_use','servicing','retired')
  - tabel `demo_areas`, `demo_units`, `store_settings`, `opening_hours`, dan `store_closures`

| Tabel | Kolom penting |
|---|---|
| `demo_areas` | `slug unique`, `name`, `kind demo_area_kind`, `capacity int not null check (>= 0)`, `is_reservable bool not null`, `is_active bool default true`, `sort_order`. Check: `kind <> 'free' or is_reservable = false`. |
| `demo_units` | `variant_id` → `product_variants` (restrict), `area_id` → `demo_areas` (restrict), `code text unique check (code ~ '^DM-[A-Z]-[0-9]{3}$')`, `status demo_unit_status default 'available'`, `notes text default ''` |
| `store_settings` | Baris tunggal: `id boolean primary key default true check (id)`. Kolom: `address text not null`, `whatsapp text` (format sama dengan profil), `maps_url text null`, `session_minutes` 30, `min_lead_minutes` 60, `max_days_ahead` 14, `max_active_reservations` 2, `pickup_hours` 48, `cancel_cutoff_minutes` 60 (semuanya `int not null`, ≥ 0 atau > 0 sesuai artinya) |
| `opening_hours` | `isodow smallint primary key check (isodow between 1 and 7)`, `opens_at time null`, `closes_at time null`. Check: keduanya null (hari tutup) atau `opens_at < closes_at`. |
| `store_closures` | `date date primary key`, `reason text not null default ''` |

RLS:

| Tabel | Baca: semua orang | Baca: staf | Tulis |
|---|---|---|---|
| `demo_areas` | `is_active` | semua | pemilik |
| `demo_units` | `status <> 'retired'` | semua | pemilik. Operator baru bisa menulis lewat fungsi di Fase 1. |
| `store_settings`, `opening_hours`, `store_closures` | semua | semua | pemilik |

- [ ] **Step 1: Tulis tes yang gagal (`showroom.test.ts`)**

Fixture dibuat lewat admin: satu area `desk`, satu varian katalog, satu unit `available`, dan satu unit `retired`. Semua dihapus di `afterAll`.

```ts
it('shows anon units that are not retired', async () => {
  const codes = (await anonClient().from('demo_units').select('code').in('id', [uAvail, uRetired])).data!.map((r) => r.code);
  expect(codes).toEqual([codeAvail]);
});
it('shows staff retired units', async () => {
  expect((await clientFor('operator').from('demo_units').select('id').eq('id', uRetired)).data).toHaveLength(1);
});
it.each(['customer', 'operator'] as const)('blocks %s from changing a unit directly', async (p) => {
  expect((await clientFor(p).from('demo_units').update({ status: 'servicing' }).eq('id', uAvail).select('id')).data).toEqual([]);
});
it('rejects a reservable free area', async () => {
  const { error } = await adminClient().from('demo_areas').insert({ slug: `${prefix}free`, name: 'X', kind: 'free', capacity: 0, is_reservable: true });
  expect(error?.code).toBe('23514');
});
it('rejects a badly formatted unit code', async () => {
  expect((await adminClient().from('demo_units').update({ code: 'DEMO-1' }).eq('id', uAvail)).error?.code).toBe('23514');
});
it('keeps store_settings to one row', async () => {
  expect((await adminClient().from('store_settings').insert({ id: false, address: 'x' })).error?.code).toBe('23514');
});
it('rejects closing before opening', async () => {
  expect((await adminClient().from('opening_hours').upsert({ isodow: 3, opens_at: '21:00', closes_at: '10:00' })).error?.code).toBe('23514');
});
it('lets anon read opening hours but not change them', async () => {
  expect((await anonClient().from('opening_hours').select('isodow')).error).toBeNull();
  expect((await clientFor('customer').from('opening_hours').update({ opens_at: '09:00' }).eq('isodow', 1).select('isodow')).data).toEqual([]);
});
```

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `pnpm test:rls`
Expected: FAIL, karena tabel showroom belum ada.

- [ ] **Step 3: Tulis migrasi**

Run: `pnpm exec supabase migration new showroom`

- [ ] **Step 4: Kirim migrasi, lalu jalankan tes**

Run: `pnpm exec supabase db push && pnpm test:rls`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: skema area dan unit demo, pengaturan toko"
```

---

### Task 6: Log audit

**Files:**
- Create: `supabase/migrations/<ts>_audit.sql`
- Test: `packages/db-tests/src/audit.test.ts`

**Interfaces:**
- Produces:
  - tabel `public.audit_logs`:
    - `id bigint generated always as identity`
    - `actor_id uuid null`
    - `action text check (action in ('insert','update','delete'))`
    - `table_name text`, `row_id text`
    - `before jsonb null`, `after jsonb null`
    - `created_at timestamptz default now()`
    - index `(table_name, created_at desc)`
  - fungsi trigger `public.audit_row_change()` (`security definer`). `TG_ARGV[0]` opsional berisi daftar kolom dipisah koma yang ingin disimpan. Kolom `id` selalu disimpan.

Trigger dipasang `after insert or update or delete` di tabel `categories`, `category_attributes`, `products`, `product_variants`, `demo_areas`, `demo_units`, `store_settings`, dan `opening_hours`. Khusus `profiles`, trigger hanya `after update`, dengan `when (old.role is distinct from new.role or old.is_active is distinct from new.is_active)` dan argumen `'role,is_active'`, supaya nomor WhatsApp tidak ikut masuk log.

RLS: select hanya untuk pemilik. Tidak ada policy insert, update, atau delete.

- [ ] **Step 1: Tulis tes yang gagal (`audit.test.ts`)**

```ts
it('records who changed a price', async () => {
  await clientFor('owner').from('product_variants').update({ price_idr: 1_249_000 }).eq('id', vOn);
  const { data } = await adminClient().from('audit_logs').select('actor_id, before, after')
    .eq('table_name', 'product_variants').eq('row_id', vOn).order('id', { ascending: false }).limit(1).single();
  expect(data!.actor_id).toBe(userIdOf('owner'));
  expect(data!.after).toMatchObject({ price_idr: 1_249_000 });
});
it('logs role changes without personal data', async () => {
  await clientFor('owner').from('profiles').update({ role: 'operator' }).eq('id', userIdOf('customer2'));
  const row = (await adminClient().from('audit_logs').select('after').eq('table_name', 'profiles')
    .eq('row_id', userIdOf('customer2')).order('id', { ascending: false }).limit(1).single()).data!;
  expect(Object.keys(row.after as object).sort()).toEqual(['id', 'is_active', 'role']);
  await clientFor('owner').from('profiles').update({ role: 'customer' }).eq('id', userIdOf('customer2'));
});
it('does not log WhatsApp edits', async () => {
  const before = (await adminClient().from('audit_logs').select('id', { count: 'exact', head: true }).eq('row_id', userIdOf('customer'))).count;
  await clientFor('customer').from('profiles').update({ whatsapp: '6281299990000' }).eq('id', userIdOf('customer'));
  const after = (await adminClient().from('audit_logs').select('id', { count: 'exact', head: true }).eq('row_id', userIdOf('customer'))).count;
  expect(after).toBe(before);
});
it.each(['customer', 'operator'] as const)('hides the log from %s', async (p) => {
  expect((await clientFor(p).from('audit_logs').select('id').limit(1)).data).toEqual([]);
});
```

Fixture `vOn` disiapkan dengan cara yang sama seperti di Task 4: produk dan varian berawalan `rls-${runId()}-`, dihapus di `afterAll`.

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `pnpm test:rls` → Expected: FAIL, karena `audit_logs` belum ada.

- [ ] **Step 3: Tulis migrasi**

Run: `pnpm exec supabase migration new audit`

- [ ] **Step 4: Kirim migrasi, lalu jalankan tes**

Run: `pnpm exec supabase db push && pnpm test:rls`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: log audit untuk katalog, showroom, dan perubahan peran"
```

---

### Task 7: Seed struktural, akun demo, dan tipe database

**Files:**
- Create: `supabase/seed.sql`, `scripts/seed-users.ts`, `scripts/db-types.ts`, `packages/shared/src/database.types.ts` (hasil generate)
- Test: `packages/db-tests/src/seed.test.ts`

**Interfaces:**
- Produces: data seed di bawah ini, `Database` type di `@lantai-dua/shared/database`, serta 7 akun demo yang dipakai e2e di Task 9.

`seed.sql` harus idempoten: semua insert memakai `on conflict (slug | isodow | id) do update`.

**Rak:** `kontrol` "Kontrol" (1), `permukaan` "Permukaan" (2), `audio` "Audio" (3).

**Kategori** (semuanya `is_active = true`):

| slug | name | rak | try_mode | hygiene_note |
|---|---|---|---|---|
| `mouse` | Mouse | kontrol | unit | – |
| `keyboard` | Keyboard | kontrol | unit | – |
| `mousepad` | Mousepad kain | permukaan | free | – |
| `glasspad` | Glasspad | permukaan | free | – |
| `deskmat` | Deskmat | permukaan | free | – |
| `headset` | Headset / headphone | audio | unit | Pasang cover telinga sekali pakai sebelum dipakai pelanggan. |

**Template spek.** Singkatan kolom: F = `is_filterable`, C = `is_comparable`, V = scope `variant` (selain itu `product`).

| Kategori | Atribut |
|---|---|
| mouse | `length_mm` number mm C · `width_mm` number mm C · `height_mm` number mm C · `weight_g` number g F C · `shape` enum [Simetris, Ergonomis kanan] F C · `connectivity` multi_enum [Kabel, Wireless 2.4 GHz, Bluetooth] F C · `sensor` text C · `color` text V |
| keyboard | `layout` enum [Full size, TKL, 75%, 65%, 60%] F C · `connectivity` multi_enum [Kabel, Wireless 2.4 GHz, Bluetooth] F C · `hot_swap` boolean F C · `switch_type` enum [Linear, Tactile, Clicky, Magnetic] F C V · `switch_name` text C V · `color` text V |
| headset | `connectivity` multi_enum [3.5 mm, USB, Wireless 2.4 GHz, Bluetooth] F C · `mic` enum [Lepas-pasang, Tetap, Tanpa mic] F C · `back_type` enum [Closed-back, Open-back] F C · `weight_g` number g C · `color` text V |
| mousepad | `size` enum [S, M, L, XL, XXL] F C · `surface` enum [Control, Speed, Hybrid] F C · `length_mm` number mm C · `width_mm` number mm C · `thickness_mm` number mm F C · `color` text V |
| glasspad | `length_mm` number mm F C · `width_mm` number mm C · `thickness_mm` number mm F C · `coating` text C · `color` text V |
| deskmat | `length_mm` number mm F C · `width_mm` number mm C · `material` enum [Kain, Kulit sintetis, Felt] F C · `color` text V |

**Area demo:**
- `meja-kontrol` "Meja Kontrol": desk, kapasitas 3, bisa direservasi.
- `meja-permukaan` "Meja Permukaan": free, kapasitas 0, tidak bisa direservasi.

**Pengaturan toko:** alamat `Jl. Contoh Raya No. 2, Surabaya` (fiktif), WhatsApp `6281200000000`. Kolom lain memakai default.

**Jam buka:** isodow 1–6 pukul 10:00–21:00, isodow 7 pukul 12:00–20:00.

**Akun demo** (`seed-users.ts`, kata sandi dari `SEED_PASSWORD`):

| Email | Nama | Peran | Aktif |
|---|---|---|---|
| `pemilik@lantaidua.test` | Danu Saputra | owner | ya |
| `operator1@lantaidua.test` | Bima Aditya | operator | ya |
| `operator2@lantaidua.test` | Sari Wulandari | operator | ya |
| `nonaktif@lantaidua.test` | Yoga Pranata | operator | tidak |
| `pelanggan1@lantaidua.test` | Raka Pratama | customer | ya |
| `pelanggan2@lantaidua.test` | Nadia Salsabila | customer | ya |
| `pelanggan3@lantaidua.test` | Dimas Ardiansyah | customer | ya |

Perilaku `seed-users.ts`:
- Panggil `process.loadEnvFile('.env.local')`.
- Untuk setiap akun, cari dulu lewat `auth.admin.listUsers` (dengan paginasi).
- Kalau belum ada, buat dengan `email_confirm: true`. Kalau sudah ada, perbarui kata sandi dan nama.
- Terakhir, set `role`, `is_active`, dan `full_name` di `profiles` lewat admin client.

`db-types.ts` menjalankan `supabase gen types typescript --project-id <SUPABASE_PROJECT_REF> --schema public` lalu menulis hasilnya ke `packages/shared/src/database.types.ts`.

- [ ] **Step 1: Tulis tes yang gagal (`seed.test.ts`)**

```ts
it('seeds the six launch categories with their try mode', async () => {
  const { data } = await anonClient().from('categories').select('slug, try_mode').order('sort_order');
  expect(Object.fromEntries(data!.map((c) => [c.slug, c.try_mode]))).toMatchObject({
    mouse: 'unit', keyboard: 'unit', mousepad: 'free', glasspad: 'free', deskmat: 'free', headset: 'unit',
  });
});
it('gives mouse the template from the PRD', async () => {
  const { data } = await anonClient().from('category_attributes')
    .select('key, scope, categories!inner(slug)').eq('categories.slug', 'mouse');
  expect(data!.map((a) => a.key).sort()).toEqual(
    ['color', 'connectivity', 'height_mm', 'length_mm', 'sensor', 'shape', 'weight_g', 'width_mm']);
  expect(data!.find((a) => a.key === 'color')!.scope).toBe('variant');
});
it('makes switch a variant attribute for keyboards', async () => {
  const { data } = await anonClient().from('category_attributes')
    .select('key, scope, categories!inner(slug)').eq('categories.slug', 'keyboard').eq('key', 'switch_type').single();
  expect(data!.scope).toBe('variant');
});
it('seeds the two launch demo areas', async () => {
  const { data } = await anonClient().from('demo_areas').select('slug, kind, capacity, is_reservable')
    .in('slug', ['meja-kontrol', 'meja-permukaan']).order('sort_order');
  expect(data).toEqual([
    { slug: 'meja-kontrol', kind: 'desk', capacity: 3, is_reservable: true },
    { slug: 'meja-permukaan', kind: 'free', capacity: 0, is_reservable: false },
  ]);
});
it('seeds opening hours with a shorter Sunday', async () => {
  const { data } = await anonClient().from('opening_hours').select('isodow, opens_at, closes_at').eq('isodow', 7).single();
  expect(data).toEqual({ isodow: 7, opens_at: '12:00:00', closes_at: '20:00:00' });
});
it('seeds the demo accounts with their roles', async () => {
  const { data } = await adminClient().from('profiles').select('full_name, role, is_active')
    .in('full_name', ['Danu Saputra', 'Bima Aditya', 'Yoga Pranata', 'Raka Pratama']);
  expect(data).toEqual(expect.arrayContaining([
    { full_name: 'Danu Saputra', role: 'owner', is_active: true },
    { full_name: 'Bima Aditya', role: 'operator', is_active: true },
    { full_name: 'Yoga Pranata', role: 'operator', is_active: false },
    { full_name: 'Raka Pratama', role: 'customer', is_active: true },
  ]));
});
```

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `pnpm test:rls` → Expected: FAIL, karena data seed belum ada.

- [ ] **Step 3: Tulis `seed.sql`, `seed-users.ts`, dan `db-types.ts`, lalu jalankan semuanya**

Run: `pnpm db:push`, lalu `pnpm db:seed-users` dua kali (memastikan skripnya idempoten), lalu `pnpm db:types`.
Expected: perintah kedua `db:seed-users` tidak menghasilkan error dan tidak membuat akun ganda, dan file `database.types.ts` berisi `profiles`, `categories`, serta `audit_logs`.

- [ ] **Step 4: Jalankan semua tes**

Run: `pnpm test:rls && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: seed rak, kategori, template spek, area demo, akun demo, dan tipe DB"
```

---

### Task 8: Kerangka web publik

**Files:**
- Create: `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/postcss.config.mjs`, `apps/web/tsconfig.json`, `apps/web/.env.example`, `apps/web/playwright.config.ts`
- Create: `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/(public)/layout.tsx` dan `page.tsx`, serta `katalog/`, `bandingkan/`, `showroom/`, `reservasi/baru/`, `kebijakan-privasi/` (masing-masing `page.tsx`)
- Create: `apps/web/src/components/logo.tsx`, `button.tsx`, `site-header.tsx`, `site-footer.tsx`, `coming-soon.tsx`
- Test: `apps/web/e2e/public.spec.ts`

**Interfaces:**
- Consumes: `@lantai-dua/tokens/theme.css`.
- Produces:
  - `Logo({ withWordmark?: boolean })`
  - `Button(props: ButtonHTMLAttributes & { variant?: 'primary' | 'demo' | 'secondary' | 'text'; size?: 'md' | 'sm' })`
  - `ButtonLink(props: LinkProps & { variant?; size?; children })`. Varian `demo` menampilkan ikon panah ↗.
  - `SiteHeader({ account?: { href: string; label: string } })`
  - `SiteFooter()`
  - `ComingSoon({ title: string; description: string })`

Ketentuan:
- **`package.json`:**
  - dependencies: `next@16.4.6`, `react@19.3.1`, `react-dom@19.3.1`, `@supabase/ssr@0.12.7`, `@supabase/supabase-js@2.119.2`, `@lantai-dua/shared` dan `@lantai-dua/tokens` (`workspace:*`)
  - devDependencies: `tailwindcss@4.3.5`, `@tailwindcss/postcss@4.3.5`, `typescript@6.0.3`, `@types/react`, `@types/node`, `@playwright/test@1.65.1`, `vitest@5.1.1`
  - scripts: `dev`: `next dev`, `build`: `next build`, `typecheck`: `tsc --noEmit`, `test`: `vitest run --passWithNoTests`, `e2e`: `playwright test`
- **`next.config.ts`:** `transpilePackages: ['@lantai-dua/shared', '@lantai-dua/tokens']`.
- **`globals.css`:**
  - `@import "tailwindcss"; @import "@lantai-dua/tokens/theme.css";`
  - `body` memakai `bg-bg text-ink font-text`.
  - `:focus-visible` memakai outline 2px `primary` dengan offset 2px.
  - Kelas `.font-display` menambahkan `font-stretch: var(--font-display-stretch)`.
- **`layout.tsx`:**
  - `<html lang="id">`.
  - `next/font/google`: `Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo' })`, `Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument-sans' })`, `Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })`.
  - Metadata: `title.template` `'%s · LANTAI DUA'`, default `'LANTAI DUA · Coba dulu. Baru pilih.'`.
- **Header:**
  - logo
  - `<nav aria-label="Utama">` berisi **Katalog · Bandingkan · Showroom ↗** (Showroom memakai warna aksen). Di bawah 768 px, nav pindah ke baris kedua di bawah logo sebagai daftar mendatar. Fase 0 belum memakai menu hamburger.
  - tautan **Masuk** ke `/masuk`. Kalau prop `account` diisi, tautan ini diganti dengan akun.
- **Footer:** teks persis `LANTAI DUA adalah toko fiktif untuk project magang.`, ditambah tautan Kebijakan privasi.
- **Beranda (L1, versi Fase 0):**
  - overline `Toko periferal gaming · Surabaya`
  - judul `Coba dulu. Baru pilih.`
  - satu kalimat penjelasan
  - `ButtonLink` primary **Lihat Katalog** → `/katalog`
  - `ButtonLink` demo **Reservasi Demo** → `/reservasi/baru`
- **Halaman placeholder:** memakai `ComingSoon`, dengan judul sesuai nama halaman dan deskripsi `Halaman ini sedang disiapkan.`
- **`playwright.config.ts`:**
  - `process.loadEnvFile('.env.local')` kalau filenya ada
  - `webServer: { command: 'pnpm dev', url: 'http://localhost:3000', reuseExistingServer: true }`
  - satu project: chromium
- **`apps/web/.env.example`:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, `E2E_PASSWORD`.

- [ ] **Step 1: Tulis tes yang gagal (`e2e/public.spec.ts`)**

```ts
test('home shows the promise and both calls to action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Coba dulu. Baru pilih.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Lihat Katalog' })).toHaveAttribute('href', '/katalog');
  await expect(page.getByRole('link', { name: /Reservasi Demo/ })).toHaveAttribute('href', '/reservasi/baru');
});
for (const [name, path] of [['Katalog', '/katalog'], ['Bandingkan', '/bandingkan'], ['Showroom', '/showroom']] as const) {
  test(`nav link ${name} opens ${path}`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Utama' }).getByRole('link', { name }).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
}
test('no horizontal scroll at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});
test('footer states the store is fictional', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('contentinfo')).toContainText('LANTAI DUA adalah toko fiktif untuk project magang.');
});
```

Tes nav berjalan di ukuran desktop bawaan Playwright, yaitu 1280 px. Tes 360 px memastikan nav di baris kedua tidak membuat halaman bisa digeser ke samping.

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `pnpm install && pnpm --filter @lantai-dua/web exec playwright install chromium && pnpm e2e`
Expected: FAIL, karena halaman belum ada.

- [ ] **Step 3: Implementasikan konfigurasi, layout, komponen, dan halaman sesuai ketentuan di atas**

- [ ] **Step 4: Jalankan tes**

Run: `pnpm e2e && pnpm typecheck && pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: kerangka web publik dengan token dan huruf LANTAI DUA"
```

---

### Task 9: Login, penjaga rute, dan tiga dashboard

**Files:**
- Create: `apps/web/src/lib/supabase/server.ts`, `apps/web/src/lib/supabase/proxy-client.ts`, `apps/web/src/lib/viewer.ts`, `apps/web/src/lib/auth.ts`, `apps/web/src/lib/auth-errors.ts`, `apps/web/src/proxy.ts`
- Create: `apps/web/src/app/(auth)/layout.tsx`, `(auth)/actions.ts`, `(auth)/masuk/page.tsx`, `(auth)/masuk/login-form.tsx`, `(auth)/daftar/page.tsx`, `(auth)/daftar/signup-form.tsx`, `apps/web/src/app/auth/konfirmasi/route.ts`, `apps/web/src/app/akun-nonaktif/page.tsx`
- Create: `apps/web/src/components/text-field.tsx`, `apps/web/src/components/dashboard-shell.tsx`, dan `apps/web/src/app/{akun,operator,pemilik}/layout.tsx` serta `page.tsx`
- Modify: `apps/web/src/app/(public)/layout.tsx` (header menampilkan tautan akun)
- Test: `apps/web/src/lib/auth-errors.test.ts`, `apps/web/e2e/auth.spec.ts`

**Interfaces:**
- Consumes: `resolveAccess`, `safeNextPath`, `Viewer` (Task 1); `homePathForRole`, `ROLE_LABEL` (Task 1); `Database` (Task 7); akun demo (Task 7).
- Produces:
  - `createServerSupabase(): Promise<SupabaseClient<Database>>`: memakai `cookies()` dari `next/headers`
  - `createProxySupabase(request: NextRequest): { supabase: SupabaseClient<Database>; response: () => NextResponse }`
  - `getViewer(supabase): Promise<{ viewer: Viewer; userId: string | null; fullName: string | null }>`. Isinya `auth.getClaims()`, lalu `profiles.select('role, is_active, full_name')` untuk `sub`. Kalau tidak ada profil atau `is_active=false`, hasilnya `inactive`.
  - `requireRole(allowed: readonly Role[]): Promise<{ userId: string; fullName: string; role: Role }>`: melakukan `redirect()` dengan aturan yang sama seperti `resolveAccess`.
  - `authErrorMessage(code: string | undefined): string`
  - server actions:
    - `signIn(prev: FormState, data: FormData): Promise<FormState>`
    - `signUp(prev: FormState, data: FormData): Promise<FormState>`
    - `signOut(): Promise<void>`
    - dengan `type FormState = { error?: string; fieldErrors?: Record<string, string>; sent?: boolean }`
  - `TextField({ label, name, type?, error?, help?, ...input })`: selalu memakai `<label>` yang terlihat, `aria-invalid`, dan `aria-describedby`
  - `DashboardShell({ roleLabel, userName, nav: { href: string; label: string }[], children })`: sidebar 240 px mulai lebar 1024 px, bar atas di HP, plus tombol **Keluar**

Perilaku:
- **`proxy.ts`:**
  - Ekspor `proxy(request)` dan `config.matcher` = semua path kecuali `_next/static`, `_next/image`, `favicon.ico`, dan file gambar.
  - Jalankan `getViewer`, lalu `resolveAccess(pathname, viewer, search)`.
  - Kalau hasilnya redirect, buat `NextResponse.redirect` sambil membawa cookie sesi yang baru diperbarui.
- **`signIn`:**
  - `signInWithPassword`. Kalau error, kembalikan `{ error: authErrorMessage(error.code) }`.
  - Kalau berhasil, baca profil:
    - tidak aktif → `redirect('/akun-nonaktif')`
    - aktif → `redirect(safeNextPath(next) ?? homePathForRole(role))`
- **`signUp`:**
  - Validasi: `full_name` wajib diisi, email, kata sandi minimal 8 karakter, dan kotak persetujuan kebijakan privasi wajib dicentang. Setiap pesan error muncul di dekat kolomnya.
  - Panggil `auth.signUp` dengan `options.data.full_name` dan `emailRedirectTo: \`${NEXT_PUBLIC_SITE_URL}/auth/konfirmasi?next=${encodeURIComponent(safeNextPath(next) ?? '/akun')}\``.
  - Kalau berhasil, kembalikan `{ sent: true }`. Formulir lalu menampilkan `Cek email untuk verifikasi akun, lalu klik tautannya.`
- **`/auth/konfirmasi`:** menangani dua bentuk tautan.
  - Template bawaan (Fase 0): Supabase sudah memverifikasi email, lalu mengarahkan ke sini dengan `?code=…`. Tukar dengan `exchangeCodeForSession(code)`.
    - Berhasil → `redirect(safeNextPath(next) ?? '/akun')`.
    - Gagal, misalnya karena tautan dibuka di browser atau HP lain → `redirect('/masuk?pesan=terverifikasi')`. Halaman `/masuk` lalu menampilkan `Email sudah terverifikasi. Silakan masuk.`
  - Template `token_hash` (setelah SMTP sendiri dipasang di Fase 1): kalau ada `token_hash` dan `type`, jalankan `verifyOtp` lalu redirect dengan aturan yang sama.
  - Ada parameter `error` / `error_description`, atau `verifyOtp` gagal → `redirect('/masuk?error=verifikasi')`. Halaman `/masuk` lalu menampilkan `Tautan verifikasi tidak valid atau sudah kedaluwarsa.`
- **`/akun-nonaktif`:** judul `Akun ini sedang dinonaktifkan`, kalimat `Hubungi pemilik toko kalau ini keliru.`, dan tombol **Keluar**.
- **Dashboard:** setiap layout memanggil `requireRole`.

| Halaman | Isi |
|---|---|
| `/akun` | Judul `Halo, {nama depan}`, plus status kosong `Belum ada reservasi.` dan `Belum ada pesanan.` |
| `/operator` | Judul `Hari ini`, plus `Belum ada kunjungan atau pesanan.` |
| `/pemilik` | Judul `Ringkasan bisnis`, plus `Data penjualan muncul setelah ada pesanan.` |

Navigasinya baru satu item, yaitu Ringkasan, karena halaman lain belum dibuat.

Pesan `authErrorMessage`:

| Code | Pesan |
|---|---|
| `invalid_credentials` | `Email atau kata sandi salah.` |
| `email_not_confirmed` | `Email belum diverifikasi. Cek kotak masuk, lalu klik tautan verifikasinya.` |
| `user_already_exists`, `email_exists` | `Email ini sudah terdaftar. Silakan masuk.` |
| `weak_password` | `Kata sandi minimal 8 karakter.` |
| `over_email_send_rate_limit` | `Terlalu banyak permintaan email. Coba lagi beberapa menit lagi.` |
| `over_request_rate_limit` | `Terlalu banyak percobaan. Coba lagi sebentar lagi.` |
| lainnya / `undefined` | `Terjadi kesalahan. Coba lagi.` |

- [ ] **Step 1: Tulis tes unit yang gagal (`auth-errors.test.ts`)**

```ts
it.each([
  ['invalid_credentials', 'Email atau kata sandi salah.'],
  ['email_not_confirmed', 'Email belum diverifikasi. Cek kotak masuk, lalu klik tautan verifikasinya.'],
  ['email_exists', 'Email ini sudah terdaftar. Silakan masuk.'],
  ['something_new', 'Terjadi kesalahan. Coba lagi.'],
  [undefined, 'Terjadi kesalahan. Coba lagi.'],
])('maps %s', (code, msg) => expect(authErrorMessage(code)).toBe(msg));
```

- [ ] **Step 2: Tulis tes e2e yang gagal (`e2e/auth.spec.ts`)**

```ts
const pw = process.env.E2E_PASSWORD!;
async function login(page: Page, email: string, next?: string) {
  await page.goto(next ? `/masuk?next=${encodeURIComponent(next)}` : '/masuk');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Kata sandi').fill(pw);
  await page.getByRole('button', { name: 'Masuk' }).click();
}
test('guest is sent to login with next', async ({ page }) => {
  await page.goto('/operator');
  await expect(page).toHaveURL('/masuk?next=%2Foperator');
});
test('customer lands on /akun', async ({ page }) => {
  await login(page, 'pelanggan1@lantaidua.test');
  await expect(page).toHaveURL('/akun');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Halo, Raka');
});
test('operator lands on /operator and cannot open /pemilik', async ({ page }) => {
  await login(page, 'operator1@lantaidua.test');
  await expect(page).toHaveURL('/operator');
  await page.goto('/pemilik');
  await expect(page).toHaveURL('/operator');
});
test('owner lands on /pemilik and can open /operator', async ({ page }) => {
  await login(page, 'pemilik@lantaidua.test');
  await expect(page).toHaveURL('/pemilik');
  await page.goto('/operator');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hari ini');
});
test('wrong password shows a clear message', async ({ page }) => {
  await page.goto('/masuk');
  await page.getByLabel('Email').fill('pelanggan1@lantaidua.test');
  await page.getByLabel('Kata sandi').fill('salah-banget');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByRole('alert')).toHaveText('Email atau kata sandi salah.');
});
test('external next is ignored', async ({ page }) => {
  await login(page, 'pelanggan1@lantaidua.test', 'https://evil.example');
  await expect(page).toHaveURL('/akun');
});
test('deactivated staff land on /akun-nonaktif and can sign out', async ({ page }) => {
  await login(page, 'nonaktif@lantaidua.test');
  await expect(page).toHaveURL('/akun-nonaktif');
  await page.goto('/operator');
  await expect(page).toHaveURL('/akun-nonaktif');
  await page.getByRole('button', { name: 'Keluar' }).click();
  await page.goto('/akun');
  await expect(page).toHaveURL('/masuk?next=%2Fakun');
});
test('sign out ends the session', async ({ page }) => {
  await login(page, 'pelanggan1@lantaidua.test');
  await page.getByRole('button', { name: 'Keluar' }).click();
  await page.goto('/akun');
  await expect(page).toHaveURL('/masuk?next=%2Fakun');
});
```

- [ ] **Step 3: Jalankan tes, pastikan gagal**

Run: `pnpm --filter @lantai-dua/web test && pnpm e2e`
Expected: FAIL, karena modul dan halaman belum ada.

- [ ] **Step 4: Implementasikan semua file sesuai Interfaces dan Perilaku di atas**

- [ ] **Step 5: Jalankan semua tes**

Run: `pnpm --filter @lantai-dua/web test && pnpm e2e && pnpm typecheck && pnpm check`
Expected: PASS.

- [ ] **Step 6: Coba daftar secara manual**

Daftar dengan email asli milik pemilik project di `/daftar`. Pastikan email verifikasi masuk, tautannya mengarah ke `/auth/konfirmasi`, lalu berakhir di `/akun`. Setelah itu hapus akun ini dari dashboard Supabase. Langkah ini manual karena kuota email bawaan Supabase hanya beberapa per jam.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: login, penjaga rute per peran, dan kerangka tiga dashboard"
```

---

### Task 10: Dokumentasi dan verifikasi akhir

**Files:**
- Create: `README.md`
- Modify: `design-system/lantai-dua/MASTER.md` (§10 Token), `docs/PRD.md` (§18, baris risiko kuota email)

- [ ] **Step 1: Tulis `README.md`**

Isinya:
- satu paragraf tentang project
- struktur folder
- prasyarat (Task 0)
- langkah setup: `pnpm install`, isi `.env.local` di root dan di `apps/web`, `supabase login` / `link`, `pnpm db:push`, `pnpm db:seed-users`, `pnpm db:types`
- perintah harian: `pnpm dev`, `check`, `typecheck`, `test`, `test:rls`, `e2e`
- tabel akun demo (email dan peran saja, tanpa kata sandi)
- catatan: project ini tidak memakai Docker, dan tes RLS berjalan terhadap project dev sungguhan

- [ ] **Step 2: Perbarui MASTER.md §10**

Sumber kebenaran token sekarang `packages/tokens/src/tokens.ts`. File `theme.css` dibuat lewat `pnpm --filter @lantai-dua/tokens build`. File `design-system/lantai-dua/tokens.css` / `tokens.json` sekarang hanya salinan v0.1 untuk pratinjau.

- [ ] **Step 3: Perbarui PRD §18, risiko kuota email**

Ubah mitigasinya menjadi: "Fase 0 memakai akun demo yang dibuat lewat admin. SMTP sendiri dipasang bersamaan dengan deploy di Fase 1, karena butuh domain."

- [ ] **Step 4: Jalankan semua pemeriksaan sekaligus**

Run: `pnpm check && pnpm typecheck && pnpm test && pnpm test:rls && pnpm e2e`
Expected: semua PASS. Ini kriteria selesai Fase 0 (PRD §16): ketiga peran login dan diarahkan ke dashboard masing-masing, dan tes RLS untuk setiap peran lulus.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "docs: README setup, sumber token, dan catatan risiko email"
```
