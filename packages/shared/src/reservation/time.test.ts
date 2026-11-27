import { describe, expect, it } from 'vitest';
import {
  addDays,
  dateWindow,
  dayLabel,
  formatDuration,
  formatSession,
  slotTime,
  wibDate,
} from './time';

// 28 Nov 2026 pukul 00.30 WIB; di UTC masih tanggal 27.
const now = new Date('2026-11-27T17:30:00Z');

describe('waktu WIB', () => {
  it('uses the WIB calendar date', () => {
    expect(wibDate(now)).toBe('2026-11-28');
    expect(wibDate(new Date('2026-11-27T16:59:00Z'))).toBe('2026-11-27');
  });

  it('adds days across months', () => {
    expect(addDays('2026-11-28', 3)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('builds the date window inclusively', () => {
    const w = dateWindow('2026-11-28', 14);
    expect(w).toHaveLength(15);
    expect(w[0]).toBe('2026-11-28');
    expect(w.at(-1)).toBe('2026-12-12');
  });

  it('labels days relative to today', () => {
    expect(
      ['2026-11-28', '2026-11-29', '2026-11-30', '2026-12-05'].map((d) =>
        dayLabel(d, '2026-11-28'),
      ),
    ).toEqual(['Hari ini', 'Besok', 'Sen 30', 'Sab 5']);
  });

  it('reads slot times in WIB', () => {
    expect(slotTime('2026-11-28T07:00:00Z')).toBe('14.00');
    expect(slotTime('2026-11-28T03:30:00+00:00')).toBe('10.30');
    expect(slotTime('2026-11-27T17:00:00Z')).toBe('00.00');
  });

  it('formats a session in WIB', () => {
    expect(formatSession('2026-11-28T07:00:00Z', '2026-11-28T07:30:00Z')).toBe(
      'Sab, 28 Nov 2026 · 14.00–14.30 WIB',
    );
    expect(formatSession('2026-12-31T16:30:00Z', '2026-12-31T17:00:00Z')).toBe(
      'Kam, 31 Des 2026 · 23.30–00.00 WIB',
    );
  });

  it.each([
    [30, '30 menit'],
    [60, '1 jam'],
    [90, '1 jam 30 menit'],
    [120, '2 jam'],
  ])('formats %i minutes', (m, text) => {
    expect(formatDuration(m)).toBe(text);
  });
});
