import type { SupabaseClient } from '@supabase/supabase-js';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { adminClient, anonClient, clientFor, runId, userIdOf } from './clients';
import {
  createReservationFixture,
  deleteReservationFixture,
  deleteReservationsOf,
  type ReservationFixture,
  reserve,
  slotAt,
  toWibTime,
  weekdayAhead,
  wibDay,
} from './reservation-fixture';

type SlotRow = {
  starts_at: string;
  ends_at: string;
  available: boolean;
  reason: string | null;
  reason_variant_id: string | null;
};

const prefix = () => `rls-${runId()}-rs-`;
let f: ReservationFixture;
let D: number;
const people = () => [userIdOf('customer'), userIdOf('customer2')];

beforeAll(async () => {
  f = await createReservationFixture(adminClient(), prefix());
  D = weekdayAhead(2);
});
afterEach(async () => {
  await deleteReservationsOf(people());
});
afterAll(async () => {
  await deleteReservationsOf(people());
  await deleteReservationFixture(adminClient(), f);
});

async function slots(
  c: SupabaseClient,
  ids: string[],
  from = wibDay(D),
  to = from,
): Promise<SlotRow[]> {
  const { data, error } = await c.rpc('reservation_slots', {
    p_from: from,
    p_to: to,
    p_variant_ids: ids,
  });
  if (error) throw new Error(error.message);
  return data as SlotRow[];
}
const at = (rows: SlotRow[], hhmm: string) => rows.find((r) => toWibTime(r.starts_at) === hhmm);

describe('reservation_slots', () => {
  it('lays out the day on the session grid in WIB', async () => {
    const rows = await slots(anonClient(), []);
    // Senin–Sabtu di seed: 10.00–21.00, sesi 30 menit.
    expect(toWibTime(rows[0]?.starts_at ?? '')).toBe('10.00');
    expect(toWibTime(rows.at(-1)?.starts_at ?? '')).toBe('20.30');
    expect(rows).toHaveLength(22);
    expect(
      new Date(rows[0]?.ends_at ?? '').getTime() - new Date(rows[0]?.starts_at ?? '').getTime(),
    ).toBe(30 * 60 * 1000);
  });

  it('marks a taken unit only for that variant and slot', async () => {
    expect((await reserve('customer2', [f.vSolo], slotAt(D, '14.00'))).error).toBeNull();
    const rows = await slots(anonClient(), [f.vSolo, f.vDuo]);
    expect(at(rows, '14.00')).toMatchObject({
      available: false,
      reason: 'unit_taken',
      reason_variant_id: f.vSolo,
    });
    expect(at(rows, '14.30')).toMatchObject({ available: true, reason: null });
    expect(at(await slots(anonClient(), [f.vDuo]), '14.00')).toMatchObject({ available: true });
  });

  it('reports a full desk', async () => {
    expect((await reserve('customer2', [f.vSoloB], slotAt(D, '15.00'))).error).toBeNull();
    expect(at(await slots(anonClient(), [f.vSoloB2]), '15.00')).toMatchObject({
      available: false,
      reason: 'desk_full',
      reason_variant_id: null,
    });
  });

  it('reports a serviced-only variant on every slot', async () => {
    const rows = await slots(anonClient(), [f.vServ, f.vDuo]);
    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every((r) => r.reason === 'unit_servicing' && r.reason_variant_id === f.vServ),
    ).toBe(true);
  });

  it('tells a customer about their own booking, but never a guest', async () => {
    expect((await reserve('customer', [f.vDuo], slotAt(D, '16.00'))).error).toBeNull();
    expect(at(await slots(clientFor('customer'), [f.vSolo]), '16.00')?.reason).toBe('own_overlap');
    expect(at(await slots(anonClient(), [f.vSolo]), '16.00')?.reason).toBeNull();
    expect(at(await slots(clientFor('customer2'), [f.vSolo]), '16.00')?.reason).toBeNull();
  });

  it('marks a closed day with a single row', async () => {
    const day = weekdayAhead(4);
    const admin = adminClient();
    await admin.from('store_closures').delete().eq('date', wibDay(day));
    await admin.from('store_closures').insert({ date: wibDay(day), reason: 'tes' });
    try {
      const rows = await slots(anonClient(), [f.vDuo], wibDay(day));
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ available: false, reason: 'closed' });
      expect(toWibTime(rows[0]?.starts_at ?? '')).toBe('00.00');
    } finally {
      await admin.from('store_closures').delete().eq('date', wibDay(day));
    }
  });

  it('marks past and too-soon slots today', async () => {
    const rows = await slots(anonClient(), [], wibDay(0));
    const now = Date.now();
    for (const r of rows) {
      if (r.reason === 'closed') continue;
      const start = new Date(r.starts_at).getTime();
      // Selisih beberapa detik antara jam server dan mesin tes diabaikan.
      if (start < now - 5_000) expect(r.reason, r.starts_at).toBe('past');
      else if (start > now + 5_000 && start < now + 55 * 60 * 1000)
        expect(r.reason, r.starts_at).toBe('too_soon');
    }
  });

  it('uses the stored lead time', async () => {
    const admin = adminClient();
    const before = await admin.from('store_settings').select('min_lead_minutes').single();
    const lead = (before.data as { min_lead_minutes: number }).min_lead_minutes;
    await admin
      .from('store_settings')
      .update({ min_lead_minutes: 5 * 24 * 60 })
      .eq('id', true);
    try {
      expect((await slots(anonClient(), [f.vDuo])).every((r) => r.reason === 'too_soon')).toBe(
        true,
      );
    } finally {
      await admin.from('store_settings').update({ min_lead_minutes: lead }).eq('id', true);
    }
  });

  it('cuts the window at max_days_ahead + 1 days and marks days beyond it', async () => {
    const rows = await slots(anonClient(), [], wibDay(0), wibDay(30));
    const days = new Set(rows.map((r) => wibDayOf(r.starts_at)));
    expect(days.size).toBeLessThanOrEqual(15);
    const far = await slots(anonClient(), [], wibDay(weekdayAhead(16)));
    expect(far.every((r) => r.reason === 'too_far')).toBe(true);
  });

  it('ignores unknown ids and keeps at most four variants', async () => {
    const rows = await slots(anonClient(), [
      '00000000-0000-0000-0000-000000000000',
      f.vDuo,
      f.vDuo,
      f.vSolo,
      f.vSoloB,
      f.vSoloB2,
      f.vServ,
    ]);
    // vServ adalah varian kelima yang unik, jadi dipotong dan tidak membuat slot "diservis".
    expect(rows.some((r) => r.reason === 'unit_servicing')).toBe(false);
  });

  it('returns no personal data', async () => {
    expect((await reserve('customer2', [f.vSolo], slotAt(D, '17.00'))).error).toBeNull();
    const row = at(await slots(anonClient(), [f.vSolo]), '17.00');
    expect(Object.keys(row ?? {}).sort()).toEqual(
      ['available', 'ends_at', 'reason', 'reason_variant_id', 'starts_at'].sort(),
    );
  });
});

describe('reservable_variants', () => {
  it('lists reservable variants with unit counts', async () => {
    const { data, error } = await anonClient().rpc('reservable_variants');
    expect(error).toBeNull();
    const rows = data as {
      variant_id: string;
      sku: string;
      assignable_units: number;
      servicing_units: number;
      area_id: string;
    }[];
    expect(rows.find((r) => r.variant_id === f.vServ)).toMatchObject({
      assignable_units: 0,
      servicing_units: 1,
    });
    expect(rows.find((r) => r.variant_id === f.vDuo)).toMatchObject({
      assignable_units: 2,
      servicing_units: 0,
      area_id: f.areaA,
    });
    // Varian tanpa unit demo (vOn dari fixture katalog) tidak muncul.
    expect(rows.some((r) => r.variant_id === f.vOn)).toBe(false);
  });

  it('keeps the internal unit list out of the API', async () => {
    for (const c of [anonClient(), clientFor('customer'), clientFor('operator')]) {
      const { error } = await c.from('reservable_unit_list').select('unit_id').limit(1);
      expect(error).not.toBeNull();
    }
  });

  it('drops variants once their product is inactive', async () => {
    const admin = adminClient();
    const { data: v } = await admin
      .from('product_variants')
      .select('product_id')
      .eq('id', f.vDuo)
      .single();
    const productId = (v as { product_id: string }).product_id;
    await admin.from('products').update({ is_active: false }).eq('id', productId);
    try {
      const rows = (await anonClient().rpc('reservable_variants')).data as { variant_id: string }[];
      expect(rows.some((r) => r.variant_id === f.vDuo)).toBe(false);
    } finally {
      await admin.from('products').update({ is_active: true }).eq('id', productId);
    }
  });
});

function wibDayOf(iso: string): string {
  return new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
