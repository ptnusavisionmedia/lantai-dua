import type { ReactNode } from 'react';

const TONE = {
  error: 'bg-danger-soft text-danger',
  info: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
} as const;

/** Pesan di atas formulir. `error` diumumkan ke pembaca layar sebagai alert, sisanya sebagai status. */
export function Notice({ tone, children }: { tone: keyof typeof TONE; children: ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-md px-3 py-2.5 text-sm font-medium ${TONE[tone]}`}
    >
      {children}
    </p>
  );
}
