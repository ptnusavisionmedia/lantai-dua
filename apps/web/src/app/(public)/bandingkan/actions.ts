'use server';

import { type Gear, type ManualSpecs, validateManualSpecs } from '@lantai-dua/shared/compare';
import { getCurrentViewer } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';

export type SaveGearInput = { kind: 'item'; slug: string } | { kind: 'manual'; specs: ManualSpecs };
export type SaveGearResult = { ok: true; gear: Gear } | { ok: false; error: string };

const FAILED = 'Gagal menyimpan. Coba lagi sebentar.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Menyimpan mouse yang dipakai sekarang sebagai Gear gue (PRD §9.5 B10). Hanya untuk pelanggan
 * aktif; isian dari browser diperiksa ulang di sini, dan RLS `user_gear` menjadi penjaga terakhir.
 */
export async function saveMouseGear(input: SaveGearInput): Promise<SaveGearResult> {
  const { viewer, userId } = await getCurrentViewer();
  if (viewer.kind !== 'active' || viewer.role !== 'customer' || !userId) {
    return { ok: false, error: 'Masuk sebagai pelanggan untuk menyimpan mouse lu.' };
  }
  if (!isRecord(input)) return { ok: false, error: FAILED };

  const supabase = await createServerSupabase();
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'mouse')
    .maybeSingle();
  if (categoryError || !category) return { ok: false, error: FAILED };

  let gear: Gear;
  if (input.kind === 'item' && typeof input.slug === 'string') {
    const { data: item, error } = await supabase
      .from('compare_items')
      .select('id')
      .eq('slug', input.slug)
      .eq('category_slug', 'mouse')
      .maybeSingle();
    if (error) return { ok: false, error: FAILED };
    if (!item?.id) return { ok: false, error: 'Mouse ini tidak ditemukan.' };
    gear = { kind: 'item', productId: item.id };
  } else if (input.kind === 'manual' && isRecord(input.specs)) {
    const specs = validateManualSpecs(input.specs);
    if (!specs) return { ok: false, error: 'Ukuran belum lengkap atau di luar rentang.' };
    gear = { kind: 'manual', specs };
  } else {
    return { ok: false, error: FAILED };
  }

  // Kolom yang tidak dipakai dikirim null, supaya aturan "tepat satu" tetap terpenuhi saat
  // gear berganti dari produk ke ukuran manual atau sebaliknya.
  const { error } = await supabase.from('user_gear').upsert(
    {
      user_id: userId,
      category_id: category.id,
      product_id: gear.kind === 'item' ? gear.productId : null,
      manual_specs: gear.kind === 'manual' ? gear.specs : null,
    },
    { onConflict: 'user_id,category_id' },
  );
  if (error) return { ok: false, error: FAILED };
  return { ok: true, gear };
}
