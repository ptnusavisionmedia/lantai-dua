export type ReservationStatus =
  | 'scheduled'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'unrecorded';

/** Alasan slot tidak bisa dipilih, sesuai urutan di desain 1C-1 §5.1. */
export type SlotReason =
  | 'closed'
  | 'past'
  | 'too_soon'
  | 'too_far'
  | 'own_overlap'
  | 'desk_full'
  | 'unit_servicing'
  | 'unit_taken';

/** Varian yang bisa direservasi (fungsi `reservable_variants`). */
export type ReservableVariant = {
  id: string;
  sku: string;
  name: string;
  productSlug: string;
  /** "Merek Model", misalnya "VortexSeries Ignix F1". */
  productName: string;
  categorySlug: string;
  categoryName: string;
  categorySort: number;
  areaId: string;
  areaName: string;
  assignableUnits: number;
  servicingUnits: number;
};

/** Satu slot dari `reservation_slots`, dengan tanggal dan jam WIB. */
export type Slot = {
  startsAt: string;
  endsAt: string;
  /** `YYYY-MM-DD` WIB. */
  date: string;
  /** `HH.MM` WIB, misalnya "14.00". */
  time: string;
  available: boolean;
  reason: SlotReason | null;
  reasonVariantId: string | null;
};

export type ReservationSettings = {
  sessionMinutes: number;
  minLeadMinutes: number;
  maxDaysAhead: number;
  maxActiveReservations: number;
  cancelCutoffMinutes: number;
};

/** Isi URL formulir `/reservasi/baru`. */
export type ReservationQuery = {
  skus: string[];
  tanggal: string | null;
  jam: string | null;
  bawa: string | null;
};

export type ReservationItemView = { name: string; unitCode: string | null };

export type ReservationView = {
  id: string;
  code: string;
  status: ReservationStatus;
  startsAt: string;
  endsAt: string;
  note: string | null;
  areaName: string | null;
  items: ReservationItemView[];
};

/** Bentuk hasil select `reservations` dengan item, varian, produk, merek, unit, dan area tersemat. */
export type ReservationRowWithItems = {
  id: string;
  code: string;
  status: ReservationStatus;
  starts_at: string;
  ends_at: string;
  note: string | null;
  reservation_items: {
    variant: {
      name: string;
      product: { model_name: string; brand: { name: string } | null } | null;
    } | null;
    unit: { code: string; area: { name: string } | null } | null;
  }[];
};
