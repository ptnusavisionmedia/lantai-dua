'use server';

import {
  isReservationCode,
  STAFF_ACTION,
  type StaffAction,
  staffErrorText,
} from '@lantai-dua/shared/reservation';
import { refresh } from 'next/cache';
import { getStoreInfo } from '@/lib/reservation-data';
import { createServerSupabase } from '@/lib/supabase/server';

export type StaffActionResult = { ok: true } | { ok: false; error: string };

/**
 * Menjalankan satu aksi staf lewat `staff_set_reservation_status`. Semua aturan (peran, alur status,
 * batas waktu, alasan) diperiksa database. Berhasil atau gagal, halaman dimuat ulang supaya
 * operator melihat status terbaru (desain 1C-2 §5.4).
 */
export async function runStaffAction(input: {
  code: string;
  action: StaffAction;
  reason?: string;
}): Promise<StaffActionResult> {
  const settings = await getStoreInfo();
  const action = typeof input?.action === 'string' ? input.action : '';
  const target = Object.hasOwn(STAFF_ACTION, action)
    ? STAFF_ACTION[action as StaffAction]
    : undefined;
  if (typeof input?.code !== 'string' || !isReservationCode(input.code)) {
    return { ok: false, error: staffErrorText('not_found', settings) };
  }
  if (!target) return { ok: false, error: staffErrorText('invalid_transition', settings) };

  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc('staff_set_reservation_status', {
    p_code: input.code,
    p_status: target.to,
    p_reason: typeof input.reason === 'string' ? input.reason : undefined,
  });
  refresh();
  if (error) return { ok: false, error: staffErrorText(error.message, settings) };
  return { ok: true };
}
