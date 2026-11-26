'use client';

import {
  type CompareExamples,
  type CompareItem,
  EMPTY_PAIR,
  type Gear,
  resolveInitialPair,
  serializeCompareQuery,
  summarySentence,
} from '@lantai-dua/shared/compare';
import { useState } from 'react';
import { ButtonLink } from '../button';
import { PairPicker } from '../compare/pair-picker';
import { SizeBoxes } from '../compare/size-boxes';

/**
 * Versi ringkas Bandingkan di beranda (PRD §9.1 L4, B12): dua pemilih, kalimat selisih, tampak
 * atas, dan tautan ke halaman lengkap. Pilihan di sini tidak mengubah URL beranda.
 */
export function CompareTeaser({
  items,
  examples,
  gear,
}: {
  items: CompareItem[];
  examples: CompareExamples;
  gear: Gear | null;
}) {
  const [pair, setPair] = useState(() => resolveInitialPair(EMPTY_PAIR, { items, gear, examples }));
  if (!pair.target) return null;

  const savedManual = gear?.kind === 'manual' ? gear.specs : null;
  const text = pair.current
    ? summarySentence(pair)
    : 'Pilih mouse yang lu pakai sekarang untuk melihat bedanya.';

  return (
    <section
      aria-labelledby="bandingkan-title"
      className="mx-auto max-w-[1200px] px-4 py-12 md:px-8"
    >
      <h2 id="bandingkan-title" className="font-display text-2xl font-bold tracking-[-0.01em]">
        Bandingkan mouse
      </h2>
      <p className="mt-2 max-w-[56ch] text-ink-muted">
        Taruh mouse yang lu pakai sekarang di samping mouse incaran, lalu lihat bedanya.
      </p>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="space-y-5">
          <PairPicker
            items={items}
            pair={pair}
            allowManual={false}
            savedManual={savedManual}
            onChange={setPair}
          />
          <p
            data-testid="compare-summary"
            aria-live="polite"
            className="font-display text-xl leading-snug font-semibold text-balance text-ink"
          >
            {text}
          </p>
          <ButtonLink variant="text" href={`/bandingkan${serializeCompareQuery(pair)}`}>
            Buka perbandingan lengkap
          </ButtonLink>
        </div>
        <SizeBoxes pair={pair} views={['top']} />
      </div>
    </section>
  );
}
