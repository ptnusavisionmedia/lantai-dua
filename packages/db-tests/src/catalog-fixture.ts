import type { SupabaseClient } from '@supabase/supabase-js';

export type CatalogFixture = {
  prefix: string;
  groupId: string;
  catId: string;
  catOffId: string;
  brandId: string;
  pOn: string;
  pOff: string;
  pRef: string;
  pInOffCat: string;
  vOn: string;
  vOff: string;
};

async function insertOne(admin: SupabaseClient, table: string, row: Record<string, unknown>) {
  const { data, error } = await admin.from(table).insert(row).select('id').single();
  if (error) throw new Error(`Fixture ${table} gagal: ${error.message}`);
  return data.id as string;
}

/** Membuat rak, kategori aktif + nonaktif, merek, produk, dan varian tes. Semua slug berawalan `prefix`. */
export async function createCatalogFixture(
  admin: SupabaseClient,
  prefix: string,
): Promise<CatalogFixture> {
  const groupId = await insertOne(admin, 'category_groups', {
    slug: `${prefix}grp`,
    name: 'Rak tes',
  });
  const catId = await insertOne(admin, 'categories', {
    group_id: groupId,
    slug: `${prefix}cat`,
    name: 'Kategori tes',
    try_mode: 'unit',
    is_active: true,
  });
  const catOffId = await insertOne(admin, 'categories', {
    group_id: groupId,
    slug: `${prefix}cat-off`,
    name: 'Kategori nonaktif',
    try_mode: 'free',
    is_active: false,
  });
  const { error: attrError } = await admin.from('category_attributes').insert(
    [
      { category_id: catId, key: 'weight_g', label: 'Bobot', type: 'number', unit: 'g' },
      {
        category_id: catId,
        key: 'shape',
        label: 'Bentuk',
        type: 'enum',
        options: ['Simetris', 'Ergonomis kanan'],
      },
      {
        category_id: catId,
        key: 'connectivity',
        label: 'Koneksi',
        type: 'multi_enum',
        options: ['Kabel', 'Bluetooth'],
      },
      { category_id: catId, key: 'wireless', label: 'Wireless', type: 'boolean' },
      { category_id: catId, key: 'sensor', label: 'Sensor', type: 'text' },
      { category_id: catId, key: 'color', label: 'Warna', type: 'text', scope: 'variant' },
    ],
    { defaultToNull: false },
  );
  if (attrError) throw new Error(`Fixture category_attributes gagal: ${attrError.message}`);

  const brandId = await insertOne(admin, 'brands', { slug: `${prefix}brand`, name: 'Merek tes' });
  const product = (slug: string, extra: Record<string, unknown>) =>
    insertOne(admin, 'products', {
      category_id: catId,
      brand_id: brandId,
      model_name: slug,
      slug: `${prefix}${slug}`,
      ...extra,
    });
  const pOn = await product('p-on', { is_active: true });
  const pOff = await product('p-off', { is_active: false });
  const pRef = await product('p-ref', { is_active: true, is_for_sale: false });
  const pInOffCat = await product('p-in-off-cat', { is_active: true, category_id: catOffId });
  const vOn = await insertOne(admin, 'product_variants', {
    product_id: pOn,
    sku: `${prefix}v-on`,
    name: 'Hitam',
    price_idr: 1_000_000,
  });
  const vOff = await insertOne(admin, 'product_variants', {
    product_id: pOn,
    sku: `${prefix}v-off`,
    name: 'Putih',
    price_idr: 1_000_000,
    is_active: false,
  });
  return {
    prefix,
    groupId,
    catId,
    catOffId,
    brandId,
    pOn,
    pOff,
    pRef,
    pInOffCat,
    vOn,
    vOff,
  };
}

/** Menghapus semua data fixture (urutannya mengikuti foreign key). */
export async function deleteCatalogFixture(admin: SupabaseClient, prefix: string): Promise<void> {
  await admin.from('products').delete().like('slug', `${prefix}%`);
  await admin.from('categories').delete().like('slug', `${prefix}%`);
  await admin.from('category_groups').delete().like('slug', `${prefix}%`);
  await admin.from('brands').delete().like('slug', `${prefix}%`);
}
