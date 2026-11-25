import {
  type AttributeDef,
  type CatalogItem,
  fromAttributeRow,
  fromCatalogRow,
  type TryMode,
} from '@lantai-dua/shared/catalog';
import { cache } from 'react';
import { createServerSupabase } from './supabase/server';

export { productImageUrl } from './image-url';

export type CategorySummary = {
  slug: string;
  name: string;
  groupSlug: string;
  groupName: string;
  sortOrder: number;
};

export type CategoryDetail = {
  slug: string;
  name: string;
  tryMode: TryMode;
  hygieneNote: string | null;
  attributes: AttributeDef[];
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const fetchCatalogItems = cache(async (category: string | null): Promise<CatalogItem[]> => {
  const supabase = await createServerSupabase();
  let query = supabase.from('catalog_items').select('*');
  if (category) query = query.eq('category_slug', category);
  const { data, error } = await query;
  if (error) throw new Error(`Katalog gagal dimuat: ${error.message}`);
  return data.map(fromCatalogRow);
});

/** Produk yang tampil di katalog (aktif, dijual, punya varian aktif), opsional per kategori. */
export async function listCatalogItems(opts: { category?: string } = {}): Promise<CatalogItem[]> {
  return fetchCatalogItems(opts.category ?? null);
}

/** Kategori aktif, urut menurut rak lalu kategori. */
export const listCategories = cache(async (): Promise<CategorySummary[]> => {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('categories')
    .select('slug, name, sort_order, group:category_groups!inner(slug, name, sort_order)')
    .eq('is_active', true);
  if (error) throw new Error(`Kategori gagal dimuat: ${error.message}`);
  return data
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      groupSlug: c.group.slug,
      groupName: c.group.name,
      sortOrder: c.group.sort_order * 1000 + c.sort_order,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
});

/** Kategori aktif beserta template speknya, atau null kalau tidak ada. */
export const getCategory = cache(async (slug: string): Promise<CategoryDetail | null> => {
  if (!SLUG.test(slug)) return null;
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('categories')
    .select('slug, name, try_mode, hygiene_note, category_attributes(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw new Error(`Kategori gagal dimuat: ${error.message}`);
  if (!data) return null;
  return {
    slug: data.slug,
    name: data.name,
    tryMode: data.try_mode,
    hygieneNote: data.hygiene_note,
    attributes: data.category_attributes
      .map(fromAttributeRow)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
});
