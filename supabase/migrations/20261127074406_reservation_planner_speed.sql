-- Mempercepat perencana reservasi. Daftar unit yang bisa direservasi dijadikan view internal,
-- supaya planner Postgres bisa menggabungkannya ke query pemanggil. Fungsi security definer tidak
-- pernah di-inline, jadi setiap panggilan reservable_units() menjalankan ulang join lima tabel.
-- Perilakunya tidak berubah.

create view public.reservable_unit_list as
  select u.id as unit_id, u.code, u.variant_id, u.area_id, u.status
  from public.demo_units u
  join public.demo_areas a on a.id = u.area_id and a.is_active and a.is_reservable
  join public.product_variants v on v.id = u.variant_id and v.is_active
  join public.products p on p.id = v.product_id and p.is_active and p.is_for_sale
  join public.categories c on c.id = p.category_id and c.is_active and c.try_mode = 'unit'
  where u.status in ('available', 'in_use', 'servicing');

comment on view public.reservable_unit_list is 'Internal untuk fungsi reservasi. Tidak dibuka lewat API.';

-- View dimiliki postgres dan dibaca hanya oleh fungsi security definer.
revoke all on public.reservable_unit_list from public, anon, authenticated;

create or replace function public.reservable_units()
returns table (unit_id uuid, code text, variant_id uuid, area_id uuid, status public.demo_unit_status)
language sql
stable
security definer
set search_path = ''
as $$
  select r.unit_id, r.code, r.variant_id, r.area_id, r.status from public.reservable_unit_list r;
$$;

create or replace function public.plan_reservation(p_variant_ids uuid[], p_period tstzrange, p_customer uuid)
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
  v_free int;
  v_assignable int;
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
    from public.reservable_unit_list ru
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
      continue;
    end if;

    -- Kenapa tidak ada unit: meja penuh, semua unit diservis, atau semua unit sudah dipesan.
    select
      (count(*) filter (
        where not exists (
          select 1 from public.reservation_items i
          where i.unit_id = ru.unit_id and i.is_active and i.period && p_period
        )
      ))::int,
      count(*)::int
      into v_free, v_assignable
    from public.reservable_unit_list ru
    where ru.variant_id = v_variant and ru.status in ('available', 'in_use');

    if v_free > 0 then
      v_desk_full := true;
    elsif v_assignable = 0 then
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

create or replace function public.reservable_variants()
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
  from public.reservable_unit_list ru
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

-- create or replace mempertahankan hak akses lama; ditulis ulang supaya jelas.
revoke execute on function public.reservable_units() from public, anon, authenticated;
revoke execute on function public.plan_reservation(uuid[], tstzrange, uuid) from public, anon, authenticated;
