import { describe, expect, it } from 'vitest';
import type { AttributeDef } from '../catalog/types';
import { compareRows } from './table';
import { makeCompareItem } from './testing';

const def = (
  key: string,
  label: string,
  type: AttributeDef['type'],
  sortOrder: number,
  extra: Partial<AttributeDef> = {},
): AttributeDef => ({
  key,
  label,
  type,
  scope: 'product',
  unit: null,
  options: null,
  isFilterable: false,
  isComparable: true,
  sortOrder,
  ...extra,
});

// Template mouse dari seed.sql, sengaja diacak supaya urutan sortOrder yang dipakai.
const attrs: AttributeDef[] = [
  def('sensor', 'Sensor', 'text', 7),
  def('length_mm', 'Panjang', 'number', 1, { unit: 'mm' }),
  def('width_mm', 'Lebar', 'number', 2, { unit: 'mm' }),
  def('height_mm', 'Tinggi', 'number', 3, { unit: 'mm' }),
  def('weight_g', 'Bobot', 'number', 4, { unit: 'g' }),
  def('shape', 'Bentuk', 'enum', 5, { options: ['Simetris', 'Ergonomis kanan'] }),
  def('connectivity', 'Koneksi', 'multi_enum', 6, { options: ['Kabel', 'Bluetooth'] }),
  def('color', 'Warna', 'text', 8, { scope: 'variant', isComparable: false }),
];

const r1 = makeCompareItem({
  id: 'a',
  priceMin: 1_000_000,
  priceMax: 1_000_000,
  specs: {
    length_mm: 127.69,
    width_mm: 67.76,
    height_mm: 42.84,
    weight_g: 60,
    shape: 'Ergonomis kanan',
    sensor: 'PAW 3395',
  },
});
const f1 = makeCompareItem({
  id: 'b',
  priceMin: 899_000,
  priceMax: 949_000,
  specs: {
    length_mm: 121.48,
    width_mm: 61.27,
    height_mm: 38.2,
    weight_g: 51,
    shape: 'Simetris',
    sensor: 'PAW 3311',
  },
});

describe('compareRows', () => {
  it('orders sizes, price, then other comparable attributes', () => {
    const rows = compareRows({ current: { kind: 'item', item: r1 }, target: f1 }, attrs);
    expect(rows.map((r) => r.key)).toEqual([
      'length_mm',
      'width_mm',
      'height_mm',
      'weight_g',
      'harga',
      'shape',
      'sensor',
    ]);
    expect(rows[0]).toEqual({
      key: 'length_mm',
      label: 'Panjang',
      current: '127,69 mm',
      target: '121,48 mm',
      diff: '−6,2 mm',
    });
    expect(rows[3]).toMatchObject({ current: '60 g', target: '51 g', diff: '−9 g' });
    expect(rows[4]).toEqual({
      key: 'harga',
      label: 'Harga',
      current: 'Rp1.000.000',
      target: 'mulai Rp899.000',
      diff: '−Rp101.000',
    });
    expect(rows[5]).toEqual({
      key: 'shape',
      label: 'Bentuk',
      current: 'Ergonomis kanan',
      target: 'Simetris',
      diff: null,
    });
  });

  it('signs a bigger target with a plus', () => {
    const rows = compareRows({ current: { kind: 'item', item: f1 }, target: r1 }, attrs);
    expect(rows[0]?.diff).toBe('+6,2 mm');
    expect(rows[4]?.diff).toBe('+Rp101.000');
  });

  it('drops price for references', () => {
    const ref = makeCompareItem({
      id: 'r',
      isForSale: false,
      priceMin: null,
      priceMax: null,
      specs: { length_mm: 116.6 },
    });
    const rows = compareRows({ current: { kind: 'item', item: ref }, target: f1 }, attrs);
    expect(rows.map((r) => r.key)).not.toContain('harga');
  });

  it('dashes manual non-size rows and missing sizes', () => {
    const rows = compareRows(
      { current: { kind: 'manual', specs: { length_mm: 125 } }, target: f1 },
      attrs,
    );
    expect(rows.find((r) => r.key === 'shape')).toMatchObject({ current: '–', target: 'Simetris' });
    expect(rows.find((r) => r.key === 'width_mm')).toMatchObject({
      current: '–',
      target: '61,27 mm',
      diff: null,
    });
    expect(rows.find((r) => r.key === 'length_mm')?.diff).toBe('−3,5 mm');
  });

  it('writes Sama when the rounded difference is zero', () => {
    const rows = compareRows(
      {
        current: { kind: 'item', item: makeCompareItem({ id: 'x', specs: { weight_g: 60 } }) },
        target: makeCompareItem({ id: 'y', specs: { weight_g: 60.4 } }),
      },
      attrs,
    );
    expect(rows).toEqual([
      { key: 'weight_g', label: 'Bobot', current: '60 g', target: '60,4 g', diff: 'Sama' },
      { key: 'harga', label: 'Harga', current: 'Rp1.000.000', target: 'Rp1.000.000', diff: 'Sama' },
    ]);
  });

  it('returns no rows with an empty slot', () => {
    expect(compareRows({ current: null, target: f1 }, attrs)).toEqual([]);
  });
});
