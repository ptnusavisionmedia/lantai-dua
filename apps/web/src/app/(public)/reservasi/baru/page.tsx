import {
  dateWindow,
  formatDuration,
  parseReservationQuery,
  wibDate,
} from '@lantai-dua/shared/reservation';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReservationForm } from '@/components/reservation/reservation-form';
import {
  getReservationViewer,
  getStoreInfo,
  listMyReservations,
  listReservableVariants,
  listSlots,
} from '@/lib/reservation-data';
import { toSearchParams } from '@/lib/search-params';

export const metadata: Metadata = { title: 'Reservasi demo' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ReservasiBaruPage({ searchParams }: Props) {
  const [info, variants, viewer] = await Promise.all([
    getStoreInfo(),
    listReservableVariants(),
    getReservationViewer(),
  ]);
  const today = wibDate(new Date());
  const window = dateWindow(today, info.maxDaysAhead);
  const query = parseReservationQuery(toSearchParams(await searchParams), variants, window);
  const chosen = query.skus
    .map((sku) => variants.find((v) => v.sku === sku))
    .filter((v) => v !== undefined);
  const slots = await listSlots(
    window[0] ?? today,
    window.at(-1) ?? today,
    chosen.map((v) => v.id),
  );
  // Tanggal awal: dari URL, atau tanggal pertama yang masih punya slot kosong.
  const tanggal = query.tanggal ?? slots.find((s) => s.available)?.date ?? today;
  // Pelanggan yang sudah mencapai batas reservasi aktif diberi tahu sebelum mengisi formulir,
  // bukan baru saat Konfirmasi ditolak (anti-tujuan desain §2).
  const now = Date.now();
  const active =
    viewer === 'customer'
      ? (await listMyReservations()).filter(
          (r) =>
            (r.status === 'scheduled' || r.status === 'checked_in') &&
            new Date(r.endsAt).getTime() > now,
        ).length
      : 0;
  const atLimit = active >= info.maxActiveReservations;
  const areaName = chosen[0]?.areaName ?? variants[0]?.areaName ?? 'Meja Kontrol';

  return (
    <section className="mx-auto max-w-[1200px] px-4 pt-10 pb-20 md:px-8 md:pt-14">
      <h1 className="font-display text-[40px] leading-[1.1] font-bold tracking-[-0.015em]">
        Reservasi demo
      </h1>
      <p className="mt-3 max-w-[62ch] text-lg text-ink-muted">
        {areaName} · sesi {formatDuration(info.sessionMinutes)}. Pilih unit demo, tanggal, dan jam,
        lalu kami siapkan di lantai dua.
      </p>
      <div className="mt-8">
        <Suspense>
          <ReservationForm
            variants={variants}
            slots={slots}
            settings={info}
            today={today}
            window={window}
            query={{ ...query, tanggal }}
            viewer={viewer}
            atLimit={atLimit}
          />
        </Suspense>
      </div>
    </section>
  );
}
