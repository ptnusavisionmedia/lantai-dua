import { homePathForRole, type Role } from '@lantai-dua/shared/roles';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createServerSupabase } from './supabase/server';
import { getViewer } from './viewer';

/** Viewer untuk request ini (dihitung sekali per request, dipakai bersama layout dan halaman). */
export const getCurrentViewer = cache(async () => getViewer(await createServerSupabase()));

/**
 * Penjaga kedua di setiap dashboard (yang pertama ada di proxy.ts).
 * Mengarahkan ke halaman yang tepat kalau perannya tidak cocok.
 */
export async function requireRole(
  allowed: readonly Role[],
): Promise<{ userId: string; fullName: string; role: Role }> {
  const { viewer, userId, fullName } = await getCurrentViewer();
  if (viewer.kind === 'guest' || !userId) redirect('/masuk');
  if (viewer.kind === 'inactive') redirect('/akun-nonaktif');
  if (!allowed.includes(viewer.role)) redirect(homePathForRole(viewer.role));
  return { userId, fullName: fullName ?? '', role: viewer.role };
}
