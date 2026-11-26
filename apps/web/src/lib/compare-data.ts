import type { AttributeDef } from '@lantai-dua/shared/catalog';
import {
  type CompareExamples,
  type CompareItem,
  fromCompareRow,
  fromGearRow,
  type Gear,
} from '@lantai-dua/shared/compare';
import { cache } from 'react';
import { getCurrentViewer } from './auth';
import { getCategory } from './catalog-data';
import { createServerSupabase } from './supabase/server';

/** Siapa yang membuka Bandingkan: tamu, pelanggan aktif, atau lainnya (staf, akun nonaktif). */
export type CompareViewer = 'guest' | 'customer' | 'other';

/** Mouse dijual dan referensi di satu kategori, dari view `compare_items`. */
export const listCompareItems = cache(async (category: string): Promise<CompareItem[]> => {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('compare_items')
    .select('*')
    .eq('category_slug', category);
  if (error) throw new Error(`Daftar mouse gagal dimuat: ${error.message}`);
  return data.map(fromCompareRow);
});

/** Pasangan contoh dari pengaturan toko. */
export const getCompareExamples = cache(async (): Promise<CompareExamples> => {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('store_settings')
    .select('compare_example_current_id, compare_example_target_id')
    .maybeSingle();
  if (error) throw new Error(`Pengaturan toko gagal dimuat: ${error.message}`);
  return {
    currentId: data?.compare_example_current_id ?? null,
    targetId: data?.compare_example_target_id ?? null,
  };
});

/** Gear gue milik pelanggan yang sedang login untuk satu kategori; null selain pelanggan aktif. */
export const getMyGear = cache(async (category: string): Promise<Gear | null> => {
  const { viewer } = await getCurrentViewer();
  if (viewer.kind !== 'active' || viewer.role !== 'customer') return null;
  const supabase = await createServerSupabase();
  const { data: cat, error: catError } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', category)
    .maybeSingle();
  if (catError) throw new Error(`Kategori gagal dimuat: ${catError.message}`);
  if (!cat) return null;
  // RLS hanya mengembalikan baris milik pelanggan ini.
  const { data, error } = await supabase
    .from('user_gear')
    .select('product_id, manual_specs')
    .eq('category_id', cat.id)
    .maybeSingle();
  if (error) throw new Error(`Gear gagal dimuat: ${error.message}`);
  return data ? fromGearRow(data) : null;
});

export type ComparePageData = {
  items: CompareItem[];
  attributes: AttributeDef[];
  examples: CompareExamples;
  gear: Gear | null;
  viewer: CompareViewer;
};

/** Semua data Bandingkan mouse, atau null kalau kategori mouse tidak aktif. */
export const loadComparePage = cache(async (): Promise<ComparePageData | null> => {
  const category = await getCategory('mouse');
  if (!category) return null;
  const [items, examples, gear, { viewer }] = await Promise.all([
    listCompareItems('mouse'),
    getCompareExamples(),
    getMyGear('mouse'),
    getCurrentViewer(),
  ]);
  const kind: CompareViewer =
    viewer.kind === 'guest'
      ? 'guest'
      : viewer.kind === 'active' && viewer.role === 'customer'
        ? 'customer'
        : 'other';
  return { items, attributes: category.attributes, examples, gear, viewer: kind };
});
