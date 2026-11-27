-- Fase 1C-1: reservasi sesi demo untuk pelanggan (PRD §9.6, §11, §11.1).
-- Aturan anti-bentrok dijaga exclusion constraint:
--   - satu unit tidak ada di dua reservasi aktif yang waktunya tumpang tindih;
--   - satu kursi meja (nomor 1..kapasitas) tidak dipakai dua reservasi aktif sekaligus;
--   - satu pelanggan tidak punya dua reservasi aktif yang tumpang tindih.
-- Reservasi hanya dibuat dan dibatalkan lewat fungsi, tidak pernah ditulis langsung.

create extension if not exists btree_gist with schema extensions;

create type public.reservation_status as enum (
  'scheduled', 'checked_in', 'completed', 'cancelled', 'no_show', 'unrecorded'
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^L2D-[2-9A-HJKMNP-Z]{8}$'),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.reservation_status not null default 'scheduled',
  note text check (note is null or char_length(note) <= 500),
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users (id) on delete set null,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_valid_period check (ends_at > starts_at),
  constraint reservations_no_customer_overlap exclude using gist (
    customer_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('scheduled', 'checked_in'))
);
create index reservations_customer_id_idx on public.reservations (customer_id);
create index reservations_starts_at_idx on public.reservations (starts_at);

comment on table public.reservations is 'Reservasi sesi demo. Dibuat dan dibatalkan lewat fungsi.';

create table public.reservation_items (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  unit_id uuid not null references public.demo_units (id) on delete restrict,
  period tstzrange not null,
  is_active boolean not null default true,
  unique (reservation_id, variant_id),
  constraint reservation_items_no_unit_overlap exclude using gist (
    unit_id with =,
    period with &&
  ) where (is_active)
);
create index reservation_items_variant_id_idx on public.reservation_items (variant_id);
create index reservation_items_unit_id_idx on public.reservation_items (unit_id);

create table public.reservation_seats (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  area_id uuid not null references public.demo_areas (id) on delete restrict,
  seat_no int not null check (seat_no >= 1),
  period tstzrange not null,
  is_active boolean not null default true,
  unique (reservation_id, area_id),
  constraint reservation_seats_no_overlap exclude using gist (
    area_id with =,
    seat_no with =,
    period with &&
  ) where (is_active)
);
create index reservation_seats_area_id_idx on public.reservation_seats (area_id);

create trigger reservations_set_updated_at before update on public.reservations
  for each row execute function public.set_updated_at();

-- Catatan pelanggan sengaja tidak ikut ke log aktivitas.
create trigger audit_reservations after insert or update or delete on public.reservations
  for each row execute function public.audit_row_change('code,status,starts_at,cancelled_by');

-- Unit harus milik varian yang dipesan.
create function public.validate_reservation_item()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.demo_units u where u.id = new.unit_id and u.variant_id = new.variant_id
  ) then
    raise exception 'Unit demo bukan milik varian ini.' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger reservation_items_validate
  before insert or update of unit_id, variant_id on public.reservation_items
  for each row execute function public.validate_reservation_item();

-- Nomor kursi tidak boleh melebihi kapasitas area saat dibuat.
create function public.validate_reservation_seat()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_capacity int;
begin
  select a.capacity into v_capacity from public.demo_areas a where a.id = new.area_id;
  if v_capacity is null or new.seat_no > v_capacity then
    raise exception 'Nomor kursi melebihi kapasitas area.' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger reservation_seats_validate
  before insert on public.reservation_seats
  for each row execute function public.validate_reservation_seat();

-- Item dan kursi mengikuti status dan jadwal reservasinya. Kolom is_active ada karena exclusion
-- constraint tidak bisa membaca status dari tabel lain.
create function public.sync_reservation_children()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_active boolean := new.status in ('scheduled', 'checked_in');
  v_period tstzrange := tstzrange(new.starts_at, new.ends_at, '[)');
begin
  update public.reservation_items i
    set is_active = v_active, period = v_period
    where i.reservation_id = new.id
      and (i.is_active is distinct from v_active or i.period is distinct from v_period);
  update public.reservation_seats s
    set is_active = v_active, period = v_period
    where s.reservation_id = new.id
      and (s.is_active is distinct from v_active or s.period is distinct from v_period);
  return null;
end;
$$;

create trigger reservations_sync_children
  after update of status, starts_at, ends_at on public.reservations
  for each row execute function public.sync_reservation_children();

-- ── Bantuan internal ──────────────────────────────────────────────────────────

-- Unit yang bisa ditugaskan (status available / in_use) atau sedang diservis, di area yang bisa
-- direservasi, dari varian, produk, dan kategori aktif yang dicoba per unit.
create function public.reservable_units()
returns table (unit_id uuid, code text, variant_id uuid, area_id uuid, status public.demo_unit_status)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.code, u.variant_id, u.area_id, u.status
  from public.demo_units u
  join public.demo_areas a on a.id = u.area_id and a.is_active and a.is_reservable
  join public.product_variants v on v.id = u.variant_id and v.is_active
  join public.products p on p.id = v.product_id and p.is_active and p.is_for_sale
  join public.categories c on c.id = p.category_id and c.is_active and c.try_mode = 'unit'
  where u.status in ('available', 'in_use', 'servicing');
$$;

create function public.area_has_free_seat(p_area_id uuid, p_period tstzrange)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select count(*) from public.reservation_seats s
      where s.area_id = p_area_id and s.is_active and s.period && p_period)
    < (select a.capacity from public.demo_areas a where a.id = p_area_id),
    false
  );
$$;

-- Area meja bawaan untuk slot tanpa varian: area meja yang bisa direservasi dengan urutan terkecil.
create function public.default_reservation_area()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select a.id from public.demo_areas a
  where a.is_active and a.is_reservable and a.kind = 'desk'
  order by a.sort_order, a.slug
  limit 1;
$$;

-- Perencana yang dipakai bersama oleh reservation_slots dan create_reservation, supaya slot yang
-- tampil bisa dipilih memang bisa dipesan. Mengembalikan alasan pertama yang berlaku
-- (own_overlap, desk_full, unit_servicing, unit_taken) atau rencana [{variant_id, unit_id, area_id}].
create function public.plan_reservation(p_variant_ids uuid[], p_period tstzrange, p_customer uuid)
returns table (reason text, reason_variant_id uuid, plan jsonb)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_variant uuid;
  v_unit uuid;
  v_area uuid;
  v_plan jsonb := '[]'::jsonb;
  v_seated uuid[] := '{}';
  v_desk_full boolean := false;
  v_servicing uuid;
  v_taken uuid;
begin
  if p_customer is not null and exists (
    select 1 from public.reservations r
    where r.customer_id = p_customer
      and r.status in ('scheduled', 'checked_in')
      and tstzrange(r.starts_at, r.ends_at, '[)') && p_period
  ) then
    return query select 'own_overlap'::text, null::uuid, null::jsonb;
    return;
  end if;

  if coalesce(array_length(p_variant_ids, 1), 0) = 0 then
    v_area := public.default_reservation_area();
    if v_area is null or not public.area_has_free_seat(v_area, p_period) then
      return query select 'desk_full'::text, null::uuid, null::jsonb;
    else
      return query select null::text, null::uuid, '[]'::jsonb;
    end if;
    return;
  end if;

  foreach v_variant in array p_variant_ids loop
    v_unit := null;
    v_area := null;
    select ru.unit_id, ru.area_id into v_unit, v_area
    from public.reservable_units() ru
    where ru.variant_id = v_variant
      and ru.status in ('available', 'in_use')
      and not exists (
        select 1 from public.reservation_items i
        where i.unit_id = ru.unit_id and i.is_active and i.period && p_period
      )
      and (ru.area_id = any (v_seated) or public.area_has_free_seat(ru.area_id, p_period))
    order by ru.code
    limit 1;

    if v_unit is not null then
      v_plan := v_plan || jsonb_build_array(
        jsonb_build_object('variant_id', v_variant, 'unit_id', v_unit, 'area_id', v_area)
      );
      if not (v_area = any (v_seated)) then
        v_seated := v_seated || v_area;
      end if;
    elsif exists (
      -- Ada unit kosong, tetapi mejanya penuh.
      select 1 from public.reservable_units() ru
      where ru.variant_id = v_variant
        and ru.status in ('available', 'in_use')
        and not exists (
          select 1 from public.reservation_items i
          where i.unit_id = ru.unit_id and i.is_active and i.period && p_period
        )
    ) then
      v_desk_full := true;
    elsif not exists (
      select 1 from public.reservable_units() ru
      where ru.variant_id = v_variant and ru.status in ('available', 'in_use')
    ) then
      v_servicing := coalesce(v_servicing, v_variant);
    else
      v_taken := coalesce(v_taken, v_variant);
    end if;
  end loop;

  if v_desk_full then
    return query select 'desk_full'::text, null::uuid, null::jsonb;
  elsif v_servicing is not null then
    return query select 'unit_servicing'::text, v_servicing, null::jsonb;
  elsif v_taken is not null then
    return query select 'unit_taken'::text, v_taken, null::jsonb;
  else
    return query select null::text, null::uuid, v_plan;
  end if;
end;
$$;

-- Kode L2D- + 8 karakter acak tanpa huruf mirip. Byte diambil dari gen_random_uuid(), tanpa byte
-- versi dan varian UUID.
create function public.new_reservation_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  v_bytes bytea;
  v_code text;
  v_index int;
begin
  loop
    v_bytes := uuid_send(gen_random_uuid());
    v_code := 'L2D-';
    foreach v_index in array array[0, 1, 2, 3, 4, 5, 10, 11] loop
      v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, v_index) % 31) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.reservations r where r.code = v_code);
  end loop;
  return v_code;
end;
$$;

-- ── Fungsi untuk pelanggan ────────────────────────────────────────────────────

create function public.create_reservation(
  p_variant_ids uuid[],
  p_starts_at timestamptz,
  p_note text default null
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_settings public.store_settings;
  v_count int;
  v_local timestamp;
  v_day date;
  v_minute int;
  v_open int;
  v_close int;
  v_ends timestamptz;
  v_period tstzrange;
  v_key text;
  v_reason text;
  v_reason_variant uuid;
  v_plan jsonb;
  v_id uuid;
  v_code text;
  v_item jsonb;
  v_area uuid;
  v_seat int;
  v_constraint text;
begin
  if v_user is null or public.current_app_role() is distinct from 'customer' then
    raise exception 'not_customer' using errcode = 'P0001';
  end if;

  select * into v_settings from public.store_settings limit 1;

  v_count := coalesce(array_length(p_variant_ids, 1), 0);
  if v_count < 1 or v_count > 4
    or (select count(distinct x) from unnest(p_variant_ids) as x) <> v_count
    or exists (
      select 1 from unnest(p_variant_ids) as x
      where x is null
        or not exists (select 1 from public.reservable_units() ru where ru.variant_id = x)
    )
  then
    raise exception 'invalid_items' using errcode = 'P0001';
  end if;

  -- Jadwal dalam WIB: tepat di slot, dalam jam buka, bukan hari libur.
  v_local := p_starts_at at time zone 'Asia/Jakarta';
  v_day := v_local::date;
  v_minute := extract(hour from v_local)::int * 60 + extract(minute from v_local)::int;
  select extract(hour from h.opens_at)::int * 60 + extract(minute from h.opens_at)::int,
         extract(hour from h.closes_at)::int * 60 + extract(minute from h.closes_at)::int
    into v_open, v_close
    from public.opening_hours h
    where h.isodow = extract(isodow from v_day)::int;
  if v_open is null
    or exists (select 1 from public.store_closures c where c.date = v_day)
    or extract(second from v_local) <> 0
    or v_minute < v_open
    or v_minute + v_settings.session_minutes > v_close
    or (v_minute - v_open) % v_settings.session_minutes <> 0
  then
    raise exception 'outside_hours' using errcode = 'P0001';
  end if;
  if p_starts_at < now() + make_interval(mins => v_settings.min_lead_minutes) then
    raise exception 'too_soon' using errcode = 'P0001';
  end if;
  if v_day > (now() at time zone 'Asia/Jakarta')::date + v_settings.max_days_ahead then
    raise exception 'too_far' using errcode = 'P0001';
  end if;

  v_ends := p_starts_at + make_interval(mins => v_settings.session_minutes);
  v_period := tstzrange(p_starts_at, v_ends, '[)');

  -- Kunci dalam urutan tetap: pelanggan, area slot ini, lalu varian. Constraint tetap penjaga terakhir.
  for v_key in
    select k from (
      select 'res-customer:' || v_user::text as k
      union
      select 'res-area:' || ru.area_id::text || ':' || extract(epoch from p_starts_at)::bigint::text
        from public.reservable_units() ru where ru.variant_id = any (p_variant_ids)
      union
      select 'res-variant:' || x::text from unnest(p_variant_ids) as x
    ) keys
    order by k
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_key, 0));
  end loop;

  if (
    select count(*) from public.reservations r
    where r.customer_id = v_user and r.created_at > now() - interval '24 hours'
  ) >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if (
    select count(*) from public.reservations r
    where r.customer_id = v_user
      and r.status in ('scheduled', 'checked_in')
      and r.ends_at > now()
  ) >= v_settings.max_active_reservations then
    raise exception 'too_many_active' using errcode = 'P0001';
  end if;

  select p.reason, p.reason_variant_id, p.plan into v_reason, v_reason_variant, v_plan
    from public.plan_reservation(p_variant_ids, v_period, v_user) p;
  if v_reason is not null then
    raise exception '%', v_reason using errcode = 'P0001', detail = coalesce(v_reason_variant::text, '');
  end if;

  begin
    v_code := public.new_reservation_code();
    insert into public.reservations (code, customer_id, starts_at, ends_at, note)
      values (v_code, v_user, p_starts_at, v_ends, nullif(left(btrim(coalesce(p_note, '')), 500), ''))
      returning id into v_id;

    for v_item in select * from jsonb_array_elements(v_plan) loop
      insert into public.reservation_items (reservation_id, variant_id, unit_id, period)
        values (v_id, (v_item ->> 'variant_id')::uuid, (v_item ->> 'unit_id')::uuid, v_period);
    end loop;

    for v_area in
      select distinct (e ->> 'area_id')::uuid from jsonb_array_elements(v_plan) as e
    loop
      select min(n) into v_seat
        from generate_series(1, (select a.capacity from public.demo_areas a where a.id = v_area)) as n
        where not exists (
          select 1 from public.reservation_seats s
          where s.area_id = v_area and s.seat_no = n and s.is_active and s.period && v_period
        );
      if v_seat is null then
        raise exception 'desk_full' using errcode = 'P0001';
      end if;
      insert into public.reservation_seats (reservation_id, area_id, seat_no, period)
        values (v_id, v_area, v_seat, v_period);
    end loop;
  exception when exclusion_violation then
    get stacked diagnostics v_constraint = constraint_name;
    raise exception '%', case v_constraint
      when 'reservation_items_no_unit_overlap' then 'unit_taken'
      when 'reservation_seats_no_overlap' then 'desk_full'
      else 'own_overlap'
    end using errcode = 'P0001';
  end;

  return v_code;
end;
$$;

create function public.cancel_reservation(p_code text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_reservation public.reservations;
  v_cutoff int;
begin
  select * into v_reservation from public.reservations r
    where r.code = p_code and r.customer_id = auth.uid()
    for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if v_reservation.status <> 'scheduled' then
    raise exception 'not_cancellable' using errcode = 'P0001';
  end if;
  select s.cancel_cutoff_minutes into v_cutoff from public.store_settings s limit 1;
  if now() >= v_reservation.starts_at - make_interval(mins => v_cutoff) then
    raise exception 'cancel_too_late' using errcode = 'P0001';
  end if;
  update public.reservations
    set status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid()
    where id = v_reservation.id;
end;
$$;

-- ── Hak akses ─────────────────────────────────────────────────────────────────

alter table public.reservations enable row level security;
alter table public.reservation_items enable row level security;
alter table public.reservation_seats enable row level security;

create policy "reservations: pelanggan baca miliknya, staf baca semua" on public.reservations
  for select to authenticated
  using (customer_id = (select auth.uid()) or public.is_staff());

create policy "reservation_items: baca kalau reservasinya terlihat" on public.reservation_items
  for select to authenticated
  using (exists (select 1 from public.reservations r where r.id = reservation_id));

create policy "reservation_seats: staf baca" on public.reservation_seats
  for select to authenticated
  using (public.is_staff());

-- Fungsi internal tidak bisa dipanggil lewat API.
revoke execute on function public.reservable_units() from public, anon, authenticated;
revoke execute on function public.area_has_free_seat(uuid, tstzrange) from public, anon, authenticated;
revoke execute on function public.default_reservation_area() from public, anon, authenticated;
revoke execute on function public.plan_reservation(uuid[], tstzrange, uuid) from public, anon, authenticated;
revoke execute on function public.new_reservation_code() from public, anon, authenticated;

-- Buat dan batal: hanya pengguna login (peran diperiksa di dalam fungsi).
revoke execute on function public.create_reservation(uuid[], timestamptz, text) from public, anon;
revoke execute on function public.cancel_reservation(text) from public, anon;
grant execute on function public.create_reservation(uuid[], timestamptz, text) to authenticated;
grant execute on function public.cancel_reservation(text) to authenticated;
