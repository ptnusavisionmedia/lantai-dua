import { describe, expect, it } from 'vitest';
import {
  compareTitle,
  gearToSlot,
  pickerGroups,
  resolveInitialPair,
  slotMatchesGear,
  slotName,
} from './pair';
import { parseCompareQuery } from './query';
import { makeCompareItem } from './testing';

const f1 = makeCompareItem({
  slug: 'vortexseries-ignix-f1',
  brandName: 'VortexSeries',
  modelName: 'Ignix F1',
  isForSale: true,
  specs: { weight_g: 51 },
  demoStatus: 'available',
  demoVariantSku: 'L2-VTX-IGNIXF1-WHT',
});
const g102 = makeCompareItem({
  slug: 'logitech-g102-lightsync',
  brandName: 'Logitech',
  modelName: 'G102 Lightsync',
  isForSale: false,
  specs: { weight_g: 85 },
});
const dav3 = makeCompareItem({
  slug: 'razer-deathadder-v3-pro',
  brandName: 'Razer',
  modelName: 'DeathAdder V3 Pro',
  isForSale: true,
  specs: { weight_g: 63 },
  demoStatus: 'in_use',
  demoVariantSku: 'L2-RZR-DAV3PRO-BLK',
});
const items = [f1, g102, dav3];
const p = (s: string) => parseCompareQuery(new URLSearchParams(s), items);
const examples = { currentId: g102.id, targetId: f1.id };

describe('resolveInitialPair', () => {
  it('uses the example pair when the URL has no valid slot', () => {
    for (const raw of ['', 'sekarang=zzz', 'utm_source=x']) {
      expect(resolveInitialPair(p(raw), { items, gear: null, examples }), raw).toEqual({
        current: { kind: 'item', item: g102 },
        target: f1,
      });
    }
  });

  it('fills the current slot from gear but keeps the URL target', () => {
    const r = resolveInitialPair(p('incaran=razer-deathadder-v3-pro'), {
      items,
      gear: { kind: 'item', productId: f1.id },
      examples,
    });
    expect(r).toEqual({ current: { kind: 'item', item: f1 }, target: dav3 });
  });

  it('prefers gear over the example when the URL is empty', () => {
    const r = resolveInitialPair(p(''), {
      items,
      gear: { kind: 'manual', specs: { length_mm: 125 } },
      examples,
    });
    expect(r).toEqual({ current: { kind: 'manual', specs: { length_mm: 125 } }, target: f1 });
  });

  it('keeps the URL current slot over gear', () => {
    const r = resolveInitialPair(p('sekarang=razer-deathadder-v3-pro'), {
      items,
      gear: { kind: 'item', productId: f1.id },
      examples,
    });
    expect(r).toEqual({ current: { kind: 'item', item: dav3 }, target: null });
  });

  it('leaves the current slot empty when the URL only has a target and there is no gear', () => {
    expect(
      resolveInitialPair(p('incaran=razer-deathadder-v3-pro'), { items, gear: null, examples })
        .current,
    ).toBeNull();
  });

  it('treats gear pointing at an inactive mouse as empty', () => {
    const r = resolveInitialPair(p(''), {
      items,
      gear: { kind: 'item', productId: 'hilang' },
      examples,
    });
    expect(r.current).toEqual({ kind: 'item', item: g102 });
  });

  it('falls back to the lightest for-sale mouse with a demo unit', () => {
    const ctx = { items, gear: null, examples: { currentId: g102.id, targetId: g102.id } };
    expect(resolveInitialPair(p(''), ctx).target).toBe(f1);

    const noDemo = [
      makeCompareItem({ id: 'berat', isForSale: true, specs: { weight_g: 90 } }),
      makeCompareItem({ id: 'ringan', isForSale: true, specs: { weight_g: 55 } }),
      makeCompareItem({ id: 'tanpa-bobot', isForSale: true, specs: {} }),
    ];
    const r = resolveInitialPair(parseCompareQuery(new URLSearchParams(''), noDemo), {
      items: noDemo,
      gear: null,
      examples: { currentId: null, targetId: null },
    });
    expect(r.target?.id).toBe('ringan');

    const none = resolveInitialPair(parseCompareQuery(new URLSearchParams(''), [g102]), {
      items: [g102],
      gear: null,
      examples: { currentId: null, targetId: null },
    });
    expect(none).toEqual({ current: null, target: null });
  });

  it('prefers a demo unit over a lighter mouse without one', () => {
    const light = makeCompareItem({ id: 'light', isForSale: true, specs: { weight_g: 40 } });
    const r = resolveInitialPair(parseCompareQuery(new URLSearchParams(''), [light, dav3]), {
      items: [light, dav3],
      gear: null,
      examples: { currentId: null, targetId: null },
    });
    expect(r.target).toBe(dav3);
  });

  it('leaves the current slot empty when the example mouse is gone', () => {
    const r = resolveInitialPair(p(''), {
      items,
      gear: null,
      examples: { currentId: 'hilang', targetId: f1.id },
    });
    expect(r).toEqual({ current: null, target: f1 });
  });
});

describe('gear helpers', () => {
  it('turns gear into a slot', () => {
    expect(gearToSlot({ kind: 'item', productId: dav3.id }, items)).toEqual({
      kind: 'item',
      item: dav3,
    });
    expect(gearToSlot({ kind: 'manual', specs: { weight_g: 60 } }, items)).toEqual({
      kind: 'manual',
      specs: { weight_g: 60 },
    });
    expect(gearToSlot(null, items)).toBeNull();
  });

  it('matches a slot with the saved gear', () => {
    expect(slotMatchesGear({ kind: 'item', item: f1 }, { kind: 'item', productId: f1.id })).toBe(
      true,
    );
    expect(slotMatchesGear({ kind: 'item', item: f1 }, { kind: 'item', productId: g102.id })).toBe(
      false,
    );
    expect(
      slotMatchesGear(
        { kind: 'manual', specs: { length_mm: 125, weight_g: 60 } },
        { kind: 'manual', specs: { weight_g: 60, length_mm: 125 } },
      ),
    ).toBe(true);
    expect(
      slotMatchesGear(
        { kind: 'manual', specs: { length_mm: 125 } },
        { kind: 'manual', specs: { length_mm: 126 } },
      ),
    ).toBe(false);
    expect(slotMatchesGear({ kind: 'item', item: f1 }, null)).toBe(false);
    expect(slotMatchesGear(null, null)).toBe(false);
  });
});

describe('picker and names', () => {
  it('groups for-sale and other mice, sorted by brand then model', () => {
    const a = makeCompareItem({ brandName: 'Zowie', modelName: 'EC2-CW', isForSale: false });
    const b = makeCompareItem({ brandName: 'Logitech', modelName: 'G304', isForSale: false });
    const c = makeCompareItem({ brandName: 'Logitech', modelName: 'G102', isForSale: false });
    const { forSale, others } = pickerGroups([a, f1, b, dav3, c]);
    expect(forSale).toEqual([dav3, f1]);
    expect(others).toEqual([c, b, a]);
  });

  it('names slots for people', () => {
    expect(slotName(g102)).toBe('Logitech G102 Lightsync');
    expect(slotName({ kind: 'item', item: f1 })).toBe('VortexSeries Ignix F1');
    expect(slotName({ kind: 'manual', specs: {} })).toBe('Ukuran lu');
  });

  it('titles the page with both names only for two listed mice', () => {
    expect(compareTitle({ current: { kind: 'item', item: g102 }, target: f1 })).toBe(
      'Bandingkan Logitech G102 Lightsync vs VortexSeries Ignix F1',
    );
    expect(compareTitle({ current: { kind: 'manual', specs: {} }, target: f1 })).toBe(
      'Bandingkan mouse',
    );
    expect(compareTitle({ current: null, target: f1 })).toBe('Bandingkan mouse');
  });
});
