import { describe, expect, it } from 'vitest';
import { parseReservationQuery, serializeReservationQuery } from './query';
import { makeVariant } from './testing';
import { dateWindow } from './time';

const variants = ['A', 'B', 'C', 'D', 'E'].map((sku) => makeVariant({ sku }));
const window = dateWindow('2026-11-28', 14);
const parse = (raw: string) => parseReservationQuery(new URLSearchParams(raw), variants, window);

describe('parseReservationQuery', () => {
  it('reads every field', () => {
    expect(parse('varian=A,B&tanggal=2026-11-30&jam=14.00&bawa=logitech-g102-lightsync')).toEqual({
      skus: ['A', 'B'],
      tanggal: '2026-11-30',
      jam: '14.00',
      bawa: 'logitech-g102-lightsync',
    });
  });

  it('keeps known SKUs in order, drops unknown, duplicates, and the fifth', () => {
    expect(parse('varian=B,X,A,B,C,D,E').skus).toEqual(['B', 'A', 'C', 'D']);
  });

  it('accepts ukur as bawa', () => {
    expect(parse('bawa=ukur').bawa).toBe('ukur');
  });

  it.each([
    'tanggal=2026-12-31',
    'tanggal=2026-11-27',
    'tanggal=kemarin',
    'jam=14.15x',
    'jam=25.00',
    'jam=14:00',
    'bawa=../evil',
    'bawa=Ukur',
  ])('ignores %s', (raw) => {
    const q = parse(raw);
    expect([q.tanggal, q.jam, q.bawa]).toEqual([null, null, null]);
  });

  it('returns an empty query for an empty URL', () => {
    expect(parse('')).toEqual({ skus: [], tanggal: null, jam: null, bawa: null });
  });
});

describe('serializeReservationQuery', () => {
  it('round-trips in a stable order', () => {
    const s = '?varian=A,B&tanggal=2026-11-30&jam=14.00&bawa=ukur';
    expect(serializeReservationQuery(parse(s))).toBe(s);
  });

  it('writes nothing for an empty query', () => {
    expect(serializeReservationQuery({ skus: [], tanggal: null, jam: null, bawa: null })).toBe('');
  });
});
