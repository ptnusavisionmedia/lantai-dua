import type { SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type CatalogFixture, createCatalogFixture, deleteCatalogFixture } from './catalog-fixture';
import { adminClient, anonClient, clientFor, runId } from './clients';

const prefix = () => `rls-${runId()}-cv-`;
let f: CatalogFixture;
let areaIds: string[] = [];
let pFree: string;
let unitCodes: string[] = [];

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

  await must('stok vOn', admin.from('product_variants').update({ stock_qty: 2 }).eq('id', f.vOn));
  const vB = await must(
    'varian vB',
    admin
      .from('product_variants')
      .insert({
        product_id: f.pOn,
        sku: `${prefix()}v-b`,
        name: 'Gateron Brown (tactile)',
        price_idr: 1_200_000,
        stock_qty: 5,
      })
      .select('id')
      .single(),
  );

  const areas = await must(
    'area',
    admin
      .from('demo_areas')
      .insert(
        [
          {
            slug: `${prefix()}desk`,
            name: 'Meja tes',
            kind: 'desk',
            capacity: 2,
            is_reservable: true,
          },
          {
            slug: `${prefix()}desk-off`,
            name: 'Meja nonaktif',
            kind: 'desk',
            capacity: 1,
            is_reservable: true,
            is_active: false,
          },
        ],
        { defaultToNull: false },
      )
      .select('id, slug'),
  );
  const desk = areas.find((a) => a.slug.endsWith('desk'))?.id as string;
  const deskOff = areas.find((a) => a.slug.endsWith('desk-off'))?.id as string;
  areaIds = [desk, deskOff];

  // Unit yang TIDAK boleh dihitung sengaja diberi kode terkecil, supaya aturan yang bocor langsung ketahuan.
  const n = Math.floor(Math.random() * 990);
  unitCodes = [0, 1, 2, 3].map((i) => `DM-Y-${String(n + i).padStart(3, '0')}`);
  await must(
    'unit demo',
    admin.from('demo_units').insert([
      { variant_id: f.vOn, area_id: deskOff, code: unitCodes[0], status: 'available' },
      { variant_id: f.vOff, area_id: desk, code: unitCodes[1], status: 'available' },
      { variant_id: vB.id, area_id: desk, code: unitCodes[2], status: 'available' },
      { variant_id: f.vOn, area_id: desk, code: unitCodes[3], status: 'in_use' },
    ]),
  );

  const catFree = await must(
    'kategori bebas coba',
    admin
      .from('categories')
      .insert({
        group_id: f.groupId,
        slug: `${prefix()}cat-free`,
        name: 'Bebas coba',
        try_mode: 'free',
        is_active: true,
      })
      .select('id')
      .single(),
  );
  const free = await must(
    'produk bebas coba',
    admin
      .from('products')
      .insert({
        category_id: catFree.id,
        brand_id: f.brandId,
        model_name: 'Pad tes',
        slug: `${prefix()}p-free`,
        is_active: true,
      })
      .select('id')
      .single(),
  );
  pFree = free.id;
  await must(
    'varian bebas coba',
    admin.from('product_variants').insert({
      product_id: pFree,
      sku: `${prefix()}v-free`,
      name: 'Hitam',
      price_idr: 100_000,
      stock_qty: 1,
    }),
  );
});

afterAll(async () => {
  const admin = adminClient();
  await admin.from('demo_units').delete().in('area_id', areaIds);
  await admin.from('demo_areas').delete().in('id', areaIds);
  await deleteCatalogFixture(admin, prefix());
});

const item = async (c: SupabaseClient, id: string) =>
  (await c.from('catalog_items').select('*').eq('id', id).maybeSingle()).data;

describe('catalog_items', () => {
  it('lists only active for-sale products in active categories', async () => {
    const { data } = await anonClient()
      .from('catalog_items')
      .select('id')
      .like('slug', `${prefix()}%`);
    expect((data ?? []).map((r) => r.id).sort()).toEqual([f.pOn, pFree].sort());
  });

  it('aggregates price, stock and the best counted demo unit', async () => {
    expect(await item(anonClient(), f.pOn)).toMatchObject({
      price_min: 1_000_000,
      price_max: 1_200_000,
      stock_total: 7,
      demo_status: 'available',
      demo_variant_name: 'Gateron Brown (tactile)',
      demo_variant_sku: `${prefix()}v-b`,
      category_slug: `${prefix()}cat`,
      try_mode: 'unit',
    });
  });

  it('marks free categories as free without a demo variant', async () => {
    expect(await item(anonClient(), pFree)).toMatchObject({
      demo_status: 'free',
      demo_variant_name: null,
      demo_variant_sku: null,
    });
  });

  it('shows staff exactly what guests see', async () => {
    expect(await item(clientFor('operator'), f.pOn)).toEqual(await item(anonClient(), f.pOn));
    expect(await item(clientFor('owner'), f.pOff)).toBeNull();
    expect(await item(clientFor('owner'), f.pRef)).toBeNull();
  });
});

describe('variant_availability', () => {
  it('reports per-variant demo status and hides inactive variants', async () => {
    const { data } = await anonClient()
      .from('variant_availability')
      .select('sku, demo_status')
      .eq('product_id', f.pOn);
    expect(Object.fromEntries((data ?? []).map((r) => [r.sku, r.demo_status]))).toEqual({
      [`${prefix()}v-on`]: 'in_use',
      [`${prefix()}v-b`]: 'available',
    });
  });

  it('marks variants of free categories as free', async () => {
    const { data } = await anonClient()
      .from('variant_availability')
      .select('demo_status')
      .eq('product_id', pFree);
    expect(data).toEqual([{ demo_status: 'free' }]);
  });

  it('matches what staff see', async () => {
    const q = (c: SupabaseClient) =>
      c.from('variant_availability').select('*').eq('product_id', f.pOn).order('sku');
    expect((await q(clientFor('owner'))).data).toEqual((await q(anonClient())).data);
  });
});

describe('product-images bucket', () => {
  const file = () => new Blob(['x'], { type: 'image/webp' });

  it.each(['customer', 'operator'] as const)('blocks %s from uploading', async (p) => {
    const { error } = await clientFor(p)
      .storage.from('product-images')
      .upload(`tes/${runId()}-${p}.webp`, file());
    expect(error).not.toBeNull();
  });

  it('blocks anon from uploading', async () => {
    const { error } = await anonClient()
      .storage.from('product-images')
      .upload(`tes/${runId()}-anon.webp`, file());
    expect(error).not.toBeNull();
  });

  it('lets the owner upload and anyone read it', async () => {
    const path = `tes/${runId()}-owner.webp`;
    const upload = await clientFor('owner').storage.from('product-images').upload(path, file());
    expect(upload.error).toBeNull();
    const url = anonClient().storage.from('product-images').getPublicUrl(path).data.publicUrl;
    expect((await fetch(url)).status).toBe(200);
    await adminClient().storage.from('product-images').remove([path]);
  });
});

describe('demo fallback', () => {
  it('falls back to none when every counted unit is retired', async () => {
    await adminClient()
      .from('demo_units')
      .update({ status: 'retired' })
      .in('code', [unitCodes[2] as string, unitCodes[3] as string]);
    expect(await item(anonClient(), f.pOn)).toMatchObject({
      demo_status: 'none',
      demo_variant_name: null,
      demo_variant_sku: null,
    });
  });
});
