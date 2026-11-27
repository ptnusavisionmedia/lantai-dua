import { describe, expect, it } from 'vitest';
import {
  CODE_INVALID,
  cleanCancelReason,
  groupByHour,
  isRecent,
  LIVE_TEXT,
  liveState,
  normalizeReservationCode,
  STAFF_ACTION,
  staffActions,
  staffErrorText,
  statusCounts,
} from './staff';
import { SETTINGS } from './testing';
import type { ReservationStatus } from './types';

/** Jam WIB pada Sab 28 Nov 2026, misalnya at('13.01'). */
const at = (time: string, day = '2026-11-28') =>
  new Date(`${day}T${time.replace('.', ':')}:00+07:00`);
// Sesi Sab 28 Nov 2026 14.00–14.30 WIB.
const r = (status: ReservationStatus) => ({
  status,
  startsAt: '2026-11-28T07:00:00Z',
  endsAt: '2026-11-28T07:30:00Z',
});

describe('staffActions', () => {
  it.each([
    ['scheduled', '12.59', ['cancel']],
    ['scheduled', '13.01', ['check_in', 'cancel']],
    ['scheduled', '14.16', ['check_in', 'no_show', 'cancel']],
    ['scheduled', '14.31', ['no_show']],
    ['checked_in', '14.10', ['complete', 'cancel', 'undo_check_in']],
    ['checked_in', '14.31', ['complete']],
    ['completed', '20.00', ['undo_complete']],
    ['no_show', '14.20', ['check_in']],
    ['no_show', '14.31', []],
    ['unrecorded', '20.00', ['attended', 'no_show', 'cancel']],
    ['cancelled', '14.10', []],
  ] as const)('%s at %s offers %j', (status, time, expected) => {
    expect(staffActions(r(status), SETTINGS, at(time))).toEqual(expected);
  });

  it('treats the window edges like the database', () => {
    expect(staffActions(r('scheduled'), SETTINGS, at('13.00'))).toContain('check_in');
    expect(staffActions(r('scheduled'), SETTINGS, at('14.15'))).toContain('no_show');
    expect(staffActions(r('scheduled'), SETTINGS, at('14.30'))).toEqual(['no_show']);
  });

  it('offers no undo for a completed session the next day', () => {
    expect(staffActions(r('completed'), SETTINGS, at('10.00', '2026-11-29'))).toEqual([]);
  });

  it('does not open check-in for tomorrow even within the hour', () => {
    const tomorrow = {
      status: 'scheduled' as const,
      startsAt: '2026-11-28T17:30:00Z', // 29 Nov 00.30 WIB
      endsAt: '2026-11-28T18:00:00Z',
    };
    expect(staffActions(tomorrow, SETTINGS, at('23.45'))).toEqual(['cancel']);
  });

  it('reads the windows from settings', () => {
    const s = { ...SETTINGS, checkinOpenMinutes: 30, noShowAfterMinutes: 5 };
    expect(staffActions(r('scheduled'), s, at('13.20'))).toEqual(['cancel']);
    expect(staffActions(r('scheduled'), s, at('14.06'))).toEqual(['check_in', 'no_show', 'cancel']);
  });

  it('labels every action and marks only the undo ones as minor', () => {
    expect(STAFF_ACTION.check_in).toEqual({ to: 'checked_in', label: 'Check-in', minor: false });
    expect(STAFF_ACTION.complete).toEqual({ to: 'completed', label: 'Selesai', minor: false });
    expect(STAFF_ACTION.no_show).toEqual({ to: 'no_show', label: 'Tidak datang', minor: false });
    expect(STAFF_ACTION.cancel).toEqual({ to: 'cancelled', label: 'Batalkan', minor: false });
    expect(STAFF_ACTION.attended).toEqual({ to: 'completed', label: 'Datang', minor: false });
    expect(STAFF_ACTION.undo_check_in).toEqual({
      to: 'scheduled',
      label: 'Urungkan check-in',
      minor: true,
    });
    expect(STAFF_ACTION.undo_complete).toEqual({
      to: 'checked_in',
      label: 'Urungkan selesai',
      minor: true,
    });
  });
});

describe('normalizeReservationCode', () => {
  it.each([['l2d-f6w859e4'], ['F6W859E4'], ['L2D F6W8 59E4'], [' l2df6w859e4 ']])(
    'normalizes %j',
    (input) => {
      expect(normalizeReservationCode(input)).toBe('L2D-F6W859E4');
    },
  );

  it.each([['L2D-F6W859E'], ['L2D-F6W859E0'], ['hello'], ['']])('rejects %j', (input) => {
    expect(normalizeReservationCode(input)).toBeNull();
  });

  it('explains a bad code with an example', () => {
    expect(CODE_INVALID).toBe('Kode tidak dikenali. Contoh: L2D-H7K3QX9P');
  });
});

describe('cleanCancelReason', () => {
  it('trims and limits a cancel reason to 3–200 characters', () => {
    expect(cleanCancelReason('  ab ')).toBeNull();
    expect(cleanCancelReason(' Unit rusak ')).toBe('Unit rusak');
    expect(cleanCancelReason('x'.repeat(200))).toBe('x'.repeat(200));
    expect(cleanCancelReason('x'.repeat(201))).toBeNull();
  });
});

describe('staffErrorText', () => {
  it.each([
    ['invalid_transition', 'Status reservasi ini baru saja berubah. Data sudah dimuat ulang.'],
    ['checkin_too_early', 'Check-in baru bisa mulai 1 jam sebelum sesi.'],
    ['no_show_too_early', 'Tidak datang baru bisa ditandai 15 menit setelah sesi mulai.'],
    ['session_over', 'Sesi ini sudah berakhir.'],
    ['reason_required', 'Tulis alasan pembatalan (3–200 karakter).'],
    ['slot_conflict', 'Unit atau meja untuk sesi ini sudah terpakai.'],
    ['not_staff', 'Aksi ini hanya untuk staf toko.'],
    ['not_found', 'Kode reservasi tidak ditemukan.'],
    ['apa-ini', 'Gagal menyimpan. Coba lagi sebentar.'],
  ])('words %s', (code, text) => {
    expect(staffErrorText(code, SETTINGS)).toBe(text);
  });

  it('uses the stored windows', () => {
    const s = { ...SETTINGS, checkinOpenMinutes: 30, noShowAfterMinutes: 10 };
    expect(staffErrorText('checkin_too_early', s)).toBe(
      'Check-in baru bisa mulai 30 menit sebelum sesi.',
    );
    expect(staffErrorText('no_show_too_early', s)).toBe(
      'Tidak datang baru bisa ditandai 10 menit setelah sesi mulai.',
    );
  });
});

describe('linimasa', () => {
  it('groups by WIB hour in time order', () => {
    const list = [
      { id: 'c', startsAt: '2026-11-28T09:00:00Z' }, // 16.00 WIB
      { id: 'b', startsAt: '2026-11-28T07:30:00Z' }, // 14.30 WIB
      { id: 'a', startsAt: '2026-11-28T07:00:00Z' }, // 14.00 WIB
    ];
    expect(groupByHour(list)).toEqual([
      { hour: '14.00', items: [list[2], list[1]] },
      { hour: '16.00', items: [list[0]] },
    ]);
  });

  it('counts every status, zero included', () => {
    expect(
      statusCounts([{ status: 'scheduled' }, { status: 'scheduled' }, { status: 'no_show' }]),
    ).toEqual({
      scheduled: 2,
      checked_in: 0,
      completed: 0,
      cancelled: 0,
      no_show: 1,
      unrecorded: 0,
    });
  });

  it('marks reservations made in the last 15 minutes as new', () => {
    const now = at('14.00');
    expect(isRecent(at('13.46').toISOString(), now)).toBe(true);
    expect(isRecent(at('13.44').toISOString(), now)).toBe(false);
  });
});

describe('liveState', () => {
  it.each([
    ['SUBSCRIBED', 0, 'live'],
    ['CHANNEL_ERROR', 5_000, 'reconnecting'],
    ['TIMED_OUT', 19_999, 'reconnecting'],
    ['CHANNEL_ERROR', 20_000, 'offline'],
    ['CLOSED', 0, 'offline'],
  ] as const)('maps %s after %d ms to %s', (status, ms, expected) => {
    expect(liveState(status, ms)).toBe(expected);
  });

  it('words each state', () => {
    expect(LIVE_TEXT).toEqual({
      live: 'Langsung',
      reconnecting: 'Menyambung ulang…',
      offline: 'Terputus',
    });
  });
});
