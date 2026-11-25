import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { catalogSeed } from './catalog';
import type { SeedProduct } from './types';

type TemplateAttr = { type: string; scope: 'product' | 'variant'; options: string[] | null };

/** Template spek dibaca langsung dari seed struktural, supaya data ini tidak bisa menyimpang darinya. */
function readTemplates(): Map<string, Map<string, TemplateAttr>> {
  const sql = readFileSync(new URL('../../../supabase/seed.sql', import.meta.url), 'utf8');
  const row =
    /\('([a-z]+)', '([a-z_]+)', '[^']*', '(number|enum|multi_enum|boolean|text)', '(product|variant)', (?:'[^']*'|null),\s*(?:null(?:::text\[\])?|array\[([^\]]*)\])/g;
  const templates = new Map<string, Map<string, TemplateAttr>>();
  for (const [, category = '', key = '', type = '', scope, options] of sql.matchAll(row)) {
    const attrs = templates.get(category) ?? new Map<string, TemplateAttr>();
    attrs.set(key, {
      type,
      scope: scope as TemplateAttr['scope'],
      options: options ? [...options.matchAll(/'([^']*)'/g)].map((m) => m[1] ?? '') : null,
    });
    templates.set(category, attrs);
  }
  return templates;
}

function isValidValue(attr: TemplateAttr, value: unknown): boolean {
  switch (attr.type) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) && value > 0;
    case 'enum':
      return typeof value === 'string' && (attr.options ?? []).includes(value);
    case 'multi_enum':
      return (
        Array.isArray(value) &&
        value.length > 0 &&
        new Set(value).size === value.length &&
        value.every((v) => (attr.options ?? []).includes(v))
      );
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return typeof value === 'string' && value.trim() !== '';
  }
}

const { brands, products } = catalogSeed;
const all = (pred: (p: SeedProduct) => boolean) => products.some(pred);
const units = products.flatMap((p) => p.demoUnits);
const stock = (p: SeedProduct) => p.variants.reduce((s, v) => s + v.stockQty, 0);
const variantKeys = (p: SeedProduct) => p.variants.flatMap((v) => Object.keys(v.attributes));
const PADS = ['mousepad', 'glasspad', 'deskmat'];
const UNIT_LETTER: Record<string, string> = { mouse: 'M', keyboard: 'K', headset: 'H' };

describe('catalog seed: coverage', () => {
  it('has the 16 approved products', () => {
    expect(products).toHaveLength(16);
  });

  it('fills every launch category with at least two products', () => {
    for (const c of ['mouse', 'keyboard', 'headset', 'mousepad', 'glasspad', 'deskmat']) {
      expect(products.filter((p) => p.categorySlug === c).length, c).toBeGreaterThanOrEqual(2);
    }
  });

  it('marks the eight owner gear items', () => {
    expect(products.filter((p) => p.ownerGear)).toHaveLength(8);
  });

  it('covers every status combination', () => {
    expect(all((p) => stock(p) > 3)).toBe(true);
    expect(all((p) => stock(p) >= 1 && stock(p) <= 3)).toBe(true);
    expect(all((p) => stock(p) === 0)).toBe(true);
    for (const s of ['available', 'in_use', 'servicing'] as const) {
      expect(
        units.some((u) => u.status === s),
        s,
      ).toBe(true);
    }
    expect(all((p) => p.categorySlug in UNIT_LETTER && p.demoUnits.length === 0)).toBe(true);
    // D5: stok habis tapi unit demonya tersedia.
    expect(all((p) => stock(p) === 0 && p.demoUnits.some((u) => u.status === 'available'))).toBe(
      true,
    );
    // D4: keyboard yang unit demonya memakai switch selain varian pertamanya.
    expect(
      all(
        (p) =>
          p.categorySlug === 'keyboard' &&
          p.demoUnits.some((u) => u.variantSku !== p.variants[0]?.sku),
      ),
    ).toBe(true);
  });
});

describe('catalog seed: specs', () => {
  const templates = readTemplates();

  it('reads the spec templates from seed.sql', () => {
    expect([...templates.keys()].sort()).toEqual(
      ['deskmat', 'glasspad', 'headset', 'keyboard', 'mouse', 'mousepad'].sort(),
    );
    expect(templates.get('mouse')?.get('shape')?.options).toEqual(['Simetris', 'Ergonomis kanan']);
  });

  it('uses only template keys with valid values', () => {
    for (const p of products) {
      const template = templates.get(p.categorySlug);
      expect(template, p.slug).toBeDefined();
      const check = (scope: 'product' | 'variant', values: Record<string, unknown>) => {
        for (const [key, value] of Object.entries(values)) {
          const attr = template?.get(key);
          expect(attr?.scope, `${p.slug}.${key}`).toBe(scope);
          if (attr)
            expect(isValidValue(attr, value), `${p.slug}.${key}=${String(value)}`).toBe(true);
        }
      };
      check('product', p.specs);
      for (const v of p.variants) check('variant', v.attributes);
    }
  });

  it('cites a source for every spec and variant attribute', () => {
    for (const p of products) {
      const keys = new Set([...Object.keys(p.specs), ...variantKeys(p)]);
      for (const k of keys) expect(p.specSources[k], `${p.slug}.${k}`).toMatch(/^(resmi|ukur)$/);
      for (const k of Object.keys(p.specSources)) expect(keys.has(k), `${p.slug}: ${k}`).toBe(true);
      if (Object.values(p.specSources).includes('resmi')) {
        expect(p.specSourceUrl, p.slug).toMatch(/^https:\/\//);
      }
    }
  });

  // "<switch> (<jenis>)"; jenis hanya kalau tertulis di sumber resmi, warna hanya kalau produknya
  // dijual dalam lebih dari satu warna (supaya nama varian tetap bisa dibedakan).
  it('names keyboard variants "<switch> (<type>)", plus " · <color>" when colors vary', () => {
    const keyboards = products.filter((p) => p.categorySlug === 'keyboard');
    expect(keyboards.length).toBeGreaterThan(0);
    for (const p of keyboards) {
      const colors = new Set(p.variants.map((v) => v.attributes.color));
      for (const v of p.variants) {
        const { switch_name, switch_type, color } = v.attributes;
        expect(typeof switch_name, v.sku).toBe('string');
        const base =
          switch_type === undefined
            ? String(switch_name)
            : `${String(switch_name)} (${String(switch_type).toLowerCase()})`;
        expect(v.name, v.sku).toBe(colors.size > 1 ? `${base} · ${String(color)}` : base);
      }
    }
  });

  it('gives every variant of a product a distinct name', () => {
    for (const p of products) {
      const names = p.variants.map((v) => v.name);
      expect(new Set(names).size, p.slug).toBe(names.length);
    }
  });

  it('links eloshapes only for mice', () => {
    for (const p of products) {
      if (p.eloshapesUrl === null) continue;
      expect(p.categorySlug, p.slug).toBe('mouse');
      expect(p.eloshapesUrl, p.slug).toMatch(/^https:\/\/(www\.)?eloshapes\.com\//);
    }
  });
});

describe('catalog seed: identity', () => {
  it('uses unique slugs prefixed by a known brand', () => {
    const brandSlugs = new Set(brands.map((b) => b.slug));
    expect(brandSlugs.size).toBe(brands.length);
    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length);
    for (const p of products) {
      expect(p.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(brandSlugs.has(p.brandSlug), p.slug).toBe(true);
      expect(p.slug.startsWith(`${p.brandSlug}-`), p.slug).toBe(true);
      expect(p.description.trim(), p.slug).not.toBe('');
    }
    for (const b of brands)
      expect(
        all((p) => p.brandSlug === b.slug),
        b.slug,
      ).toBe(true);
  });

  it('uses unique, well-formed SKUs and unit codes', () => {
    const skus = products.flatMap((p) => p.variants.map((v) => v.sku));
    expect(new Set(skus).size).toBe(skus.length);
    for (const sku of skus) expect(sku).toMatch(/^L2-[A-Z0-9]{3}-[A-Z0-9]+(?:-[A-Z0-9]+)*$/);

    const codes = units.map((u) => u.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const p of products) {
      expect(p.variants.length, p.slug).toBeGreaterThan(0);
      const sortOrders = p.variants.map((v) => v.sortOrder);
      expect(new Set(sortOrders).size, p.slug).toBe(sortOrders.length);
      for (const u of p.demoUnits) {
        expect(u.code).toMatch(new RegExp(`^DM-${UNIT_LETTER[p.categorySlug] ?? '?'}-\\d{3}$`));
        expect(
          p.variants.some((v) => v.sku === u.variantSku),
          u.code,
        ).toBe(true);
      }
    }
  });

  it('keeps pads and deskmats without demo units', () => {
    for (const p of products.filter((p) => PADS.includes(p.categorySlug))) {
      expect(p.demoUnits, p.slug).toEqual([]);
    }
  });

  it('uses whole-thousand sample prices', () => {
    for (const v of products.flatMap((p) => p.variants)) {
      expect(v.priceIdr, v.sku).toBeGreaterThan(0);
      expect(v.priceIdr % 1000, v.sku).toBe(0);
      expect(Number.isInteger(v.stockQty) && v.stockQty >= 0, v.sku).toBe(true);
    }
  });
});
