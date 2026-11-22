import { describe, expect, it } from 'vitest';
import { adminClient, anonClient } from './clients';

const attributesOf = async (slug: string) => {
  const { data, error } = await anonClient()
    .from('category_attributes')
    .select('key, scope, type, options, categories!inner(slug)')
    .eq('categories.slug', slug);
  if (error) throw new Error(error.message);
  return data;
};

describe('structural seed', () => {
  it('seeds the six launch categories with their try mode', async () => {
    const { data } = await anonClient().from('categories').select('slug, try_mode');
    expect(Object.fromEntries((data ?? []).map((c) => [c.slug, c.try_mode]))).toMatchObject({
      mouse: 'unit',
      keyboard: 'unit',
      mousepad: 'free',
      glasspad: 'free',
      deskmat: 'free',
      headset: 'unit',
    });
  });

  it('groups categories into the three launch racks', async () => {
    const { data } = await anonClient()
      .from('categories')
      .select('slug, category_groups!inner(slug)')
      .in('slug', ['mouse', 'mousepad', 'headset']);
    const rack = Object.fromEntries(
      (data ?? []).map((c) => [c.slug, (c.category_groups as unknown as { slug: string }).slug]),
    );
    expect(rack).toEqual({ mouse: 'kontrol', mousepad: 'permukaan', headset: 'audio' });
  });

  it('gives mouse the template from the PRD', async () => {
    const attrs = await attributesOf('mouse');
    expect(attrs.map((a) => a.key).sort()).toEqual([
      'color',
      'connectivity',
      'height_mm',
      'length_mm',
      'sensor',
      'shape',
      'weight_g',
      'width_mm',
    ]);
    expect(attrs.find((a) => a.key === 'color')?.scope).toBe('variant');
    expect(attrs.find((a) => a.key === 'connectivity')?.options).toEqual([
      'Kabel',
      'Wireless 2.4 GHz',
      'Bluetooth',
    ]);
  });

  it('makes switch a variant attribute for keyboards', async () => {
    const attrs = await attributesOf('keyboard');
    expect(attrs.find((a) => a.key === 'switch_type')).toMatchObject({
      scope: 'variant',
      type: 'enum',
      options: ['Linear', 'Tactile', 'Clicky', 'Magnetic'],
    });
  });

  it('notes hygiene for headsets', async () => {
    const { data } = await anonClient()
      .from('categories')
      .select('hygiene_note')
      .eq('slug', 'headset')
      .single();
    expect(data?.hygiene_note).toBe('Pasang cover telinga sekali pakai sebelum dipakai pelanggan.');
  });

  it('seeds the two launch demo areas', async () => {
    const { data } = await anonClient()
      .from('demo_areas')
      .select('slug, kind, capacity, is_reservable')
      .in('slug', ['meja-kontrol', 'meja-permukaan'])
      .order('sort_order');
    expect(data).toEqual([
      { slug: 'meja-kontrol', kind: 'desk', capacity: 3, is_reservable: true },
      { slug: 'meja-permukaan', kind: 'free', capacity: 0, is_reservable: false },
    ]);
  });

  it('seeds opening hours with a shorter Sunday', async () => {
    const { data } = await anonClient()
      .from('opening_hours')
      .select('isodow, opens_at, closes_at')
      .order('isodow');
    expect(data).toHaveLength(7);
    expect(data?.[0]).toEqual({ isodow: 1, opens_at: '10:00:00', closes_at: '21:00:00' });
    expect(data?.[6]).toEqual({ isodow: 7, opens_at: '12:00:00', closes_at: '20:00:00' });
  });

  it('seeds the fictional store settings', async () => {
    const { data } = await anonClient()
      .from('store_settings')
      .select('address, session_minutes, pickup_hours')
      .single();
    expect(data).toEqual({
      address: 'Jl. Contoh Raya No. 2, Surabaya',
      session_minutes: 30,
      pickup_hours: 48,
    });
  });
});

describe('demo accounts', () => {
  it('seeds the demo accounts with their roles', async () => {
    const { data } = await adminClient()
      .from('profiles')
      .select('full_name, role, is_active')
      .in('full_name', ['Danu Saputra', 'Bima Aditya', 'Yoga Pranata', 'Raka Pratama']);
    expect(data).toEqual(
      expect.arrayContaining([
        { full_name: 'Danu Saputra', role: 'owner', is_active: true },
        { full_name: 'Bima Aditya', role: 'operator', is_active: true },
        { full_name: 'Yoga Pranata', role: 'operator', is_active: false },
        { full_name: 'Raka Pratama', role: 'customer', is_active: true },
      ]),
    );
    expect(data).toHaveLength(4);
  });
});
