import { describe, expect, it } from 'vitest';
import { MANUAL_FIELDS, MANUAL_KEYS, parseManualNumber, validateManualSpecs } from './manual';

describe('parseManualNumber', () => {
  it.each([
    ['125', 125],
    ['125,5', 125.5],
    ['125.55', 125.55],
    ['125,556', 125.56],
    [' 125 ', 125],
  ])('parses %s', (raw, value) => {
    expect(parseManualNumber(raw, 'length_mm')).toEqual({ value, error: null });
  });

  it('treats an empty field as no value', () => {
    expect(parseManualNumber(' ', 'length_mm')).toEqual({ value: null, error: null });
  });

  it('rejects non-numbers and out-of-range values', () => {
    expect(parseManualNumber('abc', 'length_mm').error).toBe(
      'Isi dengan angka, misalnya 125 atau 125,5.',
    );
    expect(parseManualNumber('12,5,5', 'length_mm').error).toBe(
      'Isi dengan angka, misalnya 125 atau 125,5.',
    );
    expect(parseManualNumber('500', 'width_mm').error).toBe('Lebar harus antara 40 dan 100 mm.');
    expect(parseManualNumber('10', 'weight_g').error).toBe('Bobot harus antara 20 dan 200 g.');
    expect(parseManualNumber('79', 'length_mm').value).toBeNull();
  });
});

describe('validateManualSpecs', () => {
  it('keeps the four sizes within range', () => {
    expect(validateManualSpecs({ length_mm: 125, weight_g: 60 })).toEqual({
      length_mm: 125,
      weight_g: 60,
    });
  });

  it.each([
    {},
    { length_mm: 500 },
    { sensor: 'x' },
    { weight_g: '60' },
    { length_mm: -1 },
    { length_mm: 125, sensor: 'x' },
  ])('rejects %o', (specs) => {
    expect(validateManualSpecs(specs)).toBeNull();
  });
});

describe('MANUAL_FIELDS', () => {
  it('lists the fields in URL order with the design ranges', () => {
    expect(MANUAL_KEYS.map((k) => MANUAL_FIELDS[k])).toEqual([
      { param: 'panjang', label: 'Panjang', unit: 'mm', min: 80, max: 160 },
      { param: 'lebar', label: 'Lebar', unit: 'mm', min: 40, max: 100 },
      { param: 'tinggi', label: 'Tinggi', unit: 'mm', min: 20, max: 60 },
      { param: 'bobot', label: 'Bobot', unit: 'g', min: 20, max: 200 },
    ]);
  });
});
