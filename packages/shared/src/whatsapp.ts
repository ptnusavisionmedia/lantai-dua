/** Bentuk yang disimpan di `profiles.whatsapp`: 62 diikuti 8–13 angka. */
const STORED = /^62[0-9]{8,13}$/;

export const WHATSAPP_INVALID = 'Nomor WhatsApp belum benar. Contoh: 0812-3456-7890';

/**
 * Nomor yang diketik pelanggan (`0812…`, `+62 812…`, `0062 812…`, `62812…`, boleh dengan spasi,
 * tanda hubung, titik, atau kurung) menjadi bentuk `62…`, atau null kalau tidak sah. Nomor nasional
 * (setelah 62) tidak boleh diawali 0, supaya isian seperti `0000000000` tidak tersimpan.
 */
export function normalizeWhatsapp(input: string): string | null {
  const compact = input.trim().replace(/[\s\-.()]/g, '');
  if (!/^\+?[0-9]+$/.test(compact)) return null;
  // `+62` dan `0062` sama-sama awalan internasional.
  const digits = compact.replace(/^\+/, '').replace(/^00(?=62)/, '');
  let national: string;
  if (digits.startsWith('620')) national = digits.slice(3);
  else if (digits.startsWith('62')) national = digits.slice(2);
  else if (digits.startsWith('0')) national = digits.slice(1);
  else return null;
  if (!/^[1-9]/.test(national)) return null;
  const stored = `62${national}`;
  return STORED.test(stored) ? stored : null;
}

/** "6281234567890" → "0812-3456-7890": angka 0 di depan, lalu kelompok 4-4-sisanya. */
export function formatWhatsapp(stored: string): string {
  const local = `0${stored.replace(/^62/, '')}`;
  return [local.slice(0, 4), local.slice(4, 8), local.slice(8)].filter(Boolean).join('-');
}

export function whatsappLink(stored: string): string {
  return `https://wa.me/${stored}`;
}
