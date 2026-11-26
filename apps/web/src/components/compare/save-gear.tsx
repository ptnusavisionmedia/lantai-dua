'use client';

import { type CurrentSlot, type Gear, slotMatchesGear } from '@lantai-dua/shared/compare';
import { useState, useTransition } from 'react';
import { type SaveGearInput, saveMouseGear } from '@/app/(public)/bandingkan/actions';
import type { CompareViewer } from '@/lib/compare-data';
import { Button, ButtonLink } from '../button';

/**
 * Tombol "Simpan sebagai mouse gue" (desain §5.8). Tamu diarahkan ke login lalu kembali ke
 * pasangan yang sama, tanpa simpan otomatis. Staf dan akun nonaktif tidak melihatnya.
 */
export function SaveGear({
  slot,
  gear,
  viewer,
  pageUrl,
  onSaved,
}: {
  slot: CurrentSlot;
  gear: Gear | null;
  viewer: CompareViewer;
  pageUrl: string;
  onSaved: (gear: Gear) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (viewer === 'other' || !slot) return null;
  if (slot.kind === 'manual' && Object.keys(slot.specs).length === 0) return null;
  if (slotMatchesGear(slot, gear)) {
    return (
      <p role="status" className="text-sm text-ink-muted">
        Tersimpan sebagai mouse lu.
      </p>
    );
  }
  if (viewer === 'guest') {
    return (
      <ButtonLink variant="secondary" href={`/masuk?next=${encodeURIComponent(pageUrl)}`}>
        Simpan sebagai mouse gue
      </ButtonLink>
    );
  }

  const save = () => {
    const input: SaveGearInput =
      slot.kind === 'item'
        ? { kind: 'item', slug: slot.item.slug }
        : { kind: 'manual', specs: slot.specs };
    setError(null);
    startTransition(async () => {
      const result = await saveMouseGear(input);
      if (result.ok) onSaved(result.gear);
      else setError(result.error);
    });
  };

  return (
    <div>
      <Button variant="secondary" onClick={save} disabled={isPending}>
        Simpan sebagai mouse gue
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
