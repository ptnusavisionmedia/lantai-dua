import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { adminClient, anonClient, clientFor, runId, userIdOf } from './clients';
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
  staffSet,
  weekdayAhead,
} from './reservation-fixture';

const prefix = () => `rls-${runId()}-st-`;
let f: ReservationFixture;
let D: number;
const people = () => [userIdOf('customer'), userIdOf('customer2')];

// Aturan check-in dan urungkan selesai memakai "hari sesi = hari ini (WIB)". Dekat tengah malam,
// sesi yang digeser beberapa menit bisa jatuh di hari lain, jadi tes itu dilewati.
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const minutesIntoWibDay = Math.floor(((Date.now() + WIB_OFFSET_MS) % 86_400_000) / 60_000);
const nearMidnight = minutesIntoWibDay < 35 || 24 * 60 - minutesIntoWibDay < 90;

// Slot asal di hari D. Setiap panggilan memakai slot berikutnya, supaya satu pelanggan tidak
// pernah punya dua reservasi di slot asal yang sama (own_overlap).
let nextSlot = 0;
function freshSlot(): string {
  const minutes = 10 * 60 + 30 * nextSlot;
  nextSlot += 1;
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return slotAt(D, `${hh}.${mm}`);
}

async function created(
  who: 'customer' | 'customer2',
  variant: string,
  at: string,
): Promise<string> {
  const r = await reserve(who, [variant], at);
  if (r.error || !r.code) throw new Error(`reservasi tes gagal: ${r.error?.message}`);
  return r.code;
}

/** Reservasi `customer` yang mulainya digeser ke sekarang + `startMin` menit. */
async function booked(startMin: number, variant?: string): Promise<string> {
  const code = await created('customer', variant ?? f.vDuo, freshSlot());
  await shiftReservation(code, minutesFromNow(startMin));
  return code;
}

/** Reservasi pada waktu tertentu (misalnya kemarin), milik `customer`. */
async function bookedAt(startsAt: Date, variant?: string): Promise<string> {
  const code = await created('customer', variant ?? f.vDuo, freshSlot());
  await shiftReservation(code, startsAt);
  return code;
}

/**
 * Dua reservasi yang tumpang tindih setelah digeser: `customer` (vDuo) dan `customer2` (vSolo),
 * dibuat di slot asal yang sama supaya nomor kursinya berbeda.
 */
async function bookedPair([a, b]: [number, number]): Promise<[string, string]> {
  const at = freshSlot();
  const first = await created('customer', f.vDuo, at);
  const second = await created('customer2', f.vSolo, at);
  await shiftReservation(first, minutesFromNow(a));
  await shiftReservation(second, minutesFromNow(b));
  return [first, second];
}

const yesterday = () => new Date(slotAt(-1, '14.00'));

async function row(code: string) {
  const { data, error } = await adminClient()
    .from('reservations')
    .select('id, status, cancel_reason, cancelled_by, cancelled_at')
    .eq('code', code)
    .single();
  if (error) throw new Error(error.message);
  return data as {
    id: string;
    status: string;
    cancel_reason: string | null;
    cancelled_by: string | null;
    cancelled_at: string | null;
  };
}

const errorOf = async (p: Promise<{ error: { message: string } | null }>) =>
  (await p).error?.message ?? null;

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

describe('check-in', () => {
  it.skipIf(nearMidnight)('opens 60 minutes before the session', async () => {
    const [early, onTime] = await bookedPair([61, 59]);
    expect(await errorOf(staffSet('operator', early, 'checked_in'))).toBe('checkin_too_early');
    expect(await errorOf(staffSet('operator', onTime, 'checked_in'))).toBeNull();
    expect((await row(onTime)).status).toBe('checked_in');
  });

  it('closes when the session ends', async () => {
    expect(await errorOf(staffSet('operator', await booked(-31), 'checked_in'))).toBe(
      'session_over',
    );
  });

  it('only opens on the day of the session (WIB)', async () => {
    const admin = adminClient();
    const { data } = await admin.from('store_settings').select('checkin_open_minutes').single();
    const original = (data as { checkin_open_minutes: number }).checkin_open_minutes;
    try {
      await admin
        .from('store_settings')
        .update({ checkin_open_minutes: 3 * 24 * 60 })
        .eq('id', true);
      const code = await bookedAt(new Date(slotAt(1, '14.00')));
      expect(await errorOf(staffSet('operator', code, 'checked_in'))).toBe('checkin_too_early');
    } finally {
      await admin.from('store_settings').update({ checkin_open_minutes: original }).eq('id', true);
    }
  });

  it('lets a customer marked no-show check in late', async () => {
    const code = await booked(-20);
    expect(await errorOf(staffSet('operator', code, 'no_show'))).toBeNull();
    expect(await errorOf(staffSet('operator', code, 'checked_in'))).toBeNull();
    expect((await row(code)).status).toBe('checked_in');
  });

  it.skipIf(nearMidnight)('undoes a check-in until the session ends', async () => {
    const [running, over] = await bookedPair([-5, -31]);
    expect(await errorOf(staffSet('operator', running, 'checked_in'))).toBeNull();
    expect(await errorOf(staffSet('operator', running, 'scheduled'))).toBeNull();
    expect((await row(running)).status).toBe('scheduled');
    await setStatusAsAdmin(over, 'checked_in');
    expect(await errorOf(staffSet('operator', over, 'scheduled'))).toBe('session_over');
  });
});

describe('tidak datang', () => {
  it('waits 15 minutes after the start', async () => {
    const [tooEarly, late] = await bookedPair([-14, -16]);
    expect(await errorOf(staffSet('operator', tooEarly, 'no_show'))).toBe('no_show_too_early');
    expect(await errorOf(staffSet('operator', late, 'no_show'))).toBeNull();
    expect((await row(late)).status).toBe('no_show');
  });

  it('frees the unit and the seat', async () => {
    const code = await booked(-20);
    expect(await errorOf(staffSet('operator', code, 'no_show'))).toBeNull();
    const { id } = await row(code);
    const admin = adminClient();
    const items = await admin
      .from('reservation_items')
      .select('is_active')
      .eq('reservation_id', id);
    const seats = await admin
      .from('reservation_seats')
      .select('is_active')
      .eq('reservation_id', id);
    expect(items.data?.length).toBeGreaterThan(0);
    expect(seats.data?.length).toBeGreaterThan(0);
    expect([...(items.data ?? []), ...(seats.data ?? [])].every((x) => x.is_active === false)).toBe(
      true,
    );
  });
});

describe('selesai', () => {
  it('needs a check-in first', async () => {
    expect(await errorOf(staffSet('operator', await booked(-5), 'completed'))).toBe(
      'invalid_transition',
    );
  });

  it.skipIf(nearMidnight)('can be undone on the day of the session only', async () => {
    const today = await booked(-5);
    expect(await errorOf(staffSet('operator', today, 'checked_in'))).toBeNull();
    expect(await errorOf(staffSet('operator', today, 'completed'))).toBeNull();
    expect(await errorOf(staffSet('operator', today, 'checked_in'))).toBeNull();
    expect((await row(today)).status).toBe('checked_in');

    const past = await bookedAt(yesterday());
    await setStatusAsAdmin(past, 'completed');
    expect(await errorOf(staffSet('operator', past, 'checked_in'))).toBe('session_over');
  });
});

describe('batal oleh staf', () => {
  it.each([[undefined], ['  ab  '], ['x'.repeat(201)]])(
    'needs a 3–200 character reason (%#)',
    async (reason) => {
      expect(await errorOf(staffSet('operator', await booked(90), 'cancelled', reason))).toBe(
        'reason_required',
      );
    },
  );

  it('stores the trimmed reason and who cancelled', async () => {
    const code = await booked(90);
    expect(
      await errorOf(staffSet('operator', code, 'cancelled', '  Unit sedang dibersihkan  ')),
    ).toBeNull();
    const r = await row(code);
    expect(r.status).toBe('cancelled');
    expect(r.cancel_reason).toBe('Unit sedang dibersihkan');
    expect(r.cancelled_by).toBe(userIdOf('operator'));
    expect(r.cancelled_at).not.toBeNull();
  });

  it('frees the unit for another customer at the same time', async () => {
    const at = slotAt(D, '15.00');
    const code = await created('customer', f.vSolo, at);
    expect(await errorOf(staffSet('operator', code, 'cancelled', 'Unit rusak'))).toBeNull();
    expect((await reserve('customer2', [f.vSolo], at)).error).toBeNull();
  });

  it('works from check-in and from unrecorded, but not after the session', async () => {
    const [running, over] = await bookedPair([-5, -31]);
    await setStatusAsAdmin(running, 'checked_in');
    expect(await errorOf(staffSet('operator', running, 'cancelled', 'Unit rusak'))).toBeNull();

    const forgotten = await bookedAt(yesterday());
    await setStatusAsAdmin(forgotten, 'unrecorded');
    expect(
      await errorOf(staffSet('operator', forgotten, 'cancelled', 'Toko tutup mendadak')),
    ).toBeNull();

    expect(await errorOf(staffSet('operator', over, 'cancelled', 'Unit rusak'))).toBe(
      'session_over',
    );
  });

  it('never revives a cancelled reservation', async () => {
    const code = await booked(-5);
    expect(await errorOf(staffSet('operator', code, 'cancelled', 'Unit rusak'))).toBeNull();
    expect(await errorOf(staffSet('operator', code, 'checked_in'))).toBe('invalid_transition');
    expect(await errorOf(staffSet('operator', code, 'scheduled'))).toBe('invalid_transition');
  });
});

describe('koreksi tidak tercatat', () => {
  it.each(['completed', 'no_show'])('corrects to %s', async (status) => {
    const code = await bookedAt(yesterday());
    await setStatusAsAdmin(code, 'unrecorded');
    expect(await errorOf(staffSet('operator', code, status))).toBeNull();
    expect((await row(code)).status).toBe(status);
  });
});

describe('siapa yang boleh', () => {
  it.each(['customer', 'operatorInactive'] as const)('blocks %s', async (p) => {
    expect(await errorOf(staffSet(p, await booked(-20), 'no_show'))).toBe('not_staff');
  });

  it('blocks guests', async () => {
    expect(await errorOf(staffSet('anon', await booked(-20), 'no_show'))).not.toBeNull();
  });

  it('lets the owner act and reports unknown codes', async () => {
    const code = await booked(-20);
    expect(await errorOf(staffSet('owner', code, 'no_show'))).toBeNull();
    expect(await errorOf(staffSet('operator', 'L2D-22222222', 'no_show'))).toBe('not_found');
  });

  it('lets only one of two simultaneous actions win', async () => {
    // Keduanya sah untuk reservasi Terjadwal 20 menit setelah mulai, di jam berapa pun.
    const code = await booked(-20);
    const [a, b] = await Promise.all([
      staffSet('operator', code, 'no_show'),
      staffSet('owner', code, 'cancelled', 'Pelanggan minta batal'),
    ]);
    expect([a.error, b.error].filter((e) => e === null)).toHaveLength(1);
    expect([a.error?.message, b.error?.message]).toContain('invalid_transition');
  });

  it('blocks direct status updates', async () => {
    const code = await booked(-5);
    const { data } = await clientFor('operator')
      .from('reservations')
      .update({ status: 'completed' })
      .eq('code', code)
      .select('id');
    expect(data ?? []).toEqual([]);
    expect((await row(code)).status).toBe('scheduled');
  });
});

describe('kontak pelanggan (O7)', () => {
  it('gives staff the name and WhatsApp of each reservation owner', async () => {
    const { id } = await row(await booked(90));
    const { data, error } = await clientFor('operator').rpc('reservation_contacts', {
      p_reservation_ids: [id],
    });
    expect(error).toBeNull();
    expect(data).toEqual([
      { reservation_id: id, full_name: 'Tes customer', whatsapp: '6281200000001' },
    ]);
  });

  it.each(['customer', 'operatorInactive'] as const)('refuses %s', async (p) => {
    const { id } = await row(await booked(90));
    const { error } = await clientFor(p).rpc('reservation_contacts', { p_reservation_ids: [id] });
    expect(error?.message).toBe('not_staff');
  });

  it('refuses more than 200 ids', async () => {
    const ids = Array.from({ length: 201 }, () => randomUUID());
    const { error } = await clientFor('operator').rpc('reservation_contacts', {
      p_reservation_ids: ids,
    });
    expect(error?.message).toBe('too_many_ids');
  });

  it('keeps profiles closed to operators', async () => {
    const { data } = await clientFor('operator')
      .from('profiles')
      .select('id')
      .eq('id', userIdOf('customer'));
    expect(data ?? []).toEqual([]);
  });

  it('is closed to guests', async () => {
    const { error } = await anonClient().rpc('reservation_contacts', {
      p_reservation_ids: [randomUUID()],
    });
    expect(error).not.toBeNull();
  });
});

describe('nomor WhatsApp wajib', () => {
  it('refuses a customer without a number', async () => {
    const admin = adminClient();
    try {
      await admin.from('profiles').update({ whatsapp: null }).eq('id', userIdOf('customer2'));
      expect((await reserve('customer2', [f.vDuo], slotAt(D, '18.00'))).error?.message).toBe(
        'whatsapp_required',
      );
    } finally {
      await admin
        .from('profiles')
        .update({ whatsapp: '6281200000002' })
        .eq('id', userIdOf('customer2'));
    }
  });
});
