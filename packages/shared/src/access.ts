import { homePathForRole, type Role } from './roles';

export type Viewer = { kind: 'guest' } | { kind: 'inactive' } | { kind: 'active'; role: Role };

export type AccessDecision = { kind: 'allow' } | { kind: 'redirect'; to: string };

const AREAS: ReadonlyArray<{ path: string; roles: readonly Role[] }> = [
  { path: '/akun', roles: ['customer'] },
  { path: '/operator', roles: ['operator', 'owner'] },
  { path: '/pemilik', roles: ['owner'] },
];

const GUEST_ONLY_PATHS = ['/masuk', '/daftar'];
const INACTIVE_PATH = '/akun-nonaktif';

const ALLOW: AccessDecision = { kind: 'allow' };
const redirectTo = (to: string): AccessDecision => ({ kind: 'redirect', to });

function isWithin(pathname: string, section: string): boolean {
  return pathname === section || pathname.startsWith(`${section}/`);
}

export function resolveAccess(pathname: string, viewer: Viewer, search = ''): AccessDecision {
  const area = AREAS.find((a) => isWithin(pathname, a.path));
  const isGuestOnly = GUEST_ONLY_PATHS.some((p) => isWithin(pathname, p));
  const isInactivePage = isWithin(pathname, INACTIVE_PATH);

  if (viewer.kind === 'inactive') {
    return area || isGuestOnly ? redirectTo(INACTIVE_PATH) : ALLOW;
  }

  if (viewer.kind === 'guest') {
    if (area) return redirectTo(`/masuk?next=${encodeURIComponent(pathname + search)}`);
    if (isInactivePage) return redirectTo('/masuk');
    return ALLOW;
  }

  const home = homePathForRole(viewer.role);
  if (isGuestOnly || isInactivePage) return redirectTo(home);
  if (area && !area.roles.includes(viewer.role)) return redirectTo(home);
  return ALLOW;
}

/** Returns `next` only when it is an internal path on this site; otherwise null. */
export function safeNextPath(next: string | null | undefined): string | null {
  if (typeof next !== 'string' || !next.startsWith('/')) return null;
  if (next.startsWith('//')) return null;
  for (const char of next) {
    if (char === '\\' || char.charCodeAt(0) < 0x20) return null;
  }
  return next;
}
