import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type { TestProject } from 'vitest/node';
import { requireEnv } from './env';
import { PERSONAS, type Persona } from './personas';

const noSession = { auth: { persistSession: false, autoRefreshToken: false } } as const;

/** Perubahan profil setelah akun dibuat (akun baru selalu customer aktif). */
const PROFILE_PATCH: Partial<Record<Persona, { role: string; is_active?: boolean }>> = {
  operator: { role: 'operator' },
  operatorInactive: { role: 'operator', is_active: false },
  owner: { role: 'owner' },
};

/**
 * Membuat 5 akun tes di project dev, login sekali per akun, lalu membagikan token ke semua file tes.
 * Akun dihapus lagi setelah semua tes selesai (atau kalau setup gagal di tengah jalan).
 */
export default async function setup(project: TestProject) {
  const url = requireEnv('SUPABASE_URL');
  const publishable = requireEnv('SUPABASE_PUBLISHABLE_KEY');
  const admin = createClient(url, requireEnv('SUPABASE_SECRET_KEY'), noSession);
  const runId = `${Date.now().toString(36)}${randomUUID().slice(0, 4)}`;
  const createdIds: string[] = [];

  const cleanup = async () => {
    for (const id of createdIds) await admin.auth.admin.deleteUser(id);
  };

  const sessions = {} as Record<Persona, { userId: string; accessToken: string }>;
  try {
    for (const persona of PERSONAS) {
      const email = `rls-${persona.toLowerCase()}-${runId}@lantaidua.test`;
      const password = randomUUID();
      const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: `Tes ${persona}` },
      });
      if (created.error) throw created.error;
      const userId = created.data.user.id;
      createdIds.push(userId);

      const patch = PROFILE_PATCH[persona];
      if (patch) {
        const { error } = await admin.from('profiles').update(patch).eq('id', userId);
        if (error) throw new Error(`Gagal mengatur profil ${persona}: ${error.message}`);
      }

      const signedIn = await createClient(url, publishable, noSession).auth.signInWithPassword({
        email,
        password,
      });
      if (signedIn.error) throw signedIn.error;
      sessions[persona] = { userId, accessToken: signedIn.data.session.access_token };
    }
  } catch (error) {
    await cleanup();
    throw error;
  }

  project.provide('sessions', sessions);
  project.provide('runId', runId);
  return cleanup;
}
