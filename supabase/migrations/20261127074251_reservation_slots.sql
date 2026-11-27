-- Fase 1C-1: daftar varian yang bisa direservasi dan slot beserta alasannya.
-- Keduanya bisa dipanggil tamu. Slot memakai perencana yang sama dengan create_reservation,
-- dan tidak pernah mengembalikan data pemesan.

create function public.reservable_variants()
returns table (
  variant_id uuid,
  sku text,
  variant_name text,
  product_slug text,
  model_name text,
  brand_name text,
  category_slug text,
  category_name text,
  category_sort int,
  area_id uuid,
  area_name text,
  assignable_units int,
  servicing_units int
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    v.id,
    v.sku,
    v.name,
    p.slug,
    p.model_name,
    b.name,
    c.slug,
    c.name,
    (g.sort_order * 1000 + c.sort_order)::int,
    (array_agg(ru.area_id order by ru.code))[1],
    (array_agg(a.name order by ru.code))[1],
    (count(*) filter (where ru.status in ('available', 'in_use')))::int,
    (count(*) filter (where ru.status = 'servicing'))::int
  from public.reservable_units() ru
  join public.product_variants v on v.id = ru.variant_id
  join public.products p on p.id = v.product_id
  join public.brands b on b.id = p.brand_id
  join public.categories c on c.id = p.category_id
  join public.category_groups g on g.id = c.group_id
  join public.demo_areas a on a.id = ru.area_id
  group by v.id, v.sku, v.name, v.sort_order, p.slug, p.model_name, b.name, c.slug, c.name,
    g.sort_order, c.sort_order
  order by g.sort_order, c.sort_order, b.name, p.model_name, v.sort_order, v.sku;
$$;

create function public.reservation_slots(p_from date, p_to date, p_variant_ids uuid[])
returns table (
  starts_at timestamptz,
  ends_at timestamptz,
  available boolean,
  reason text,
  reason_variant_id uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_settings public.store_settings;
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
  v_last date;
  v_ids uuid[];
  v_customer uuid;
  v_day date;
  v_open time;
  v_close time;
  v_start timestamptz;
  v_end timestamptz;
  v_reason text;
  v_reason_variant uuid;
begin
  select * into v_settings from public.store_settings limit 1;
  -- Paling banyak max_days_ahead + 1 hari per panggilan.
  v_last := least(p_to, p_from + v_settings.max_days_ahead);

  -- Hanya varian yang bisa direservasi, tanpa duplikat, dengan urutan input, maksimal 4.
  select coalesce(array_agg(s.x order by s.o), '{}') into v_ids
  from (
    select t.x, min(t.o) as o
    from unnest(p_variant_ids) with ordinality as t (x, o)
    where exists (select 1 from public.reservable_units() ru where ru.variant_id = t.x)
    group by t.x
    order by min(t.o)
    limit 4
  ) s;

  -- Alasan "punya reservasi di jam ini" hanya untuk pelanggan yang login.
  if public.current_app_role() = 'customer' then
    v_customer := auth.uid();
  end if;

  for v_day in select d::date from generate_series(p_from, v_last, interval '1 day') as d loop
    v_open := null;
    v_close := null;
    select h.opens_at, h.closes_at into v_open, v_close
      from public.opening_hours h
      where h.isodow = extract(isodow from v_day)::int;

    if v_open is null or exists (select 1 from public.store_closures c where c.date = v_day) then
      starts_at := v_day::timestamp at time zone 'Asia/Jakarta';
      ends_at := starts_at;
      available := false;
      reason := 'closed';
      reason_variant_id := null;
      return next;
      continue;
    end if;

    v_start := (v_day + v_open) at time zone 'Asia/Jakarta';
    loop
      v_end := v_start + make_interval(mins => v_settings.session_minutes);
      exit when (v_end at time zone 'Asia/Jakarta') > (v_day + v_close);

      v_reason := null;
      v_reason_variant := null;
      if v_start <= now() then
        v_reason := 'past';
      elsif v_start < now() + make_interval(mins => v_settings.min_lead_minutes) then
        v_reason := 'too_soon';
      elsif v_day > v_today + v_settings.max_days_ahead then
        v_reason := 'too_far';
      else
        select p.reason, p.reason_variant_id into v_reason, v_reason_variant
          from public.plan_reservation(v_ids, tstzrange(v_start, v_end, '[)'), v_customer) p;
      end if;

      starts_at := v_start;
      ends_at := v_end;
      available := v_reason is null;
      reason := v_reason;
      reason_variant_id := v_reason_variant;
      return next;

      v_start := v_end;
    end loop;
  end loop;
end;
$$;

revoke execute on function public.reservable_variants() from public;
revoke execute on function public.reservation_slots(date, date, uuid[]) from public;
grant execute on function public.reservable_variants() to anon, authenticated;
grant execute on function public.reservation_slots(date, date, uuid[]) to anon, authenticated;
