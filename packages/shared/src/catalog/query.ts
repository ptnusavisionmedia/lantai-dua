import type { AttributeDef, CatalogQuery, Range, SortKey } from './types';

export const EMPTY_QUERY: CatalogQuery = {
  q: '',
  rak: null,
  merek: [],
  harga: null,
  demo: false,
  stok: false,
  urut: 'terbaru',
  attrs: {},
};

const SORT_KEYS: readonly string[] = ['terbaru', 'termurah', 'termahal', 'teringan'];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NUMBER = /^\d+(?:\.\d+)?$/;
const MAX_SEARCH_LENGTH = 100;

/** Cukup objek dengan `get`: URLSearchParams, ReadonlyURLSearchParams Next, atau padanannya di aplikasi. */
export type SearchParamsLike = { get(name: string): string | null };

/** Membaca `min-max`; salah satu sisi boleh kosong. Kosong di dua sisi atau min > max dianggap tidak ada. */
function parseRange(raw: string | null): Range | null {
  if (raw === null) return null;
  const parts = raw.split('-');
  if (parts.length !== 2) return null;
  const [minRaw = '', maxRaw = ''] = parts;
  if ((minRaw !== '' && !NUMBER.test(minRaw)) || (maxRaw !== '' && !NUMBER.test(maxRaw))) {
    return null;
  }
  const range: Range = {};
  if (minRaw !== '') range.min = Number(minRaw);
  if (maxRaw !== '') range.max = Number(maxRaw);
  if (range.min === undefined && range.max === undefined) return null;
  if (range.min !== undefined && range.max !== undefined && range.min > range.max) return null;
  return range;
}

function splitList(raw: string | null): string[] {
  if (raw === null) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '');
}

/** Hanya opsi yang ada di template yang dipakai, dalam urutan template supaya URL-nya kanonis. */
function parseOptions(raw: string | null, options: string[] | null): string[] {
  const wanted = new Set(splitList(raw));
  return (options ?? []).filter((o) => wanted.has(o));
}

/**
 * Membaca query katalog dari URL. Parameter yang tidak dikenal atau nilainya tidak sah diabaikan,
 * jadi URL lama atau hasil ketikan tangan tidak pernah membuat halaman error.
 */
export function parseCatalogQuery(params: SearchParamsLike, attrs: AttributeDef[]): CatalogQuery {
  const q = (params.get('q') ?? '').trim().slice(0, MAX_SEARCH_LENGTH);
  const rakRaw = params.get('rak');
  const rak = rakRaw !== null && SLUG.test(rakRaw) ? rakRaw : null;
  const merek = [...new Set(splitList(params.get('merek')).filter((s) => SLUG.test(s)))].sort();
  const urutRaw = params.get('urut') ?? '';
  const urut = SORT_KEYS.includes(urutRaw) ? (urutRaw as SortKey) : 'terbaru';

  const parsedAttrs: CatalogQuery['attrs'] = {};
  for (const attr of attrs) {
    if (!attr.isFilterable) continue;
    const raw = params.get(attr.key);
    if (raw === null || raw === '') continue;
    if (attr.type === 'number') {
      const range = parseRange(raw);
      if (range) parsedAttrs[attr.key] = range;
    } else if (attr.type === 'enum' || attr.type === 'multi_enum') {
      const values = parseOptions(raw, attr.options);
      if (values.length > 0) parsedAttrs[attr.key] = values;
    } else if (attr.type === 'boolean') {
      if (raw === '1') parsedAttrs[attr.key] = true;
    }
  }

  return {
    q,
    rak,
    merek,
    harga: parseRange(params.get('harga')),
    demo: params.get('demo') === '1',
    stok: params.get('stok') === '1',
    urut,
    attrs: parsedAttrs,
  };
}

function rangeToString(range: Range): string {
  if (range.min === undefined && range.max === undefined) return '';
  return `${range.min ?? ''}-${range.max ?? ''}`;
}

/**
 * Menulis query ke `?…` dengan urutan key tetap: q, rak, merek, harga, demo, stok, urut,
 * lalu atribut menurut abjad. Nilai bawaan tidak ditulis, jadi query kosong menjadi ''.
 */
export function serializeCatalogQuery(query: CatalogQuery): string {
  const parts: string[] = [];
  const add = (key: string, value: string) => parts.push(`${encodeURIComponent(key)}=${value}`);
  const list = (values: string[]) => values.map(encodeURIComponent).join(',');

  if (query.q !== '') add('q', encodeURIComponent(query.q));
  if (query.rak) add('rak', encodeURIComponent(query.rak));
  if (query.merek.length > 0) add('merek', list(query.merek));
  if (query.harga) {
    const r = rangeToString(query.harga);
    if (r !== '') add('harga', r);
  }
  if (query.demo) add('demo', '1');
  if (query.stok) add('stok', '1');
  if (query.urut !== 'terbaru') add('urut', query.urut);

  for (const key of Object.keys(query.attrs).sort()) {
    const value = query.attrs[key];
    if (value === undefined) continue;
    if (value === true) {
      add(key, '1');
    } else if (Array.isArray(value)) {
      if (value.length > 0) add(key, list(value));
    } else {
      const r = rangeToString(value);
      if (r !== '') add(key, r);
    }
  }

  return parts.length > 0 ? `?${parts.join('&')}` : '';
}
