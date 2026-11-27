import { describe, expect, it } from 'vitest';
import { formatWhatsapp, normalizeWhatsapp, WHATSAPP_INVALID, whatsappLink } from './whatsapp';

describe('normalizeWhatsapp', () => {
  it.each([
    ['0812-3456-7890'],
    ['+62 812 3456 7890'],
    ['62812 3456 7890'],
    ['+62 0812-3456-7890'],
    ['(0812) 3456.7890'],
    ['0062 812 3456 7890'],
  ])('normalizes %s', (input) => {
    expect(normalizeWhatsapp(input)).toBe('6281234567890');
  });

  it.each([
    [''],
    ['12345'],
    ['0812-abc-7890'],
    ['812345678'],
    ['0812345'],
    ['0812345678901234'],
    ['0000000000'],
    ['62000000000'],
  ])('rejects %j', (input) => {
    expect(normalizeWhatsapp(input)).toBeNull();
  });

  it('accepts the shortest and longest numbers the profile allows', () => {
    expect(normalizeWhatsapp('081234567')).toBe('6281234567');
    expect(normalizeWhatsapp('0812345678901')).toBe('62812345678901');
  });
});

describe('formatWhatsapp', () => {
  it.each([
    ['6281234567890', '0812-3456-7890'],
    ['628123456789', '0812-3456-789'],
    ['6281234567', '0812-3456-7'],
  ])('formats %s as %s', (stored, shown) => {
    expect(formatWhatsapp(stored)).toBe(shown);
  });
});

describe('whatsappLink', () => {
  it('links to wa.me', () => {
    expect(whatsappLink('6281234567890')).toBe('https://wa.me/6281234567890');
  });
});

it('explains a bad number with an example', () => {
  expect(WHATSAPP_INVALID).toBe('Nomor WhatsApp belum benar. Contoh: 0812-3456-7890');
});
