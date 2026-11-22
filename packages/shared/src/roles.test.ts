import { describe, expect, it } from 'vitest';
import { homePathForRole, ROLE_LABEL } from './roles';

describe('homePathForRole', () => {
  it('maps each role to its home page', () => {
    expect(homePathForRole('customer')).toBe('/akun');
    expect(homePathForRole('operator')).toBe('/operator');
    expect(homePathForRole('owner')).toBe('/pemilik');
  });
});

describe('ROLE_LABEL', () => {
  it('labels roles in Indonesian', () => {
    expect(ROLE_LABEL).toEqual({ customer: 'Pelanggan', operator: 'Operator', owner: 'Pemilik' });
  });
});
