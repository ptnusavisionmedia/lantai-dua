import type { Tone } from '../catalog/types';
import type { ReservationSettings, ReservationStatus, ReservationView } from './types';

/** Label status untuk pelanggan. Terjadwal yang sudah lewat ditulis "Sudah lewat". */
export function reservationStatusLabel(
  status: ReservationStatus,
  endsAt: string,
  now: Date,
): { tone: Tone; text: string } {
  switch (status) {
    case 'scheduled':
      return new Date(endsAt).getTime() <= now.getTime()
        ? { tone: 'none', text: 'Sudah lewat' }
        : { tone: 'demo', text: 'Terjadwal' };
    case 'checked_in':
      return { tone: 'ok', text: 'Check-in' };
    case 'completed':
      return { tone: 'ok', text: 'Selesai' };
    case 'cancelled':
      return { tone: 'none', text: 'Dibatalkan' };
    case 'no_show':
      return { tone: 'bad', text: 'Tidak datang' };
    case 'unrecorded':
      return { tone: 'warn', text: 'Tidak tercatat' };
  }
}

/** Bisa dibatalkan pelanggan: masih Terjadwal dan sebelum batas batal. */
export function canCancel(
  r: Pick<ReservationView, 'status' | 'startsAt'>,
  s: ReservationSettings,
  now: Date,
): boolean {
  if (r.status !== 'scheduled') return false;
  return now.getTime() < new Date(r.startsAt).getTime() - s.cancelCutoffMinutes * 60_000;
}
