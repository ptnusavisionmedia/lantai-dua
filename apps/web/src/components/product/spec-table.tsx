import { type AttributeDef, formatDimensions, formatSpecValue } from '@lantai-dua/shared/catalog';

const DIMENSION_KEYS = ['length_mm', 'width_mm', 'height_mm'];

/**
 * Semua atribut template yang punya nilai, dengan label dan satuannya. Atribut level varian
 * diambil dari varian terpilih. Mouse dengan panjang, lebar, dan tinggi lengkap mendapat
 * satu baris "Dimensi".
 */
export function SpecTable({
  attributes,
  specs,
  variantAttributes,
}: {
  attributes: AttributeDef[];
  specs: Record<string, unknown>;
  variantAttributes: Record<string, unknown>;
}) {
  const dimensions = formatDimensions(specs);
  const rows: { key: string; label: string; value: string }[] = [];
  for (const attr of [...attributes].sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (dimensions && DIMENSION_KEYS.includes(attr.key)) {
      if (attr.key === 'length_mm')
        rows.push({ key: 'dimensi', label: 'Dimensi', value: dimensions });
      continue;
    }
    const source = attr.scope === 'variant' ? variantAttributes : specs;
    const value = formatSpecValue(attr, source[attr.key]);
    if (value !== null) rows.push({ key: attr.key, label: attr.label, value });
  }

  if (rows.length === 0) {
    return <p className="text-ink-muted">Spesifikasi produk ini sedang kami lengkapi.</p>;
  }
  return (
    <dl className="divide-y divide-border border-y border-border">
      {rows.map((r) => (
        <div key={r.key} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-3">
          <dt className="text-ink-muted">{r.label}</dt>
          <dd className="font-mono text-[15px] break-words text-ink">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
