'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { cancelReservationAction } from '@/app/akun/reservasi/actions';
import { Button } from '../button';
import { Notice } from '../notice';

const FAILED = 'Gagal membatalkan. Coba lagi sebentar.';

/** Tombol batal dengan dialog konfirmasi. Setelah berhasil, halaman dimuat ulang dari server. */
export function CancelReservation({ code }: { code: string }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const cancel = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await cancelReservationAction(code);
        dialog.current?.close();
        if (result.ok) router.refresh();
        else setError(result.error);
      } catch {
        dialog.current?.close();
        setError(FAILED);
      }
    });
  };

  return (
    <div className="space-y-2">
      <Button variant="secondary" onClick={() => dialog.current?.showModal()}>
        Batalkan reservasi
      </Button>
      {error && <Notice tone="error">{error}</Notice>}
      <dialog
        ref={dialog}
        aria-labelledby="batal-judul"
        className="m-auto w-[min(420px,calc(100vw-32px))] rounded-lg border border-border bg-surface p-5 text-ink backdrop:bg-ink/40"
      >
        <h2 id="batal-judul" className="font-display text-lg font-semibold">
          Batalkan reservasi ini?
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Unit demonya akan dilepas untuk pelanggan lain. Kalau mau ganti jadwal, buat reservasi
          baru setelah ini.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => dialog.current?.close()} disabled={pending}>
            Tidak
          </Button>
          <Button onClick={cancel} disabled={pending}>
            Ya, batalkan
          </Button>
        </div>
      </dialog>
    </div>
  );
}
