import { describe, expect, it } from 'vitest';
import { cancelErrorText, createErrorText, slotReasonText, variantLabel } from './messages';
import { makeSlot, makeVariant, SETTINGS } from './testing';

const f1 = makeVariant({ id: 'f1', productName: 'VortexSeries Ignix F1', name: 'Putih' });
const variants = [f1];

describe('slotReasonText', () => {
  it.each([
    ['unit_taken', 'Unit demo VortexSeries Ignix F1 · Putih sudah dipesan di jam ini'],
    ['unit_servicing', 'Unit demo VortexSeries Ignix F1 · Putih sedang diservis'],
    ['too_soon', 'Pesan paling lambat 1 jam sebelum sesi'],
    ['too_far', 'Paling jauh 14 hari ke depan'],
    ['own_overlap', 'Lu udah punya reservasi di jam ini'],
    ['desk_full', 'Meja penuh'],
    ['closed', 'Toko tutup'],
    ['past', 'Sudah lewat'],
  ] as const)('explains %s', (reason, text) => {
    const slot = makeSlot({ available: false, reason, reasonVariantId: 'f1' });
    expect(slotReasonText(slot, variants, SETTINGS)).toBe(text);
  });

  it('returns null for an available slot', () => {
    expect(slotReasonText(makeSlot(), variants, SETTINGS)).toBeNull();
  });

  it('uses the stored lead time', () => {
    const slot = makeSlot({ available: false, reason: 'too_soon' });
    expect(slotReasonText(slot, variants, { ...SETTINGS, minLeadMinutes: 90 })).toBe(
      'Pesan paling lambat 1 jam 30 menit sebelum sesi',
    );
  });

  it('falls back to a generic name for an unknown variant', () => {
    const slot = makeSlot({ available: false, reason: 'unit_taken', reasonVariantId: 'x' });
    expect(slotReasonText(slot, variants, SETTINGS)).toBe('Unit demo ini sudah dipesan di jam ini');
  });
});

describe('createErrorText', () => {
  it.each([
    ['desk_full', null, 'Slot ini baru saja penuh. Pilih jam lain.'],
    ['slot_unavailable', null, 'Slot ini baru saja penuh. Pilih jam lain.'],
    [
      'unit_taken',
      'VortexSeries Ignix F1 · Putih',
      'Unit demo VortexSeries Ignix F1 · Putih baru saja dipesan orang lain di jam ini.',
    ],
    [
      'unit_servicing',
      'VortexSeries Ignix F1 · Putih',
      'Unit demo VortexSeries Ignix F1 · Putih sedang diservis.',
    ],
    ['own_overlap', null, 'Lu udah punya reservasi di jam ini.'],
    [
      'too_many_active',
      null,
      'Lu udah punya 2 reservasi aktif. Batalkan salah satu dulu, atau tunggu sampai sesinya lewat.',
    ],
    ['rate_limited', null, 'Terlalu banyak reservasi dibuat hari ini. Coba lagi besok.'],
    ['too_soon', null, 'Jam ini sudah tidak bisa dipesan. Pilih jam lain.'],
    ['outside_hours', null, 'Jam ini sudah tidak bisa dipesan. Pilih jam lain.'],
    ['not_customer', null, 'Reservasi dibuat dari akun pelanggan.'],
    ['aneh', null, 'Gagal menyimpan. Coba lagi sebentar.'],
  ])('maps %s', (code, name, text) => {
    expect(createErrorText(code, name, SETTINGS)).toBe(text);
  });

  it('names a generic unit when the variant is unknown', () => {
    expect(createErrorText('unit_taken', null, SETTINGS)).toBe(
      'Unit demo ini baru saja dipesan orang lain di jam ini.',
    );
  });
});

describe('cancelErrorText', () => {
  it.each([
    ['cancel_too_late', 'Batas batal sudah lewat. Hubungi toko lewat WhatsApp.'],
    ['not_cancellable', 'Reservasi ini sudah tidak bisa dibatalkan.'],
    ['not_found', 'Gagal membatalkan. Coba lagi sebentar.'],
  ])('maps %s', (code, text) => {
    expect(cancelErrorText(code, SETTINGS)).toBe(text);
  });
});

describe('variantLabel', () => {
  it('joins product and variant names', () => {
    expect(variantLabel(f1)).toBe('VortexSeries Ignix F1 · Putih');
  });
});
