/**
 * Helper KHUSUS TES e2e: membersihkan dan menyiapkan reservasi akun tes.
 * Membaca secret key dari `.env.local` root (bukan dari env aplikasi web), dan tidak pernah
 * diimpor oleh kode aplikasi. Tanpa pembersihan ini, batas 10 reservasi per 24 jam akan
 * memblokir run e2e berikutnya.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PASSWORD } from './data';

const noSession = { auth: { persistSession: false, autoRefreshToken: false } } as const;

function rootEnv(): Record<string, string | undefined> {
  return parseEnv(readFileSync(resolve(process.cwd(), '../../.env.local'), 'utf8'));
}

export function adminClient(): SupabaseClient {
  const env = rootEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new Error('SUPABASE_URL dan SUPABASE_SECRET_KEY belum ada di .env.local root');
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, noSession);
}

async function userIds(admin: SupabaseClient, emails: string[]): Promise<string[]> {
  const wanted = new Set(emails.map((e) => e.toLowerCase()));
  const ids: string[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`daftar akun: ${error.message}`);
    for (const u of data.users) if (u.email && wanted.has(u.email.toLowerCase())) ids.push(u.id);
    if (data.users.length < 200) break;
  }
  return ids;
}

/** Menghapus semua reservasi milik akun-akun ini (item dan kursi ikut terhapus). */
export async function clearReservations(emails: string[]): Promise<void> {
  const admin = adminClient();
  const ids = await userIds(admin, emails);
  if (ids.length === 0) return;
  const { error } = await admin.from('reservations').delete().in('customer_id', ids);
  if (error) throw new Error(`hapus reservasi: ${error.message}`);
}

/** Membuat reservasi sebagai pelanggan lewat fungsi database, lalu mengembalikan kodenya. */
export async function reserveAs(email: string, skus: string[], startsAt: string): Promise<string> {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    noSession,
  );
  const auth = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (auth.error) throw new Error(`login ${email}: ${auth.error.message}`);
  const { data: variants, error: vError } = await client.rpc('reservable_variants');
  if (vError) throw new Error(`varian: ${vError.message}`);
  const ids = skus.map((sku) => {
    const v = (variants as { sku: string; variant_id: string }[]).find((x) => x.sku === sku);
    if (!v) throw new Error(`varian ${sku} tidak bisa direservasi`);
    return v.variant_id;
  });
  const { data, error } = await client.rpc('create_reservation', {
    p_variant_ids: ids,
    p_starts_at: startsAt,
    p_note: null,
  });
  await client.auth.signOut();
  if (error) throw new Error(`reservasi ${email}: ${error.message}`);
  return data as string;
}

/** Tanggal WIB hari ini + `days`, sebagai `YYYY-MM-DD`. */
export function wibDateIn(days: number): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000 + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

/** Awal slot `hhmm` ("14.00") pada tanggal WIB itu, sebagai timestamptz. */
export function startsAtOn(day: string, hhmm: string): string {
  return `${day}T${hhmm.replace('.', ':')}:00+07:00`;
}
