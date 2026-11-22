import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type CatalogFixture, createCatalogFixture, deleteCatalogFixture } from './catalog-fixture';
import { adminClient, anonClient, clientFor, runId } from './clients';

const prefix = () => `rls-${runId()}-show-`;
let catalog: CatalogFixture;
let areaId: string;
let uAvail: string;
let uRetired: string;
let codeAvail: string;

beforeAll(async () => {
  const admin = adminClient();
  catalog = await createCatalogFixture(admin, prefix());
  const area = await admin
    .from('demo_areas')
    .insert({
      slug: `${prefix()}desk`,
      name: 'Meja tes',
      kind: 'desk',
      capacity: 2,
      is_reservable: true,
    })
    .select('id')
    .single();
  if (area.error) throw new Error(`Fixture demo_areas gagal: ${area.error.message}`);
  areaId = area.data.id;

  const n = Math.floor(Math.random() * 998);
  codeAvail = `DM-Z-${String(n).padStart(3, '0')}`;
  const units = await admin
    .from('demo_units')
    .insert(
      [
        { variant_id: catalog.vOn, area_id: areaId, code: codeAvail, status: 'available' },
        {
          variant_id: catalog.vOn,
          area_id: areaId,
          code: `DM-Z-${String(n + 1).padStart(3, '0')}`,
          status: 'retired',
        },
      ],
      { defaultToNull: false },
    )
    .select('id, status');
  if (units.error) throw new Error(`Fixture demo_units gagal: ${units.error.message}`);
  uAvail = units.data.find((u) => u.status === 'available')?.id;
  uRetired = units.data.find((u) => u.status === 'retired')?.id;
});

afterAll(async () => {
  const admin = adminClient();
  await admin.from('demo_units').delete().eq('area_id', areaId);
  await admin.from('demo_areas').delete().like('slug', `${prefix()}%`);
  await deleteCatalogFixture(admin, prefix());
});

describe('demo units', () => {
  it('shows anon units that are not retired', async () => {
    const { data } = await anonClient()
      .from('demo_units')
      .select('code')
      .in('id', [uAvail, uRetired]);
    expect(data?.map((r) => r.code)).toEqual([codeAvail]);
  });

  it('shows staff retired units', async () => {
    const { data } = await clientFor('operator').from('demo_units').select('id').eq('id', uRetired);
    expect(data).toHaveLength(1);
  });

  it.each(['customer', 'operator'] as const)(
    'blocks %s from changing a unit directly',
    async (p) => {
      const { data } = await clientFor(p)
        .from('demo_units')
        .update({ status: 'servicing' })
        .eq('id', uAvail)
        .select('id');
      expect(data).toEqual([]);
    },
  );

  it('rejects a badly formatted unit code', async () => {
    const { error } = await adminClient()
      .from('demo_units')
      .update({ code: 'DEMO-1' })
      .eq('id', uAvail);
    expect(error?.code).toBe('23514');
  });
});

describe('demo areas', () => {
  it('rejects a reservable free area', async () => {
    const { error } = await adminClient()
      .from('demo_areas')
      .insert({
        slug: `${prefix()}free`,
        name: 'X',
        kind: 'free',
        capacity: 0,
        is_reservable: true,
      });
    expect(error?.code).toBe('23514');
  });
});

describe('store settings and hours', () => {
  it('keeps store_settings to one row', async () => {
    const { error } = await adminClient()
      .from('store_settings')
      .insert({ id: false, address: 'x' });
    expect(error?.code).toBe('23514');
  });

  it('rejects closing before opening', async () => {
    const { error } = await adminClient()
      .from('opening_hours')
      .upsert({ isodow: 3, opens_at: '21:00', closes_at: '10:00' });
    expect(error?.code).toBe('23514');
  });

  it('rejects a weekday outside 1–7', async () => {
    const { error } = await adminClient()
      .from('opening_hours')
      .insert({ isodow: 8, opens_at: '10:00', closes_at: '21:00' });
    expect(error?.code).toBe('23514');
  });

  it('lets anon read opening hours but not change them', async () => {
    expect((await anonClient().from('opening_hours').select('isodow')).error).toBeNull();
    const { data } = await clientFor('customer')
      .from('opening_hours')
      .update({ opens_at: '09:00' })
      .eq('isodow', 1)
      .select('isodow');
    expect(data).toEqual([]);
  });
});
