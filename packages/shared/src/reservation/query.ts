import type { SearchParamsLike } from '../catalog/query';
import type { ReservableVariant, ReservationQuery } from './types';

export const MAX_ITEMS = 4;

const JAM = /^([01]\d|2[0-3])\.([0-5]\d)$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Membaca URL formulir reservasi. Nilai yang tidak sah diabaikan: SKU asing atau ganda, varian
 * kelima dan seterusnya, tanggal di luar jendela, jam yang bukan `HH.MM`, dan `bawa` yang aneh.
 */
export function parseReservationQuery(
  params: SearchParamsLike,
  variants: ReservableVariant[],
  window: string[],
): ReservationQuery {
  const known = new Set(variants.map((v) => v.sku));
  const skus: string[] = [];
  for (const raw of (params.get('varian') ?? '').split(',')) {
    const sku = raw.trim();
    if (skus.length < MAX_ITEMS && known.has(sku) && !skus.includes(sku)) skus.push(sku);
  }
  const tanggal = params.get('tanggal');
  const jam = params.get('jam');
  const bawa = params.get('bawa');
  return {
    skus,
    tanggal: tanggal !== null && window.includes(tanggal) ? tanggal : null,
    jam: jam !== null && JAM.test(jam) ? jam : null,
    bawa: bawa !== null && (bawa === 'ukur' || SLUG.test(bawa)) ? bawa : null,
  };
}

/** Menulis URL dengan urutan tetap: varian, tanggal, jam, bawa. */
export function serializeReservationQuery(q: ReservationQuery): string {
  const parts: string[] = [];
  if (q.skus.length > 0) parts.push(`varian=${q.skus.map(encodeURIComponent).join(',')}`);
  if (q.tanggal) parts.push(`tanggal=${q.tanggal}`);
  if (q.jam) parts.push(`jam=${q.jam}`);
  if (q.bawa) parts.push(`bawa=${encodeURIComponent(q.bawa)}`);
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}
