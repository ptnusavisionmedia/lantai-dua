/**
 * Membuat ulang tipe TypeScript dari skema database project dev.
 * Jalankan dari root: `pnpm db:types`. Butuh SUPABASE_PROJECT_REF di .env.local dan `supabase login`.
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

process.loadEnvFile('.env.local');

const ref = process.env.SUPABASE_PROJECT_REF ?? '';
if (!/^[a-z0-9]{20}$/.test(ref)) {
  throw new Error(
    'SUPABASE_PROJECT_REF di .env.local harus 20 huruf kecil/angka (lihat Project Settings)',
  );
}

const types = execSync(
  `pnpm exec supabase gen types typescript --project-id ${ref} --schema public`,
  { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
);

const target = 'packages/shared/src/database.types.ts';
writeFileSync(target, types);
console.log(`Tipe database ditulis ke ${target}`);
