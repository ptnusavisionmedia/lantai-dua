'use client';

import {
  type ReservationSettings,
  type ReservationStatus,
  STAFF_ACTION,
  type StaffAction,
  staffActions,
} from '@lantai-dua/shared/reservation';
import { useState, useTransition } from 'react';
import { runStaffAction } from '@/app/operator/actions';
import { useNow } from '@/lib/use-now';
import { Button } from '../button';
import { Notice } from '../notice';
import { CancelDialog } from './cancel-dialog';

const FAILED = 'Gagal menyimpan. Coba lagi sebentar.';

/**
 * Tombol aksi staf yang berlaku saat ini (desain 1C-2 §5.4), dihitung ulang setiap 30 detik.
 * Di linimasa tanpa Batalkan; di detail lengkap. Tombol urungkan tampil kecil di bawah.
 */
export function StaffActions({
  code,
  status,
  startsAt,
  endsAt,
  settings,
  nowIso,
  place,
}: {
  code: string;
  status: ReservationStatus;
  startsAt: string;
  endsAt: string;
  settings: ReservationSettings;
  nowIso: string;
  place: 'row' | 'detail';
}) {
  const now = useNow(nowIso, 30_000);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const actions = staffActions({ status, startsAt, endsAt }, settings, now);
  const main = actions.filter((a) => !STAFF_ACTION[a].minor && a !== 'cancel');
  const minor = actions.filter((a) => STAFF_ACTION[a].minor);
  const canCancel = place === 'detail' && actions.includes('cancel');
  if (actions.length === 0) return null;

  /** Menjalankan aksi; mengembalikan pesan galat atau null. */
  const perform = (action: StaffAction, reason?: string) =>
    new Promise<string | null>((resolve) => {
      startTransition(async () => {
        try {
          const result = await runStaffAction({ code, action, reason });
          resolve(result.ok ? null : result.error);
        } catch {
          resolve(FAILED);
        }
      });
    });

  const click = async (action: StaffAction) => {
    setError(null);
    setError(await perform(action));
  };

  return (
    <div className="space-y-2">
      {(main.length > 0 || canCancel) && (
        <div className="flex flex-wrap gap-2">
          {main.map((a) => (
            <Button
              key={a}
              variant={a === 'check_in' ? 'demo' : a === 'no_show' ? 'secondary' : 'primary'}
              onClick={() => click(a)}
              disabled={pending}
            >
              {STAFF_ACTION[a].label}
            </Button>
          ))}
          {canCancel && (
            <CancelDialog
              settings={settings}
              busy={pending}
              onSubmit={(reason) => perform('cancel', reason)}
            />
          )}
        </div>
      )}
      {minor.length > 0 && (
        <div className="flex flex-wrap gap-x-4">
          {minor.map((a) => (
            <Button key={a} variant="text" onClick={() => click(a)} disabled={pending}>
              {STAFF_ACTION[a].label}
            </Button>
          ))}
        </div>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
