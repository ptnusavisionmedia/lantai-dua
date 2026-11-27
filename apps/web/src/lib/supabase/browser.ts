import type { Database } from '@lantai-dua/shared/database';
import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from '../env';

/**
 * Klien Supabase di browser, dengan publishable key dan sesi login dari cookie. Dipakai hanya
 * untuk berlangganan realtime; data tetap dibaca lewat server. Satu instance per tab.
 */
export function createBrowserSupabase() {
  const { url, key } = publicEnv();
  return createBrowserClient<Database>(url, key);
}
