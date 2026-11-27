import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { inject } from 'vitest';
import { requireEnv } from './env';

import { PERSONAS, type Persona } from './personas';

export { PERSONAS, type Persona };
export type Sessions = Record<Persona, { userId: string; accessToken: string }>;

declare module 'vitest' {
  interface ProvidedContext {
    sessions: Sessions;
    runId: string;
  }
}

const noSession = { auth: { persistSession: false, autoRefreshToken: false } } as const;

/** Klien dengan secret key: melewati RLS. Hanya untuk menyiapkan dan memeriksa data tes. */
export function adminClient(): SupabaseClient {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SECRET_KEY'), noSession);
}

/** Klien tamu (belum login). */
export function anonClient(): SupabaseClient {
  return createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_PUBLISHABLE_KEY'),
    noSession,
  );
}

/** Klien yang login sebagai persona tertentu. */
export function clientFor(persona: Persona): SupabaseClient {
  const { accessToken } = inject('sessions')[persona];
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_PUBLISHABLE_KEY'), {
    ...noSession,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/** Klien persona yang juga login di koneksi realtime, supaya RLS berlaku untuk perubahan yang diterima. */
export async function realtimeFor(persona: Persona): Promise<SupabaseClient> {
  const client = clientFor(persona);
  await client.realtime.setAuth(inject('sessions')[persona].accessToken);
  return client;
}

export function userIdOf(persona: Persona): string {
  return inject('sessions')[persona].userId;
}

/** ID unik untuk satu kali eksekusi tes, dipakai sebagai awalan data fixture. */
export function runId(): string {
  return inject('runId');
}
