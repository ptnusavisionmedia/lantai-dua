import { describe, expect, it } from 'vitest';
import { buildIcs, googleCalendarUrl } from './calendar';

const r = {
  code: 'L2D-H7K3QX9P',
  startsAt: '2026-11-28T07:00:00Z',
  endsAt: '2026-11-28T07:30:00Z',
  items: ['VortexSeries Ignix F1 · Putih', 'Razer Viper; edisi, khusus'],
  address: 'Jl. Contoh Raya No. 2, Surabaya',
};
const now = new Date('2026-11-27T10:00:00Z');

describe('buildIcs', () => {
  const ics = buildIcs(r, now);

  it('writes a calendar event in UTC with CRLF lines', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('DTSTART:20261128T070000Z\r\n');
    expect(ics).toContain('DTEND:20261128T073000Z\r\n');
    expect(ics).toContain('DTSTAMP:20261127T100000Z\r\n');
    expect(ics).toContain('UID:L2D-H7K3QX9P@lantaidua\r\n');
    expect(ics).toContain('SUMMARY:Sesi demo LANTAI DUA (L2D-H7K3QX9P)\r\n');
  });

  it('escapes commas, semicolons and new lines', () => {
    expect(ics).toContain('LOCATION:Jl. Contoh Raya No. 2\\, Surabaya\r\n');
    expect(ics).toContain('Razer Viper\\; edisi\\, khusus');
    expect(ics).toMatch(/DESCRIPTION:[^\r\n]*\\n/);
  });
});

describe('googleCalendarUrl', () => {
  it('links to Google Calendar with the same times', () => {
    const url = googleCalendarUrl(r);
    expect(url.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE&')).toBe(
      true,
    );
    expect(url).toContain('dates=20261128T070000Z%2F20261128T073000Z');
    expect(new URL(url).searchParams.get('location')).toBe(r.address);
    expect(new URL(url).searchParams.get('text')).toBe('Sesi demo LANTAI DUA (L2D-H7K3QX9P)');
  });
});
