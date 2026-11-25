import { describe, expect, it } from 'vitest';
import { demoLabel, stockLabel } from './labels';

describe('stockLabel', () => {
  it.each([
    [0, 'bad', 'Stok habis', 'Stok jual: habis'],
    [1, 'warn', 'Sisa 1', 'Stok jual: sisa 1'],
    [2, 'warn', 'Sisa 2', 'Stok jual: sisa 2'],
    [3, 'warn', 'Sisa 3', 'Stok jual: sisa 3'],
    [4, 'ok', 'Stok tersedia', 'Stok jual: tersedia'],
  ] as const)('stock %i', (n, tone, card, detail) => {
    expect(stockLabel(n)).toEqual({ tone, card, detail });
  });
});

describe('demoLabel', () => {
  it.each([
    ['free', null, 'demo', 'Bisa dicoba langsung'],
    ['available', 'Gateron Brown (tactile)', 'demo', 'Demo tersedia · Gateron Brown (tactile)'],
    ['in_use', 'Putih', 'warn', 'Unit demo sedang dipakai'],
    ['servicing', null, 'none', 'Unit demo sedang diservis'],
    ['none', null, 'none', 'Tidak ada unit demo'],
  ] as const)('demo %s', (status, name, tone, text) => {
    expect(demoLabel(status, name)).toEqual({ tone, text });
  });
});
