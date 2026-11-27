import { isLive } from '@lantai-dua/shared/reservation';
import type { Metadata } from 'next';
import { ButtonLink } from '@/components/button';
import { DashboardTitle } from '@/components/dashboard-shell';
import { ReservationCard } from '@/components/reservation/reservation-card';
import { listMyReservations } from '@/lib/reservation-data';

export const metadata: Metadata = { title: 'Reservasi saya' };

export default async function ReservasiSayaPage() {
  const now = new Date();
  const all = await listMyReservations();
  // Mendatang: Terjadwal atau Check-in yang sesinya belum berakhir.
  const isUpcoming = (r: (typeof all)[number]) => isLive(r, now);
  const upcoming = all.filter(isUpcoming);
  const history = all.filter((r) => !isUpcoming(r)).reverse();

  return (
    <>
      <DashboardTitle>Reservasi saya</DashboardTitle>
      {all.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border bg-surface p-6">
          <p className="text-ink-muted">Belum ada reservasi.</p>
          <ButtonLink href="/reservasi/baru" variant="demo" className="mt-4">
            Reservasi demo
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          <section aria-labelledby="mendatang">
            <h2 id="mendatang" className="font-display text-lg font-semibold">
              Mendatang
            </h2>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-ink-muted">Tidak ada reservasi mendatang.</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {upcoming.map((r) => (
                  <li key={r.id}>
                    <ReservationCard reservation={r} now={now} />
                  </li>
                ))}
              </ul>
            )}
            <ButtonLink href="/reservasi/baru" variant="demo" className="mt-4">
              Reservasi demo
            </ButtonLink>
          </section>
          {history.length > 0 && (
            <section aria-labelledby="riwayat">
              <h2 id="riwayat" className="font-display text-lg font-semibold">
                Riwayat
              </h2>
              <ul className="mt-3 grid gap-3">
                {history.map((r) => (
                  <li key={r.id}>
                    <ReservationCard reservation={r} now={now} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}
