import {
  fromReservableRow,
  fromReservationRow,
  fromSettingsRow,
  fromSlotRow,
  isReservationCode,
  type ReservableVariant,
  type ReservationRowWithItems,
  type ReservationSettings,
  type ReservationView,
  type Slot,
} from '@lantai-dua/shared/reservation';
import { cache } from 'react';
import { getCurrentViewer } from './auth';
import { createServerSupabase } from './supabase/server';

export type StoreInfo = ReservationSettings & {
  address: string;
  mapsUrl: string | null;
  whatsapp: string | null;
};

/** Siapa yang membuka formulir: tamu, pelanggan aktif, atau lainnya (staf, akun nonaktif). */
export type ReservationViewer = 'guest' | 'customer' | 'other';

/** Angka reservasi dan kontak toko dari pengaturan toko. */
export const getStoreInfo = cache(async (): Promise<StoreInfo> => {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('store_settings')
    .select(
      'session_minutes, min_lead_minutes, max_days_ahead, max_active_reservations, cancel_cutoff_minutes, checkin_open_minutes, no_show_after_minutes, address, maps_url, whatsapp',
    )
    .single();
  if (error) throw new Error(`Pengaturan toko gagal dimuat: ${error.message}`);
  return {
    ...fromSettingsRow(data),
    address: data.address,
    mapsUrl: data.maps_url,
    whatsapp: data.whatsapp,
  };
});

/** Varian yang bisa direservasi, termasuk yang semua unitnya sedang diservis. */
export const listReservableVariants = cache(async (): Promise<ReservableVariant[]> => {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc('reservable_variants');
  if (error) throw new Error(`Daftar unit demo gagal dimuat: ${error.message}`);
  return data.map(fromReservableRow);
});

/** Slot untuk rentang tanggal WIB dan varian tertentu, beserta alasannya. */
export async function listSlots(from: string, to: string, variantIds: string[]): Promise<Slot[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc('reservation_slots', {
    p_from: from,
    p_to: to,
    p_variant_ids: variantIds,
  });
  if (error) throw new Error(`Jadwal gagal dimuat: ${error.message}`);
  return data.map(fromSlotRow);
}

const RESERVATION_SELECT =
  'id, code, status, starts_at, ends_at, note, cancel_reason, reservation_items(variant:product_variants(name, product:products(model_name, brand:brands(name))), unit:demo_units(code, area:demo_areas(name)))';

/** Reservasi milik pelanggan yang login (RLS), urut dari jadwal paling awal. */
export const listMyReservations = cache(async (): Promise<ReservationView[]> => {
  const supabase = await createServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return [];
  const { data, error } = await supabase
    .from('reservations')
    .select(RESERVATION_SELECT)
    .eq('customer_id', userId)
    .order('starts_at');
  if (error) throw new Error(`Reservasi gagal dimuat: ${error.message}`);
  return (data as unknown as ReservationRowWithItems[]).map(fromReservationRow);
});

/** Satu reservasi milik pelanggan yang login; null kalau kodenya tidak sah atau bukan miliknya. */
export const getMyReservation = cache(async (code: string): Promise<ReservationView | null> => {
  if (!isReservationCode(code)) return null;
  const supabase = await createServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;
  const { data, error } = await supabase
    .from('reservations')
    .select(RESERVATION_SELECT)
    .eq('code', code)
    .eq('customer_id', userId)
    .maybeSingle();
  if (error) throw new Error(`Reservasi gagal dimuat: ${error.message}`);
  return data ? fromReservationRow(data as unknown as ReservationRowWithItems) : null;
});

/** Nomor WhatsApp di profil pengguna yang login; null untuk tamu atau kalau belum diisi. */
export const getMyWhatsapp = cache(async (): Promise<string | null> => {
  const supabase = await createServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('whatsapp')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(`Profil gagal dimuat: ${error.message}`);
  return data?.whatsapp ?? null;
});

export async function getReservationViewer(): Promise<ReservationViewer> {
  const { viewer } = await getCurrentViewer();
  if (viewer.kind === 'guest') return 'guest';
  return viewer.kind === 'active' && viewer.role === 'customer' ? 'customer' : 'other';
}
