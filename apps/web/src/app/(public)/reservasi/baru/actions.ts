'use server';

import { createErrorText, variantLabel } from '@lantai-dua/shared/reservation';
import { normalizeWhatsapp, WHATSAPP_INVALID } from '@lantai-dua/shared/whatsapp';
import { getStoreInfo, listReservableVariants } from '@/lib/reservation-data';
import { createServerSupabase } from '@/lib/supabase/server';

export type CreateResult = { ok: true; code: string } | { ok: false; error: string };

const SAVE_FAILED = 'Gagal menyimpan. Coba lagi sebentar.';

/**
 * Membuat reservasi lewat fungsi database. Semua aturan (jadwal, batas, anti-bentrok, peran,
 * nomor WhatsApp) diperiksa di database; di sini hanya SKU dipetakan ke id, nomor WhatsApp baru
 * disimpan ke profil lebih dulu (desain 1C-2 §5.8), dan galat diubah menjadi kalimat.
 */
export async function createReservationAction(input: {
  skus: string[];
  startsAt: string;
  note: string;
  whatsapp?: string;
}): Promise<CreateResult> {
  const [settings, variants] = await Promise.all([getStoreInfo(), listReservableVariants()]);
  const skus = Array.isArray(input?.skus) ? input.skus.filter((s) => typeof s === 'string') : [];
  const ids = skus.map((sku) => variants.find((v) => v.sku === sku)?.id);
  if (
    ids.length === 0 ||
    ids.some((id) => id === undefined) ||
    typeof input.startsAt !== 'string'
  ) {
    return { ok: false, error: createErrorText('invalid_items', null, settings) };
  }

  const supabase = await createServerSupabase();

  if (typeof input.whatsapp === 'string') {
    const whatsapp = normalizeWhatsapp(input.whatsapp);
    if (!whatsapp) return { ok: false, error: WHATSAPP_INVALID };
    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims?.sub;
    if (!userId) return { ok: false, error: createErrorText('not_customer', null, settings) };
    // Kalau reservasinya nanti gagal, nomor tetap tersimpan supaya tidak perlu diisi lagi.
    const { error } = await supabase.from('profiles').update({ whatsapp }).eq('id', userId);
    if (error) return { ok: false, error: SAVE_FAILED };
  }

  const { data, error } = await supabase.rpc('create_reservation', {
    p_variant_ids: ids as string[],
    p_starts_at: input.startsAt,
    p_note: typeof input.note === 'string' ? input.note.slice(0, 500) : '',
  });
  if (error) {
    const variant = variants.find((v) => v.id === error.details);
    return {
      ok: false,
      error: createErrorText(error.message, variant ? variantLabel(variant) : null, settings),
    };
  }
  return { ok: true, code: data };
}
