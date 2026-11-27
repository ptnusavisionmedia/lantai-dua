-- Fase 1C-2: reservasi di sisi operator (PRD §9.6 R8, §9.10 O2 dan O7, §9.2 A4, §11.1 poin 4).
--   - Angka jendela check-in dan tidak datang disimpan di pengaturan toko.
--   - Reservasi baru mewajibkan nomor WhatsApp di profil pelanggan.
--   - Semua perpindahan status oleh staf lewat satu fungsi dengan tabel perpindahan.
--   - Staf membaca nama dan WhatsApp pelanggan hanya lewat reservasinya. Policy profiles tidak berubah.

alter table public.store_settings
  add column checkin_open_minutes int not null default 60 check (checkin_open_minutes >= 0),
  add column no_show_after_minutes int not null default 15 check (no_show_after_minutes >= 0);

-- ── create_reservation: sama dengan 1C-1, ditambah nomor WhatsApp wajib ────────

create or replace function public.create_reservation(
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

  -- Staf mungkin perlu menghubungi pelanggan (A4).
  if not exists (
    select 1 from public.profiles p where p.id = v_user and p.whatsapp is not null
  ) then
    raise exception 'whatsapp_required' using errcode = 'P0001';
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

-- ── Perubahan status oleh staf ────────────────────────────────────────────────
-- Tabel perpindahan desain 1C-2 §5.4. Hari dihitung dalam WIB. Perpindahan lain ditolak.

create function public.staff_set_reservation_status(
  p_code text,
  p_status public.reservation_status,
  p_reason text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_r public.reservations;
  v_open int;
  v_late int;
  v_now timestamptz := now();
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
  v_day date;
  v_reason text := btrim(coalesce(p_reason, ''));
  v_from public.reservation_status;
begin
  if not public.is_staff() then
    raise exception 'not_staff' using errcode = 'P0001';
  end if;

  -- Kunci baris dulu: dua staf yang menekan tombol bersamaan diproses bergantian, dan yang kedua
  -- membaca status terbaru.
  select * into v_r from public.reservations r where r.code = p_code for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  select s.checkin_open_minutes, s.no_show_after_minutes into v_open, v_late
    from public.store_settings s limit 1;
  v_day := (v_r.starts_at at time zone 'Asia/Jakarta')::date;
  v_from := v_r.status;

  if p_status = 'checked_in' and v_from = 'scheduled' then
    if v_now >= v_r.ends_at then
      raise exception 'session_over' using errcode = 'P0001';
    end if;
    if v_day <> v_today or v_now < v_r.starts_at - make_interval(mins => v_open) then
      raise exception 'checkin_too_early' using errcode = 'P0001';
    end if;
  elsif p_status = 'checked_in' and v_from = 'no_show' then
    -- Pelanggan terlambat setelah ditandai Tidak datang.
    if v_now >= v_r.ends_at then
      raise exception 'session_over' using errcode = 'P0001';
    end if;
  elsif p_status = 'scheduled' and v_from = 'checked_in' then
    -- Urungkan check-in.
    if v_now >= v_r.ends_at then
      raise exception 'session_over' using errcode = 'P0001';
    end if;
  elsif p_status = 'checked_in' and v_from = 'completed' then
    -- Urungkan selesai, hanya di hari sesi.
    if v_day <> v_today then
      raise exception 'session_over' using errcode = 'P0001';
    end if;
  elsif p_status = 'no_show' and v_from = 'scheduled' then
    if v_now < v_r.starts_at + make_interval(mins => v_late) then
      raise exception 'no_show_too_early' using errcode = 'P0001';
    end if;
  elsif p_status = 'no_show' and v_from = 'unrecorded' then
    null;
  elsif p_status = 'completed' and v_from in ('checked_in', 'unrecorded') then
    null;
  elsif p_status = 'cancelled' and v_from in ('scheduled', 'checked_in', 'unrecorded') then
    if char_length(v_reason) < 3 or char_length(v_reason) > 200 then
      raise exception 'reason_required' using errcode = 'P0001';
    end if;
    if v_from <> 'unrecorded' and v_now >= v_r.ends_at then
      raise exception 'session_over' using errcode = 'P0001';
    end if;
  else
    raise exception 'invalid_transition' using errcode = 'P0001';
  end if;

  begin
    if p_status = 'cancelled' then
      update public.reservations
        set status = 'cancelled', cancelled_at = v_now, cancelled_by = auth.uid(), cancel_reason = v_reason
        where id = v_r.id;
    else
      update public.reservations set status = p_status where id = v_r.id;
    end if;
  exception when exclusion_violation then
    -- Hanya mungkin saat reservasi diaktifkan lagi dan unit atau kursinya sudah terpakai.
    raise exception 'slot_conflict' using errcode = 'P0001';
  end;
end;
$$;

-- ── Kontak pelanggan untuk staf (O7) ─────────────────────────────────────────

create function public.reservation_contacts(p_reservation_ids uuid[])
returns table (reservation_id uuid, full_name text, whatsapp text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'not_staff' using errcode = 'P0001';
  end if;
  if coalesce(array_length(p_reservation_ids, 1), 0) > 200 then
    raise exception 'too_many_ids' using errcode = 'P0001';
  end if;
  return query
    select r.id, p.full_name, p.whatsapp
    from public.reservations r
    join public.profiles p on p.id = r.customer_id
    where r.id = any (p_reservation_ids);
end;
$$;

-- ── Hak akses ─────────────────────────────────────────────────────────────────

revoke execute on function public.staff_set_reservation_status(text, public.reservation_status, text)
  from public, anon;
revoke execute on function public.reservation_contacts(uuid[]) from public, anon;
grant execute on function public.staff_set_reservation_status(text, public.reservation_status, text)
  to authenticated;
grant execute on function public.reservation_contacts(uuid[]) to authenticated;
