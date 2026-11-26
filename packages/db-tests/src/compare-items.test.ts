import type { SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type CatalogFixture, createCatalogFixture, deleteCatalogFixture } from './catalog-fixture';
import { adminClient, anonClient, clientFor, runId } from './clients';

const prefix = () => `rls-${runId()}-ci-`;
let f: CatalogFixture;
let areaId: string;

async function ok(label: string, p: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await p;
  if (error) throw new Error(`${label}: ${error.message}`);
}
async function must<T>(
  label: string,
  p: PromiseLike<{ data: T; error: { message: string } | null }>,
): Promise<NonNullable<T>> {
  const { data, error } = await p;
  if (error) throw new Error(`${label}: ${error.message}`);
  if (data === null || data === undefined) throw new Error(`${label}: tidak ada data`);
  return data as NonNullable<T>;
}

beforeAll(async () => {
  const admin = adminClient();
  f = await createCatalogFixture(admin, prefix());

  const area = await must(
    'area',
    admin
      .from('demo_areas')
      .insert({
        slug: `${prefix()}desk`,
        name: 'Meja tes',
        kind: 'desk',
        capacity: 2,
        is_reservable: true,
      })
      .select('id')
      .single(),
  );
  areaId = area.id;
  const n = Math.floor(Math.random() * 1000);
  await ok(
    'unit demo',
    admin.from('demo_units').insert({
      variant_id: f.vOn,
      area_id: areaId,
      code: `DM-Z-${String(n).padStart(3, '0')}`,
      status: 'available',
    }),
  );

  // Produk dijual dan aktif, tetapi tanpa varian: tidak bisa dibeli, jadi tidak boleh jadi incaran.
  await ok(
    'produk tanpa varian',
    admin.from('products').insert({
      category_id: f.catId,
      brand_id: f.brandId,
      model_name: 'Tanpa varian',
      slug: `${prefix()}p-novar`,
      is_active: true,
    }),
  );
});

afterAll(async () => {
  const admin = adminClient();
  await admin.from('demo_units').delete().eq('area_id', areaId);
  await admin.from('demo_areas').delete().eq('id', areaId);
  await deleteCatalogFixture(admin, prefix());
});

const row = async (c: SupabaseClient, id: string) =>
  (await c.from('compare_items').select('*').eq('id', id).maybeSingle()).data;

describe('compare_items', () => {
  it('lists for-sale and reference products, skips inactive and variantless ones', async () => {
    const { data, error } = await anonClient()
      .from('compare_items')
      .select('id')
      .like('slug', `${prefix()}%`);
    expect(error).toBeNull();
    expect((data ?? []).map((r) => r.id).sort()).toEqual([f.pOn, f.pRef].sort());
  });

  it('summarises a for-sale product', async () => {
    expect(await row(anonClient(), f.pOn)).toMatchObject({
      slug: `${prefix()}p-on`,
      brand_name: 'Merek tes',
      category_slug: `${prefix()}cat`,
      is_for_sale: true,
      price_min: 1_000_000,
      price_max: 1_000_000,
      demo_status: 'available',
      demo_variant_sku: `${prefix()}v-on`,
      demo_variant_name: 'Hitam',
    });
  });

  it('keeps references without price or demo', async () => {
    expect(await row(anonClient(), f.pRef)).toMatchObject({
      is_for_sale: false,
      price_min: null,
      price_max: null,
      demo_status: 'none',
      demo_variant_sku: null,
      demo_variant_name: null,
    });
  });

  it('shows staff exactly what guests see', async () => {
    expect(await row(clientFor('owner'), f.pRef)).toEqual(await row(anonClient(), f.pRef));
    expect(await row(clientFor('operator'), f.pOn)).toEqual(await row(anonClient(), f.pOn));
    expect(await row(clientFor('owner'), f.pOff)).toBeNull();
    expect(await row(clientFor('owner'), f.pInOffCat)).toBeNull();
  });

  it('still keeps references out of catalog_items', async () => {
    const { data } = await anonClient().from('catalog_items').select('id').eq('id', f.pRef);
    expect(data).toEqual([]);
  });
});

describe('products slug', () => {
  it('reserves the slug "ukur"', async () => {
    const admin = adminClient();
    try {
      const { error } = await admin
        .from('products')
        .insert({ category_id: f.catId, brand_id: f.brandId, model_name: 'x', slug: 'ukur' });
      expect(error).not.toBeNull();
    } finally {
      // Kalau aturannya bocor, baris ini akan mengunci kategori fixture dari penghapusan.
      await admin.from('products').delete().eq('slug', 'ukur');
    }
  });
});

describe('store_settings example pair', () => {
  it('lets anyone read the example pair and clears it when the product is deleted', async () => {
    const admin = adminClient();
    const original = await must(
      'pengaturan toko',
      admin
        .from('store_settings')
        .select('compare_example_current_id, compare_example_target_id')
        .single(),
    );
    const temp = await must(
      'produk sementara',
      admin
        .from('products')
        .insert({
          category_id: f.catId,
          brand_id: f.brandId,
          model_name: 'Contoh sementara',
          slug: `${prefix()}p-temp`,
          is_active: true,
          is_for_sale: false,
        })
        .select('id')
        .single(),
    );
    try {
      await ok(
        'set contoh',
        admin.from('store_settings').update({ compare_example_current_id: temp.id }).eq('id', true),
      );
      const seen = await anonClient()
        .from('store_settings')
        .select('compare_example_current_id')
        .single();
      expect(seen.data).toEqual({ compare_example_current_id: temp.id });

      await ok('hapus produk sementara', admin.from('products').delete().eq('id', temp.id));
      const after = await admin
        .from('store_settings')
        .select('compare_example_current_id')
        .single();
      expect(after.data).toEqual({ compare_example_current_id: null });
    } finally {
      await admin.from('products').delete().eq('id', temp.id);
      await ok(
        'kembalikan contoh',
        admin
          .from('store_settings')
          .update({
            compare_example_current_id: original.compare_example_current_id,
            compare_example_target_id: original.compare_example_target_id,
          })
          .eq('id', true),
      );
    }
  });
});
