import type { Metadata } from 'next';
import { ButtonLink } from '@/components/button';
import { DashboardTitle, EmptyState } from '@/components/dashboard-shell';
import { ReservationCard } from '@/components/reservation/reservation-card';
import { requireRole } from '@/lib/auth';
import { listMyReservations } from '@/lib/reservation-data';

export const metadata: Metadata = { title: 'Akun' };

export default async function AkunPage() {
  const me = await requireRole(['customer']);
  const firstName = me.fullName.split(' ')[0] || 'kamu';
  const now = new Date();
  const next = (await listMyReservations()).find(
    (r) => r.status === 'scheduled' && new Date(r.endsAt).getTime() > now.getTime(),
  );
  return (
    <>
      <DashboardTitle>Halo, {firstName}</DashboardTitle>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section aria-labelledby="kartu-reservasi" className="space-y-3">
          <h2 id="kartu-reservasi" className="font-display text-base font-semibold">
            Reservasi terdekat
          </h2>
          {next ? (
            <ReservationCard reservation={next} withQr now={now} />
          ) : (
            <div className="rounded-lg border border-border bg-surface p-5">
              <p className="text-ink-muted">Belum ada reservasi.</p>
              <ButtonLink href="/reservasi/baru" variant="demo" className="mt-4">
                Reservasi demo
              </ButtonLink>
            </div>
          )}
        </section>
        <EmptyState title="Pesanan">Belum ada pesanan.</EmptyState>
      </div>
    </>
  );
}
