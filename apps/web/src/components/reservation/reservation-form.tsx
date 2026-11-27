'use client';

import {
  createErrorText,
  type ReservableVariant,
  type ReservationQuery,
  type ReservationSettings,
  type Slot,
  serializeReservationQuery,
  slotReasonText,
} from '@lantai-dua/shared/reservation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { createReservationAction } from '@/app/(public)/reservasi/baru/actions';
import type { ReservationViewer } from '@/lib/reservation-data';
import { Button, buttonClasses } from '../button';
import { Notice } from '../notice';
import { DateStrip } from './date-strip';
import { SlotGrid } from './slot-grid';
import { VariantPicker } from './variant-picker';

const BASE_PATH = '/reservasi/baru';
const NOTE_KEY = 'l2-reservasi-catatan';
const SAVE_FAILED = 'Gagal menyimpan. Coba lagi sebentar.';

function readNote(): string {
  try {
    return window.sessionStorage.getItem(NOTE_KEY) ?? '';
  } catch {
    return '';
  }
}
function writeNote(value: string | null): void {
  try {
    if (value === null) window.sessionStorage.removeItem(NOTE_KEY);
    else window.sessionStorage.setItem(NOTE_KEY, value);
  } catch {
    // Penyimpanan browser bisa diblokir; catatan cukup hilang.
  }
}

/**
 * Formulir reservasi (desain 1C-1 §5.1). Varian datang dari URL dan slot dihitung server untuk
 * seluruh jendela tanggal, jadi berganti tanggal atau jam tidak perlu ke server. Berganti varian
 * memakai router.replace supaya server menghitung ulang slot.
 */
export function ReservationForm({
  variants,
  slots,
  settings,
  today,
  window: dates,
  query,
  viewer,
  atLimit = false,
}: {
  variants: ReservableVariant[];
  slots: Slot[];
  settings: ReservationSettings;
  today: string;
  window: string[];
  query: ReservationQuery;
  viewer: ReservationViewer;
  /** Pelanggan sudah punya reservasi aktif sebanyak batas toko. */
  atLimit?: boolean;
}) {
  const router = useRouter();
  const [routing, startRouting] = useTransition();
  const [saving, startSaving] = useTransition();
  const [date, setDate] = useState(query.tanggal ?? today);
  const [jam, setJam] = useState<string | null>(query.jam);
  const [pendingSkus, setPendingSkus] = useState<string[] | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const skus = pendingSkus ?? query.skus;

  // Catatan hanya hidup di tab ini (desain §5.1), dibaca setelah mount.
  useEffect(() => {
    setNote(readNote());
  }, []);
  // Setelah router.replace selesai, URL (dan props) kembali menjadi sumber varian.
  const skuKey = query.skus.join(',');
  const [seenSkus, setSeenSkus] = useState(skuKey);
  if (seenSkus !== skuKey) {
    setSeenSkus(skuKey);
    setPendingSkus(null);
  }

  const daySlots = useMemo(() => slots.filter((s) => s.date === date), [slots, date]);
  const closedDates = useMemo(() => {
    const closed = new Set<string>();
    for (const d of dates) {
      const own = slots.filter((s) => s.date === d);
      if (own.length > 0 && own.every((s) => s.reason === 'closed')) closed.add(d);
    }
    return closed;
  }, [slots, dates]);
  const selected = daySlots.find((s) => s.time === jam && s.available) ?? null;

  const urlFor = (next: { skus?: string[]; tanggal?: string; jam?: string | null }) =>
    `${BASE_PATH}${serializeReservationQuery({
      skus: next.skus ?? skus,
      tanggal: next.tanggal ?? date,
      jam: next.jam === undefined ? jam : next.jam,
      bawa: query.bawa,
    })}`;

  const changeSkus = (next: string[]) => {
    setError(null);
    setPendingSkus(next);
    startRouting(() => router.replace(urlFor({ skus: next }), { scroll: false }));
  };
  const changeDate = (next: string) => {
    setDate(next);
    setJam(null);
    window.history.replaceState(null, '', urlFor({ tanggal: next, jam: null }));
  };
  const changeJam = (next: string) => {
    setJam(next);
    window.history.replaceState(null, '', urlFor({ jam: next }));
  };
  const changeNote = (value: string) => {
    setNote(value);
    writeNote(value);
  };

  const confirm = () => {
    if (!selected) return;
    setError(null);
    startSaving(async () => {
      try {
        const result = await createReservationAction({ skus, startsAt: selected.startsAt, note });
        if (result.ok) {
          writeNote(null);
          router.push(`/akun/reservasi/${result.code}?baru=1`);
        } else {
          setError(result.error);
          router.refresh();
        }
      } catch {
        setError(SAVE_FAILED);
      }
    });
  };

  const reasonText = (s: Slot) => slotReasonText(s, variants, settings);
  const blocked = atLimit
    ? createErrorText('too_many_active', null, settings)
    : skus.length === 0
      ? 'Pilih minimal satu unit demo.'
      : selected
        ? null
        : 'Pilih jam yang masih kosong.';

  return (
    <div className="space-y-8">
      <div>
        <VariantPicker variants={variants} selected={skus} onChange={changeSkus} />
        {query.bawa && (
          <p className="mt-3 max-w-[60ch] text-sm text-ink-muted">
            Mouse lama lu nggak ada di showroom? Bawa aja dari rumah biar bisa dibandingin langsung.
          </p>
        )}
      </div>

      <DateStrip
        window={dates}
        today={today}
        closedDates={closedDates}
        value={date}
        onChange={changeDate}
      />
      <SlotGrid
        slots={daySlots}
        value={jam}
        reasonText={reasonText}
        onChange={changeJam}
        busy={routing}
      />

      <div className="grid max-w-[640px] gap-1.5">
        <label htmlFor="catatan" className="font-display text-sm font-semibold text-ink">
          Catatan
        </label>
        <textarea
          id="catatan"
          maxLength={500}
          rows={3}
          value={note}
          onChange={(e) => changeNote(e.target.value)}
          placeholder="Opsional"
          className="rounded-md border border-border-input bg-surface px-3 py-2 text-base text-ink"
        />
      </div>

      <div className="space-y-3">
        {error && <Notice tone="error">{error}</Notice>}
        {viewer === 'guest' && (
          <Link
            href={`/masuk?next=${encodeURIComponent(urlFor({}))}`}
            className={buttonClasses('demo')}
          >
            Masuk untuk konfirmasi
          </Link>
        )}
        {viewer === 'other' && (
          <p className="text-ink-muted">Reservasi dibuat dari akun pelanggan.</p>
        )}
        {viewer === 'customer' && (
          <>
            <Button
              variant="demo"
              onClick={confirm}
              disabled={blocked !== null || saving || routing}
              aria-describedby={blocked ? 'konfirmasi-syarat' : undefined}
            >
              Konfirmasi reservasi
            </Button>
            {blocked && (
              <p id="konfirmasi-syarat" className="text-sm text-ink-muted">
                {blocked}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
