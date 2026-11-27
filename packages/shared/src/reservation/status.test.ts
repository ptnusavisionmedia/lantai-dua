import { describe, expect, it } from 'vitest';
import { isReservationCode } from './code';
import { canCancel, isLive, reservationStatusLabel } from './status';
import { SETTINGS } from './testing';

const now = new Date('2026-11-28T05:00:00Z');
const future = '2026-11-28T07:00:00Z';
const past = '2026-11-28T04:00:00Z';

describe('reservationStatusLabel', () => {
  it.each([
    ['scheduled', future, 'demo', 'Terjadwal'],
    ['scheduled', past, 'none', 'Sudah lewat'],
    ['checked_in', future, 'ok', 'Check-in'],
    ['completed', past, 'ok', 'Selesai'],
    ['cancelled', future, 'none', 'Dibatalkan'],
    ['no_show', past, 'bad', 'Tidak datang'],
    ['unrecorded', past, 'warn', 'Tidak tercatat'],
  ] as const)('%s ending %s', (status, endsAt, tone, text) => {
    expect(reservationStatusLabel(status, endsAt, now)).toEqual({ tone, text });
  });

  it('calls a cancellation with a reason "Dibatalkan toko"', () => {
    expect(reservationStatusLabel('cancelled', future, now, 'Unit rusak')).toEqual({
      tone: 'none',
      text: 'Dibatalkan toko',
    });
    expect(reservationStatusLabel('cancelled', future, now, null).text).toBe('Dibatalkan');
  });
});

describe('isLive', () => {
  it.each([
    ['scheduled', future, true],
    ['checked_in', future, true],
    ['scheduled', past, false],
    ['checked_in', past, false],
    ['completed', future, false],
    ['cancelled', future, false],
    ['no_show', future, false],
    ['unrecorded', future, false],
  ] as const)('%s ending %s → %s', (status, endsAt, live) => {
    expect(isLive({ status, endsAt }, now)).toBe(live);
  });
});

describe('canCancel', () => {
  const at = (minutes: number) => new Date(now.getTime() + minutes * 60_000).toISOString();
  it('allows a scheduled reservation before the cut-off', () => {
    expect(canCancel({ status: 'scheduled', startsAt: at(61) }, SETTINGS, now)).toBe(true);
  });
  it('refuses exactly at the cut-off and after it', () => {
    expect(canCancel({ status: 'scheduled', startsAt: at(60) }, SETTINGS, now)).toBe(false);
    expect(canCancel({ status: 'scheduled', startsAt: at(10) }, SETTINGS, now)).toBe(false);
  });
  it('refuses anything not scheduled', () => {
    expect(canCancel({ status: 'cancelled', startsAt: at(600) }, SETTINGS, now)).toBe(false);
  });
});

describe('isReservationCode', () => {
  it.each([
    ['L2D-H7K3QX9P', true],
    ['L2D-H7K3QX9', false],
    ['L2D-H7K3QX0P', false],
    ['L2D-H7K3QXIP', false],
    ['l2d-h7k3qx9p', false],
    ['L2D-H7K3QX9P ', false],
  ])('%s → %s', (code, ok) => {
    expect(isReservationCode(code)).toBe(ok);
  });
});
