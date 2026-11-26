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
  compareExample?: CatalogSeed['compareExample'];
};

const refSlug = `${prefix}ref`;

/** 1 merek, 1 produk mouse, 2 varian (stok total 7), 1 unit demo, 1 mouse referensi. */
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
    references: [
      {
        slug: refSlug,
        brandSlug: `${prefix}brand`,
        categorySlug: 'mouse',
        modelName: 'Referensi seed tes',
        specs: { length_mm: 120, width_mm: 62, height_mm: 38, weight_g: 70 },
        specSources: {
          length_mm: 'resmi',
          width_mm: 'resmi',
          height_mm: 'resmi',
          weight_g: 'resmi',
        },
        specSourceUrl: 'https://example.com/referensi',
        eloshapesUrl: null,
      },
    ],
    compareExample: o.compareExample ?? null,
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
  await admin.from('products').delete().in('slug', [slug, refSlug]);
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
      referencesCreated: 1,
      referencesUpdated: 0,
      examplesSet: 0,
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

  it('creates references as not for sale without variants', async () => {
    const admin = adminClient();
    expect(
      await one(anonClient().from('compare_items').select('is_for_sale').eq('slug', refSlug)),
    ).toEqual([{ is_for_sale: false }]);
    const ref = await one(admin.from('products').select('id').eq('slug', refSlug).single());
    expect(
      await one(
        admin
          .from('product_variants')
          .select('id')
          .eq('product_id', ref?.id ?? ''),
      ),
    ).toEqual([]);
  });

  it('keeps is_for_sale when re-run, and restores it from data only when forced', async () => {
    const admin = adminClient();
    const forSale = async (s: string) =>
      (await one(admin.from('products').select('is_for_sale').eq('slug', s).single()))?.is_for_sale;
    await one(admin.from('products').update({ is_for_sale: true }).eq('slug', refSlug));
    await one(admin.from('products').update({ is_for_sale: false }).eq('slug', slug));

    const r = await seedCatalog(admin, fixture());
    expect(r).toMatchObject({ referencesCreated: 0, referencesUpdated: 1 });
    expect(await forSale(refSlug)).toBe(true);
    expect(await forSale(slug)).toBe(false);

    await seedCatalog(admin, fixture(), { forceBusiness: true });
    expect(await forSale(refSlug)).toBe(false);
    expect(await forSale(slug)).toBe(true);
  });

  it('fills the example pair only where it is empty', async () => {
    const admin = adminClient();
    const columns = 'compare_example_current_id, compare_example_target_id';
    const original = await one(admin.from('store_settings').select(columns).single());
    const ids = await one(admin.from('products').select('id, slug').in('slug', [slug, refSlug]));
    const idOf = (s: string) => ids?.find((p) => p.slug === s)?.id;
    const example = { currentSlug: refSlug, targetSlug: slug };
    try {
      await one(
        admin
          .from('store_settings')
          .update({ compare_example_current_id: null, compare_example_target_id: null })
          .eq('id', true),
      );
      const first = await seedCatalog(admin, fixture({ compareExample: example }));
      expect(first.examplesSet).toBe(2);
      expect(await one(admin.from('store_settings').select(columns).single())).toEqual({
        compare_example_current_id: idOf(refSlug),
        compare_example_target_id: idOf(slug),
      });

      // Pilihan pemilik tidak boleh tertimpa.
      await one(
        admin
          .from('store_settings')
          .update({ compare_example_current_id: idOf(slug) })
          .eq('id', true),
      );
      const second = await seedCatalog(admin, fixture({ compareExample: example }));
      expect(second.examplesSet).toBe(0);
      expect(
        await one(admin.from('store_settings').select('compare_example_current_id').single()),
      ).toEqual({ compare_example_current_id: idOf(slug) });
    } finally {
      await one(
        admin
          .from('store_settings')
          .update(original ?? {})
          .eq('id', true),
      );
    }
  });

  it('has the real references seeded', async () => {
    const slugs = catalogSeed.references.map((r) => r.slug);
    expect(slugs.length).toBeGreaterThan(0);
    const data = await one(
      anonClient().from('compare_items').select('slug, is_for_sale').in('slug', slugs),
    );
    expect(data?.map((d) => d.slug).sort()).toEqual([...slugs].sort());
    expect(data?.every((d) => d.is_for_sale === false)).toBe(true);
  });

  it('has the real catalog seeded', async () => {
    const slugs = catalogSeed.products.map((p) => p.slug);
    const data = await one(anonClient().from('catalog_items').select('slug').in('slug', slugs));
    expect(data?.map((d) => d.slug).sort()).toEqual([...slugs].sort());
  });
});
