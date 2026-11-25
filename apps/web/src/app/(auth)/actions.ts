'use server';

import { safeNextPath } from '@lantai-dua/shared/access';
import { homePathForRole } from '@lantai-dua/shared/roles';
import { redirect } from 'next/navigation';
import { authErrorMessage } from '@/lib/auth-errors';
import { publicEnv } from '@/lib/env';
import { createServerSupabase } from '@/lib/supabase/server';

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  sent?: boolean;
  /** Isian yang dikembalikan ke formulir supaya tidak hilang saat ada galat (kata sandi tidak ikut). */
  values?: { email?: string; full_name?: string };
  /**
   * Tampilkan tautan "Daftar dulu". Supabase tidak membedakan akun yang belum ada dengan kata sandi
   * salah (supaya email terdaftar tidak bisa ditebak), jadi petunjuk ini muncul untuk keduanya.
   */
  suggestSignup?: boolean;
};

const field = (data: FormData, name: string) => String(data.get(name) ?? '').trim();

export async function signIn(_prev: FormState, data: FormData): Promise<FormState> {
  const email = field(data, 'email');
  const password = String(data.get('password') ?? '');
  const next = safeNextPath(field(data, 'next'));

  const fieldErrors: Record<string, string> = {};
  if (!email) fieldErrors.email = 'Email wajib diisi.';
  if (!password) fieldErrors.password = 'Kata sandi wajib diisi.';
  const values = { email };
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const supabase = await createServerSupabase();
  const { data: auth, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error: authErrorMessage(error.code),
      values,
      suggestSignup: error.code === 'invalid_credentials',
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (!profile?.is_active) redirect('/akun-nonaktif');
  redirect(next ?? homePathForRole(profile.role));
}

export async function signUp(_prev: FormState, data: FormData): Promise<FormState> {
  const fullName = field(data, 'full_name');
  const email = field(data, 'email');
  const password = String(data.get('password') ?? '');
  const consent = data.get('consent') === 'on';
  const next = safeNextPath(field(data, 'next')) ?? '/akun';

  const fieldErrors: Record<string, string> = {};
  if (!fullName) fieldErrors.full_name = 'Nama lengkap wajib diisi.';
  if (!email) fieldErrors.email = 'Email wajib diisi.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fieldErrors.email = 'Format email tidak valid.';
  if (password.length < 8) fieldErrors.password = 'Kata sandi minimal 8 karakter.';
  if (!consent) fieldErrors.consent = 'Setujui kebijakan privasi untuk mendaftar.';
  const values = { email, full_name: fullName };
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${publicEnv().siteUrl}/auth/konfirmasi?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: authErrorMessage(error.code), values };
  return { sent: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect('/');
}
