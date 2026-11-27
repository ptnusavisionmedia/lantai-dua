import {
  canCancel,
  formatSession,
  googleCalendarUrl,
  reservationStatusLabel,
} from '@lantai-dua/shared/reservation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusLine } from '@/components/catalog/status-line';
import { Notice } from '@/components/notice';
import { CancelReservation } from '@/components/reservation/cancel-reservation';
import { ReservationQr } from '@/components/reservation/reservation-qr';
import { getMyReservation, getStoreInfo } from '@/lib/reservation-data';

type Props = {
  params: Promise<{ kode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await getMyReservation((await params).kode);
  return { title: r ? `Reservasi ${r.code}` : 'Halaman tidak ditemukan' };
}

const LINK = 'inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline';

export default async function ReservasiDetailPage({ params, searchParams }: Props) {
  const [reservation, info] = await Promise.all([
    getMyReservation((await params).kode),
    getStoreInfo(),
  ]);
  if (!reservation) notFound();
  const r = reservation;
  const now = new Date();
  const label = reservationStatusLabel(r.status, r.endsAt, now);
  const active = r.status === 'scheduled' || r.status === 'checked_in';
  const upcoming = r.status === 'scheduled' && new Date(r.endsAt).getTime() > now.getTime();
  const isNew = (await searchParams).baru === '1' && r.status === 'scheduled';
  const event = {
    code: r.code,
    startsAt: r.startsAt,
    endsAt: r.endsAt,
    items: r.items.map((i) => i.name),
    address: info.address,
  };

  return (
    <article className="space-y-8">
      <div>
        <Link href="/akun/reservasi" className={`${LINK} text-sm`}>
          ← Reservasi saya
        </Link>
        <h1 className="font-display mt-2 text-2xl font-bold">Detail reservasi</h1>
      </div>

      {isNew && <Notice tone="success">Reservasi berhasil dibuat.</Notice>}

      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 space-y-5">
          <div className="space-y-2">
            <p className="font-mono text-2xl font-semibold tracking-wider text-ink">{r.code}</p>
            <StatusLine tone={label.tone} text={label.text} />
          </div>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-ink-muted">Jadwal</dt>
              <dd className="mt-0.5 text-base text-ink">{formatSession(r.startsAt, r.endsAt)}</dd>
            </div>
            {r.areaName && (
              <div>
                <dt className="text-ink-muted">Area</dt>
                <dd className="mt-0.5 text-base text-ink">{r.areaName}</dd>
              </div>
            )}
            <div>
              <dt className="text-ink-muted">Yang disiapkan</dt>
              <dd className="mt-1">
                <ul className="grid gap-1 text-base text-ink">
                  {r.items.map((i) => (
                    <li key={`${i.name}-${i.unitCode}`} className="[overflow-wrap:anywhere]">
                      {i.unitCode ? `${i.name} · ${i.unitCode}` : i.name}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            {r.note && (
              <div>
                <dt className="text-ink-muted">Catatan</dt>
                <dd className="mt-0.5 text-base [overflow-wrap:anywhere] text-ink">{r.note}</dd>
              </div>
            )}
          </dl>
        </div>
        {active && (
          <div className="justify-self-start">
            <ReservationQr code={r.code} />
          </div>
        )}
      </div>

      {upcoming && (
        <div className="flex flex-wrap gap-x-6">
          <a href={`/akun/reservasi/${r.code}/kalender`} className={LINK}>
            Unduh ke kalender (.ics)
          </a>
          <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" className={LINK}>
            Tambah ke Google Calendar
          </a>
        </div>
      )}

      {upcoming &&
        (canCancel(r, info, now) ? (
          <CancelReservation code={r.code} />
        ) : (
          <p className="text-sm text-ink-muted">
            Batas batal sudah lewat. Hubungi toko lewat WhatsApp.
          </p>
        ))}

      <section aria-labelledby="lokasi" className="border-t border-border pt-6 text-sm">
        <h2 id="lokasi" className="font-display text-base font-semibold">
          Lokasi
        </h2>
        <p className="mt-2 text-base text-ink">{info.address}</p>
        <div className="mt-1 flex flex-wrap gap-x-6">
          {info.mapsUrl && (
            <a href={info.mapsUrl} target="_blank" rel="noreferrer" className={LINK}>
              Buka peta
            </a>
          )}
          {info.whatsapp && (
            <a
              href={`https://wa.me/${info.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className={LINK}
            >
              Chat toko di WhatsApp
            </a>
          )}
        </div>
      </section>
    </article>
  );
}
