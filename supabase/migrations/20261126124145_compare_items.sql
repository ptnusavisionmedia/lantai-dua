-- Fase 1B: data untuk halaman Bandingkan.
-- View compare_items memuat mouse dijual dan mouse referensi (tidak dijual) beserta harga dan status demo.
-- Seperti catalog_items, view ini memakai security_invoker dan menulis ulang aturan visibilitas publik
-- secara eksplisit, jadi staf dan tamu melihat hasil yang sama.

create view public.compare_items
with (security_invoker = true) as
with visible_products as (
  select p.*, c.slug as category_slug, c.try_mode, b.slug as brand_slug, b.name as brand_name
  from public.products p
  join public.categories c on c.id = p.category_id and c.is_active
  join public.brands b on b.id = p.brand_id
  where p.is_active
),
variant_stats as (
  select v.product_id, min(v.price_idr) as price_min, max(v.price_idr) as price_max
  from public.product_variants v
  where v.is_active
  group by v.product_id
),
best_unit as (
  select distinct on (u.product_id) u.product_id, u.status, u.variant_name, u.variant_sku
  from public.counted_demo_units u
  order by u.product_id, u.rank, u.code
)
select
  p.id,
  p.slug,
  p.model_name,
  p.brand_slug,
  p.brand_name,
  p.category_slug,
  p.is_for_sale,
  p.specs,
  p.eloshapes_url,
  case when p.is_for_sale then s.price_min end as price_min,
  case when p.is_for_sale then s.price_max end as price_max,
  case
    when not p.is_for_sale then 'none'
    when p.try_mode = 'free' then 'free'
    else coalesce(bu.status::text, 'none')
  end as demo_status,
  case when p.is_for_sale and p.try_mode <> 'free' then bu.variant_sku end as demo_variant_sku,
  case when p.is_for_sale and p.try_mode <> 'free' then bu.variant_name end as demo_variant_name
from visible_products p
left join variant_stats s on s.product_id = p.id
left join best_unit bu on bu.product_id = p.id
-- Mouse dijual tanpa varian aktif tidak bisa dibeli dan tidak punya halaman, jadi tidak ditawarkan.
where not p.is_for_sale or s.product_id is not null;

comment on view public.compare_items is 'Mouse dijual dan referensi untuk Bandingkan (Fase 1B).';

grant select on public.compare_items to anon, authenticated;

-- Pasangan contoh untuk /bandingkan dan beranda (PRD §9.1 L4). Diubah pemilik lewat pengaturan toko.
alter table public.store_settings
  add column compare_example_current_id uuid references public.products (id) on delete set null,
  add column compare_example_target_id uuid references public.products (id) on delete set null;

-- "ukur" dipakai di URL Bandingkan untuk ukuran manual, jadi tidak boleh menjadi slug produk.
alter table public.products
  add constraint products_slug_not_reserved check (slug <> 'ukur');
