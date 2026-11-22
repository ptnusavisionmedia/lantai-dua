import type { Database } from '@lantai-dua/shared/database';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { publicEnv } from '../env';

/**
 * Klien Supabase untuk proxy.ts. Cookie sesi yang diperbarui ditulis ke request (untuk halaman)
 * dan ke response (untuk browser). Ambil response lewat `response()` setelah memakai klien.
 */
export function createProxySupabase(request: NextRequest) {
  const { url, key } = publicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [header, value] of Object.entries(headers ?? {})) {
          response.headers.set(header, value);
        }
      },
    },
  });

  return { supabase, response: () => response };
}
