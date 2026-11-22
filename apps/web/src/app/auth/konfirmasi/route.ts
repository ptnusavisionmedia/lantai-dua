import { safeNextPath } from '@lantai-dua/shared/access';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Tujuan tautan verifikasi email dari template bawaan Supabase: email sudah diverifikasi,
 * lalu datang ke sini dengan ?code=… (PKCE). Kode hanya bisa ditukar oleh browser yang mendaftar,
 * jadi tautan orang lain tidak bisa membuat pengunjung masuk ke akun orang itu.
 *
 * Tautan bentuk ?token_hash=… sengaja belum diterima. Tanpa pembatasan, tautan magic link milik
 * orang lain bisa memasukkan pengunjung ke akun orang itu (login CSRF). Bentuk ini baru ditambahkan
 * di Fase 1 bersama SMTP sendiri, dan hanya untuk tipe verifikasi pendaftaran.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNextPath(params.get('next')) ?? '/akun';
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));

  const code = params.get('code');
  if (!code || params.get('error') || params.get('error_description')) {
    return go('/masuk?error=verifikasi');
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  // Gagal tukar kode (misalnya dibuka di browser lain): email tetap sudah terverifikasi.
  return go(error ? '/masuk?pesan=terverifikasi' : next);
}
