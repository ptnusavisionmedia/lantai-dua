const rupiah = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });

/** `1249000` → `Rp1.249.000`. */
export function formatRupiah(n: number): string {
  return `Rp${rupiah.format(n)}`;
}

/** Dimensi mouse `P × L × T mm`, atau null kalau salah satunya belum tercatat. */
export function formatDimensions(specs: Record<string, unknown>): string | null {
  const dims = [specs.length_mm, specs.width_mm, specs.height_mm];
  if (!dims.every((d): d is number => typeof d === 'number')) return null;
  return `${dims.map((d) => decimal.format(d)).join(' × ')} mm`;
}
