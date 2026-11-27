import { randomUUID } from 'node:crypto';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import { adminClient, clientFor, type Persona, realtimeFor, runId, userIdOf } from './clients';
import {
  createReservationFixture,
  deleteReservationFixture,
  deleteReservationsOf,
  minutesFromNow,
  type ReservationFixture,
  reserve,
  setStatusAsAdmin,
  shiftReservation,
  slotAt,
  weekdayAhead,
} from './reservation-fixture';

// Job asli juga berjalan setiap 15 menit di database dev, jadi tes hanya memeriksa status akhir,
// bukan jumlah baris yang diubah.

const prefix = () => `rls-${runId()}-ac-`;
let f: ReservationFixture;
let D: number;
const people = () => [userIdOf('customer'), userIdOf('customer2')];
let nextSlot = 0;

function freshSlot(): string {
  const minutes = 10 * 60 + 30 * nextSlot;
  nextSlot += 1;
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return slotAt(D, `${hh}.${mm}`);
}

async function created(who: 'customer' | 'customer2', variant: string, at: string) {
  const r = await reserve(who, [variant], at);
  if (r.error || !r.code) throw new Error(`reservasi tes gagal: ${r.error?.message}`);
  return r.code;
}

/** Dua reservasi (customer vSolo, customer2 vDuo) di slot asal yang sama, lalu digeser ke `startsAt`. */
async function pairAt(startsAt: Date): Promise<[string, string]> {
  const at = freshSlot();
  const a = await created('customer', f.vSolo, at);
  const b = await created('customer2', f.vDuo, at);
  await shiftReservation(a, startsAt);
  await shiftReservation(b, startsAt);
  return [a, b];
}

const yesterday = () => new Date(slotAt(-1, '14.00'));
const close = () => adminClient().rpc('close_overdue_reservations');

async function statusOf(code: string): Promise<string> {
  const { data } = await adminClient()
    .from('reservations')
    .select('status')
    .eq('code', code)
    .single();
  return (data as { status: string }).status;
}

beforeAll(async () => {
  f = await createReservationFixture(adminClient(), prefix());
  D = weekdayAhead(2);
});
afterEach(async () => {
  await deleteReservationsOf(people());
  nextSlot = 0;
});
afterAll(async () => {
  await deleteReservationsOf(people());
  await deleteReservationFixture(adminClient(), f);
});

it('completes check-ins and marks scheduled as unrecorded after closing time', async () => {
  const [checkedIn, forgotten] = await pairAt(yesterday());
  await setStatusAsAdmin(checkedIn, 'checked_in');
  expect((await close()).error).toBeNull();
  expect(await statusOf(checkedIn)).toBe('completed');
  expect(await statusOf(forgotten)).toBe('unrecorded');

  const { data: ids } = await adminClient()
    .from('reservations')
    .select('id')
    .in('code', [checkedIn, forgotten]);
  const { data: items } = await adminClient()
    .from('reservation_items')
    .select('is_active')
    .in(
      'reservation_id',
      (ids ?? []).map((r) => r.id),
    );
  expect(items?.length).toBe(2);
  expect(items?.every((i) => i.is_active === false)).toBe(true);
});

it('leaves sessions that ended less than two hours ago', async () => {
  const code = await created('customer', f.vSolo, freshSlot());
  await shiftReservation(code, minutesFromNow(-40));
  expect((await close()).error).toBeNull();
  expect(await statusOf(code)).toBe('scheduled');
});

it('leaves final statuses alone and gives the same result twice', async () => {
  const [cancelled, forgotten] = await pairAt(yesterday());
  await setStatusAsAdmin(cancelled, 'cancelled', {
    cancelled_at: new Date().toISOString(),
    cancel_reason: 'tes',
  });
  expect((await close()).error).toBeNull();
  expect((await close()).error).toBeNull();
  expect(await statusOf(cancelled)).toBe('cancelled');
  expect(await statusOf(forgotten)).toBe('unrecorded');
});

it('cannot be run by signed-in users', async () => {
  const { error } = await clientFor('owner').rpc('close_overdue_reservations');
  expect(error).not.toBeNull();
});

it('runs every 15 minutes and publishes reservations for realtime', async () => {
  const { data, error } = await adminClient().rpc('reservation_ops_check');
  expect(error).toBeNull();
  expect(data).toEqual([
    { job_schedule: '*/15 * * * *', job_active: true, realtime_published: true },
  ]);
});

type Listener = { client: SupabaseClient; channel: RealtimeChannel; ids: string[] };

async function listen(who: Persona): Promise<Listener> {
  const client = await realtimeFor(who);
  const ids: string[] = [];
  const channel = client
    .channel(`tes-${who}-${randomUUID()}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reservations' }, (p) => {
      ids.push((p.new as { id: string }).id);
    });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${who} tidak tersambung ke realtime`)),
      10_000,
    );
    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timer);
        resolve();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timer);
        reject(err ?? new Error(status));
      }
    });
  });
  return { client, channel, ids };
}

async function waitFor(check: () => boolean, ms: number): Promise<boolean> {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (check()) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return check();
}

it('sends reservation changes to staff but not to other customers', {
  timeout: 45_000,
}, async () => {
  const code = await created('customer', f.vSolo, freshSlot());
  const { data } = await adminClient().from('reservations').select('id').eq('code', code).single();
  const id = (data as { id: string }).id;

  const staff = await listen('operator');
  const other = await listen('customer2');
  try {
    // Beri realtime sedikit waktu setelah SUBSCRIBED sebelum ada perubahan.
    await new Promise((r) => setTimeout(r, 1500));
    await adminClient().from('reservations').update({ note: 'diubah tes realtime' }).eq('id', id);
    expect(await waitFor(() => staff.ids.includes(id), 10_000)).toBe(true);
    await new Promise((r) => setTimeout(r, 5000));
    expect(other.ids).not.toContain(id);
  } finally {
    for (const l of [staff, other]) {
      await l.client.removeChannel(l.channel);
      l.client.realtime.disconnect();
    }
  }
});
