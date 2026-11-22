/** Nilai env publik untuk web. Secret key tidak pernah dibaca di sini. */
export function publicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diisi di apps/web/.env.local',
    );
  }
  return { url, key, siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000' };
}
