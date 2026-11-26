import { describe, expect, it } from 'vitest';
import { EMPTY_PAIR, parseCompareQuery, serializeCompareQuery } from './query';
import { makeCompareItem } from './testing';

const f1 = makeCompareItem({ slug: 'vortexseries-ignix-f1', isForSale: true });
const g102 = makeCompareItem({ slug: 'logitech-g102-lightsync', isForSale: false });
const items = [f1, g102];
const p = (s: string) => parseCompareQuery(new URLSearchParams(s), items);

describe('parseCompareQuery', () => {
  it('reads a pair of slugs', () => {
    expect(p('sekarang=logitech-g102-lightsync&incaran=vortexseries-ignix-f1')).toEqual({
      current: { kind: 'item', item: g102 },
      target: f1,
    });
  });

  it('reads manual sizes, ignoring invalid numbers', () => {
    expect(p('sekarang=ukur&panjang=125.5&lebar=abc&tinggi=500&bobot=60').current).toEqual({
      kind: 'manual',
      specs: { length_mm: 125.5, weight_g: 60 },
    });
  });

  it('opens an empty manual slot for sekarang=ukur without numbers', () => {
    expect(p('sekarang=ukur').current).toEqual({ kind: 'manual', specs: {} });
  });

  it('only accepts dots in URL numbers', () => {
    expect(p('sekarang=ukur&panjang=125,5').current).toEqual({ kind: 'manual', specs: {} });
  });

  it.each([
    'sekarang=zzz',
    'incaran=logitech-g102-lightsync',
    'panjang=125',
    'incaran=',
    'sekarang=ukur&panjang=125,5x',
    'utm_source=x',
    'incaran=zzz',
  ])('drops invalid %s', (raw) => {
    const pair = p(raw);
    expect(pair.target).toBeNull();
    expect(
      pair.current === null ||
        (pair.current.kind === 'manual' && Object.keys(pair.current.specs).length === 0),
    ).toBe(true);
  });

  it('allows the same mouse in both slots', () => {
    expect(p('sekarang=vortexseries-ignix-f1&incaran=vortexseries-ignix-f1')).toEqual({
      current: { kind: 'item', item: f1 },
      target: f1,
    });
  });
});

describe('serializeCompareQuery', () => {
  it('round-trips in a stable order', () => {
    const s = '?sekarang=ukur&panjang=125.5&tinggi=40&bobot=60&incaran=vortexseries-ignix-f1';
    expect(serializeCompareQuery(p(s))).toBe(s);
  });

  it('writes slugs and skips empty slots', () => {
    expect(serializeCompareQuery({ current: { kind: 'item', item: g102 }, target: null })).toBe(
      '?sekarang=logitech-g102-lightsync',
    );
    expect(serializeCompareQuery({ current: { kind: 'manual', specs: {} }, target: f1 })).toBe(
      '?sekarang=ukur&incaran=vortexseries-ignix-f1',
    );
    expect(serializeCompareQuery(EMPTY_PAIR)).toBe('');
  });
});
