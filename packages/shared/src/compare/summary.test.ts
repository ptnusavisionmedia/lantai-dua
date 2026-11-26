import { describe, expect, it } from 'vitest';
import { slotSpecs, summarySentence } from './summary';
import { makeCompareItem } from './testing';
import type { CurrentSlot } from './types';

const cur = (specs: Record<string, unknown>): CurrentSlot => ({
  kind: 'item',
  item: makeCompareItem({ id: 'a', specs }),
});
const tgt = (specs: Record<string, unknown>) => makeCompareItem({ id: 'b', specs });

describe('summarySentence', () => {
  it.each([
    [
      { weight_g: 60, length_mm: 127.69 },
      { weight_g: 51, length_mm: 121.48 },
      'Incaran lebih ringan 9 g dan lebih pendek 6,2 mm.',
    ],
    [
      { weight_g: 60, length_mm: 120 },
      { weight_g: 63, length_mm: 120.3 },
      'Incaran lebih berat 3 g, panjangnya hampir sama.',
    ],
    [
      { weight_g: 60, length_mm: 120 },
      { weight_g: 60.4, length_mm: 119.8 },
      'Bobot dan panjangnya hampir sama.',
    ],
    [{ length_mm: 125 }, { weight_g: 51, length_mm: 121 }, 'Incaran lebih pendek 4 mm.'],
    [
      { weight_g: 60, length_mm: 120 },
      { weight_g: 60.5, length_mm: 125 },
      'Incaran lebih panjang 5 mm, bobotnya hampir sama.',
    ],
    [{ weight_g: 60 }, { weight_g: 51.4 }, 'Incaran lebih ringan 9 g.'],
    [{ weight_g: 60 }, { weight_g: 59.5 }, 'Bobotnya hampir sama.'],
    [{ length_mm: 120 }, { length_mm: 120.4 }, 'Panjangnya hampir sama.'],
    [{ length_mm: 120 }, { length_mm: 119.5 }, 'Incaran lebih pendek 0,5 mm.'],
    [
      { weight_g: 80, length_mm: 120 },
      { weight_g: 120, length_mm: 130.04 },
      'Incaran lebih berat 40 g dan lebih panjang 10 mm.',
    ],
  ])('%o vs %o', (a, b, text) => {
    expect(summarySentence({ current: cur(a), target: tgt(b) })).toBe(text);
  });

  it('handles manual sizes', () => {
    expect(
      summarySentence({
        current: { kind: 'manual', specs: { length_mm: 125 } },
        target: tgt({ length_mm: 121 }),
      }),
    ).toBe('Incaran lebih pendek 4 mm.');
  });

  it('says when both slots hold the same mouse', () => {
    const same = makeCompareItem({ id: 'x', specs: { weight_g: 60 } });
    expect(summarySentence({ current: { kind: 'item', item: same }, target: same })).toBe(
      'Dua pilihan ini mouse yang sama.',
    );
  });

  it('stays silent without weight or length on both sides, or with an empty slot', () => {
    expect(summarySentence({ current: cur({ sensor: 'x' }), target: tgt({ weight_g: 51 }) })).toBe(
      null,
    );
    expect(summarySentence({ current: null, target: tgt({ weight_g: 51 }) })).toBeNull();
    expect(summarySentence({ current: cur({ weight_g: 60 }), target: null })).toBeNull();
    expect(
      summarySentence({ current: { kind: 'manual', specs: {} }, target: tgt({ weight_g: 51 }) }),
    ).toBeNull();
  });
});

describe('slotSpecs', () => {
  it('reads specs from any slot', () => {
    expect(slotSpecs({ kind: 'manual', specs: { weight_g: 60 } })).toEqual({ weight_g: 60 });
    expect(slotSpecs(tgt({ length_mm: 120 }))).toEqual({ length_mm: 120 });
    expect(slotSpecs(null)).toEqual({});
  });
});
