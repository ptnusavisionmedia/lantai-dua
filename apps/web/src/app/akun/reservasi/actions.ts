'use server';

import { cancelErrorText, isReservationCode } from '@lantai-dua/shared/reservation';
import { revalidatePath } from 'next/cache';
import { getStoreInfo } from '@/lib/reservation-data';
import { createServerSupabase } from '@/lib/supabase/server';

export type CancelResult = { ok: true } | { ok: false; error: string };

/** Membatalkan reservasi milik sendiri lewat fungsi database (batas waktu diperiksa di sana). */
export async function cancelReservationAction(code: string): Promise<CancelResult> {
  const settings = await getStoreInfo();
  if (typeof code !== 'string' || !isReservationCode(code)) {
    return { ok: false, error: cancelErrorText('not_found', settings) };
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc('cancel_reservation', { p_code: code });
  if (error) return { ok: false, error: cancelErrorText(error.message, settings) };
  revalidatePath(`/akun/reservasi/${code}`);
  revalidatePath('/akun/reservasi');
  revalidatePath('/akun');
  return { ok: true };
}
