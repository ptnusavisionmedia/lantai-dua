'use client';

import { formatDimensions } from '@lantai-dua/shared/catalog';
import {
  type BoxPanel,
  boxPanels,
  type ComparePair,
  serializeCompareQuery,
  slotName,
  slotSpecs,
} from '@lantai-dua/shared/compare';
import { useMemo, useState } from 'react';
import { Button } from '../button';

type View = 'top' | 'side';

/** Ruang tambahan di kanan dan bawah viewBox untuk garis ukur, sama di semua panel (mm). */
const EXTRA = 12;
const TICK = 2;
const number = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });

const CAPTION: Record<View, string> = {
  top: 'Tampak atas · skala sama',
  side: 'Tampak samping · skala sama',
};

function sizeText(specs: Record<string, unknown>): string {
  const dims = formatDimensions(specs);
  const weight = typeof specs.weight_g === 'number' ? `${number.format(specs.weight_g)} g` : null;
  return [dims ?? 'ukuran belum lengkap', weight].filter(Boolean).join(' · ');
}

/** Garis ukur gambar teknik: garis tipis dengan dua ujung tegak dan angka mono di tengah. */
function MeasureLine({
  x1,
  y1,
  x2,
  y2,
  label,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
}) {
  const vertical = x1 === x2;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  return (
    <g className="text-ink-muted" stroke="currentColor" strokeWidth={1}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} vectorEffect="non-scaling-stroke" />
      {vertical ? (
        <>
          <line x1={x1 - TICK} y1={y1} x2={x1 + TICK} y2={y1} vectorEffect="non-scaling-stroke" />
          <line x1={x2 - TICK} y1={y2} x2={x2 + TICK} y2={y2} vectorEffect="non-scaling-stroke" />
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - TICK} x2={x1} y2={y1 + TICK} vectorEffect="non-scaling-stroke" />
          <line x1={x2} y1={y2 - TICK} x2={x2} y2={y2 + TICK} vectorEffect="non-scaling-stroke" />
        </>
      )}
      <text
        x={vertical ? cx + 5.5 : cx}
        y={vertical ? cy : cy + 7}
        transform={vertical ? `rotate(-90 ${cx + 5.5} ${cy})` : undefined}
        textAnchor="middle"
        dominantBaseline="middle"
        stroke="none"
        fill="currentColor"
        className="font-mono"
        fontSize={5}
      >
        {label}
      </text>
    </g>
  );
}

function Panel({
  view,
  panel,
  label,
  animKey,
}: {
  view: View;
  panel: BoxPanel;
  label: string;
  animKey: string;
}) {
  const { width, height, current, target } = panel;
  return (
    <svg
      viewBox={`0 0 ${width + EXTRA} ${height + EXTRA}`}
      role="img"
      aria-label={label}
      className="mt-2 block h-auto w-full overflow-visible rounded-md bg-surface-sunken"
    >
      <g key={animKey}>
        {view === 'side' && (
          <line
            x1={0}
            x2={width}
            y1={target.y + target.h}
            y2={target.y + target.h}
            className="text-border-input"
            stroke="currentColor"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <rect
          className="m1-target"
          x={target.x}
          y={target.y}
          width={target.w}
          height={target.h}
          rx={Math.min(target.h, target.w) * 0.18}
          fill="var(--color-primary-soft)"
          stroke="var(--color-primary)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
        <rect
          className="m1-current"
          x={current.x}
          y={current.y}
          width={current.w}
          height={current.h}
          rx={Math.min(current.h, current.w) * 0.18}
          fill="none"
          stroke="var(--color-ink-subtle)"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
        />
        <g className="m1-after">
          <MeasureLine
            x1={target.x}
            y1={height + 3}
            x2={target.x + target.w}
            y2={height + 3}
            label={`${number.format(target.w)} mm`}
          />
          <MeasureLine
            x1={width + 3}
            y1={target.y}
            x2={width + 3}
            y2={target.y + target.h}
            label={`${number.format(target.h)}`}
          />
        </g>
      </g>
    </svg>
  );
}

/**
 * Kotak ukuran berskala sama (desain §5.5): mouse sekarang bergaris putus-putus, incaran berisi
 * warna primer. Gerak M1 memakai CSS dan diputar ulang dengan mengganti `key` grup SVG.
 */
export function SizeBoxes({ pair, views }: { pair: ComparePair; views: View[] }) {
  const panels = useMemo(() => boxPanels(pair), [pair]);
  const [play, setPlay] = useState(0);
  const { current, target } = pair;
  if (!current || !target) return null;

  const animKey = `${serializeCompareQuery(pair)}-${play}`;
  const currentName = slotName(current);
  const targetName = slotName(target);
  const shown = views.map((view) => ({
    view,
    panel: view === 'top' ? panels.top : panels.side,
    gap: view === 'top' ? panels.topGap : panels.sideGap,
  }));
  const panelLabel = (view: View, p: BoxPanel) => {
    const second = view === 'top' ? 'lebar' : 'tinggi';
    const dims = (w: number, h: number) => `${number.format(w)} × ${number.format(h)} mm`;
    return `${CAPTION[view]}. Panjang × ${second}: ${currentName} ${dims(p.current.w, p.current.h)}, ${targetName} ${dims(p.target.w, p.target.h)}.`;
  };

  return (
    <figure data-testid="size-boxes" data-play={play} className="space-y-4">
      <div className={`grid gap-6 ${views.length > 1 ? 'md:grid-cols-2' : 'max-w-[560px]'}`}>
        {shown.map(({ view, panel, gap }) => (
          <div key={view} className="min-w-0">
            <p className="text-[13px] font-medium text-ink-muted">{CAPTION[view]}</p>
            {panel ? (
              <Panel view={view} panel={panel} label={panelLabel(view, panel)} animKey={animKey} />
            ) : (
              <p className="mt-2 rounded-md bg-surface-sunken px-4 py-6 text-sm text-ink-muted">
                {gap}
              </p>
            )}
          </div>
        ))}
      </div>
      <figcaption className="space-y-2 text-sm">
        <ul className="space-y-1">
          <li className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className="mt-1.5 h-2.5 w-5 shrink-0 rounded-[2px] border-[1.5px] border-dashed border-ink-subtle"
            />
            <span>
              <span className="text-ink-muted">Mouse sekarang:</span> {currentName}{' '}
              <span className="font-mono text-[13px] text-ink-muted">
                {sizeText(slotSpecs(current))}
              </span>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className="mt-1.5 h-2.5 w-5 shrink-0 rounded-[2px] border-[1.5px] border-primary bg-primary-soft"
            />
            <span>
              <span className="text-ink-muted">Incaran:</span> {targetName}{' '}
              <span className="font-mono text-[13px] text-ink-muted">{sizeText(target.specs)}</span>
            </span>
          </li>
        </ul>
        <div className="flex flex-wrap items-center gap-x-4">
          <p className="text-ink-muted">Ukuran luar, bukan bentuk asli.</p>
          <Button variant="text" onClick={() => setPlay((n) => n + 1)}>
            Putar ulang
          </Button>
        </div>
      </figcaption>
    </figure>
  );
}
