import {
  formatSession,
  isRecent,
  type OperatorReservation,
  type ReservationSettings,
  reservationStatusLabel,
  slotTime,
} from '@lantai-dua/shared/reservation';
import { formatWhatsapp, whatsappLink } from '@lantai-dua/shared/whatsapp';
import Link from 'next/link';
import { StatusLine } from '../catalog/status-line';
import { StaffActions } from './staff-actions';

const LINK = 'inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline';

/** Kontak pelanggan (O7): nama dan tautan WhatsApp, atau keterangan kalau nomornya belum ada. */
export function CustomerContact({ r }: { r: OperatorReservation }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-ink">
      <span className="font-semibold">{r.customerName}</span>
      <span aria-hidden="true" className="text-ink-muted">
        ·
      </span>
      {r.whatsapp ? (
        <a href={whatsappLink(r.whatsapp)} target="_blank" rel="noreferrer" className={LINK}>
          {formatWhatsapp(r.whatsapp)}
        </a>
      ) : (
        <span className="text-ink-muted">Belum ada nomor WhatsApp</span>
      )}
    </p>
  );
}

/** Daftar unit yang harus disiapkan, beserta catatan kebersihan kategorinya (R14). */
export function PrepList({ r }: { r: OperatorReservation }) {
  return (
    <div className="space-y-1">
      <ul className="grid gap-0.5 text-[15px] text-ink">
        {r.items.map((i) => (
          <li key={`${i.name}-${i.unitCode}`} className="[overflow-wrap:anywhere]">
            {i.name}
            {i.unitCode && <span className="font-mono text-sm"> ({i.unitCode})</span>}
            {i.areaName && <span className="text-ink-muted"> · {i.areaName}</span>}
          </li>
        ))}
      </ul>
      {r.hygieneNotes.map((n) => (
        <p key={n} className="text-sm text-warning">
          <span className="font-semibold">Kebersihan:</span> {n}
        </p>
      ))}
    </div>
  );
}

/**
 * Satu reservasi di linimasa Hari ini atau di daftar Perlu dikoreksi (desain 1C-2 §5.1).
 * Reservasi yang dibatalkan diredupkan tanpa tombol.
 */
export function ReservationRow({
  r,
  settings,
  nowIso,
  variant,
}: {
  r: OperatorReservation;
  settings: ReservationSettings;
  nowIso: string;
  variant: 'timeline' | 'correction';
}) {
  const now = new Date(nowIso);
  const label = reservationStatusLabel(r.status, r.endsAt, now);
  const cancelled = r.status === 'cancelled';
  const when =
    variant === 'correction'
      ? formatSession(r.startsAt, r.endsAt)
      : `${slotTime(r.startsAt)}–${slotTime(r.endsAt)}`;

  return (
    <article
      className={`space-y-3 rounded-lg border border-border bg-surface p-4 ${cancelled ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[15px] font-semibold text-ink">{when}</p>
        <div className="flex flex-wrap items-center gap-2">
          {!cancelled && isRecent(r.createdAt, now) && (
            <span className="rounded-sm bg-primary-soft px-2 text-[13px] leading-6 font-medium text-primary">
              Baru
            </span>
          )}
          <StatusLine tone={label.tone} text={label.text} />
        </div>
      </div>
      <CustomerContact r={r} />
      <PrepList r={r} />
      {r.note && (
        <p className="text-sm [overflow-wrap:anywhere] text-ink">
          <span className="text-ink-muted">Catatan pelanggan:</span> “{r.note}”
        </p>
      )}
      {!cancelled && (
        <StaffActions
          code={r.code}
          status={r.status}
          startsAt={r.startsAt}
          endsAt={r.endsAt}
          settings={settings}
          nowIso={nowIso}
          place="row"
        />
      )}
      <Link href={`/operator/reservasi/${r.code}`} className={`${LINK} font-mono text-sm`}>
        <span className="sr-only">Detail reservasi </span>
        {r.code}
      </Link>
    </article>
  );
}
