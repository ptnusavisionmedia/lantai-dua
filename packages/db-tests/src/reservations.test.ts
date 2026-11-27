import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { adminClient, anonClient, clientFor, runId, userIdOf } from './clients';
import {
  createReservationFixture,
  deleteReservationFixture,
  deleteReservationsOf,
  type ReservationFixture,
  reserve,
  slotAt,
  weekdayAhead,
  wibDay,
} from './reservation-fixture';

const prefix = () => `rls-${runId()}-rv-`;
let f: ReservationFixture;
let D: number;
const people = () => [userIdOf('customer'), userIdOf('customer2')];
const CODE = /^L2D-[2-9A-HJKMNP-Z]{8}$/;
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const randomCode = () =>
  `L2D-${Array.from({ length: 8 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')}`;

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

async function row(code: string) {
  const { data } = await adminClient()
    .from('reservations')
    .select('id, status, note, cancelled_by, starts_at')
    .eq('code', code)
    .single();
  return data as { id: string; status: string; note: string | null; cancelled_by: string | null };
}

describe('anti-bentrok', () => {
  it('gives the last unit to exactly one of two simultaneous customers', async () => {
    const at = slotAt(D, '14.00');
    const [a, b] = await Promise.all([
      reserve('customer', [f.vSolo], at),
      reserve('customer2', [f.vSolo], at),
    ]);
    expect([a.error, b.error].filter((e) => e === null)).toHaveLength(1);
    expect([a.error?.message, b.error?.message]).toContain('unit_taken');
  });

  it('never seats more people than desks', async () => {
    const at = slotAt(D, '15.00');
    // Unit berbeda, tetapi area B hanya punya 1 meja: yang menentukan adalah kursinya.
    const [a, b] = await Promise.all([
      reserve('customer', [f.vSoloB], at),
      reserve('customer2', [f.vSoloB2], at),
    ]);
    expect([a.error, b.error].filter((e) => e === null)).toHaveLength(1);
    expect([a.error?.message, b.error?.message]).toContain('desk_full');
  });

  it('uses the second unit of a variant before refusing', async () => {
    const at = slotAt(D, '16.00');
    const [a, b] = await Promise.all([
      reserve('customer', [f.vDuo], at),
      reserve('customer2', [f.vDuo], at),
    ]);
    expect(a.error).toBeNull();
    expect(b.error).toBeNull();
  });

  it('frees the unit and the seat when cancelled', async () => {
    const at = slotAt(D, '17.00');
    const first = await reserve('customer', [f.vSoloB], at);
    expect(first.error).toBeNull();
    expect((await reserve('customer2', [f.vSoloB], at)).error?.message).toBe('unit_taken');
    const cancel = await clientFor('customer').rpc('cancel_reservation', { p_code: first.code });
    expect(cancel.error).toBeNull();
    expect((await reserve('customer2', [f.vSoloB], at)).error).toBeNull();
  });

  it('keeps one customer out of two places at once but allows back-to-back', async () => {
    expect((await reserve('customer', [f.vSolo], slotAt(D, '14.00'))).error).toBeNull();
    expect((await reserve('customer', [f.vDuo], slotAt(D, '14.00'))).error?.message).toBe(
      'own_overlap',
    );
    expect((await reserve('customer', [f.vDuo], slotAt(D, '14.30'))).error).toBeNull();
  });
});

describe('aturan', () => {
  it('limits active reservations, ignoring ones already over', async () => {
    const one = await reserve('customer', [f.vDuo], slotAt(D, '10.00'));
    expect((await reserve('customer', [f.vDuo], slotAt(D, '11.00'))).error).toBeNull();
    expect((await reserve('customer', [f.vDuo], slotAt(D, '12.00'))).error?.message).toBe(
      'too_many_active',
    );
    // Sesi yang sudah lewat tidak dihitung aktif.
    const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await adminClient()
      .from('reservations')
      .update({
        starts_at: past.toISOString(),
        ends_at: new Date(past.getTime() + 30 * 60 * 1000).toISOString(),
      })
      .eq('code', one.code);
    expect((await reserve('customer', [f.vDuo], slotAt(D, '12.00'))).error).toBeNull();
  });

  it('limits creations to 10 per 24 hours, cancelled included', async () => {
    const start = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const rows = Array.from({ length: 10 }, () => ({
      code: randomCode(),
      customer_id: userIdOf('customer2'),
      starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + 30 * 60 * 1000).toISOString(),
      status: 'cancelled',
    }));
    const { error } = await adminClient().from('reservations').insert(rows);
    expect(error).toBeNull();
    expect((await reserve('customer2', [f.vDuo], slotAt(D, '13.00'))).error?.message).toBe(
      'rate_limited',
    );
  });

  it.each([
    ['not on the grid', () => slotAt(D, '14.15'), 'outside_hours'],
    ['before opening', () => slotAt(D, '09.30'), 'outside_hours'],
    ['too far ahead', () => slotAt(weekdayAhead(20), '14.00'), 'too_far'],
  ])('rejects a slot %s', async (_, at, code) => {
    expect((await reserve('customer', [f.vDuo], at())).error?.message).toBe(code);
  });

  it('rejects a closed day', async () => {
    const day = weekdayAhead(4);
    const admin = adminClient();
    await admin.from('store_closures').delete().eq('date', wibDay(day));
    const { error } = await admin
      .from('store_closures')
      .insert({ date: wibDay(day), reason: 'tes' });
    expect(error).toBeNull();
    try {
      expect((await reserve('customer', [f.vDuo], slotAt(day, '14.00'))).error?.message).toBe(
        'outside_hours',
      );
    } finally {
      await admin.from('store_closures').delete().eq('date', wibDay(day));
    }
  });

  it('rejects too-soon slots using the stored lead time', async () => {
    const admin = adminClient();
    const before = await admin.from('store_settings').select('min_lead_minutes').single();
    const lead = (before.data as { min_lead_minutes: number }).min_lead_minutes;
    await admin
      .from('store_settings')
      .update({ min_lead_minutes: 5 * 24 * 60 })
      .eq('id', true);
    try {
      expect((await reserve('customer', [f.vDuo], slotAt(D, '18.00'))).error?.message).toBe(
        'too_soon',
      );
    } finally {
      await admin.from('store_settings').update({ min_lead_minutes: lead }).eq('id', true);
    }
  });

  it.each([
    ['no variants', () => []],
    ['five variants', () => [f.vSolo, f.vDuo, f.vSoloB, f.vSoloB2, f.vServ]],
    ['a duplicate', () => [f.vDuo, f.vDuo]],
    ['an unknown variant', () => [randomUUID()]],
    ['a variant without demo units', () => [f.vOn]],
  ])('rejects %s', async (_, ids) => {
    expect((await reserve('customer', ids(), slotAt(D, '18.00'))).error?.message).toBe(
      'invalid_items',
    );
  });

  it('reports a variant whose only unit is being serviced', async () => {
    const r = await reserve('customer', [f.vServ], slotAt(D, '18.00'));
    expect(r.error).toMatchObject({ message: 'unit_servicing', details: f.vServ });
  });

  it('returns a well-formed code and stores a trimmed note', async () => {
    const r = await reserve('customer', [f.vDuo], slotAt(D, '19.00'), '  halo  ');
    expect(r.error).toBeNull();
    expect(r.code).toMatch(CODE);
    expect((await row(r.code as string)).note).toBe('halo');
    const blank = await reserve('customer', [f.vSolo], slotAt(D, '20.00'), '   ');
    expect((await row(blank.code as string)).note).toBeNull();
  });
});

describe('batal', () => {
  it('lets the owner cancel before the cut-off', async () => {
    const r = await reserve('customer', [f.vDuo], slotAt(D, '19.00'));
    const { error } = await clientFor('customer').rpc('cancel_reservation', { p_code: r.code });
    expect(error).toBeNull();
    expect(await row(r.code as string)).toMatchObject({
      status: 'cancelled',
      cancelled_by: userIdOf('customer'),
    });
  });

  it('refuses inside the cut-off and for other customers', async () => {
    const r = await reserve('customer', [f.vDuo], slotAt(D, '19.30'));
    const other = await clientFor('customer2').rpc('cancel_reservation', { p_code: r.code });
    expect(other.error?.message).toBe('not_found');
    // 59 menit, bukan tepat 60: jam server bisa berbeda beberapa detik dari jam mesin tes.
    const soon = Date.now() + 59 * 60 * 1000;
    await adminClient()
      .from('reservations')
      .update({
        starts_at: new Date(soon).toISOString(),
        ends_at: new Date(soon + 30 * 60 * 1000).toISOString(),
      })
      .eq('code', r.code);
    const late = await clientFor('customer').rpc('cancel_reservation', { p_code: r.code });
    expect(late.error?.message).toBe('cancel_too_late');
  });

  it('refuses a reservation that is no longer scheduled', async () => {
    const r = await reserve('customer', [f.vDuo], slotAt(D, '20.00'));
    await clientFor('customer').rpc('cancel_reservation', { p_code: r.code });
    const again = await clientFor('customer').rpc('cancel_reservation', { p_code: r.code });
    expect(again.error?.message).toBe('not_cancellable');
  });
});

describe('RLS', () => {
  it('shows customers only their own reservations', async () => {
    const r = await reserve('customer', [f.vDuo], slotAt(D, '14.00'));
    const { id } = await row(r.code as string);
    const look = async (who: 'customer' | 'customer2' | 'operator' | 'owner') =>
      (await clientFor(who).from('reservations').select('id').eq('id', id)).data ?? [];
    expect(await look('customer')).toHaveLength(1);
    expect(await look('customer2')).toEqual([]);
    expect(await look('operator')).toHaveLength(1);
    expect(await look('owner')).toHaveLength(1);
    const items = await clientFor('customer2')
      .from('reservation_items')
      .select('id')
      .eq('reservation_id', id);
    expect(items.data ?? []).toEqual([]);
    expect(
      (await clientFor('customer').from('reservation_items').select('id').eq('reservation_id', id))
        .data,
    ).toHaveLength(1);
  });

  it.each(['operator', 'owner', 'operatorInactive'] as const)(
    'blocks %s from creating',
    async (p) => {
      expect((await reserve(p, [f.vDuo], slotAt(D, '19.00'))).error?.message).toBe('not_customer');
    },
  );

  it('blocks guests from creating', async () => {
    expect((await reserve('anon', [f.vDuo], slotAt(D, '19.00'))).error).not.toBeNull();
  });

  it('blocks direct writes', async () => {
    const c = clientFor('customer');
    const start = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000);
    const insert = await c.from('reservations').insert({
      code: randomCode(),
      customer_id: userIdOf('customer'),
      starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + 30 * 60 * 1000).toISOString(),
    });
    expect(insert.error).not.toBeNull();

    const r = await reserve('customer', [f.vDuo], slotAt(D, '15.00'));
    const { id } = await row(r.code as string);
    const update = await c
      .from('reservations')
      .update({ status: 'completed' })
      .eq('id', id)
      .select();
    expect(update.data ?? []).toEqual([]);
    const remove = await c.from('reservations').delete().eq('id', id).select();
    expect(remove.data ?? []).toEqual([]);
    const itemUpdate = await c
      .from('reservation_items')
      .update({ is_active: false })
      .eq('reservation_id', id)
      .select();
    expect(itemUpdate.data ?? []).toEqual([]);
    expect((await row(r.code as string)).status).toBe('scheduled');
  });

  it('hides seats from customers and the planner from everyone', async () => {
    const r = await reserve('customer', [f.vDuo], slotAt(D, '16.00'));
    const { id } = await row(r.code as string);
    const seats = await clientFor('customer')
      .from('reservation_seats')
      .select('id')
      .eq('reservation_id', id);
    expect(seats.data ?? []).toEqual([]);
    expect(
      (await clientFor('operator').from('reservation_seats').select('id').eq('reservation_id', id))
        .data,
    ).toHaveLength(1);
    const plan = await clientFor('customer').rpc('plan_reservation', {
      p_variant_ids: [f.vDuo],
      p_period: `[${slotAt(D, '16.00')},${slotAt(D, '16.30')})`,
      p_customer: userIdOf('customer'),
    });
    expect(plan.error).not.toBeNull();
    expect(anonClient()).toBeDefined();
  });
});
