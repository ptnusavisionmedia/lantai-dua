/**
 * Membuat atau memperbarui 7 akun demo LANTAI DUA di project Supabase dev.
 * Pelanggan diberi nomor WhatsApp fiktif, karena reservasi mewajibkan nomor (A4).
 * Jalankan dari root: `pnpm db:seed-users`. Butuh SUPABASE_URL, SUPABASE_SECRET_KEY, SEED_PASSWORD di .env.local.
 */
import { createClient, type User } from '@supabase/supabase-js';

process.loadEnvFile('.env.local');

const ACCOUNTS = [
  {
    email: 'pemilik@lantaidua.test',
    fullName: 'Danu Saputra',
    role: 'owner',
    active: true,
    whatsapp: null,
  },
  {
    email: 'operator1@lantaidua.test',
    fullName: 'Bima Aditya',
    role: 'operator',
    active: true,
    whatsapp: null,
  },
  {
    email: 'operator2@lantaidua.test',
    fullName: 'Sari Wulandari',
    role: 'operator',
    active: true,
    whatsapp: null,
  },
  {
    email: 'nonaktif@lantaidua.test',
    fullName: 'Yoga Pranata',
    role: 'operator',
    active: false,
    whatsapp: null,
  },
  {
    email: 'pelanggan1@lantaidua.test',
    fullName: 'Raka Pratama',
    role: 'customer',
    active: true,
    whatsapp: '6281234500001',
  },
  {
    email: 'pelanggan2@lantaidua.test',
    fullName: 'Nadia Salsabila',
    role: 'customer',
    active: true,
    whatsapp: '6281234500002',
  },
  {
    email: 'pelanggan3@lantaidua.test',
    fullName: 'Dimas Ardiansyah',
    role: 'customer',
    active: true,
    whatsapp: '6281234500003',
  },
] as const;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} belum diisi di .env.local`);
  return value;
}

const password = requireEnv('SEED_PASSWORD');
if (password.length < 8) throw new Error('SEED_PASSWORD minimal 8 karakter');

const admin = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SECRET_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function allUsers(): Promise<User[]> {
  const users: User[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

const existing = new Map((await allUsers()).map((u) => [u.email?.toLowerCase(), u]));

for (const account of ACCOUNTS) {
  const metadata = { full_name: account.fullName };
  let userId = existing.get(account.email)?.id;

  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      user_metadata: metadata,
    });
    if (error) throw error;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
    userId = data.user.id;
  }

  const { error } = await admin
    .from('profiles')
    .update({
      full_name: account.fullName,
      role: account.role,
      is_active: account.active,
      whatsapp: account.whatsapp,
    })
    .eq('id', userId);
  if (error) throw new Error(`Profil ${account.email} gagal diperbarui: ${error.message}`);

  console.log(`${account.email} → ${account.role}${account.active ? '' : ' (nonaktif)'}`);
}
