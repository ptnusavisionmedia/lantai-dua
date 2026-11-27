const ZONE = 'Asia/Jakarta';

const dateParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const clockParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const longParts = new Intl.DateTimeFormat('id-ID', {
  timeZone: ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const shortDay = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'UTC',
  weekday: 'short',
  day: 'numeric',
});

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((p) => p.type === type)?.value ?? '';
}

/** Tanggal kalender WIB dari sebuah waktu, sebagai `YYYY-MM-DD`. */
export function wibDate(at: Date): string {
  const p = dateParts.formatToParts(at);
  return `${part(p, 'year')}-${part(p, 'month')}-${part(p, 'day')}`;
}

/** `YYYY-MM-DD` ditambah `n` hari (tanggal kalender, tanpa zona waktu). */
export function addDays(date: string, n: number): string {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Hari ini sampai `maxDaysAhead` hari ke depan, inklusif. */
export function dateWindow(today: string, maxDaysAhead: number): string[] {
  return Array.from({ length: maxDaysAhead + 1 }, (_, i) => addDays(today, i));
}

/** "Hari ini", "Besok", atau "Sab 29". */
export function dayLabel(date: string, today: string): string {
  if (date === today) return 'Hari ini';
  if (date === addDays(today, 1)) return 'Besok';
  const p = shortDay.formatToParts(new Date(`${date}T00:00:00Z`));
  return `${part(p, 'weekday')} ${part(p, 'day')}`;
}

/** Jam WIB sebuah waktu, sebagai "14.00". */
export function slotTime(iso: string): string {
  const p = clockParts.formatToParts(new Date(iso));
  return `${part(p, 'hour')}.${part(p, 'minute')}`;
}

/** "Sab, 28 Nov 2026 · 14.00–14.30 WIB" (PRD §13). */
export function formatSession(startsAt: string, endsAt: string): string {
  const p = longParts.formatToParts(new Date(startsAt));
  const day = `${part(p, 'weekday')}, ${part(p, 'day')} ${part(p, 'month')} ${part(p, 'year')}`;
  return `${day} · ${slotTime(startsAt)}–${slotTime(endsAt)} WIB`;
}

/** 30 → "30 menit", 60 → "1 jam", 90 → "1 jam 30 menit". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} menit`;
  return m === 0 ? `${h} jam` : `${h} jam ${m} menit`;
}
