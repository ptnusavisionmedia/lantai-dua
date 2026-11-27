import {
  formatSession,
  type ReservationView,
  reservationStatusLabel,
} from '@lantai-dua/shared/reservation';
import Link from 'next/link';
import { StatusLine } from '../catalog/status-line';
import { ReservationQr } from './reservation-qr';

function summary(r: ReservationView): string {
  const [first, ...rest] = r.items;
  if (!first) return 'Unit demo';
  return rest.length > 0 ? `${first.name} + ${rest.length} lainnya` : first.name;
}

/** Ringkasan satu reservasi dengan tautan ke detailnya; QR opsional untuk ringkasan Akun. */
export function ReservationCard({
  reservation: r,
  withQr = false,
  now,
}: {
  reservation: ReservationView;
  withQr?: boolean;
  now: Date;
}) {
  const label = reservationStatusLabel(r.status, r.endsAt, now);
  return (
    <article className="flex flex-wrap items-start gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="min-w-0 flex-1 space-y-1.5">
        <StatusLine tone={label.tone} text={label.text} />
        <p className="font-medium text-ink">{formatSession(r.startsAt, r.endsAt)}</p>
        <p className="text-sm [overflow-wrap:anywhere] text-ink-muted">{summary(r)}</p>
        <Link
          href={`/akun/reservasi/${r.code}`}
          className="inline-flex min-h-11 items-center font-mono text-sm text-primary underline-offset-4 hover:underline"
        >
          <span className="sr-only">Detail reservasi </span>
          {r.code}
        </Link>
      </div>
      {withQr && <ReservationQr code={r.code} size={120} />}
    </article>
  );
}
