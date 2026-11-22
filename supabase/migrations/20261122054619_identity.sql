-- Identitas: peran, profil, dan aturan siapa yang boleh mengubah peran (PRD §6).

create type public.app_role as enum ('customer', 'operator', 'owner');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  whatsapp text check (whatsapp ~ '^62[0-9]{8,13}$'),
  role public.app_role not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Profil setiap akun. Peran dan status hanya diubah pemilik.';

-- Trigger generik untuk kolom updated_at, dipakai juga oleh tabel lain.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Setiap akun baru otomatis punya profil pelanggan.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Peran efektif akun yang sedang login: null kalau belum login, tidak punya profil, atau nonaktif.
create function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.is_active;
$$;

create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('operator', 'owner'), false);
$$;

create function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() = 'owner', false);
$$;

-- Hanya pemilik yang boleh mengubah peran/status, dan pemilik tidak boleh mengunci dirinya sendiri.
-- Skrip dengan secret key (auth.uid() null) tidak dibatasi.
create function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and auth.uid() is not null then
    if not public.is_owner() then
      raise exception 'Hanya pemilik yang boleh mengubah peran atau status akun.'
        using errcode = '42501';
    end if;
    if old.id = auth.uid() then
      raise exception 'Pemilik tidak bisa mengubah peran atau status akunnya sendiri.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

alter table public.profiles enable row level security;

create policy "profiles: baca milik sendiri" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: pemilik baca semua" on public.profiles
  for select to authenticated
  using (public.is_owner());

create policy "profiles: ubah milik sendiri" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles: pemilik ubah semua" on public.profiles
  for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

grant execute on function public.current_app_role() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_owner() to anon, authenticated;
