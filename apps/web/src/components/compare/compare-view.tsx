'use client';

import type { AttributeDef } from '@lantai-dua/shared/catalog';
import {
  type CompareExamples,
  type CompareItem,
  type ComparePair,
  compareRows,
  compareTitle,
  type Gear,
  parseCompareQuery,
  resolveInitialPair,
  serializeCompareQuery,
  summarySentence,
} from '@lantai-dua/shared/compare';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { CompareViewer } from '@/lib/compare-data';
import { CompareTable } from './compare-table';
import { DemoPanel } from './demo-panel';
import { ManualFields } from './manual-fields';
import { PairPicker } from './pair-picker';
import { SaveGear } from './save-gear';
import { SizeBoxes } from './size-boxes';

const BASE_PATH = '/bandingkan';

export type CompareViewProps = {
  items: CompareItem[];
  attributes: AttributeDef[];
  examples: CompareExamples;
  gear: Gear | null;
  viewer: CompareViewer;
};

function summaryText(pair: ComparePair): string | null {
  if (!pair.current) return 'Pilih mouse yang lu pakai sekarang untuk melihat bedanya.';
  if (!pair.target) return 'Pilih mouse incaran untuk melihat bedanya.';
  return summarySentence(pair);
}

/**
 * Halaman Bandingkan di browser. Pasangan diturunkan dari URL (lalu Gear gue dan pasangan contoh),
 * dan setiap pilihan masuk riwayat browser lewat pushState, sama seperti filter katalog.
 */
export function CompareView({ items, attributes, examples, gear, viewer }: CompareViewProps) {
  const searchParams = useSearchParams();
  const urlKey = searchParams.toString();
  const fromUrl = useMemo(
    () => resolveInitialPair(parseCompareQuery(searchParams, items), { items, gear, examples }),
    [searchParams, items, gear, examples],
  );

  // pushState di dalam transisi Next membuat URL baru menyusul sesaat kemudian. Sampai itu
  // terjadi, tampilan memakai pilihan yang baru; begitu URL berubah, URL kembali jadi sumbernya.
  const [pending, setPending] = useState<ComparePair | null>(null);
  const [seenUrl, setSeenUrl] = useState(urlKey);
  if (seenUrl !== urlKey) {
    setSeenUrl(urlKey);
    setPending(null);
  }
  const pair = pending ?? fromUrl;
  const query = serializeCompareQuery(pair);
  // Gear terakhir yang tersimpan, supaya teks "Tersimpan" langsung tampil tanpa memuat ulang.
  const [savedGear, setSavedGear] = useState(gear);

  // URL selalu mencerminkan pasangan yang tampil, termasuk yang terisi dari gear atau contoh.
  useEffect(() => {
    if (window.location.search !== query) {
      window.history.replaceState(null, '', `${BASE_PATH}${query}`);
    }
  }, [query]);

  const title = compareTitle(pair);
  useEffect(() => {
    document.title = `${title} · LANTAI DUA`;
  }, [title]);

  const update = (next: ComparePair) => {
    setPending(next);
    window.history.pushState(null, '', `${BASE_PATH}${serializeCompareQuery(next)}`);
  };

  const rows = useMemo(() => compareRows(pair, attributes), [pair, attributes]);
  const text = summaryText(pair);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <PairPicker items={items} pair={pair} allowManual onChange={update} />
        {pair.current?.kind === 'manual' && (
          <ManualFields
            specs={pair.current.specs}
            onCommit={(specs) => update({ ...pair, current: { kind: 'manual', specs } })}
          />
        )}
        <SaveGear
          slot={pair.current}
          gear={savedGear}
          viewer={viewer}
          pageUrl={`${BASE_PATH}${query}`}
          onSaved={setSavedGear}
        />
      </div>

      <p
        data-testid="compare-summary"
        aria-live="polite"
        className="font-display text-[clamp(1.25rem,1.1rem+0.8vw,1.625rem)] leading-snug font-semibold text-balance text-ink"
      >
        {text}
      </p>

      <SizeBoxes pair={pair} views={['top', 'side']} />
      {rows.length > 0 && <CompareTable rows={rows} />}
      <DemoPanel pair={pair} viewer={viewer} />
    </div>
  );
}
