import {
  formatDay,
  groupByHour,
  slotTime,
  statusCounts,
  wibDate,
} from '@lantai-dua/shared/reservation';
import type { Metadata } from 'next';
import { DashboardTitle } from '@/components/dashboard-shell';
import { CodeSearch } from '@/components/operator/code-search';
import { ReservationRow } from '@/components/operator/reservation-row';
import { getOpeningToday, listTodayForOperator, listUnrecorded } from '@/lib/operator-data';
import { getStoreInfo } from '@/lib/reservation-data';

export const metadata: Metadata = { title: 'Hari ini' };

/** Hari ini untuk operator (desain 1C-2 §5.1): koreksi, ringkasan, dan linimasa per jam. */
export default async function OperatorPage() {
  const now = new Date();
  const nowIso = now.toISOString();
  const today = wibDate(now);
  const [info, hours, list, unrecorded] = await Promise.all([
    getStoreInfo(),
    getOpeningToday(today),
    listTodayForOperator(today),
    listUnrecorded(today),
  ]);
  const counts = statusCounts(list);
  const groups = groupByHour(list);
  const currentHour = `${slotTime(nowIso).slice(0, 2)}.00`;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <DashboardTitle>Hari ini</DashboardTitle>
        <p className="text-ink-muted">
          {formatDay(nowIso)} ·{' '}
          {hours ? `buka ${hours.opens}–${hours.closes}` : 'Toko tutup hari ini'}
        </p>
      </div>

      <CodeSearch />

      {unrecorded.length > 0 && (
        <section aria-labelledby="koreksi" className="space-y-3">
          <div>
            <h2 id="koreksi" className="font-display text-lg font-semibold text-warning">
              Perlu dikoreksi ({unrecorded.length})
            </h2>
            <p className="text-sm text-ink-muted">
              Reservasi yang belum dicatat. Pilih Datang atau Tidak datang.
            </p>
          </div>
          <div className="grid gap-3">
            {unrecorded.map((r) => (
              <ReservationRow
                key={r.id}
                r={r}
                settings={info}
                nowIso={nowIso}
                variant="correction"
              />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="linimasa" className="space-y-4">
        <div>
          <h2 id="linimasa" className="font-display text-lg font-semibold">
            Linimasa
          </h2>
          <p className="text-sm text-ink-muted">
            {list.length} reservasi · {counts.checked_in} check-in · {counts.completed} selesai ·{' '}
            {counts.no_show} tidak datang
          </p>
        </div>
        {groups.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface p-5 text-ink-muted">
            Belum ada reservasi hari ini.
          </p>
        ) : (
          groups.map((g) => (
            <section key={g.hour} aria-labelledby={`jam-${g.hour}`} className="space-y-3">
              <h3
                id={`jam-${g.hour}`}
                className="flex items-center gap-2 font-mono text-base font-semibold"
              >
                {g.hour}
                {g.hour === currentHour && (
                  <span className="rounded-sm bg-accent-soft px-2 font-sans text-[13px] leading-6 font-medium text-accent-ink">
                    Sekarang
                  </span>
                )}
              </h3>
              <div className="grid gap-3">
                {g.items.map((r) => (
                  <ReservationRow
                    key={r.id}
                    r={r}
                    settings={info}
                    nowIso={nowIso}
                    variant="timeline"
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </section>
    </div>
  );
}
