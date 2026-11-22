import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type CatalogFixture, createCatalogFixture, deleteCatalogFixture } from './catalog-fixture';
import { adminClient, anonClient, clientFor, runId } from './clients';

let f: CatalogFixture;
const prefix = () => `rls-${runId()}-cat-`;

beforeAll(async () => {
  f = await createCatalogFixture(adminClient(), prefix());
});

afterAll(async () => {
  await deleteCatalogFixture(adminClient(), prefix());
});

const productIds = async (client: ReturnType<typeof anonClient>) =>
  ((await client.from('products').select('id').like('slug', `${f.prefix}%`)).data ?? []).map(
    (r) => r.id as string,
  );

describe('catalog visibility', () => {
  it('shows anon only what is public', async () => {
    expect((await productIds(anonClient())).sort()).toEqual([f.pOn, f.pRef].sort());
    const { data } = await anonClient()
      .from('product_variants')
      .select('id')
      .eq('product_id', f.pOn);
    expect(data?.map((r) => r.id)).toEqual([f.vOn]);
  });

  it('hides inactive categories and their attributes from anon', async () => {
    const { data } = await anonClient()
      .from('categories')
      .select('id')
      .like('slug', `${f.prefix}%`);
    expect(data?.map((r) => r.id)).toEqual([f.catId]);
  });

  it('shows staff inactive products', async () => {
    expect(await productIds(clientFor('operator'))).toContain(f.pOff);
  });

  it('treats a deactivated operator as public', async () => {
    expect(await productIds(clientFor('operatorInactive'))).not.toContain(f.pOff);
  });
});

describe('catalog writes', () => {
  it.each(['customer', 'operator'] as const)('blocks %s from writing the catalog', async (p) => {
    const insert = await clientFor(p)
      .from('brands')
      .insert({ slug: `${f.prefix}x-${p}`, name: 'X' });
    expect(insert.error?.code).toBe('42501');
    const update = await clientFor(p)
      .from('products')
      .update({ model_name: 'X' })
      .eq('id', f.pOn)
      .select('id');
    expect(update.data).toEqual([]);
  });

  it('lets the owner write the catalog', async () => {
    const { error } = await clientFor('owner')
      .from('products')
      .update({ description: 'ok' })
      .eq('id', f.pOn);
    expect(error).toBeNull();
  });
});

describe('spec template validation', () => {
  it('accepts specs that match the template', async () => {
    const { error } = await adminClient()
      .from('products')
      .update({
        specs: {
          weight_g: 58,
          shape: 'Simetris',
          connectivity: ['Kabel', 'Bluetooth'],
          wireless: true,
          sensor: 'PAW3395',
        },
      })
      .eq('id', f.pOn);
    expect(error).toBeNull();
  });

  it.each([
    [{ weight_g: '58g' }, 'weight_g'],
    [{ warna_casing: 'merah' }, 'warna_casing'],
    [{ shape: 'Bulat' }, 'shape'],
    [{ connectivity: 'Kabel' }, 'connectivity'],
    [{ connectivity: ['Kabel', 'USB-C'] }, 'connectivity'],
    [{ sensor: null }, 'sensor'],
    [{ color: 'Hitam' }, 'color'],
  ])('rejects product specs %j', async (specs, key) => {
    const { error } = await adminClient().from('products').update({ specs }).eq('id', f.pOn);
    expect(error?.code).toBe('22023');
    expect(error?.message).toContain(key);
  });

  it('validates variant attributes against variant scope', async () => {
    const ok = await adminClient()
      .from('product_variants')
      .update({ attributes: { color: 'Hitam' } })
      .eq('id', f.vOn);
    expect(ok.error).toBeNull();
    const wrongScope = await adminClient()
      .from('product_variants')
      .update({ attributes: { weight_g: 60 } })
      .eq('id', f.vOn);
    expect(wrongScope.error?.code).toBe('22023');
  });

  it('rejects an enum attribute without options', async () => {
    const { error } = await adminClient()
      .from('category_attributes')
      .insert({ category_id: f.catId, key: 'layout', label: 'Layout', type: 'enum' });
    expect(error?.code).toBe('23514');
  });
});

describe('variant constraints', () => {
  it('rejects negative price and stock', async () => {
    const price = await adminClient()
      .from('product_variants')
      .update({ price_idr: -1 })
      .eq('id', f.vOn);
    expect(price.error?.code).toBe('23514');
    const stock = await adminClient()
      .from('product_variants')
      .update({ stock_qty: -1 })
      .eq('id', f.vOn);
    expect(stock.error?.code).toBe('23514');
  });
});
