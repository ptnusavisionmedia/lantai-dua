import { describe, expect, it } from 'vitest';
import { adminClient, anonClient, clientFor, userIdOf } from './clients';

describe('profiles', () => {
  it('hides all profiles from anon', async () => {
    const { data } = await anonClient().from('profiles').select('id');
    expect(data).toEqual([]);
  });

  it('creates a customer profile with the signup name', async () => {
    const { data } = await adminClient()
      .from('profiles')
      .select('role, full_name')
      .eq('id', userIdOf('customer'))
      .single();
    expect(data).toEqual({ role: 'customer', full_name: 'Tes customer' });
  });

  it('shows a customer only their own profile', async () => {
    const { data } = await clientFor('customer').from('profiles').select('id');
    expect(data?.map((r) => r.id)).toEqual([userIdOf('customer')]);
  });

  it('lets a customer edit name and WhatsApp', async () => {
    const { error } = await clientFor('customer')
      .from('profiles')
      .update({ full_name: 'Raka', whatsapp: '6281234567890' })
      .eq('id', userIdOf('customer'));
    expect(error).toBeNull();
  });

  it('rejects a malformed WhatsApp number', async () => {
    const { error } = await clientFor('customer')
      .from('profiles')
      .update({ whatsapp: '0812' })
      .eq('id', userIdOf('customer'));
    expect(error?.code).toBe('23514');
  });

  it.each(['customer', 'operator'] as const)('blocks %s from raising their own role', async (p) => {
    const { error } = await clientFor(p)
      .from('profiles')
      .update({ role: 'owner' })
      .eq('id', userIdOf(p));
    expect(error?.code).toBe('42501');
  });

  it('blocks a customer from editing someone else', async () => {
    const { data } = await clientFor('customer')
      .from('profiles')
      .update({ full_name: 'X' })
      .eq('id', userIdOf('customer2'))
      .select('id');
    expect(data).toEqual([]);
  });

  it('lets the owner read everyone and change roles', async () => {
    const owner = clientFor('owner');
    const { data } = await owner.from('profiles').select('id');
    expect(data?.map((r) => r.id)).toContain(userIdOf('customer2'));
    const promote = await owner
      .from('profiles')
      .update({ role: 'operator' })
      .eq('id', userIdOf('customer2'));
    expect(promote.error).toBeNull();
    const demote = await owner
      .from('profiles')
      .update({ role: 'customer' })
      .eq('id', userIdOf('customer2'));
    expect(demote.error).toBeNull();
  });

  it('stops the owner from locking themself out', async () => {
    const { error } = await clientFor('owner')
      .from('profiles')
      .update({ is_active: false })
      .eq('id', userIdOf('owner'));
    expect(error?.code).toBe('42501');
  });
});

describe('current_app_role', () => {
  it('reports the effective role, null when inactive', async () => {
    expect((await clientFor('owner').rpc('current_app_role')).data).toBe('owner');
    expect((await clientFor('operator').rpc('current_app_role')).data).toBe('operator');
    expect((await clientFor('operatorInactive').rpc('current_app_role')).data).toBeNull();
    expect((await anonClient().rpc('current_app_role')).data).toBeNull();
  });
});
