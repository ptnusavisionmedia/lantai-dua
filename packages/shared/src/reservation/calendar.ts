export type CalendarEvent = {
  code: string;
  startsAt: string;
  endsAt: string;
  items: string[];
  address: string;
};

/** `20261128T070000Z`. */
function utcStamp(at: Date): string {
  return at
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function title(code: string): string {
  return `Sesi demo LANTAI DUA (${code})`;
}

function details(e: CalendarEvent): string {
  return ['Yang disiapkan:', ...e.items.map((i) => `- ${i}`), `Kode: ${e.code}`].join('\n');
}

/** Berkas iCalendar (RFC 5545) satu acara, waktu dalam UTC, baris dipisah CRLF. */
export function buildIcs(e: CalendarEvent, now: Date): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LANTAI DUA//Reservasi demo//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.code}@lantaidua`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(new Date(e.startsAt))}`,
    `DTEND:${utcStamp(new Date(e.endsAt))}`,
    `SUMMARY:${escapeText(title(e.code))}`,
    `LOCATION:${escapeText(e.address)}`,
    `DESCRIPTION:${escapeText(details(e))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.join('\r\n')}\r\n`;
}

/** Tautan "tambah acara" Google Calendar dengan waktu yang sama. */
export function googleCalendarUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title(e.code),
    dates: `${utcStamp(new Date(e.startsAt))}/${utcStamp(new Date(e.endsAt))}`,
    details: details(e),
    location: e.address,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
