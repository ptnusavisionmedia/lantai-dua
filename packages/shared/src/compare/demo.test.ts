import { describe, expect, it } from 'vitest';
import { hasDemoUnit, slotDemoLabel, tryBothHref } from './demo';
import { makeCompareItem } from './testing';

const f1 = makeCompareItem({
  slug: 'vortexseries-ignix-f1',
  isForSale: true,
  demoStatus: 'available',
  demoVariantSku: 'L2-VTX-IGNIXF1-WHT',
  demoVariantName: 'Putih',
});
const dav3 = makeCompareItem({
  slug: 'razer-deathadder-v3-pro',
  isForSale: true,
  demoStatus: 'in_use',
  demoVariantSku: 'L2-RZR-DAV3PRO-BLK',
});
const g102 = makeCompareItem({ slug: 'logitech-g102-lightsync', isForSale: false });
const noUnit = makeCompareItem({ slug: 'tanpa-unit', isForSale: true, demoStatus: 'none' });

describe('tryBothHref', () => {
  it('links both demo units and skips bawa when the current mouse has one', () => {
    expect(tryBothHref({ current: { kind: 'item', item: dav3 }, target: f1 })).toBe(
      '/reservasi/baru?varian=L2-RZR-DAV3PRO-BLK,L2-VTX-IGNIXF1-WHT',
    );
  });

  it('adds bawa for a reference or manual current mouse', () => {
    expect(tryBothHref({ current: { kind: 'item', item: g102 }, target: f1 })).toBe(
      '/reservasi/baru?varian=L2-VTX-IGNIXF1-WHT&bawa=logitech-g102-lightsync',
    );
    expect(
      tryBothHref({ current: { kind: 'manual', specs: { length_mm: 125 } }, target: f1 }),
    ).toBe('/reservasi/baru?varian=L2-VTX-IGNIXF1-WHT&bawa=ukur');
  });

  it('links only the current demo unit when the target has none', () => {
    expect(tryBothHref({ current: { kind: 'item', item: f1 }, target: noUnit })).toBe(
      '/reservasi/baru?varian=L2-VTX-IGNIXF1-WHT',
    );
  });

  it('lists one SKU when both slots hold the same mouse', () => {
    expect(tryBothHref({ current: { kind: 'item', item: f1 }, target: f1 })).toBe(
      '/reservasi/baru?varian=L2-VTX-IGNIXF1-WHT',
    );
  });

  it('returns null without any demo unit or with an empty slot', () => {
    expect(tryBothHref({ current: { kind: 'item', item: g102 }, target: noUnit })).toBeNull();
    expect(tryBothHref({ current: null, target: f1 })).toBeNull();
    expect(tryBothHref({ current: { kind: 'item', item: f1 }, target: null })).toBeNull();
  });
});

describe('demo labels', () => {
  it('counts any unit status as a demo unit', () => {
    expect(hasDemoUnit(f1)).toBe(true);
    expect(hasDemoUnit({ kind: 'item', item: dav3 })).toBe(true);
    expect(hasDemoUnit(makeCompareItem({ demoStatus: 'servicing', demoVariantSku: 'X' }))).toBe(
      true,
    );
    expect(hasDemoUnit(noUnit)).toBe(false);
    expect(hasDemoUnit(makeCompareItem({ demoStatus: 'free', demoVariantSku: null }))).toBe(false);
    expect(hasDemoUnit({ kind: 'manual', specs: {} })).toBe(false);
    expect(hasDemoUnit(null)).toBe(false);
  });

  it('labels references and manual sizes as not in the showroom', () => {
    expect(slotDemoLabel(g102)).toEqual({ tone: 'none', text: 'Tidak ada di showroom' });
    expect(slotDemoLabel({ kind: 'manual', specs: {} })).toEqual({
      tone: 'none',
      text: 'Tidak ada di showroom',
    });
  });

  it('uses the 1A demo label for mice on sale', () => {
    expect(slotDemoLabel(f1)).toEqual({ tone: 'demo', text: 'Demo tersedia · Putih' });
    expect(slotDemoLabel({ kind: 'item', item: dav3 })).toEqual({
      tone: 'warn',
      text: 'Unit demo sedang dipakai',
    });
    expect(slotDemoLabel(noUnit)).toEqual({ tone: 'none', text: 'Tidak ada unit demo' });
  });
});
