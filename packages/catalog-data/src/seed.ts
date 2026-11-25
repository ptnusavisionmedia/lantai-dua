import type { SupabaseClient } from '@supabase/supabase-js';
import type { CatalogSeed } from './types.ts';

export type SeedReport = {
  brands: number;
  productsCreated: number;
  productsUpdated: number;
  variantsCreated: number;
  variantsUpdated: number;
  unitsCreated: number;
  unitsKept: number;
};

type Response = { data: unknown; error: { message: string } | null };

/** Generic di seluruh respons (bukan di `data`) supaya union sukses/gagal Supabase tidak menyempit jadi `never`. */
async function must<R extends Response>(
  label: string,
  query: PromiseLike<R>,
): Promise<NonNullable<R['data']>> {
  const { data, error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  if (data === null || data === undefined) throw new Error(`${label}: tidak ada data`);
  return data as NonNullable<R['data']>;
}

async function ok(label: string, query: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
}

const DEMO_AREA = 'meja-kontrol';

/**
 * Memasukkan data katalog dengan aman untuk dijalankan berulang kali.
 *
 * - Kolom deskriptif (nama, merek, kategori, deskripsi, spek, atribut varian, URL sumber)
 *   selalu disamakan dengan data.
 * - Kolom bisnis (harga, stok, `is_active`, status unit demo) hanya diisi saat baris pertama
 *   kali dibuat, supaya perubahan dari operator dan pemilik tidak hilang.
 *   `forceBusiness: true` ikut menimpanya. Ini hanya untuk development.
 * - Produk, varian, dan unit yang tidak ada di data tidak disentuh.
 */
export async function seedCatalog(
  admin: SupabaseClient,
  data: CatalogSeed,
  options: { forceBusiness?: boolean } = {},
): Promise<SeedReport> {
  const force = options.forceBusiness === true;
  const report: SeedReport = {
    brands: 0,
    productsCreated: 0,
    productsUpdated: 0,
    variantsCreated: 0,
    variantsUpdated: 0,
    unitsCreated: 0,
    unitsKept: 0,
  };

  const categorySlugs = [...new Set(data.products.map((p) => p.categorySlug))];
  const categories = await must(
    'kategori',
    admin.from('categories').select('id, slug').in('slug', categorySlugs),
  );
  const categoryId = new Map(categories.map((c) => [c.slug as string, c.id as string]));
  const missing = categorySlugs.filter((s) => !categoryId.has(s));
  if (missing.length > 0) {
    throw new Error(`Kategori belum ada: ${missing.join(', ')}. Jalankan pnpm db:push dulu.`);
  }
  const area = await must(
    `area ${DEMO_AREA}`,
    admin.from('demo_areas').select('id').eq('slug', DEMO_AREA).single(),
  );

  const brands = await must(
    'merek',
    admin
      .from('brands')
      .upsert(
        data.brands.map((b) => ({ slug: b.slug, name: b.name })),
        { onConflict: 'slug', defaultToNull: false },
      )
      .select('id, slug'),
  );
  report.brands = brands.length;
  const brandId = new Map(brands.map((b) => [b.slug as string, b.id as string]));

  // ── Produk ──
  const existingProducts = await must(
    'produk lama',
    admin
      .from('products')
      .select('id, slug')
      .in(
        'slug',
        data.products.map((p) => p.slug),
      ),
  );
  const productId = new Map(existingProducts.map((p) => [p.slug as string, p.id as string]));

  for (const p of data.products) {
    const brand = brandId.get(p.brandSlug);
    if (!brand) throw new Error(`${p.slug}: merek "${p.brandSlug}" tidak ada di data merek`);
    const descriptive = {
      brand_id: brand,
      category_id: categoryId.get(p.categorySlug),
      model_name: p.modelName,
      description: p.description,
      specs: p.specs,
      spec_source_url: p.specSourceUrl,
      eloshapes_url: p.eloshapesUrl,
    };
    const id = productId.get(p.slug);
    if (id) {
      const business = force ? { is_active: true, is_for_sale: true } : {};
      await ok(
        p.slug,
        admin
          .from('products')
          .update({ ...descriptive, ...business })
          .eq('id', id),
      );
      report.productsUpdated += 1;
    } else {
      const row = await must(
        p.slug,
        admin
          .from('products')
          .insert({ slug: p.slug, ...descriptive, is_active: true, is_for_sale: true })
          .select('id')
          .single(),
      );
      productId.set(p.slug, row.id as string);
      report.productsCreated += 1;
    }
  }

  // ── Varian ──
  const allVariants = data.products.flatMap((p) =>
    p.variants.map((v) => ({ ...v, productId: productId.get(p.slug) as string })),
  );
  const existingVariants = await must(
    'varian lama',
    admin
      .from('product_variants')
      .select('id, sku')
      .in(
        'sku',
        allVariants.map((v) => v.sku),
      ),
  );
  const variantId = new Map(existingVariants.map((v) => [v.sku as string, v.id as string]));

  const newVariants = [];
  for (const v of allVariants) {
    const id = variantId.get(v.sku);
    if (!id) {
      newVariants.push({
        product_id: v.productId,
        sku: v.sku,
        name: v.name,
        attributes: v.attributes,
        price_idr: v.priceIdr,
        stock_qty: v.stockQty,
        sort_order: v.sortOrder,
        is_active: true,
      });
      continue;
    }
    const business = force ? { price_idr: v.priceIdr, stock_qty: v.stockQty, is_active: true } : {};
    await ok(
      v.sku,
      admin
        .from('product_variants')
        .update({ name: v.name, attributes: v.attributes, sort_order: v.sortOrder, ...business })
        .eq('id', id),
    );
    report.variantsUpdated += 1;
  }
  if (newVariants.length > 0) {
    const inserted = await must(
      'varian baru',
      admin
        .from('product_variants')
        .insert(newVariants, { defaultToNull: false })
        .select('id, sku'),
    );
    for (const v of inserted) variantId.set(v.sku as string, v.id as string);
    report.variantsCreated = inserted.length;
  }

  // ── Unit demo ──
  const allUnits = data.products.flatMap((p) => p.demoUnits);
  if (allUnits.length > 0) {
    const existingUnits = await must(
      'unit lama',
      admin
        .from('demo_units')
        .select('code')
        .in(
          'code',
          allUnits.map((u) => u.code),
        ),
    );
    const known = new Set(existingUnits.map((u) => u.code as string));
    const newUnits = [];
    for (const u of allUnits) {
      const variant = variantId.get(u.variantSku);
      if (!variant) throw new Error(`${u.code}: varian "${u.variantSku}" tidak ditemukan`);
      if (known.has(u.code)) {
        if (force) {
          await ok(
            u.code,
            admin.from('demo_units').update({ status: u.status }).eq('code', u.code),
          );
        }
        report.unitsKept += 1;
      } else {
        newUnits.push({ code: u.code, variant_id: variant, area_id: area.id, status: u.status });
      }
    }
    if (newUnits.length > 0) {
      await ok('unit baru', admin.from('demo_units').insert(newUnits, { defaultToNull: false }));
      report.unitsCreated = newUnits.length;
    }
  }

  return report;
}
