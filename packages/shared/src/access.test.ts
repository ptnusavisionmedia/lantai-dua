import { describe, expect, it } from 'vitest';
import { resolveAccess, safeNextPath } from './access';
import type { Role } from './roles';

const guest = { kind: 'guest' } as const;
const inactive = { kind: 'inactive' } as const;
const as = (role: Role) => ({ kind: 'active', role }) as const;
const allow = { kind: 'allow' };
const to = (path: string) => ({ kind: 'redirect', to: path });

describe('resolveAccess', () => {
  it('allows public pages for everyone', () => {
    expect(resolveAccess('/', guest)).toEqual(allow);
    expect(resolveAccess('/katalog/mouse', inactive)).toEqual(allow);
  });

  it('sends guests from dashboards to /masuk with next', () => {
    expect(resolveAccess('/operator', guest)).toEqual(to('/masuk?next=%2Foperator'));
    expect(resolveAccess('/akun', guest, '?tab=pesanan')).toEqual(
      to('/masuk?next=%2Fakun%3Ftab%3Dpesanan'),
    );
  });

  it('matches path segments, not prefixes', () => {
    expect(resolveAccess('/akunting', guest)).toEqual(allow);
    expect(resolveAccess('/operatorx', guest)).toEqual(allow);
  });

  it('sends a wrong role to its own home', () => {
    expect(resolveAccess('/pemilik', as('customer'))).toEqual(to('/akun'));
    expect(resolveAccess('/pemilik/staf', as('operator'))).toEqual(to('/operator'));
    expect(resolveAccess('/akun', as('owner'))).toEqual(to('/pemilik'));
  });

  it('lets the owner use operator pages', () => {
    expect(resolveAccess('/operator', as('owner'))).toEqual(allow);
  });

  it('sends signed-in users away from /masuk and /daftar', () => {
    expect(resolveAccess('/masuk', as('customer'))).toEqual(to('/akun'));
    expect(resolveAccess('/daftar', as('owner'))).toEqual(to('/pemilik'));
  });

  it('routes inactive accounts to /akun-nonaktif without loops', () => {
    expect(resolveAccess('/operator', inactive)).toEqual(to('/akun-nonaktif'));
    expect(resolveAccess('/masuk', inactive)).toEqual(to('/akun-nonaktif'));
    expect(resolveAccess('/akun-nonaktif', inactive)).toEqual(allow);
    expect(resolveAccess('/akun-nonaktif', guest)).toEqual(to('/masuk'));
    expect(resolveAccess('/akun-nonaktif', as('operator'))).toEqual(to('/operator'));
  });
});

describe('safeNextPath', () => {
  it.each(['/akun', '/operator?tab=1'])('accepts %s', (p) => {
    expect(safeNextPath(p)).toBe(p);
  });

  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    'akun',
    '',
    null,
    undefined,
  ])('rejects %s', (p) => {
    expect(safeNextPath(p)).toBeNull();
  });
});
