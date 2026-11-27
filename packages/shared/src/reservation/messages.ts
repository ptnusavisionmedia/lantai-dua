import { formatDuration } from './time';
import type { ReservableVariant, ReservationSettings, Slot } from './types';

/** "VortexSeries Ignix F1 · Putih". */
export function variantLabel(v: Pick<ReservableVariant, 'productName' | 'name'>): string {
  return `${v.productName} · ${v.name}`;
}

const GENERIC_UNIT = 'ini';

/** Alasan slot untuk ditampilkan, atau null kalau slot bisa dipilih. Tidak pernah menyebut pemesan. */
export function slotReasonText(
  slot: Slot,
  variants: ReservableVariant[],
  s: ReservationSettings,
): string | null {
  if (slot.available || slot.reason === null) return null;
  const variant = variants.find((v) => v.id === slot.reasonVariantId);
  const name = variant ? variantLabel(variant) : GENERIC_UNIT;
  switch (slot.reason) {
    case 'closed':
      return 'Toko tutup';
    case 'past':
      return 'Sudah lewat';
    case 'too_soon':
      return `Pesan paling lambat ${formatDuration(s.minLeadMinutes)} sebelum sesi`;
    case 'too_far':
      return `Paling jauh ${s.maxDaysAhead} hari ke depan`;
    case 'own_overlap':
      return 'Lu udah punya reservasi di jam ini';
    case 'desk_full':
      return 'Meja penuh';
    case 'unit_servicing':
      return `Unit demo ${name} sedang diservis`;
    case 'unit_taken':
      return `Unit demo ${name} sudah dipesan di jam ini`;
  }
}

/** Pesan galat saat membuat reservasi, dari kode galat fungsi database. */
export function createErrorText(
  code: string,
  variantName: string | null,
  s: ReservationSettings,
): string {
  const name = variantName ?? GENERIC_UNIT;
  switch (code) {
    case 'desk_full':
    case 'slot_unavailable':
      return 'Slot ini baru saja penuh. Pilih jam lain.';
    case 'unit_taken':
      return `Unit demo ${name} baru saja dipesan orang lain di jam ini.`;
    case 'unit_servicing':
      return `Unit demo ${name} sedang diservis.`;
    case 'own_overlap':
      return 'Lu udah punya reservasi di jam ini.';
    case 'too_many_active':
      return `Lu udah punya ${s.maxActiveReservations} reservasi aktif. Batalkan salah satu dulu, atau tunggu sampai sesinya lewat.`;
    case 'rate_limited':
      return 'Terlalu banyak reservasi dibuat hari ini. Coba lagi besok.';
    case 'too_soon':
    case 'too_far':
    case 'outside_hours':
      return 'Jam ini sudah tidak bisa dipesan. Pilih jam lain.';
    case 'not_customer':
      return 'Reservasi dibuat dari akun pelanggan.';
    default:
      return 'Gagal menyimpan. Coba lagi sebentar.';
  }
}

/** Pesan galat saat membatalkan reservasi. */
export function cancelErrorText(code: string, _s: ReservationSettings): string {
  switch (code) {
    case 'cancel_too_late':
      return 'Batas batal sudah lewat. Hubungi toko lewat WhatsApp.';
    case 'not_cancellable':
      return 'Reservasi ini sudah tidak bisa dibatalkan.';
    default:
      return 'Gagal membatalkan. Coba lagi sebentar.';
  }
}
