-- Fase 1A: view baca untuk katalog dan detail produk, serta bucket foto produk.
-- View memakai security_invoker supaya RLS tabel asal tetap berlaku. Karena RLS memberi staf akses
-- ke data nonaktif, semua aturan visibilitas publik ditulis ulang di sini secara eksplisit,
-- jadi staf dan tamu melihat hasil yang sama.

-- Unit demo yang dihitung: belum pensiun, area aktif, varian aktif. Peringkat: available 1, in_use 2, servicing 3.
create view public.counted_demo_units
with (security_invoker = true) as
select
  u.id,
  u.code,
  u.status,
  u.variant_id,
  v.product_id,
  v.sku as variant_sku,
  v.name as variant_name,
  case u.status when 'available' then 1 when 'in_use' then 2 else 3 end as rank
from public.demo_units u
join public.product_variants v on v.id = u.variant_id and v.is_active
join public.demo_areas a on a.id = u.area_id and a.is_active
where u.status <> 'retired';

comment on view public.counted_demo_units is 'Bantuan internal untuk catalog_items dan variant_availability.';

create view public.catalog_items
with (security_invoker = true) as
with visible_products as (
  select p.*, c.slug as category_slug, c.name as category_name, c.try_mode,
    g.slug as group_slug, g.name as group_name, g.sort_order as group_sort_order,
    b.slug as brand_slug, b.name as brand_name
  from public.products p
  join public.categories c on c.id = p.category_id and c.is_active
  join public.category_groups g on g.id = c.group_id
  join public.brands b on b.id = p.brand_id
  where p.is_active and p.is_for_sale
),
variant_stats as (
  select v.product_id,
    min(v.price_idr) as price_min,
    max(v.price_idr) as price_max,
    sum(v.stock_qty)::int as stock_total,
    jsonb_agg(v.attributes order by v.sort_order, v.sku) as variant_attributes
  from public.product_variants v
  where v.is_active
  group by v.product_id
),
best_unit as (
  select distinct on (u.product_id) u.product_id, u.status, u.variant_name, u.variant_sku
  from public.counted_demo_units u
  order by u.product_id, u.rank, u.code
),
main_image as (
  select distinct on (i.product_id) i.product_id, i.storage_path
  from public.product_images i
  where i.kind = 'main' and i.variant_id is null
  order by i.product_id, i.sort_order, i.id
)
select
  p.id,
  p.slug,
  p.model_name,
  p.brand_slug,
  p.brand_name,
  p.category_slug,
  p.category_name,
  p.try_mode,
  p.group_slug,
  p.group_name,
  p.group_sort_order,
  p.specs,
  s.variant_attributes,
  s.price_min,
  s.price_max,
  s.stock_total,
  case
    when p.try_mode = 'free' then 'free'
    else coalesce(bu.status::text, 'none')
  end as demo_status,
  case when p.try_mode = 'free' then null else bu.variant_name end as demo_variant_name,
  case when p.try_mode = 'free' then null else bu.variant_sku end as demo_variant_sku,
  mi.storage_path as image_path,
  p.created_at
from visible_products p
join variant_stats s on s.product_id = p.id
left join best_unit bu on bu.product_id = p.id
left join main_image mi on mi.product_id = p.id;

create view public.variant_availability
with (security_invoker = true) as
with best_unit as (
  select distinct on (u.variant_id) u.variant_id, u.status
  from public.counted_demo_units u
  order by u.variant_id, u.rank, u.code
),
variant_image as (
  select distinct on (i.variant_id) i.variant_id, i.storage_path
  from public.product_images i
  where i.kind = 'main' and i.variant_id is not null
  order by i.variant_id, i.sort_order, i.id
)
select
  v.id,
  v.product_id,
  v.sku,
  v.name,
  v.attributes,
  v.price_idr,
  v.stock_qty,
  v.sort_order,
  case
    when ci.try_mode = 'free' then 'free'
    else coalesce(bu.status::text, 'none')
  end as demo_status,
  vi.storage_path as image_path
from public.product_variants v
join public.catalog_items ci on ci.id = v.product_id
left join best_unit bu on bu.variant_id = v.id
left join variant_image vi on vi.variant_id = v.id
where v.is_active;

grant select on public.counted_demo_units to anon, authenticated;
grant select on public.catalog_items to anon, authenticated;
grant select on public.variant_availability to anon, authenticated;

-- Bucket foto produk: semua orang bisa membaca, hanya pemilik yang bisa mengubah.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

create policy "product-images: semua baca" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-images');

create policy "product-images: pemilik unggah" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_owner());

create policy "product-images: pemilik ubah" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_owner())
  with check (bucket_id = 'product-images' and public.is_owner());

create policy "product-images: pemilik hapus" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_owner());
