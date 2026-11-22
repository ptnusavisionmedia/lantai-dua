import type { Viewer } from '@lantai-dua/shared/access';
import type { Database } from '@lantai-dua/shared/database';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ViewerInfo = { viewer: Viewer; userId: string | null; fullName: string | null };

/**
 * Siapa yang sedang membuka halaman: tamu, akun nonaktif (atau tanpa profil), atau akun aktif + perannya.
 * Identitas diambil dari JWT yang sudah diverifikasi (getClaims), lalu peran dari tabel profiles.
 */
export async function getViewer(supabase: SupabaseClient<Database>): Promise<ViewerInfo> {
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;
  if (!userId) return { viewer: { kind: 'guest' }, userId: null, fullName: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active, full_name')
    .eq('id', userId)
    .maybeSingle();

  if (!profile?.is_active) {
    return { viewer: { kind: 'inactive' }, userId, fullName: profile?.full_name ?? null };
  }
  return { viewer: { kind: 'active', role: profile.role }, userId, fullName: profile.full_name };
}
