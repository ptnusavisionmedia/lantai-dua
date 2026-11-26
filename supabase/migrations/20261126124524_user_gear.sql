-- Fase 1B: Gear gue (PRD §9.5 B10, §11). Satu gear per pelanggan per kategori, berupa produk dari daftar
-- (dijual atau referensi) atau ukuran manual. Hanya pelanggan yang bisa membaca dan mengubah miliknya
-- sendiri (PRD §11.2).

create table public.user_gear (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  manual_specs jsonb check (jsonb_typeof(manual_specs) = 'object'),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id),
  constraint user_gear_product_or_manual check ((product_id is null) <> (manual_specs is null)),
  constraint user_gear_manual_keys check (
    manual_specs is null
    or (
      manual_specs <> '{}'::jsonb
      and manual_specs - array['length_mm', 'width_mm', 'height_mm', 'weight_g'] = '{}'::jsonb
    )
  )
);
create index user_gear_product_id_idx on public.user_gear (product_id);
create index user_gear_category_id_idx on public.user_gear (category_id);

comment on table public.user_gear is 'Gear pelanggan untuk mengisi Bandingkan. Produk atau ukuran manual.';

create trigger user_gear_set_updated_at before update on public.user_gear
  for each row execute function public.set_updated_at();

-- Produk harus dari kategori yang sama; ukuran manual harus cocok dengan template kategori.
create function public.validate_user_gear()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_category_id uuid;
begin
  if new.product_id is not null then
    select p.category_id into v_category_id from public.products p where p.id = new.product_id;
    if v_category_id is distinct from new.category_id then
      raise exception 'Produk gear harus dari kategori yang sama.' using errcode = '22023';
    end if;
  end if;
  if new.manual_specs is not null then
    perform public.validate_spec_values(new.category_id, 'product', new.manual_specs);
  end if;
  return new;
end;
$$;

create trigger user_gear_validate
  before insert or update on public.user_gear
  for each row execute function public.validate_user_gear();

-- Saat template kategori berubah, ukuran manual ikut diperiksa ulang. Fungsi ini security definer
-- karena pemilik yang mengubah template tidak bisa membaca gear pelanggan lewat RLS; tanpa itu
-- pemeriksaannya akan melewati semua baris tanpa memeriksa apa pun.
create function public.revalidate_gear_values(p_category_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec record;
begin
  for rec in
    select g.manual_specs from public.user_gear g
    where g.category_id = p_category_id and g.manual_specs is not null
  loop
    perform public.validate_spec_values(p_category_id, 'product', rec.manual_specs);
  end loop;
end;
$$;

create or replace function public.revalidate_category_values(p_category_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  rec record;
begin
  for rec in select p.specs from public.products p where p.category_id = p_category_id loop
    perform public.validate_spec_values(p_category_id, 'product', rec.specs);
  end loop;
  for rec in
    select v.attributes
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where p.category_id = p_category_id
  loop
    perform public.validate_spec_values(p_category_id, 'variant', rec.attributes);
  end loop;
  perform public.revalidate_gear_values(p_category_id);
end;
$$;

-- Dipanggil lewat trigger template dengan hak pemilik, jadi authenticated perlu execute. Tamu tidak.
revoke execute on function public.revalidate_gear_values(uuid) from public, anon;
grant execute on function public.revalidate_gear_values(uuid) to authenticated;

alter table public.user_gear enable row level security;

create policy "user_gear: pelanggan baca miliknya" on public.user_gear
  for select to authenticated
  using (user_id = auth.uid() and public.current_app_role() = 'customer');

create policy "user_gear: pelanggan tambah miliknya" on public.user_gear
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.current_app_role() = 'customer'
    and (product_id is null or exists (select 1 from public.products p where p.id = product_id))
  );

create policy "user_gear: pelanggan ubah miliknya" on public.user_gear
  for update to authenticated
  using (user_id = auth.uid() and public.current_app_role() = 'customer')
  with check (
    user_id = auth.uid()
    and public.current_app_role() = 'customer'
    and (product_id is null or exists (select 1 from public.products p where p.id = product_id))
  );

create policy "user_gear: pelanggan hapus miliknya" on public.user_gear
  for delete to authenticated
  using (user_id = auth.uid() and public.current_app_role() = 'customer');
