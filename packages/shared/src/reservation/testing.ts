import type { ReservableVariant, ReservationSettings, Slot } from './types';

export const SETTINGS: ReservationSettings = {
  sessionMinutes: 30,
  minLeadMinutes: 60,
  maxDaysAhead: 14,
  maxActiveReservations: 2,
  cancelCutoffMinutes: 60,
  checkinOpenMinutes: 60,
  noShowAfterMinutes: 15,
};

let counter = 0;

export function makeVariant(overrides: Partial<ReservableVariant> = {}): ReservableVariant {
  counter += 1;
  return {
    id: `var-${counter}`,
    sku: `SKU-${counter}`,
    name: 'Putih',
    productSlug: `produk-${counter}`,
    productName: `Merek Model ${counter}`,
    categorySlug: 'mouse',
    categoryName: 'Mouse',
    categorySort: 1001,
    areaId: 'area-1',
    areaName: 'Meja Kontrol',
    assignableUnits: 1,
    servicingUnits: 0,
    ...overrides,
  };
}

export function makeSlot(overrides: Partial<Slot> = {}): Slot {
  return {
    startsAt: '2026-11-30T07:00:00Z',
    endsAt: '2026-11-30T07:30:00Z',
    date: '2026-11-30',
    time: '14.00',
    available: true,
    reason: null,
    reasonVariantId: null,
    ...overrides,
  };
}
