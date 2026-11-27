import { buildIcs } from '@lantai-dua/shared/reservation';
import { getMyReservation, getStoreInfo } from '@/lib/reservation-data';

/** Berkas .ics satu reservasi milik pelanggan yang login; 404 untuk kode lain. */
export async function GET(_request: Request, ctx: { params: Promise<{ kode: string }> }) {
  const { kode } = await ctx.params;
  const [r, info] = await Promise.all([getMyReservation(kode), getStoreInfo()]);
  if (!r) return new Response('Tidak ditemukan', { status: 404 });
  const ics = buildIcs(
    {
      code: r.code,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      items: r.items.map((i) => i.name),
      address: info.address,
    },
    new Date(),
  );
  return new Response(ics, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="lantai-dua-${r.code}.ics"`,
      'cache-control': 'private, no-store',
    },
  });
}
