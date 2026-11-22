-- Showroom: area demo, unit demo, pengaturan toko, jam buka, dan hari libur (PRD §9.6, §11).

create type public.demo_area_kind as enum ('desk', 'station', 'free');
create type public.demo_unit_status as enum ('available', 'in_use', 'servicing', 'retired');

create table public.demo_areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind public.demo_area_kind not null,
  capacity int not null check (capacity >= 0),
  is_reservable boolean not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demo_areas_free_is_not_reservable check (kind <> 'free' or is_reservable = false)
);

create table public.demo_units (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  area_id uuid not null references public.demo_areas (id) on delete restrict,
  code text not null unique check (code ~ '^DM-[A-Z]-[0-9]{3}$'),
  status public.demo_unit_status not null default 'available',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index demo_units_variant_id_idx on public.demo_units (variant_id);
create index demo_units_area_id_idx on public.demo_units (area_id);

-- Satu baris saja (id selalu true).
create table public.store_settings (
  id boolean primary key default true check (id),
  address text not null,
  whatsapp text check (whatsapp ~ '^62[0-9]{8,13}$'),
  maps_url text,
  session_minutes int not null default 30 check (session_minutes > 0),
  min_lead_minutes int not null default 60 check (min_lead_minutes >= 0),
  max_days_ahead int not null default 14 check (max_days_ahead > 0),
  max_active_reservations int not null default 2 check (max_active_reservations > 0),
  pickup_hours int not null default 48 check (pickup_hours > 0),
  cancel_cutoff_minutes int not null default 60 check (cancel_cutoff_minutes >= 0),
  updated_at timestamptz not null default now()
);

-- isodow: 1 = Senin … 7 = Minggu. Hari tutup: opens_at dan closes_at sama-sama null.
create table public.opening_hours (
  isodow smallint primary key check (isodow between 1 and 7),
  opens_at time,
  closes_at time,
  constraint opening_hours_valid_range check (
    (opens_at is null and closes_at is null)
    or (opens_at is not null and closes_at is not null and opens_at < closes_at)
  )
);

create table public.store_closures (
  date date primary key,
  reason text not null default ''
);

create trigger demo_areas_set_updated_at before update on public.demo_areas
  for each row execute function public.set_updated_at();
create trigger demo_units_set_updated_at before update on public.demo_units
  for each row execute function public.set_updated_at();
create trigger store_settings_set_updated_at before update on public.store_settings
  for each row execute function public.set_updated_at();

alter table public.demo_areas enable row level security;
alter table public.demo_units enable row level security;
alter table public.store_settings enable row level security;
alter table public.opening_hours enable row level security;
alter table public.store_closures enable row level security;

create policy "demo_areas: publik baca yang aktif" on public.demo_areas
  for select to anon, authenticated using (is_active or public.is_staff());
create policy "demo_areas: pemilik tulis" on public.demo_areas
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- Operator baru bisa mengubah status unit lewat fungsi khusus di Fase 1.
create policy "demo_units: publik baca yang belum pensiun" on public.demo_units
  for select to anon, authenticated using (status <> 'retired' or public.is_staff());
create policy "demo_units: pemilik tulis" on public.demo_units
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "store_settings: semua baca" on public.store_settings
  for select to anon, authenticated using (true);
create policy "store_settings: pemilik tulis" on public.store_settings
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "opening_hours: semua baca" on public.opening_hours
  for select to anon, authenticated using (true);
create policy "opening_hours: pemilik tulis" on public.opening_hours
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "store_closures: semua baca" on public.store_closures
  for select to anon, authenticated using (true);
create policy "store_closures: pemilik tulis" on public.store_closures
  for all to authenticated using (public.is_owner()) with check (public.is_owner());
