'use client';

import {
  CANCEL_REASON,
  cleanCancelReason,
  type ReservationSettings,
  staffErrorText,
} from '@lantai-dua/shared/reservation';
import { useId, useRef, useState } from 'react';
import { Button } from '../button';

/**
 * Batal oleh staf, dengan alasan wajib (desain 1C-2 §5.3). `onSubmit` mengembalikan pesan galat
 * dari database, atau null kalau berhasil.
 */
export function CancelDialog({
  settings,
  busy,
  onSubmit,
}: {
  settings: ReservationSettings;
  busy: boolean;
  onSubmit: (reason: string) => Promise<string | null>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanCancelReason(reason);
    if (!clean) {
      setError(staffErrorText('reason_required', settings));
      return;
    }
    setError(null);
    const failed = await onSubmit(clean);
    if (failed) {
      setError(failed);
      return;
    }
    dialog.current?.close();
    setReason('');
  };

  return (
    <>
      <Button variant="secondary" onClick={() => dialog.current?.showModal()}>
        Batalkan
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby={`${id}-judul`}
        className="m-auto w-[min(440px,calc(100vw-32px))] rounded-lg border border-border bg-surface p-5 text-ink backdrop:bg-ink/40"
      >
        <h2 id={`${id}-judul`} className="font-display text-lg font-semibold">
          Batalkan reservasi ini?
        </h2>
        <form onSubmit={submit} className="mt-4 grid gap-1.5">
          <label htmlFor={`${id}-alasan`} className="text-sm font-semibold text-ink">
            Alasan pembatalan
          </label>
          <textarea
            id={`${id}-alasan`}
            rows={3}
            maxLength={CANCEL_REASON.max}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-bantuan${error ? ` ${id}-galat` : ''}`}
            className={`rounded-md border bg-surface px-3 py-2 text-base text-ink ${
              error ? 'border-danger' : 'border-border-input'
            }`}
          />
          <p id={`${id}-bantuan`} className="text-[13px] text-ink-muted">
            Alasan ini tampil di halaman reservasi pelanggan.
          </p>
          {error && (
            <p id={`${id}-galat`} role="alert" className="text-[13px] font-medium text-danger">
              {error}
            </p>
          )}
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => dialog.current?.close()} disabled={busy}>
              Kembali
            </Button>
            <Button type="submit" disabled={busy}>
              Batalkan reservasi
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
