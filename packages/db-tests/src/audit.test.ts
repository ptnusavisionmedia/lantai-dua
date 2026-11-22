import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type CatalogFixture, createCatalogFixture, deleteCatalogFixture } from './catalog-fixture';
import { adminClient, clientFor, runId, userIdOf } from './clients';

const prefix = () => `rls-${runId()}-aud-`;
let f: CatalogFixture;

beforeAll(async () => {
  f = await createCatalogFixture(adminClient(), prefix());
});

afterAll(async () => {
  await deleteCatalogFixture(adminClient(), prefix());
});

async function latestLog(table: string, rowId: string) {
  const { data, error } = await adminClient()
    .from('audit_logs')
    .select('actor_id, action, before, after')
    .eq('table_name', table)
    .eq('row_id', rowId)
    .order('id', { ascending: false })
    .limit(1)
    .single();
  if (error) throw new Error(`audit_logs tidak terbaca: ${error.message}`);
  return data;
}

async function countLogs(rowId: string) {
  const { count } = await adminClient()
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('row_id', rowId);
  if (count === null) throw new Error('audit_logs tidak bisa dihitung');
  return count;
}

describe('audit log', () => {
  it('records who changed a price', async () => {
    await clientFor('owner')
      .from('product_variants')
      .update({ price_idr: 1_249_000 })
      .eq('id', f.vOn);
    const log = await latestLog('product_variants', f.vOn);
    expect(log.actor_id).toBe(userIdOf('owner'));
    expect(log.action).toBe('update');
    expect(log.before).toMatchObject({ price_idr: 1_000_000 });
    expect(log.after).toMatchObject({ price_idr: 1_249_000 });
  });

  it('logs role changes without personal data', async () => {
    const owner = clientFor('owner');
    await owner.from('profiles').update({ role: 'operator' }).eq('id', userIdOf('customer2'));
    const log = await latestLog('profiles', userIdOf('customer2'));
    expect(Object.keys(log.after as object).sort()).toEqual(['id', 'is_active', 'role']);
    expect(log.after).toMatchObject({ role: 'operator' });
    await owner.from('profiles').update({ role: 'customer' }).eq('id', userIdOf('customer2'));
  });

  it('does not log WhatsApp edits', async () => {
    const before = await countLogs(userIdOf('customer'));
    await clientFor('customer')
      .from('profiles')
      .update({ whatsapp: '6281299990000' })
      .eq('id', userIdOf('customer'));
    expect(await countLogs(userIdOf('customer'))).toBe(before);
  });

  it.each(['customer', 'operator'] as const)('hides the log from %s', async (p) => {
    const { data } = await clientFor(p).from('audit_logs').select('id').limit(1);
    expect(data).toEqual([]);
  });

  it('lets the owner read the log', async () => {
    const { data } = await clientFor('owner')
      .from('audit_logs')
      .select('id')
      .eq('row_id', f.vOn)
      .limit(1);
    expect(data).toHaveLength(1);
  });
});
