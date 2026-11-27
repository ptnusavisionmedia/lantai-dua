import type { Database } from '../database.types';
import { slotTime, wibDate } from './time';
import type {
  OperatorReservation,
  OperatorReservationRow,
  ReservableVariant,
  ReservationRowWithItems,
  ReservationSettings,
  ReservationView,
  Slot,
  SlotReason,
} from './types';

type Functions = Database['public']['Functions'];
type ReservableRow = Functions['reservable_variants']['Returns'][number];
type SlotRow = Functions['reservation_slots']['Returns'][number];
type SettingsRow = Database['public']['Tables']['store_settings']['Row'];

const REASONS: readonly string[] = [
  'closed',
  'past',
  'too_soon',
  'too_far',
  'own_overlap',
  'desk_full',
  'unit_servicing',
  'unit_taken',
];

export function fromReservableRow(row: ReservableRow): ReservableVariant {
  return {
    id: row.variant_id,
    sku: row.sku,
    name: row.variant_name,
    productSlug: row.product_slug,
    productName: `${row.brand_name} ${row.model_name}`,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    categorySort: row.category_sort,
    areaId: row.area_id,
    areaName: row.area_name,
    assignableUnits: row.assignable_units,
    servicingUnits: row.servicing_units,
  };
}

/** Alasan yang tidak dikenal dianggap "meja penuh", supaya slotnya tetap tidak bisa dipilih. */
export function fromSlotRow(row: SlotRow): Slot {
  const reason = row.available
    ? null
    : REASONS.includes(row.reason)
      ? (row.reason as SlotReason)
      : 'desk_full';
  return {
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    date: wibDate(new Date(row.starts_at)),
    time: slotTime(row.starts_at),
    available: row.available,
    reason,
    reasonVariantId: row.reason_variant_id ?? null,
  };
}

export function fromSettingsRow(
  row: Pick<
    SettingsRow,
    | 'session_minutes'
    | 'min_lead_minutes'
    | 'max_days_ahead'
    | 'max_active_reservations'
    | 'cancel_cutoff_minutes'
    | 'checkin_open_minutes'
    | 'no_show_after_minutes'
  >,
): ReservationSettings {
  return {
    sessionMinutes: row.session_minutes,
    minLeadMinutes: row.min_lead_minutes,
    maxDaysAhead: row.max_days_ahead,
    maxActiveReservations: row.max_active_reservations,
    cancelCutoffMinutes: row.cancel_cutoff_minutes,
    checkinOpenMinutes: row.checkin_open_minutes,
    noShowAfterMinutes: row.no_show_after_minutes,
  };
}

type ItemRow = ReservationRowWithItems['reservation_items'][number];

/** "Merek Model · Varian", atau "Unit demo" kalau variannya tidak terbaca. */
function itemName(i: ItemRow): string {
  const product = i.variant?.product;
  return i.variant && product
    ? `${product.brand?.name ? `${product.brand.name} ` : ''}${product.model_name} · ${i.variant.name}`
    : 'Unit demo';
}

/** Nama item "Merek Model · Varian"; area diambil dari unit pertama yang punya area. */
export function fromReservationRow(row: ReservationRowWithItems): ReservationView {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    note: row.note,
    cancelReason: row.cancel_reason,
    areaName: row.reservation_items.find((i) => i.unit?.area)?.unit?.area?.name ?? null,
    items: row.reservation_items.map((i) => ({
      name: itemName(i),
      unitCode: i.unit?.code ?? null,
    })),
  };
}

/**
 * Reservasi untuk layar operator. Kontak datang dari `reservation_contacts` (O7); catatan
 * kebersihan diambil sekali per kategori, dalam urutan item (R14).
 */
export function fromOperatorRow(
  row: OperatorReservationRow,
  contact: { full_name: string; whatsapp: string | null } | undefined,
): OperatorReservation {
  const base = fromReservationRow(row);
  const hygieneNotes: string[] = [];
  for (const i of row.reservation_items) {
    const note = i.variant?.product?.category?.hygiene_note;
    if (note && !hygieneNotes.includes(note)) hygieneNotes.push(note);
  }
  return {
    ...base,
    items: row.reservation_items.map((i) => ({
      name: itemName(i),
      unitCode: i.unit?.code ?? null,
      areaName: i.unit?.area?.name ?? null,
    })),
    customerName: contact?.full_name.trim() || 'Pelanggan',
    whatsapp: contact?.whatsapp ?? null,
    hygieneNotes,
    createdAt: row.created_at,
  };
}
