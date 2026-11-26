import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type CatalogFixture, createCatalogFixture, deleteCatalogFixture } from './catalog-fixture';
import { adminClient, anonClient, clientFor, type Persona, runId, userIdOf } from './clients';

const prefix = () => `rls-${runId()}-ug-`;
let f: CatalogFixture;
let catB: string;
let pB: string;

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
  const cat = await must(
    'kategori kedua',
    admin
      .from('categories')
      .insert({
        group_id: f.groupId,
        slug: `${prefix()}cat-b`,
        name: 'Kategori kedua',
        try_mode: 'unit',
        is_active: true,
      })
      .select('id')
      .single(),
  );
  catB = cat.id;
  const product = await must(
    'produk kategori kedua',
    admin
      .from('products')
      .insert({
        category_id: catB,
        brand_id: f.brandId,
        model_name: 'p-b',
        slug: `${prefix()}p-b`,
        is_active: true,
      })
      .select('id')
      .single(),
  );
  pB = product.id;
});

beforeEach(async () => {
  await adminClient().from('user_gear').delete().in('category_id', [f.catId, catB]);
});

afterAll(async () => {
  const admin = adminClient();
  await admin.from('user_gear').delete().in('category_id', [f.catId, catB]);
  await deleteCatalogFixture(admin, prefix());
});

const gear = (extra: Record<string, unknown>) => ({ category_id: f.catId, ...extra });
const mine = (p: Persona) =>
  clientFor(p).from('user_gear').select('id, product_id, manual_specs').eq('category_id', f.catId);

/** Gear milik customer, dibuat lewat admin supaya tes akses tidak bergantung pada policy insert. */
async function customerGear(extra: Record<string, unknown>) {
  return must(
    'gear customer',
    adminClient()
      .from('user_gear')
      .insert(gear({ user_id: userIdOf('customer'), ...extra }))
      .select('id')
      .single(),
  );
}

describe('user_gear: owner of the row', () => {
  it('lets a customer save and read their own gear', async () => {
    const { error } = await clientFor('customer')
      .from('user_gear')
      .insert(gear({ product_id: f.pOn }));
    expect(error).toBeNull();
    expect((await mine('customer')).data).toMatchObject([
      { product_id: f.pOn, manual_specs: null },
    ]);
  });

  it('accepts a reference product and manual sizes', async () => {
    const c = clientFor('customer');
    expect((await c.from('user_gear').insert(gear({ product_id: f.pRef }))).error).toBeNull();
    const { error } = await c.from('user_gear').upsert(
      {
        user_id: userIdOf('customer'),
        category_id: f.catId,
        product_id: null,
        manual_specs: { weight_g: 60 },
      },
      { onConflict: 'user_id,category_id' },
    );
    expect(error).toBeNull();
    expect((await mine('customer')).data).toMatchObject([
      { product_id: null, manual_specs: { weight_g: 60 } },
    ]);
  });

  it('allows one row per category', async () => {
    const c = clientFor('customer');
    expect((await c.from('user_gear').insert(gear({ product_id: f.pOn }))).error).toBeNull();
    expect((await c.from('user_gear').insert(gear({ product_id: f.pRef }))).error).not.toBeNull();
  });
});

describe('user_gear: everyone else', () => {
  it('hides gear from other customers, staff and guests', async () => {
    const row = await customerGear({ product_id: f.pOn });
    for (const p of ['customer2', 'operator', 'owner'] as const) {
      expect((await mine(p)).data, p).toEqual([]);
    }
    expect((await anonClient().from('user_gear').select('id').eq('id', row.id)).data ?? []).toEqual(
      [],
    );

    const other = clientFor('customer2');
    const updated = await other
      .from('user_gear')
      .update({ product_id: f.pRef })
      .eq('id', row.id)
      .select();
    expect(updated.data ?? []).toEqual([]);
    const deleted = await other.from('user_gear').delete().eq('id', row.id).select();
    expect(deleted.data ?? []).toEqual([]);

    const still = await adminClient()
      .from('user_gear')
      .select('product_id')
      .eq('id', row.id)
      .single();
    expect(still.data).toEqual({ product_id: f.pOn });
  });

  it.each(['customer2', 'operator', 'owner'] as const)(
    'blocks %s from writing gear for someone else',
    async (p) => {
      const { error } = await clientFor(p)
        .from('user_gear')
        .insert(gear({ user_id: userIdOf('customer'), product_id: f.pOn }));
      expect(error).not.toBeNull();
    },
  );

  it.each(['operator', 'owner'] as const)('blocks %s from saving their own gear', async (p) => {
    const { error } = await clientFor(p)
      .from('user_gear')
      .insert(gear({ product_id: f.pOn }));
    expect(error).not.toBeNull();
  });

  it('blocks guests', async () => {
    const { error } = await anonClient()
      .from('user_gear')
      .insert(gear({ product_id: f.pOn }));
    expect(error).not.toBeNull();
  });
});

describe('user_gear: row rules', () => {
  it.each([
    ['an invisible product', () => gear({ product_id: f.pOff })],
    ['a product from another category', () => gear({ product_id: pB })],
    [
      'both product and manual sizes',
      () => gear({ product_id: f.pOn, manual_specs: { weight_g: 60 } }),
    ],
    ['neither', () => gear({})],
    ['empty manual sizes', () => gear({ manual_specs: {} })],
    ['a key outside the four sizes', () => gear({ manual_specs: { sensor: 'x' } })],
    // Template fixture tidak punya length_mm, jadi validate_spec_values harus menolaknya.
    ['a key missing from the template', () => gear({ manual_specs: { length_mm: 120 } })],
    ['a non-number size', () => gear({ manual_specs: { weight_g: 'berat' } })],
  ])('rejects %s', async (_, row) => {
    const { error } = await clientFor('customer').from('user_gear').insert(row());
    expect(error).not.toBeNull();
  });

  it('deletes gear with its product', async () => {
    const admin = adminClient();
    const temp = await must(
      'produk sementara',
      admin
        .from('products')
        .insert({
          category_id: f.catId,
          brand_id: f.brandId,
          model_name: 'sementara',
          slug: `${prefix()}p-temp`,
          is_active: true,
        })
        .select('id')
        .single(),
    );
    const row = await customerGear({ product_id: temp.id });
    await admin.from('products').delete().eq('id', temp.id);
    const left = await admin.from('user_gear').select('id').eq('id', row.id);
    expect(left.data).toEqual([]);
  });

  it('keeps manual sizes valid when the template changes', async () => {
    await customerGear({ manual_specs: { weight_g: 60 } });
    const { error } = await clientFor('owner')
      .from('category_attributes')
      .delete()
      .eq('category_id', f.catId)
      .eq('key', 'weight_g');
    expect(error).not.toBeNull();
    const attr = await adminClient()
      .from('category_attributes')
      .select('key')
      .eq('category_id', f.catId)
      .eq('key', 'weight_g');
    expect(attr.data).toEqual([{ key: 'weight_g' }]);
  });
});
