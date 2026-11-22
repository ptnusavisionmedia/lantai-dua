export const ROLES = ['customer', 'operator', 'owner'] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  customer: 'Pelanggan',
  operator: 'Operator',
  owner: 'Pemilik',
};

const HOME_PATH = {
  customer: '/akun',
  operator: '/operator',
  owner: '/pemilik',
} as const satisfies Record<Role, string>;

export function homePathForRole(role: Role): (typeof HOME_PATH)[Role] {
  return HOME_PATH[role];
}
