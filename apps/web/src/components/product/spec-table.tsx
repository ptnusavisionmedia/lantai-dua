import { type AttributeDef, formatDimensions } from '@lantai-dua/shared/catalog';

const number = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
const DIMENSION_KEYS = ['length_mm', 'width_mm', 'height_mm'];

function formatValue(attr: AttributeDef, value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  switch (attr.type) {
    case 'number':
      return typeof value === 'number'
        ? `${number.format(value)}${attr.unit ? ` ${attr.unit}` : ''}`
        : null;
    case 'boolean':
      return value === true ? 'Ya' : value === false ? 'Tidak' : null;
    case 'multi_enum':
      return Array.isArray(value) && value.length > 0 ? value.join(', ') : null;
    default:
      return typeof value === 'string' ? value : null;
  }
}

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
    const value = formatValue(attr, source[attr.key]);
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
