import type { SupabaseClient } from '@supabase/supabase-js';
import { type CatalogFixture, createCatalogFixture, deleteCatalogFixture } from './catalog-fixture';
import { adminClient, anonClient, clientFor, type Persona } from './clients';

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');

/** Tanggal WIB hari ini + `daysAhead`, sebagai `YYYY-MM-DD`. */
export function wibDay(daysAhead: number): string {
  return new Date(Date.now() + WIB_OFFSET_MS + daysAhead * DAY_MS).toISOString().slice(0, 10);
}

/** Hari ke depan terkecil (≥ `min`) yang bukan Minggu, supaya jam buka 10.00–21.00 (seed). */
export function weekdayAhead(min: number): number {
  for (let d = min; ; d += 1) {
    if (new Date(`${wibDay(d)}T00:00:00Z`).getUTCDay() !== 0) return d;
  }
}

/** Awal slot `hhmm` ("14.00") pada tanggal WIB hari ini + `daysAhead`, sebagai timestamptz. */
export function slotAt(daysAhead: number, hhmm: string): string {
  return `${wibDay(daysAhead)}T${hhmm.replace('.', ':')}:00+07:00`;
}

/** Jam WIB dari timestamptz, sebagai "14.00". */
export function toWibTime(iso: string): string {
  const d = new Date(new Date(iso).getTime() + WIB_OFFSET_MS);
  return `${pad(d.getUTCHours())}.${pad(d.getUTCMinutes())}`;
}

export type ReservationFixture = CatalogFixture & {
  areaA: string;
  areaB: string;
  vSolo: string;
  vDuo: string;
  vSoloB: string;
  vSoloB2: string;
  vServ: string;
  unitIds: string[];
};

async function must<T>(
  label: string,
  p: PromiseLike<{ data: T; error: { message: string } | null }>,
): Promise<NonNullable<T>> {
  const { data, error } = await p;
  if (error) throw new Error(`${label}: ${error.message}`);
  if (data === null || data === undefined) throw new Error(`${label}: tidak ada data`);
  return data as NonNullable<T>;
}

/**
 * Area A (meja, kapasitas 2) dan B (kapasitas 1) beserta varian tes di kategori fixture (`try_mode` unit):
 * vSolo (1 unit di A), vDuo (2 unit di A), vSoloB dan vSoloB2 (masing-masing 1 unit di B),
 * dan vServ (1 unit diservis di A).
 */
export async function createReservationFixture(
  admin: SupabaseClient,
  prefix: string,
): Promise<ReservationFixture> {
  const f = await createCatalogFixture(admin, prefix);
  const areas = await must(
    'area',
    admin
      .from('demo_areas')
      .insert(
        [
          {
            slug: `${prefix}area-a`,
            name: 'Meja tes A',
            kind: 'desk',
            capacity: 2,
            is_reservable: true,
            sort_order: 900,
          },
          {
            slug: `${prefix}area-b`,
            name: 'Meja tes B',
            kind: 'desk',
            capacity: 1,
            is_reservable: true,
            sort_order: 901,
          },
        ],
        { defaultToNull: false },
      )
      .select('id, slug'),
  );
  const areaA = areas.find((a) => a.slug.endsWith('area-a'))?.id as string;
  const areaB = areas.find((a) => a.slug.endsWith('area-b'))?.id as string;

  const product = await must(
    'produk reservasi',
    admin
      .from('products')
      .insert({
        category_id: f.catId,
        brand_id: f.brandId,
        model_name: 'Mouse reservasi',
        slug: `${prefix}p-res`,
        is_active: true,
      })
      .select('id')
      .single(),
  );
  const names = ['solo', 'duo', 'solo-b', 'solo-b2', 'serv'] as const;
  const variants = await must(
    'varian reservasi',
    admin
      .from('product_variants')
      .insert(
        names.map((n, i) => ({
          product_id: product.id,
          sku: `${prefix}v-${n}`,
          name: `Varian ${n}`,
          price_idr: 1_000_000,
          sort_order: i,
        })),
        { defaultToNull: false },
      )
      .select('id, sku'),
  );
  const id = (n: (typeof names)[number]) =>
    variants.find((v) => v.sku === `${prefix}v-${n}`)?.id as string;

  // Kode unit wajib DM-<huruf>-<3 angka>; huruf R hanya dipakai tes reservasi.
  const base = Math.floor(Math.random() * 990);
  const code = (i: number) => `DM-R-${String((base + i) % 1000).padStart(3, '0')}`;
  const units = await must(
    'unit reservasi',
    admin
      .from('demo_units')
      .insert(
        [
          { variant_id: id('solo'), area_id: areaA, code: code(0), status: 'available' },
          { variant_id: id('duo'), area_id: areaA, code: code(1), status: 'available' },
          { variant_id: id('duo'), area_id: areaA, code: code(2), status: 'in_use' },
          { variant_id: id('solo-b'), area_id: areaB, code: code(3), status: 'available' },
          { variant_id: id('solo-b2'), area_id: areaB, code: code(4), status: 'available' },
          { variant_id: id('serv'), area_id: areaA, code: code(5), status: 'servicing' },
        ],
        { defaultToNull: false },
      )
      .select('id'),
  );

  return {
    ...f,
    areaA,
    areaB,
    vSolo: id('solo'),
    vDuo: id('duo'),
    vSoloB: id('solo-b'),
    vSoloB2: id('solo-b2'),
    vServ: id('serv'),
    unitIds: units.map((u) => u.id as string),
  };
}

/** Hapus reservasi milik pengguna tes (item dan kursi ikut terhapus). */
export async function deleteReservationsOf(userIds: string[]): Promise<void> {
  const { error } = await adminClient().from('reservations').delete().in('customer_id', userIds);
  if (error) throw new Error(`hapus reservasi: ${error.message}`);
}

export async function deleteReservationFixture(
  admin: SupabaseClient,
  f: ReservationFixture,
): Promise<void> {
  await admin.from('reservation_items').delete().in('unit_id', f.unitIds);
  await admin.from('demo_units').delete().in('id', f.unitIds);
  await admin.from('demo_areas').delete().in('id', [f.areaA, f.areaB]);
  await deleteCatalogFixture(admin, f.prefix);
}

export type ReserveResult = {
  code: string | null;
  error: { message: string; details: string | null; code: string } | null;
};

/** Memanggil `create_reservation` sebagai persona (atau tamu). */
export async function reserve(
  who: Persona | 'anon',
  variantIds: string[],
  startsAt: string,
  note?: string,
): Promise<ReserveResult> {
  const client = who === 'anon' ? anonClient() : clientFor(who);
  const { data, error } = await client.rpc('create_reservation', {
    p_variant_ids: variantIds,
    p_starts_at: startsAt,
    p_note: note ?? null,
  });
  return {
    code: (data as string | null) ?? null,
    error: error
      ? { message: error.message, details: error.details ?? null, code: error.code }
      : null,
  };
}
