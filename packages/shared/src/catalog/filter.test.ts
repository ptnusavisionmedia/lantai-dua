import { describe, expect, it } from 'vitest';
import { brandFacet, facetsFor, filterCatalog, priceBounds, sortCatalog } from './filter';
import { EMPTY_QUERY } from './query';
import { ATTRS, makeItem } from './testing';
import type { CatalogQuery } from './types';

const ids = (items: { id: string }[]) => items.map((i) => i.id);
const q = (over: Partial<CatalogQuery>): CatalogQuery => ({ ...EMPTY_QUERY, ...over });

describe('filterCatalog', () => {
  it('ANDs across filters and ORs within one', () => {
    const a = makeItem({ id: 'a', specs: { shape: 'Simetris', connectivity: ['Bluetooth'] } });
    const b = makeItem({ id: 'b', specs: { shape: 'Ergonomis kanan', connectivity: ['Kabel'] } });
    const c = makeItem({
      id: 'c',
      specs: { shape: 'Ergonomis kanan', connectivity: ['Bluetooth'] },
    });
    const query = q({
      attrs: { shape: ['Simetris', 'Ergonomis kanan'], connectivity: ['Bluetooth'] },
    });
    expect(ids(filterCatalog([a, b, c], query, ATTRS))).toEqual(['a', 'c']);
  });

  it('excludes items without a value from a range filter', () => {
    const items = [
      makeItem({ id: 'x', specs: {} }),
      makeItem({ id: 'y', specs: { weight_g: 58 } }),
    ];
    expect(ids(filterCatalog(items, q({ attrs: { weight_g: { min: 50 } } }), ATTRS))).toEqual([
      'y',
    ]);
  });

  it('matches variant-scope attributes on any variant', () => {
    const kb = makeItem({
      id: 'kb',
      variantAttributes: [{ switch_type: 'Linear' }, { switch_type: 'Tactile' }],
    });
    const other = makeItem({ id: 'o', variantAttributes: [{ switch_type: 'Linear' }] });
    expect(
      ids(filterCatalog([kb, other], q({ attrs: { switch_type: ['Tactile'] } }), ATTRS)),
    ).toEqual(['kb']);
  });

  it('matches a boolean filter only when the value is true', () => {
    const items = [
      makeItem({ id: 't', specs: { hot_swap: true } }),
      makeItem({ id: 'f', specs: { hot_swap: false } }),
      makeItem({ id: 'n', specs: {} }),
    ];
    expect(ids(filterCatalog(items, q({ attrs: { hot_swap: true } }), ATTRS))).toEqual(['t']);
  });

  it('treats demo=1 as available or free', () => {
    const items = [
      makeItem({ id: 'av', demoStatus: 'available' }),
      makeItem({ id: 'fr', demoStatus: 'free' }),
      makeItem({ id: 'iu', demoStatus: 'in_use' }),
      makeItem({ id: 'no', demoStatus: 'none' }),
    ];
    expect(ids(filterCatalog(items, q({ demo: true }), ATTRS))).toEqual(['av', 'fr']);
  });

  it('keeps only items in stock when stok=1', () => {
    const items = [makeItem({ id: 's', stockTotal: 1 }), makeItem({ id: 'z', stockTotal: 0 })];
    expect(ids(filterCatalog(items, q({ stok: true }), ATTRS))).toEqual(['s']);
  });

  it('searches brand and model case-insensitively', () => {
    const items = [
      makeItem({ id: 'i', brandName: 'VortexSeries', modelName: 'Ignix F1' }),
      makeItem({ id: 'l', brandName: 'Logitech', modelName: 'G Pro X Superlight 2' }),
    ];
    expect(ids(filterCatalog(items, q({ q: 'IGNIX' }), ATTRS))).toEqual(['i']);
    expect(ids(filterCatalog(items, q({ q: 'logitech g pro' }), ATTRS))).toEqual(['l']);
  });

  it('filters by brand and rack', () => {
    const items = [
      makeItem({ id: 'a', brandSlug: 'a', groupSlug: 'kontrol' }),
      makeItem({ id: 'b', brandSlug: 'b', groupSlug: 'audio' }),
    ];
    expect(ids(filterCatalog(items, q({ merek: ['b'] }), ATTRS))).toEqual(['b']);
    expect(ids(filterCatalog(items, q({ rak: 'kontrol' }), ATTRS))).toEqual(['a']);
  });

  it('filters price by the cheapest variant', () => {
    const items = [
      makeItem({ id: 'cheap', priceMin: 900_000, priceMax: 1_400_000 }),
      makeItem({ id: 'dear', priceMin: 1_100_000, priceMax: 1_100_000 }),
    ];
    expect(ids(filterCatalog(items, q({ harga: { max: 1_000_000 } }), ATTRS))).toEqual(['cheap']);
  });
});

describe('sortCatalog', () => {
  it('sorts lightest first and puts unknown weight last', () => {
    const r = sortCatalog(
      [
        makeItem({ id: 'x', specs: {} }),
        makeItem({ id: 'h', specs: { weight_g: 80 } }),
        makeItem({ id: 'l', specs: { weight_g: 55 } }),
      ],
      'teringan',
    );
    expect(ids(r)).toEqual(['l', 'h', 'x']);
  });

  it('sorts by price and by newest', () => {
    const a = makeItem({
      id: 'a',
      priceMin: 500,
      priceMax: 900,
      createdAt: '2026-11-01T00:00:00Z',
    });
    const b = makeItem({
      id: 'b',
      priceMin: 700,
      priceMax: 700,
      createdAt: '2026-11-20T00:00:00Z',
    });
    expect(ids(sortCatalog([b, a], 'termurah'))).toEqual(['a', 'b']);
    expect(ids(sortCatalog([b, a], 'termahal'))).toEqual(['a', 'b']);
    expect(ids(sortCatalog([a, b], 'terbaru'))).toEqual(['b', 'a']);
  });

  it('does not mutate its input', () => {
    const input = [makeItem({ id: '1', priceMin: 2 }), makeItem({ id: '2', priceMin: 1 })];
    sortCatalog(input, 'termurah');
    expect(ids(input)).toEqual(['1', '2']);
  });
});

describe('facets', () => {
  it('builds facets from filterable attributes only, in template order', () => {
    const items = [makeItem({ specs: { weight_g: 58 } }), makeItem({ specs: { weight_g: 80 } })];
    expect(facetsFor(ATTRS, items).map((f) => [f.key, f.kind])).toEqual([
      ['weight_g', 'range'],
      ['shape', 'checklist'],
      ['connectivity', 'checklist'],
      ['hot_swap', 'toggle'],
      ['switch_type', 'checklist'],
    ]);
  });

  it('gives range bounds and option counts', () => {
    const items = [
      makeItem({ specs: { weight_g: 58, shape: 'Simetris' } }),
      makeItem({ specs: { weight_g: 80, shape: 'Simetris' } }),
    ];
    const [weight, shape] = facetsFor(ATTRS, items);
    expect(weight).toMatchObject({ kind: 'range', unit: 'g', bounds: { min: 58, max: 80 } });
    expect(shape).toMatchObject({
      kind: 'checklist',
      options: [
        { value: 'Simetris', label: 'Simetris', count: 2 },
        { value: 'Ergonomis kanan', label: 'Ergonomis kanan', count: 0 },
      ],
    });
  });

  it('lists brands by name with counts', () => {
    const items = [
      makeItem({ brandSlug: 'razer', brandName: 'Razer' }),
      makeItem({ brandSlug: 'logitech', brandName: 'Logitech' }),
      makeItem({ brandSlug: 'razer', brandName: 'Razer' }),
    ];
    expect(brandFacet(items)).toEqual({
      key: 'merek',
      label: 'Merek',
      kind: 'checklist',
      options: [
        { value: 'logitech', label: 'Logitech', count: 1 },
        { value: 'razer', label: 'Razer', count: 2 },
      ],
    });
  });

  it('reports price bounds from the cheapest variants', () => {
    expect(
      priceBounds([makeItem({ priceMin: 300_000 }), makeItem({ priceMin: 1_200_000 })]),
    ).toEqual({ min: 300_000, max: 1_200_000 });
    expect(priceBounds([])).toBeNull();
  });
});
