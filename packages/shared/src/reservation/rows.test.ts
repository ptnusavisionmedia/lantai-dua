import { describe, expect, it } from 'vitest';
import {
  fromOperatorRow,
  fromReservableRow,
  fromReservationRow,
  fromSettingsRow,
  fromSlotRow,
} from './rows';

describe('rows', () => {
  it('maps a reservable variant', () => {
    expect(
      fromReservableRow({
        variant_id: 'v1',
        sku: 'L2-VTX-IGNIXF1-WHT',
        variant_name: 'Putih',
        product_slug: 'vortexseries-ignix-f1',
        model_name: 'Ignix F1',
        brand_name: 'VortexSeries',
        category_slug: 'mouse',
        category_name: 'Mouse',
        category_sort: 1001,
        area_id: 'a1',
        area_name: 'Meja Kontrol',
        assignable_units: 1,
        servicing_units: 0,
      }),
    ).toEqual({
      id: 'v1',
      sku: 'L2-VTX-IGNIXF1-WHT',
      name: 'Putih',
      productSlug: 'vortexseries-ignix-f1',
      productName: 'VortexSeries Ignix F1',
      categorySlug: 'mouse',
      categoryName: 'Mouse',
      categorySort: 1001,
      areaId: 'a1',
      areaName: 'Meja Kontrol',
      assignableUnits: 1,
      servicingUnits: 0,
    });
  });

  it('maps a slot with its WIB date and time', () => {
    expect(
      fromSlotRow({
        starts_at: '2026-11-27T17:00:00+00:00',
        ends_at: '2026-11-27T17:30:00+00:00',
        available: false,
        reason: 'unit_taken',
        reason_variant_id: 'v1',
      }),
    ).toEqual({
      startsAt: '2026-11-27T17:00:00+00:00',
      endsAt: '2026-11-27T17:30:00+00:00',
      date: '2026-11-28',
      time: '00.00',
      available: false,
      reason: 'unit_taken',
      reasonVariantId: 'v1',
    });
  });

  it('narrows an unknown slot reason to a safe one', () => {
    const slot = fromSlotRow({
      starts_at: '2026-11-28T07:00:00Z',
      ends_at: '2026-11-28T07:30:00Z',
      available: false,
      reason: 'aneh',
      reason_variant_id: null as unknown as string,
    });
    expect(slot).toMatchObject({ available: false, reason: 'desk_full', reasonVariantId: null });
  });

  it('maps store settings', () => {
    expect(
      fromSettingsRow({
        session_minutes: 30,
        min_lead_minutes: 60,
        max_days_ahead: 14,
        max_active_reservations: 2,
        cancel_cutoff_minutes: 60,
        checkin_open_minutes: 60,
        no_show_after_minutes: 15,
      }),
    ).toEqual({
      sessionMinutes: 30,
      minLeadMinutes: 60,
      maxDaysAhead: 14,
      maxActiveReservations: 2,
      cancelCutoffMinutes: 60,
      checkinOpenMinutes: 60,
      noShowAfterMinutes: 15,
    });
  });

  it('maps a reservation with its items and area', () => {
    expect(
      fromReservationRow({
        id: 'r1',
        code: 'L2D-H7K3QX9P',
        status: 'scheduled',
        starts_at: '2026-11-28T07:00:00Z',
        ends_at: '2026-11-28T07:30:00Z',
        note: null,
        cancel_reason: null,
        reservation_items: [
          {
            variant: {
              name: 'Putih',
              product: { model_name: 'Ignix F1', brand: { name: 'VortexSeries' } },
            },
            unit: { code: 'DM-M-001', area: { name: 'Meja Kontrol' } },
          },
          { variant: null, unit: null },
        ],
      }),
    ).toEqual({
      id: 'r1',
      code: 'L2D-H7K3QX9P',
      status: 'scheduled',
      startsAt: '2026-11-28T07:00:00Z',
      endsAt: '2026-11-28T07:30:00Z',
      note: null,
      cancelReason: null,
      areaName: 'Meja Kontrol',
      items: [
        { name: 'VortexSeries Ignix F1 · Putih', unitCode: 'DM-M-001' },
        { name: 'Unit demo', unitCode: null },
      ],
    });
  });

  it('keeps the store cancel reason', () => {
    const r = fromReservationRow({
      id: 'r1',
      code: 'L2D-H7K3QX9P',
      status: 'cancelled',
      starts_at: '2026-11-28T07:00:00Z',
      ends_at: '2026-11-28T07:30:00Z',
      note: null,
      cancel_reason: 'Unit rusak',
      reservation_items: [],
    });
    expect(r.cancelReason).toBe('Unit rusak');
  });

  it('maps an operator row with contact, areas, and unique hygiene notes', () => {
    const headset = (code: string) => ({
      variant: {
        name: 'Standar',
        product: {
          model_name: 'Kumo GS1X Pro',
          brand: { name: 'dbE' },
          category: { hygiene_note: 'Pasang cover telinga.' },
        },
      },
      unit: { code, area: { name: 'Meja Kontrol' } },
    });
    const row = {
      id: 'r1',
      code: 'L2D-H7K3QX9P',
      status: 'scheduled' as const,
      starts_at: '2026-11-28T07:00:00Z',
      ends_at: '2026-11-28T07:30:00Z',
      note: 'Bawa mouse lama',
      cancel_reason: null,
      created_at: '2026-11-27T07:00:00Z',
      reservation_items: [
        headset('DM-H-001'),
        headset('DM-H-009'),
        {
          variant: {
            name: 'Putih',
            product: {
              model_name: 'Ignix F1',
              brand: { name: 'VortexSeries' },
              category: { hygiene_note: null },
            },
          },
          unit: { code: 'DM-M-001', area: null },
        },
      ],
    };
    expect(fromOperatorRow(row, { full_name: 'Raka Pratama', whatsapp: '6281234500001' })).toEqual({
      id: 'r1',
      code: 'L2D-H7K3QX9P',
      status: 'scheduled',
      startsAt: '2026-11-28T07:00:00Z',
      endsAt: '2026-11-28T07:30:00Z',
      note: 'Bawa mouse lama',
      cancelReason: null,
      areaName: 'Meja Kontrol',
      createdAt: '2026-11-27T07:00:00Z',
      customerName: 'Raka Pratama',
      whatsapp: '6281234500001',
      hygieneNotes: ['Pasang cover telinga.'],
      items: [
        { name: 'dbE Kumo GS1X Pro · Standar', unitCode: 'DM-H-001', areaName: 'Meja Kontrol' },
        { name: 'dbE Kumo GS1X Pro · Standar', unitCode: 'DM-H-009', areaName: 'Meja Kontrol' },
        { name: 'VortexSeries Ignix F1 · Putih', unitCode: 'DM-M-001', areaName: null },
      ],
    });
    const anonymous = fromOperatorRow(row, undefined);
    expect(anonymous.customerName).toBe('Pelanggan');
    expect(anonymous.whatsapp).toBeNull();
    expect(fromOperatorRow(row, { full_name: '  ', whatsapp: null }).customerName).toBe(
      'Pelanggan',
    );
  });
});
