import { safeNextPath } from '@lantai-dua/shared/access';
import type { EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Tujuan tautan verifikasi email.
 * - Template bawaan Supabase: email sudah diverifikasi, lalu datang ke sini dengan ?code=… (PKCE).
 * - Template token_hash (setelah SMTP sendiri di Fase 1): ?token_hash=…&type=…
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNextPath(params.get('next')) ?? '/akun';
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (params.get('error') || params.get('error_description')) return go('/masuk?error=verifikasi');

  const supabase = await createServerSupabase();

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // Gagal tukar kode (misalnya dibuka di browser lain): email tetap sudah terverifikasi.
    return go(error ? '/masuk?pesan=terverifikasi' : next);
  }

  const tokenHash = params.get('token_hash');
  const type = params.get('type') as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    return go(error ? '/masuk?error=verifikasi' : next);
  }

  return go('/masuk?error=verifikasi');
}
