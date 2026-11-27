import { isReservationCode } from './code';
import { formatDuration, slotTime, wibDate } from './time';
import type {
  LiveState,
  ReservationSettings,
  ReservationStatus,
  ReservationView,
  StaffAction,
} from './types';

/** Status tujuan dan label tombol setiap aksi staf. `minor` = tombol kecil (urungkan). */
export const STAFF_ACTION: Record<
  StaffAction,
  { to: ReservationStatus; label: string; minor: boolean }
> = {
  check_in: { to: 'checked_in', label: 'Check-in', minor: false },
  complete: { to: 'completed', label: 'Selesai', minor: false },
  no_show: { to: 'no_show', label: 'Tidak datang', minor: false },
  cancel: { to: 'cancelled', label: 'Batalkan', minor: false },
  attended: { to: 'completed', label: 'Datang', minor: false },
  undo_check_in: { to: 'scheduled', label: 'Urungkan check-in', minor: true },
  undo_complete: { to: 'checked_in', label: 'Urungkan selesai', minor: true },
};

const MINUTE = 60_000;

/**
 * Tombol yang berlaku untuk staf saat ini. Aturannya sama dengan `staff_set_reservation_status`
 * (desain 1C-2 §5.4); database tetap yang memutuskan. Urutan: aksi utama, batalkan, lalu urungkan.
 */
export function staffActions(
  r: Pick<ReservationView, 'status' | 'startsAt' | 'endsAt'>,
  s: ReservationSettings,
  now: Date,
): StaffAction[] {
  const t = now.getTime();
  const start = Date.parse(r.startsAt);
  const end = Date.parse(r.endsAt);
  const running = t < end;
  const sameDay = wibDate(new Date(r.startsAt)) === wibDate(now);
  const out: StaffAction[] = [];
  switch (r.status) {
    case 'scheduled':
      if (sameDay && running && t >= start - s.checkinOpenMinutes * MINUTE) out.push('check_in');
      if (t >= start + s.noShowAfterMinutes * MINUTE) out.push('no_show');
      if (running) out.push('cancel');
      break;
    case 'checked_in':
      out.push('complete');
      if (running) out.push('cancel', 'undo_check_in');
      break;
    case 'completed':
      if (sameDay) out.push('undo_complete');
      break;
    case 'no_show':
      if (running) out.push('check_in');
      break;
    case 'unrecorded':
      out.push('attended', 'no_show', 'cancel');
      break;
    case 'cancelled':
      break;
  }
  return out;
}

export const CODE_INVALID = 'Kode tidak dikenali. Contoh: L2D-H7K3QX9P';

/**
 * Kode yang diketik atau hasil scan menjadi bentuk baku `L2D-XXXXXXXX`, atau null.
 * Huruf kecil, spasi, tanda hubung, dan awalan `L2D` boleh ada atau tidak.
 */
export function normalizeReservationCode(input: string): string | null {
  const compact = input.toUpperCase().replace(/[\s-]/g, '');
  const rest = compact.startsWith('L2D') ? compact.slice(3) : compact;
  const code = `L2D-${rest}`;
  return isReservationCode(code) ? code : null;
}

export const CANCEL_REASON = { min: 3, max: 200 } as const;

/** Alasan batal yang sudah dipangkas, atau null kalau panjangnya di luar 3–200 karakter. */
export function cleanCancelReason(input: string): string | null {
  const reason = input.trim();
  return reason.length >= CANCEL_REASON.min && reason.length <= CANCEL_REASON.max ? reason : null;
}

/** Pesan galat aksi staf, dari kode galat `staff_set_reservation_status`. */
export function staffErrorText(code: string, s: ReservationSettings): string {
  switch (code) {
    case 'invalid_transition':
      return 'Status reservasi ini baru saja berubah. Data sudah dimuat ulang.';
    case 'checkin_too_early':
      return `Check-in baru bisa mulai ${formatDuration(s.checkinOpenMinutes)} sebelum sesi.`;
    case 'no_show_too_early':
      return `Tidak datang baru bisa ditandai ${formatDuration(s.noShowAfterMinutes)} setelah sesi mulai.`;
    case 'session_over':
      return 'Sesi ini sudah berakhir.';
    case 'reason_required':
      return `Tulis alasan pembatalan (${CANCEL_REASON.min}–${CANCEL_REASON.max} karakter).`;
    case 'slot_conflict':
      return 'Unit atau meja untuk sesi ini sudah terpakai.';
    case 'not_staff':
      return 'Aksi ini hanya untuk staf toko.';
    case 'not_found':
      return 'Kode reservasi tidak ditemukan.';
    default:
      return 'Gagal menyimpan. Coba lagi sebentar.';
  }
}

/** Kelompok linimasa per jam mulai WIB ("14.00"), urut menurut waktu. */
export function groupByHour<T extends { startsAt: string }>(
  list: T[],
): { hour: string; items: T[] }[] {
  const sorted = [...list].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const groups: { hour: string; items: T[] }[] = [];
  for (const item of sorted) {
    const hour = `${slotTime(item.startsAt).slice(0, 2)}.00`;
    const last = groups.at(-1);
    if (last?.hour === hour) last.items.push(item);
    else groups.push({ hour, items: [item] });
  }
  return groups;
}

/** Jumlah reservasi per status, termasuk status yang jumlahnya nol. */
export function statusCounts(
  list: { status: ReservationStatus }[],
): Record<ReservationStatus, number> {
  const counts: Record<ReservationStatus, number> = {
    scheduled: 0,
    checked_in: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
    unrecorded: 0,
  };
  for (const r of list) counts[r.status] += 1;
  return counts;
}

/** Reservasi yang dibuat kurang dari 15 menit lalu mendapat label "Baru". */
export function isRecent(createdAt: string, now: Date): boolean {
  return now.getTime() - Date.parse(createdAt) < 15 * MINUTE;
}

const OFFLINE_AFTER_MS = 20_000;

/**
 * Keadaan penanda koneksi dari status channel Supabase Realtime dan lamanya belum tersambung.
 * Supabase mencoba menyambung ulang sendiri, jadi galat sesaat tampil sebagai "Menyambung ulang…".
 */
export function liveState(channelStatus: string, notLiveForMs: number): LiveState {
  if (channelStatus === 'SUBSCRIBED') return 'live';
  if (channelStatus === 'CLOSED') return 'offline';
  return notLiveForMs >= OFFLINE_AFTER_MS ? 'offline' : 'reconnecting';
}

export const LIVE_TEXT: Record<LiveState, string> = {
  live: 'Langsung',
  reconnecting: 'Menyambung ulang…',
  offline: 'Terputus',
};
