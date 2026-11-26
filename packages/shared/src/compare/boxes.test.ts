import { describe, expect, it } from 'vitest';
import { boxPanels } from './boxes';
import { makeCompareItem } from './testing';
import type { CurrentSlot } from './types';

const cur = (specs: Record<string, unknown>): CurrentSlot => ({
  kind: 'item',
  item: makeCompareItem({ id: 'a', brandName: 'Logitech', modelName: 'G102 Lightsync', specs }),
});
const tgt = (specs: Record<string, unknown>) =>
  makeCompareItem({ id: 'b', brandName: 'VortexSeries', modelName: 'Ignix F1', specs });

describe('boxPanels', () => {
  it('aligns the back ends on one shared scale', () => {
    const r = boxPanels({
      current: cur({ length_mm: 125, width_mm: 63, height_mm: 40 }),
      target: tgt({ length_mm: 121.48, width_mm: 61.27, height_mm: 38.2 }),
    });
    expect(r.top).toMatchObject({ width: 141, height: 79, current: { x: 8, y: 8, w: 125, h: 63 } });
    expect(r.top?.target.x).toBe(8);
    expect(r.top?.target.y).toBeCloseTo(8.865);
    expect(r.side?.width).toBe(r.top?.width);
    expect(r.side).toMatchObject({ height: 56, current: { x: 8, y: 8, w: 125, h: 40 } });
    expect(r.side?.target.y).toBeCloseTo(9.8);
    expect(r.side?.target.h).toBeCloseTo(38.2);
    expect(r.topGap).toBeNull();
    expect(r.sideGap).toBeNull();
  });

  it('scales to the larger mouse when the target is bigger', () => {
    const r = boxPanels({
      current: cur({ length_mm: 116.6, width_mm: 62.1, height_mm: 38.2 }),
      target: tgt({ length_mm: 127.69, width_mm: 67.76, height_mm: 42.84 }),
    });
    expect(r.top?.width).toBeCloseTo(143.69);
    expect(r.top?.target).toMatchObject({ x: 8, y: 8 });
    expect(r.side?.current.y).toBeCloseTo(8 + 42.84 - 38.2);
  });

  it('explains a missing panel for manual sizes and listed mice', () => {
    const r = boxPanels({
      current: { kind: 'manual', specs: { length_mm: 125 } },
      target: makeCompareItem({
        brandName: 'Logitech',
        modelName: 'G102 Lightsync',
        specs: { length_mm: 116, width_mm: 62 },
      }),
    });
    expect(r.top).toBeNull();
    expect(r.topGap).toBe('Isi lebar mouse lu untuk melihat tampak atas.');
    expect(r.side).toBeNull();
    expect(r.sideGap).toBe(
      'Isi tinggi mouse lu untuk melihat tampak samping. Tinggi Logitech G102 Lightsync belum tercatat.',
    );
  });

  it('joins several missing sizes with "dan"', () => {
    const r = boxPanels({
      current: cur({ weight_g: 85 }),
      target: tgt({ length_mm: 121, width_mm: 61, height_mm: 38 }),
    });
    expect(r.topGap).toBe('Panjang dan lebar Logitech G102 Lightsync belum tercatat.');
    expect(r.sideGap).toBe('Panjang dan tinggi Logitech G102 Lightsync belum tercatat.');
    const manual = boxPanels({
      current: { kind: 'manual', specs: {} },
      target: tgt({ length_mm: 121, width_mm: 61, height_mm: 38 }),
    });
    expect(manual.topGap).toBe('Isi panjang dan lebar mouse lu untuk melihat tampak atas.');
  });

  it('draws nothing without both slots', () => {
    expect(boxPanels({ current: null, target: tgt({ length_mm: 121 }) })).toEqual({
      top: null,
      side: null,
      topGap: null,
      sideGap: null,
    });
  });
});
