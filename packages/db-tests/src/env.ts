type EnvName = 'SUPABASE_URL' | 'SUPABASE_PUBLISHABLE_KEY' | 'SUPABASE_SECRET_KEY';

export function requireEnv(name: EnvName): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} belum diisi. Salin .env.example jadi .env.local di root lalu isi nilainya.`,
    );
  }
  return value;
}
