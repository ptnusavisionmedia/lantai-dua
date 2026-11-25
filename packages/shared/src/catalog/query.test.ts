import { describe, expect, it } from 'vitest';
import { EMPTY_QUERY, parseCatalogQuery, serializeCatalogQuery } from './query';
import { ATTRS } from './testing';

const parse = (raw: string) => parseCatalogQuery(new URLSearchParams(raw), ATTRS);

describe('parseCatalogQuery', () => {
  it('parses every filter kind', () => {
    expect(
      parse(
        'q=ignix&merek=a,b&harga=500000-&demo=1&stok=1&urut=teringan&weight_g=50-70&shape=Simetris&connectivity=Kabel,Bluetooth&hot_swap=1',
      ),
    ).toEqual({
      q: 'ignix',
      rak: null,
      merek: ['a', 'b'],
      harga: { min: 500000 },
      demo: true,
      stok: true,
      urut: 'teringan',
      attrs: {
        weight_g: { min: 50, max: 70 },
        shape: ['Simetris'],
        connectivity: ['Kabel', 'Bluetooth'],
        hot_swap: true,
      },
    });
  });

  it('reads the rack and a variant-scope filter', () => {
    const q = parse('rak=kontrol&switch_type=Tactile');
    expect(q.rak).toBe('kontrol');
    expect(q.attrs).toEqual({ switch_type: ['Tactile'] });
  });

  it.each([
    'weight_g=abc',
    'shape=Bulat',
    'foo=1',
    'urut=xyz',
    'harga=9-1',
    'hot_swap=yes',
    'weight_g=-',
    'merek=',
    'sensor=PAW3395',
    'rak=Kontrol!',
  ])('ignores invalid %s', (raw) => {
    expect(parse(raw)).toEqual(EMPTY_QUERY);
  });

  it('keeps only the valid options of a list', () => {
    expect(parse('shape=Bulat,Simetris').attrs).toEqual({ shape: ['Simetris'] });
  });
});

describe('serializeCatalogQuery', () => {
  it('round-trips through the URL in a stable order', () => {
    const s = '?q=ignix&merek=a,b&demo=1&urut=termurah&shape=Simetris&weight_g=50-70';
    expect(serializeCatalogQuery(parse(s))).toBe(s);
  });

  it('writes nothing for the empty query', () => {
    expect(serializeCatalogQuery(EMPTY_QUERY)).toBe('');
  });

  it('encodes option values with spaces', () => {
    const q = { ...EMPTY_QUERY, attrs: { shape: ['Ergonomis kanan'] } };
    const s = serializeCatalogQuery(q);
    expect(s).toBe('?shape=Ergonomis%20kanan');
    expect(parse(s.slice(1)).attrs).toEqual({ shape: ['Ergonomis kanan'] });
  });

  it('writes one-sided ranges', () => {
    expect(serializeCatalogQuery({ ...EMPTY_QUERY, harga: { max: 1000000 } })).toBe(
      '?harga=-1000000',
    );
  });
});
