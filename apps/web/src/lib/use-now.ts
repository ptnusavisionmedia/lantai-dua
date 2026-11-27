'use client';

import { useEffect, useState } from 'react';

/**
 * Jam sekarang yang diperbarui setiap `intervalMs`. Render pertama memakai jam server (`initialIso`)
 * supaya HTML server dan klien sama; setelah mount, jam browser yang dipakai.
 */
export function useNow(initialIso: string, intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date(initialIso));
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
