import type {
  AttributeDef,
  CatalogItem,
  CatalogQuery,
  Facet,
  FacetOption,
  Range,
  SortKey,
} from './types';

/** Nilai atribut sebuah produk; atribut level varian diambil dari semua varian aktifnya. */
function valuesOf(item: CatalogItem, attr: AttributeDef): unknown[] {
  if (attr.scope === 'variant') return item.variantAttributes.map((v) => v[attr.key]);
  return [item.specs[attr.key]];
}

/** Nilai multi_enum berupa array; diratakan supaya enum dan multi_enum dicek dengan cara yang sama. */
function flatValues(item: CatalogItem, attr: AttributeDef): unknown[] {
  return valuesOf(item, attr).flatMap((v) => (Array.isArray(v) ? v : [v]));
}

function inRange(value: number, range: Range): boolean {
  return (
    (range.min === undefined || value >= range.min) &&
    (range.max === undefined || value <= range.max)
  );
}

function matchesAttr(item: CatalogItem, attr: AttributeDef, wanted: string[] | Range | true) {
  if (wanted === true) return valuesOf(item, attr).some((v) => v === true);
  if (Array.isArray(wanted)) {
    return flatValues(item, attr).some((v) => typeof v === 'string' && wanted.includes(v));
  }
  return valuesOf(item, attr).some((v) => typeof v === 'number' && inRange(v, wanted));
}

const normalize = (s: string) => s.toLocaleLowerCase('id');

function matchesSearch(item: CatalogItem, q: string): boolean {
  const tokens = normalize(q).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = normalize(`${item.brandName} ${item.modelName}`);
  return tokens.every((t) => haystack.includes(t));
}

/** AND antar-filter, OR di dalam satu filter. Produk tanpa nilai untuk filter yang aktif tidak lolos. */
export function filterCatalog(
  items: CatalogItem[],
  q: CatalogQuery,
  attrs: AttributeDef[],
): CatalogItem[] {
  const byKey = new Map(attrs.map((a) => [a.key, a]));
  const active = Object.entries(q.attrs).flatMap(([key, wanted]) => {
    const attr = byKey.get(key);
    return attr ? [{ attr, wanted }] : [];
  });

  return items.filter(
    (item) =>
      matchesSearch(item, q.q) &&
      (q.rak === null || item.groupSlug === q.rak) &&
      (q.merek.length === 0 || q.merek.includes(item.brandSlug)) &&
      (q.harga === null || inRange(item.priceMin, q.harga)) &&
      (!q.demo || item.demoStatus === 'available' || item.demoStatus === 'free') &&
      (!q.stok || item.stockTotal > 0) &&
      active.every(({ attr, wanted }) => matchesAttr(item, attr, wanted)),
  );
}

function weightOf(item: CatalogItem): number | null {
  const w = item.specs.weight_g;
  return typeof w === 'number' ? w : null;
}

const byName = (a: CatalogItem, b: CatalogItem) =>
  `${a.brandName} ${a.modelName}`.localeCompare(`${b.brandName} ${b.modelName}`, 'id');

/** Mengurutkan salinan daftar. Nilai seri diurutkan menurut nama supaya hasilnya selalu sama. */
export function sortCatalog(items: CatalogItem[], urut: SortKey): CatalogItem[] {
  const compare: Record<SortKey, (a: CatalogItem, b: CatalogItem) => number> = {
    terbaru: (a, b) => b.createdAt.localeCompare(a.createdAt),
    termurah: (a, b) => a.priceMin - b.priceMin,
    termahal: (a, b) => b.priceMax - a.priceMax,
    teringan: (a, b) => {
      const wa = weightOf(a);
      const wb = weightOf(b);
      if (wa === null || wb === null) return (wa === null ? 1 : 0) - (wb === null ? 1 : 0);
      return wa - wb;
    },
  };
  return [...items].sort((a, b) => compare[urut](a, b) || byName(a, b));
}

function numericBounds(values: number[]): { min: number; max: number } | null {
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

/** Facet untuk atribut yang bisa difilter, dalam urutan template. Atribut teks tidak punya facet. */
export function facetsFor(attrs: AttributeDef[], items: CatalogItem[]): Facet[] {
  return [...attrs]
    .filter((a) => a.isFilterable && a.type !== 'text')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((attr): Facet => {
      if (attr.type === 'number') {
        const values = items.flatMap((item) =>
          valuesOf(item, attr).filter((v): v is number => typeof v === 'number'),
        );
        return {
          key: attr.key,
          label: attr.label,
          kind: 'range',
          unit: attr.unit,
          bounds: numericBounds(values),
        };
      }
      if (attr.type === 'boolean') return { key: attr.key, label: attr.label, kind: 'toggle' };
      const options: FacetOption[] = (attr.options ?? []).map((value) => ({
        value,
        label: value,
        count: items.filter((item) => flatValues(item, attr).includes(value)).length,
      }));
      return { key: attr.key, label: attr.label, kind: 'checklist', options };
    });
}

/** Facet merek: nilai = slug (yang ditulis ke URL), label = nama merek. */
export function brandFacet(items: CatalogItem[]): Extract<Facet, { kind: 'checklist' }> {
  const brands = new Map<string, FacetOption>();
  for (const item of items) {
    const option = brands.get(item.brandSlug);
    if (option) option.count += 1;
    else brands.set(item.brandSlug, { value: item.brandSlug, label: item.brandName, count: 1 });
  }
  const options = [...brands.values()].sort((a, b) => a.label.localeCompare(b.label, 'id'));
  return { key: 'merek', label: 'Merek', kind: 'checklist', options };
}

/** Rentang harga untuk filter harga, dari harga varian termurah tiap produk (sama dengan filternya). */
export function priceBounds(items: CatalogItem[]): { min: number; max: number } | null {
  return numericBounds(items.map((i) => i.priceMin));
}
