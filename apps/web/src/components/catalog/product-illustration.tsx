import type { ReactNode } from 'react';

// Gaya garis dari design-system/lantai-dua/preview.html:
// badan produk bergaris `ink` di atas `surface`, bagian utama `primary` di atas `primary-soft`,
// detail tipis `ink-subtle`, dan garis ukur tembaga (`accent`).
const INK = 'fill-surface stroke-ink [stroke-width:1.6] [stroke-linejoin:round]';
const PRI = 'fill-primary-soft stroke-primary [stroke-width:2] [stroke-linejoin:round]';
const SOFT = 'fill-none stroke-ink-subtle [stroke-width:1.4] [stroke-linecap:round]';
const KEY = 'fill-surface stroke-border-input [stroke-width:0.8]';
const ACC = 'fill-none stroke-accent [stroke-width:1.5]';

function Measure({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  return (
    <g className={ACC}>
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <line x1={x - 4} y1={y1} x2={x + 4} y2={y1} />
      <line x1={x - 4} y1={y2} x2={x + 4} y2={y2} />
    </g>
  );
}

function Keys({
  x,
  y,
  cols,
  rows,
  size,
}: {
  x: number;
  y: number;
  cols: number;
  rows: number;
  size: number;
}) {
  const keys: ReactNode[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      keys.push(
        <rect
          key={`${r}-${c}`}
          x={x + c * size}
          y={y + r * size}
          width={size - 1.6}
          height={size - 1.6}
          rx={1.4}
          className={KEY}
        />,
      );
    }
  }
  return <g>{keys}</g>;
}

const ART: Record<string, ReactNode> = {
  mouse: (
    <>
      <path
        className={PRI}
        d="M80,14 C98,14 109,30 109,54 C109,84 105,104 80,107 C55,104 51,84 51,54 C51,30 62,14 80,14 Z"
      />
      <path className={SOFT} d="M80,15 L80,50" />
      <rect
        x="77.5"
        y="24"
        width="5"
        height="12"
        rx="2.5"
        className="fill-surface stroke-primary [stroke-width:1.4]"
      />
      <Measure x={126} y1={14} y2={107} />
    </>
  ),
  keyboard: (
    <>
      <rect x="14" y="34" width="132" height="54" rx="7" className={INK} />
      <Keys x={21} y={40} cols={12} rows={4} size={10.2} />
      <rect x="44" y="81" width="72" height="4" rx="1.5" className={KEY} />
    </>
  ),
  headset: (
    <>
      <path className={INK} d="M44,70 C44,36 58,18 80,18 C102,18 116,36 116,70" fill="none" />
      <rect x="34" y="62" width="22" height="36" rx="10" className={PRI} />
      <rect x="104" y="62" width="22" height="36" rx="10" className={PRI} />
      <path className={SOFT} d="M40,92 C40,104 52,110 66,108" />
      <circle cx="68" cy="108" r="3" className="fill-ink stroke-none" />
    </>
  ),
  mousepad: (
    <>
      <rect x="18" y="22" width="124" height="80" rx="9" className={INK} />
      <rect
        x="22"
        y="26"
        width="116"
        height="72"
        rx="6"
        className="fill-none stroke-ink-subtle [stroke-width:1] [stroke-dasharray:3_3]"
      />
      <path
        className={PRI}
        d="M100,44 C108,44 113,51 113,61 C113,73 111,82 100,83 C89,82 87,73 87,61 C87,51 92,44 100,44 Z"
      />
    </>
  ),
  glasspad: (
    <>
      <rect
        x="18"
        y="22"
        width="124"
        height="80"
        rx="6"
        className="fill-primary-soft stroke-primary [stroke-width:1.6]"
      />
      <path
        className="fill-none stroke-surface [stroke-width:5] [stroke-linecap:round]"
        d="M36,92 L72,32"
      />
      <path
        className="fill-none stroke-surface [stroke-width:2.5] [stroke-linecap:round]"
        d="M52,92 L82,42"
      />
      <Measure x={152} y1={22} y2={102} />
    </>
  ),
  deskmat: (
    <>
      <rect x="6" y="36" width="148" height="56" rx="8" className={INK} />
      <rect
        x="20"
        y="48"
        width="78"
        height="30"
        rx="4"
        className="fill-surface-sunken stroke-border-input [stroke-width:1]"
      />
      <path
        className={PRI}
        d="M124,50 C130,50 134,55 134,62 C134,71 132,77 124,78 C116,77 114,71 114,62 C114,55 118,50 124,50 Z"
      />
    </>
  ),
  lainnya: (
    <>
      <rect x="44" y="28" width="72" height="66" rx="8" className={INK} />
      <path className={SOFT} d="M44,48 L116,48" />
      <path className={SOFT} d="M80,28 L80,48" />
    </>
  ),
};

/** Ilustrasi garis per kategori, dipakai selama produk belum punya foto sendiri. */
export function ProductIllustration({
  category,
  className = '',
}: {
  category: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      {ART[category] ?? ART.lainnya}
    </svg>
  );
}
