import {
  fromReservableRow,
  fromSettingsRow,
  fromSlotRow,
  type ReservableVariant,
  type ReservationSettings,
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
      'session_minutes, min_lead_minutes, max_days_ahead, max_active_reservations, cancel_cutoff_minutes, address, maps_url, whatsapp',
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

export async function getReservationViewer(): Promise<ReservationViewer> {
  const { viewer } = await getCurrentViewer();
  if (viewer.kind === 'guest') return 'guest';
  return viewer.kind === 'active' && viewer.role === 'customer' ? 'customer' : 'other';
}
