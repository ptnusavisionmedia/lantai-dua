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

/** Mengisi (atau mengosongkan) nomor WhatsApp profil akun tes. */
export async function setWhatsapp(email: string, whatsapp: string | null): Promise<void> {
  const admin = adminClient();
  const [id] = await userIds(admin, [email]);
  if (!id) throw new Error(`akun ${email} tidak ada`);
  const { error } = await admin.from('profiles').update({ whatsapp }).eq('id', id);
  if (error) throw new Error(`nomor WhatsApp ${email}: ${error.message}`);
}

/** Nomor WhatsApp yang tersimpan di profil akun tes. */
export async function whatsappOf(email: string): Promise<string | null> {
  const admin = adminClient();
  const [id] = await userIds(admin, [email]);
  const { data, error } = await admin.from('profiles').select('whatsapp').eq('id', id).single();
  if (error) throw new Error(`profil ${email}: ${error.message}`);
  return (data as { whatsapp: string | null }).whatsapp;
}

/** Waktu sekarang ditambah `m` menit (boleh negatif). */
export function minutesFromNow(m: number): Date {
  return new Date(Date.now() + m * 60_000);
}

const range = (from: string, to: string) => `[${from},${to})`;

/**
 * Menggeser jadwal reservasi; periode item dan kursi ikut bergeser lewat trigger.
 * Database dev dipakai bersama, jadi di jam tujuan bisa sudah ada reservasi lain di meja yang
 * sama. Sebelum digeser, nomor kursinya diganti ke nomor yang kosong di jam asal dan jam tujuan.
 */
export async function shiftReservation(code: string, startsAt: Date, minutes = 30): Promise<void> {
  const admin = adminClient();
  const from = startsAt.toISOString();
  const to = new Date(startsAt.getTime() + minutes * 60_000).toISOString();
  const { data: r, error } = await admin
    .from('reservations')
    .select(
      'id, starts_at, ends_at, reservation_seats(id, area_id, seat_no, area:demo_areas(capacity))',
    )
    .eq('code', code)
    .single();
  if (error) throw new Error(`reservasi ${code}: ${error.message}`);
  const res = r as unknown as {
    id: string;
    starts_at: string;
    ends_at: string;
    reservation_seats: {
      id: string;
      area_id: string;
      seat_no: number;
      area: { capacity: number } | null;
    }[];
  };
  for (const seat of res.reservation_seats) {
    const used = new Set<number>();
    for (const period of [range(res.starts_at, res.ends_at), range(from, to)]) {
      const { data: others } = await admin
        .from('reservation_seats')
        .select('seat_no')
        .eq('area_id', seat.area_id)
        .eq('is_active', true)
        .neq('reservation_id', res.id)
        .overlaps('period', period);
      for (const o of others ?? []) used.add(o.seat_no as number);
    }
    if (!used.has(seat.seat_no)) continue;
    const capacity = seat.area?.capacity ?? 0;
    const free = Array.from({ length: capacity }, (_, i) => i + 1).find((n) => !used.has(n));
    if (free === undefined) throw new Error(`meja penuh di jam tujuan untuk ${code}`);
    const { error: seatError } = await admin
      .from('reservation_seats')
      .update({ seat_no: free })
      .eq('id', seat.id);
    if (seatError) throw new Error(`ganti kursi ${code}: ${seatError.message}`);
  }
  await updateReservation(code, { starts_at: from, ends_at: to });
}

/** Mengubah kolom reservasi langsung lewat admin, untuk menyiapkan keadaan tes. */
export async function updateReservation(
  code: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await adminClient().from('reservations').update(patch).eq('code', code);
  if (error) throw new Error(`ubah reservasi ${code}: ${error.message}`);
}

/** Membuat reservasi sebagai pelanggan lewat fungsi database, lalu mengembalikan kodenya. */
export async function reserveAs(
  email: string,
  skus: string[],
  startsAt: string,
  note: string | null = null,
): Promise<string> {
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
    p_note: note,
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
