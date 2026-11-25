import {
  type CatalogSeed,
  catalogSeed,
  type SeedDemoUnit,
  seedCatalog,
} from '@lantai-dua/catalog-data';
import { afterAll, describe, expect, it } from 'vitest';
import { adminClient, anonClient, runId } from './clients';

const prefix = `rls-${runId()}-sc-`;
const slug = `${prefix}mouse`;
const sku1 = `${prefix}v1`;
const sku2 = `${prefix}v2`;
// Kode unit wajib berpola DM-<huruf>-<3 angka>; huruf X tidak dipakai kategori asli maupun tes lain.
const code = `DM-X-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

type FixtureOptions = {
  description?: string;
  price?: number;
  stock?: number;
  unitStatus?: SeedDemoUnit['status'];
};

/** 1 merek, 1 produk mouse, 2 varian (stok total 7), 1 unit demo. */
function fixture(o: FixtureOptions = {}): CatalogSeed {
  return {
    brands: [{ slug: `${prefix}brand`, name: 'Merek seed tes' }],
    products: [
      {
        slug,
        brandSlug: `${prefix}brand`,
        categorySlug: 'mouse',
        modelName: 'Mouse seed tes',
        description: o.description ?? 'lama',
        specs: { weight_g: 60 },
        specSources: { weight_g: 'resmi', color: 'resmi' },
        specSourceUrl: 'https://example.com/mouse',
        eloshapesUrl: null,
        ownerGear: false,
        variants: [
          {
            sku: sku1,
            name: 'Hitam',
            attributes: { color: 'Hitam' },
            priceIdr: o.price ?? 1_000_000,
            stockQty: o.stock ?? 3,
            sortOrder: 1,
          },
          {
            sku: sku2,
            name: 'Putih',
            attributes: { color: 'Putih' },
            priceIdr: 1_000_000,
            stockQty: 4,
            sortOrder: 2,
          },
        ],
        demoUnits: [{ code, variantSku: sku1, status: o.unitStatus ?? 'available' }],
      },
    ],
  };
}

async function one<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}

afterAll(async () => {
  const admin = adminClient();
  // Unit dihapus duluan: FK unit → varian bersifat restrict.
  await admin.from('demo_units').delete().eq('code', code);
  await admin.from('products').delete().eq('slug', slug);
  await admin.from('brands').delete().like('slug', `${prefix}%`);
});

describe('seedCatalog', () => {
  it('creates everything on the first run', async () => {
    const r = await seedCatalog(adminClient(), fixture());
    expect(r).toEqual({
      brands: 1,
      productsCreated: 1,
      productsUpdated: 0,
      variantsCreated: 2,
      variantsUpdated: 0,
      unitsCreated: 1,
      unitsKept: 0,
    });
    expect(
      await one(
        anonClient().from('catalog_items').select('stock_total, demo_status').eq('slug', slug),
      ),
    ).toEqual([{ stock_total: 7, demo_status: 'available' }]);
  });

  it('keeps business fields when re-run', async () => {
    const admin = adminClient();
    await one(
      admin.from('product_variants').update({ price_idr: 999_000, stock_qty: 0 }).eq('sku', sku1),
    );
    await one(admin.from('demo_units').update({ status: 'servicing' }).eq('code', code));
    await one(admin.from('products').update({ is_active: false }).eq('slug', slug));

    const r = await seedCatalog(
      admin,
      fixture({ description: 'baru', price: 1_500_000, stock: 9, unitStatus: 'available' }),
    );
    expect(r).toMatchObject({
      productsCreated: 0,
      productsUpdated: 1,
      variantsCreated: 0,
      variantsUpdated: 2,
      unitsCreated: 0,
      unitsKept: 1,
    });
    expect(
      await one(
        admin.from('product_variants').select('price_idr, stock_qty').eq('sku', sku1).single(),
      ),
    ).toEqual({ price_idr: 999_000, stock_qty: 0 });
    expect(await one(admin.from('demo_units').select('status').eq('code', code).single())).toEqual({
      status: 'servicing',
    });
    expect(
      await one(admin.from('products').select('description, is_active').eq('slug', slug).single()),
    ).toEqual({ description: 'baru', is_active: false });
  });

  it('overwrites business fields only when forced', async () => {
    const admin = adminClient();
    await seedCatalog(
      admin,
      fixture({ description: 'baru', price: 1_500_000, stock: 9, unitStatus: 'available' }),
      { forceBusiness: true },
    );
    expect(
      await one(
        admin.from('product_variants').select('price_idr, stock_qty').eq('sku', sku1).single(),
      ),
    ).toEqual({ price_idr: 1_500_000, stock_qty: 9 });
    expect(await one(admin.from('demo_units').select('status').eq('code', code).single())).toEqual({
      status: 'available',
    });
    expect(await one(admin.from('products').select('is_active').eq('slug', slug).single())).toEqual(
      {
        is_active: true,
      },
    );
  });

  it('places new demo units at Meja Kontrol', async () => {
    const admin = adminClient();
    const unit = await one(
      admin.from('demo_units').select('area:demo_areas(slug)').eq('code', code).single(),
    );
    expect(unit).toEqual({ area: { slug: 'meja-kontrol' } });
  });

  it('has the real catalog seeded', async () => {
    const slugs = catalogSeed.products.map((p) => p.slug);
    const data = await one(anonClient().from('catalog_items').select('slug').in('slug', slugs));
    expect(data?.map((d) => d.slug).sort()).toEqual([...slugs].sort());
  });
});
