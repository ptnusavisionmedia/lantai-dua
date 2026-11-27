'use server';

import { createErrorText, variantLabel } from '@lantai-dua/shared/reservation';
import { getStoreInfo, listReservableVariants } from '@/lib/reservation-data';
import { createServerSupabase } from '@/lib/supabase/server';

export type CreateResult = { ok: true; code: string } | { ok: false; error: string };

/**
 * Membuat reservasi lewat fungsi database. Semua aturan (jadwal, batas, anti-bentrok, peran)
 * diperiksa di database; di sini hanya SKU dipetakan ke id dan galat diubah menjadi kalimat.
 */
export async function createReservationAction(input: {
  skus: string[];
  startsAt: string;
  note: string;
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
