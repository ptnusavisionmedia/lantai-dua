'use client';

import { CODE_INVALID, normalizeReservationCode } from '@lantai-dua/shared/reservation';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { Button } from '../button';
import { TextField } from '../text-field';

const FIELD_ID = 'field-kode';

/**
 * Kolom kode reservasi (desain 1C-2 §5.2). Alat scan genggam bekerja seperti keyboard dan menekan
 * Enter sendiri. Di layar lebar kolom difokus otomatis; di HP tidak, supaya keyboard tidak muncul.
 */
export function CodeSearch({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      document.getElementById(FIELD_ID)?.focus();
    }
  }, []);

  return (
    <search aria-label="Cari reservasi" className="block">
      <form
        className="flex max-w-[640px] flex-wrap items-start gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const code = normalizeReservationCode(value);
          if (!code) {
            setError(CODE_INVALID);
            return;
          }
          setError(null);
          router.push(`/operator/reservasi/${code}`);
        }}
      >
        <div className="min-w-0 flex-1 basis-[240px]">
          <TextField
            label="Kode reservasi"
            name="kode"
            placeholder="Kode reservasi atau scan QR"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            error={error ?? undefined}
          />
        </div>
        <div className="flex gap-2 pt-[26px]">
          <Button type="submit">Buka</Button>
          {children}
        </div>
      </form>
    </search>
  );
}
