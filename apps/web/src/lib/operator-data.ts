import {
  addDays,
  fromOperatorRow,
  isReservationCode,
  type OperatorReservation,
  type OperatorReservationRow,
} from '@lantai-dua/shared/reservation';
import { cache } from 'react';
import { createServerSupabase } from './supabase/server';

// Data layar operator. Staf membaca reservasi lewat RLS 1C-1; nama dan WhatsApp pelanggan hanya
// lewat `reservation_contacts` (O7, desain 1C-2 §6.3).

const OPERATOR_SELECT =
  'id, code, status, starts_at, ends_at, note, cancel_reason, created_at, reservation_items(variant:product_variants(name, product:products(model_name, brand:brands(name), category:categories(hygiene_note))), unit:demo_units(code, area:demo_areas(name)))';

/** Batas kontak per panggilan `reservation_contacts`. */
const CONTACT_BATCH = 200;

/** Awal tanggal WIB sebagai timestamptz. */
const dayStart = (date: string) => `${date}T00:00:00+07:00`;

async function withContacts(rows: OperatorReservationRow[]): Promise<OperatorReservation[]> {
  if (rows.length === 0) return [];
  const supabase = await createServerSupabase();
  const contacts = new Map<string, { full_name: string; whatsapp: string | null }>();
  for (let i = 0; i < rows.length; i += CONTACT_BATCH) {
    const { data, error } = await supabase.rpc('reservation_contacts', {
      p_reservation_ids: rows.slice(i, i + CONTACT_BATCH).map((r) => r.id),
    });
    if (error) throw new Error(`Kontak pelanggan gagal dimuat: ${error.message}`);
    for (const c of data) contacts.set(c.reservation_id, c);
  }
  return rows.map((r) => fromOperatorRow(r, contacts.get(r.id)));
}

/** Semua reservasi yang mulai pada tanggal WIB `today`, urut menurut jam mulai. */
export const listTodayForOperator = cache(async (today: string): Promise<OperatorReservation[]> => {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('reservations')
    .select(OPERATOR_SELECT)
    .gte('starts_at', dayStart(today))
    .lt('starts_at', dayStart(addDays(today, 1)))
    .order('starts_at');
  if (error) throw new Error(`Reservasi hari ini gagal dimuat: ${error.message}`);
  return withContacts(data as unknown as OperatorReservationRow[]);
});

/** Reservasi Tidak tercatat yang mulai dalam 7 hari terakhir, paling lama dulu (R12). */
export const listUnrecorded = cache(async (today: string): Promise<OperatorReservation[]> => {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('reservations')
    .select(OPERATOR_SELECT)
    .eq('status', 'unrecorded')
    .gte('starts_at', dayStart(addDays(today, -7)))
    .order('starts_at');
  if (error) throw new Error(`Reservasi yang perlu dikoreksi gagal dimuat: ${error.message}`);
  return withContacts(data as unknown as OperatorReservationRow[]);
});

/** Satu reservasi untuk halaman detail operator; null kalau kodenya tidak sah atau tidak ada. */
export const getOperatorReservation = cache(
  async (code: string): Promise<OperatorReservation | null> => {
    if (!isReservationCode(code)) return null;
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('reservations')
      .select(OPERATOR_SELECT)
      .eq('code', code)
      .maybeSingle();
    if (error) throw new Error(`Reservasi gagal dimuat: ${error.message}`);
    if (!data) return null;
    const [r] = await withContacts([data as unknown as OperatorReservationRow]);
    return r ?? null;
  },
);

/** Jam buka toko pada tanggal WIB itu ("10.00"), atau null kalau tutup atau libur. */
export const getOpeningToday = cache(
  async (today: string): Promise<{ opens: string; closes: string } | null> => {
    const supabase = await createServerSupabase();
    const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
    const isodow = weekday === 0 ? 7 : weekday;
    const [hours, closure] = await Promise.all([
      supabase.from('opening_hours').select('opens_at, closes_at').eq('isodow', isodow).single(),
      supabase.from('store_closures').select('date').eq('date', today).maybeSingle(),
    ]);
    if (hours.error) throw new Error(`Jam buka gagal dimuat: ${hours.error.message}`);
    if (closure.data || !hours.data.opens_at || !hours.data.closes_at) return null;
    const clock = (t: string) => t.slice(0, 5).replace(':', '.');
    return { opens: clock(hours.data.opens_at), closes: clock(hours.data.closes_at) };
  },
);
