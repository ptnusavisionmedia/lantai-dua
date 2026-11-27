'use client';

import type { Tone } from '@lantai-dua/shared/catalog';
import {
  LIVE_TEXT,
  type LiveState,
  liveState,
  msUntilWibMidnight,
  wibDate,
} from '@lantai-dua/shared/reservation';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { Button } from '../button';
import { StatusLine } from '../catalog/status-line';

const TONE: Record<LiveState, Tone> = { live: 'ok', reconnecting: 'warn', offline: 'bad' };
const REFRESH_DELAY_MS = 1000;
const TICK_MS = 5000;

/**
 * Pembaruan langsung Hari ini (desain 1C-2 §5.6). Berlangganan perubahan tabel `reservations`
 * (RLS tetap berlaku), lalu memuat ulang data dari server setelah jeda singkat. Data juga dimuat
 * ulang saat tab kembali aktif, saat koneksi tersambung lagi, dan tepat setelah tengah malam WIB,
 * supaya layar yang dibiarkan menyala semalaman berganti ke hari baru.
 */
export function LiveRefresh({ today }: { today: string }) {
  const router = useRouter();
  const [state, setState] = useState<LiveState>('reconnecting');
  const [announcement, setAnnouncement] = useState('');
  // Tanggal dibaca lewat ref, supaya pergantian hari tidak memasang ulang langganan.
  const todayRef = useRef(today);
  useEffect(() => {
    todayRef.current = today;
  }, [today]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    // Setelah dilepas, callback yang terlambat datang diabaikan.
    let active = true;
    let refreshTimer: number | undefined;
    let midnightTimer: number | undefined;
    let status = 'CONNECTING';
    let notLiveSince: number | null = Date.now();
    let wasLive = false;
    let fresh = 0;

    const update = () =>
      setState(liveState(status, notLiveSince === null ? 0 : Date.now() - notLiveSince));
    const refreshSoon = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        router.refresh();
        if (fresh > 0) {
          setAnnouncement(`${fresh} reservasi baru`);
          fresh = 0;
        }
      }, REFRESH_DELAY_MS);
    };

    // Topik unik per pemasangan: klien browser dipakai bersama satu tab, dan channel lama dengan
    // topik yang sama bisa masih dalam proses keluar saat komponen dipasang lagi.
    const channel = supabase
      .channel(`operator-hari-ini-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, (p) => {
        if (!active) return;
        const startsAt = (p.new as { starts_at?: string } | null)?.starts_at;
        if (
          p.eventType === 'INSERT' &&
          startsAt &&
          wibDate(new Date(startsAt)) === todayRef.current
        ) {
          fresh += 1;
        }
        refreshSoon();
      });

    // Realtime harus memakai token sesi operator. Tanpa itu koneksinya dianggap tamu, dan RLS
    // menyaring semua perubahan reservasi.
    void (async () => {
      const { data } = await supabase.auth.getSession();
      await supabase.realtime.setAuth(data.session?.access_token ?? null);
      if (!active) return;
      channel.subscribe((next) => {
        if (!active) return;
        status = next;
        if (next === 'SUBSCRIBED') {
          // Tersambung lagi setelah putus: perubahan selama putus belum terlihat.
          if (wasLive) router.refresh();
          wasLive = true;
          notLiveSince = null;
        } else if (notLiveSince === null) {
          notLiveSince = Date.now();
        }
        update();
      });
    })();

    const tick = window.setInterval(update, TICK_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    // Muat ulang sedikit setelah tengah malam WIB, lalu jadwalkan lagi untuk malam berikutnya.
    const scheduleMidnight = () => {
      midnightTimer = window.setTimeout(() => {
        router.refresh();
        scheduleMidnight();
      }, msUntilWibMidnight(new Date()) + 1000);
    };
    scheduleMidnight();

    return () => {
      active = false;
      window.clearTimeout(refreshTimer);
      window.clearTimeout(midnightTimer);
      window.clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisible);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusLine tone={TONE[state]} text={LIVE_TEXT[state]} />
      {state === 'offline' && (
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Muat ulang
        </Button>
      )}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
