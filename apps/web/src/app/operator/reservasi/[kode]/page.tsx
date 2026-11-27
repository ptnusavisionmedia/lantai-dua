import {
  formatMoment,
  formatSession,
  reservationStatusLabel,
} from '@lantai-dua/shared/reservation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusLine } from '@/components/catalog/status-line';
import { CustomerContact, PrepList } from '@/components/operator/reservation-row';
import { StaffActions } from '@/components/operator/staff-actions';
import { getOperatorReservation } from '@/lib/operator-data';
import { getStoreInfo } from '@/lib/reservation-data';

type Props = { params: Promise<{ kode: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await getOperatorReservation((await params).kode);
  return { title: r ? `Reservasi ${r.code}` : 'Kode reservasi tidak ditemukan' };
}

const LINK = 'inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline';

/** Detail reservasi untuk operator (desain 1C-2 §5.3). */
export default async function OperatorReservationPage({ params }: Props) {
  const [r, info] = await Promise.all([
    getOperatorReservation((await params).kode),
    getStoreInfo(),
  ]);
  if (!r) notFound();
  const nowIso = new Date().toISOString();
  const label = reservationStatusLabel(r.status, r.endsAt, new Date(nowIso));

  return (
    <article className="space-y-8">
      <div>
        <Link href="/operator" className={`${LINK} text-sm`}>
          ← Hari ini
        </Link>
        <h1 className="font-display mt-2 text-2xl font-bold">Detail reservasi</h1>
      </div>

      <div className="space-y-2">
        <p className="font-mono text-2xl font-semibold tracking-wider text-ink">{r.code}</p>
        <StatusLine tone={label.tone} text={label.text} />
        {r.status === 'cancelled' && (
          <p className="text-sm [overflow-wrap:anywhere] text-ink-muted">
            {r.cancelReason ? `Alasan batal dari toko: ${r.cancelReason}` : 'Dibatalkan pelanggan'}
          </p>
        )}
      </div>

      <dl className="grid max-w-[640px] gap-4 text-sm">
        <div>
          <dt className="text-ink-muted">Jadwal</dt>
          <dd className="mt-0.5 text-base text-ink">{formatSession(r.startsAt, r.endsAt)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Pelanggan</dt>
          <dd className="mt-0.5 text-base">
            <CustomerContact r={r} />
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Yang disiapkan</dt>
          <dd className="mt-1">
            <PrepList r={r} />
          </dd>
        </div>
        {r.note && (
          <div>
            <dt className="text-ink-muted">Catatan pelanggan</dt>
            <dd className="mt-0.5 text-base [overflow-wrap:anywhere] text-ink">{r.note}</dd>
          </div>
        )}
        <div>
          <dt className="text-ink-muted">Dibuat</dt>
          <dd className="mt-0.5 text-base text-ink">{formatMoment(r.createdAt)}</dd>
        </div>
      </dl>

      <StaffActions
        code={r.code}
        status={r.status}
        startsAt={r.startsAt}
        endsAt={r.endsAt}
        settings={info}
        nowIso={nowIso}
        place="detail"
      />
    </article>
  );
}
