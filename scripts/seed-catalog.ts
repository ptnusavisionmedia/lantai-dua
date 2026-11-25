/**
 * Memasukkan 16 produk asli Fase 1A ke project Supabase dev.
 * Jalankan dari root: `pnpm db:seed-catalog`. Aman dijalankan berulang kali: harga, stok,
 * `is_active`, dan status unit demo hanya diisi saat baris pertama kali dibuat.
 *
 * `pnpm db:seed-catalog --paksa-bisnis` ikut menimpa kolom bisnis itu (development saja).
 * Butuh SUPABASE_PROJECT_REF, SUPABASE_URL, dan SUPABASE_SECRET_KEY di .env.local.
 */
import { createClient } from '@supabase/supabase-js';
import { catalogSeed, seedCatalog } from '../packages/catalog-data/src/index.ts';

process.loadEnvFile('.env.local');

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} belum diisi di .env.local`);
  return value;
}

const forceBusiness = process.argv.includes('--paksa-bisnis');
console.log(`Target: ${requireEnv('SUPABASE_PROJECT_REF')}`);
if (forceBusiness) {
  console.log('Mode --paksa-bisnis: harga, stok, is_active, dan status unit ikut ditimpa.');
}

const admin = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SECRET_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const report = await seedCatalog(admin, catalogSeed, { forceBusiness });
console.table(report);
