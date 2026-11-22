import type { Database } from '@lantai-dua/shared/database';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publicEnv } from '../env';

/** Klien Supabase untuk Server Component, Server Action, dan Route Handler. */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  const { url, key } = publicEnv();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component tidak boleh menulis cookie; sesi sudah disegarkan oleh proxy.ts.
        }
      },
    },
  });
}
