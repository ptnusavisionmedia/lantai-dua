-- Katalog: rak, kategori + template spek, merek, produk, varian, dan foto (PRD §9.3, §11).

create type public.try_mode as enum ('unit', 'station', 'free');
create type public.attribute_type as enum ('number', 'enum', 'multi_enum', 'boolean', 'text');
create type public.attribute_scope as enum ('product', 'variant');
create type public.image_kind as enum ('main', 'side', 'detail');

create table public.category_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.category_groups (id) on delete restrict,
  slug text not null unique,
  name text not null,
  try_mode public.try_mode not null,
  hygiene_note text,
  is_active boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_group_id_idx on public.categories (group_id);

-- Template spek: atribut apa saja yang boleh diisi untuk produk/varian di sebuah kategori.
create table public.category_attributes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  key text not null check (key ~ '^[a-z][a-z0-9_]*$'),
  label text not null,
  type public.attribute_type not null,
  scope public.attribute_scope not null default 'product',
  unit text,
  options text[],
  is_filterable boolean not null default false,
  is_comparable boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, key),
  constraint category_attributes_options_match_type check (
    (type in ('enum', 'multi_enum')) = (options is not null and cardinality(options) > 0)
  )
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  brand_id uuid not null references public.brands (id) on delete restrict,
  model_name text not null,
  slug text not null unique,
  description text not null default '',
  specs jsonb not null default '{}' check (jsonb_typeof(specs) = 'object'),
  is_for_sale boolean not null default true,
  is_active boolean not null default false,
  eloshapes_url text,
  contour_top_svg text,
  contour_side_svg text,
  spec_source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_id_idx on public.products (category_id);
create index products_brand_id_idx on public.products (brand_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  name text not null,
  attributes jsonb not null default '{}' check (jsonb_typeof(attributes) = 'object'),
  price_idr integer not null check (price_idr >= 0),
  stock_qty integer not null default 0 check (stock_qty >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_variants_product_id_idx on public.product_variants (product_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  storage_path text not null,
  kind public.image_kind not null default 'main',
  alt text not null default '',
  sort_order int not null default 0
);
create index product_images_product_id_idx on public.product_images (product_id);
create index product_images_variant_id_idx on public.product_images (variant_id);

create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger category_attributes_set_updated_at before update on public.category_attributes
  for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger product_variants_set_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

-- Validasi nilai spek terhadap template kategori. Error memakai kode 22023 (invalid_parameter_value).
create function public.validate_spec_values(
  p_category_id uuid,
  p_scope public.attribute_scope,
  p_values jsonb
)
returns void
language plpgsql
stable
set search_path = ''
as $$
declare
  item record;
  attr_type public.attribute_type;
  attr_options text[];
  is_valid boolean;
begin
  for item in select e.key, e.value from jsonb_each(p_values) as e loop
    select a.type, a.options into attr_type, attr_options
    from public.category_attributes a
    where a.category_id = p_category_id and a.key = item.key and a.scope = p_scope;

    if not found then
      raise exception 'Atribut "%" tidak ada di template kategori ini.', item.key
        using errcode = '22023';
    end if;

    is_valid := case attr_type
      when 'number' then jsonb_typeof(item.value) = 'number'
      when 'boolean' then jsonb_typeof(item.value) = 'boolean'
      when 'text' then jsonb_typeof(item.value) = 'string'
      when 'enum' then
        jsonb_typeof(item.value) = 'string' and (item.value #>> '{}') = any (attr_options)
      when 'multi_enum' then
        jsonb_typeof(item.value) = 'array'
        and not exists (
          select 1 from jsonb_array_elements(item.value) as el
          where jsonb_typeof(el) <> 'string' or not ((el #>> '{}') = any (attr_options))
        )
      else false
    end;

    if not is_valid then
      raise exception 'Nilai atribut "%" tidak sesuai tipe %.', item.key, attr_type
        using errcode = '22023';
    end if;
  end loop;
end;
$$;

create function public.validate_product_specs()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform public.validate_spec_values(new.category_id, 'product', new.specs);
  return new;
end;
$$;

create trigger products_validate_specs
  before insert or update of specs, category_id on public.products
  for each row execute function public.validate_product_specs();

create function public.validate_variant_attributes()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_category_id uuid;
begin
  select p.category_id into v_category_id from public.products p where p.id = new.product_id;
  perform public.validate_spec_values(v_category_id, 'variant', new.attributes);
  return new;
end;
$$;

create trigger product_variants_validate_attributes
  before insert or update of attributes, product_id on public.product_variants
  for each row execute function public.validate_variant_attributes();

-- RLS: semua orang boleh melihat yang aktif, staf melihat semua, hanya pemilik yang menulis.
alter table public.category_groups enable row level security;
alter table public.categories enable row level security;
alter table public.category_attributes enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;

create policy "category_groups: semua baca" on public.category_groups
  for select to anon, authenticated using (true);
create policy "category_groups: pemilik tulis" on public.category_groups
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "categories: publik baca yang aktif" on public.categories
  for select to anon, authenticated using (is_active or public.is_staff());
create policy "categories: pemilik tulis" on public.categories
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "category_attributes: baca kalau kategorinya terlihat" on public.category_attributes
  for select to anon, authenticated
  using (
    public.is_staff()
    or exists (select 1 from public.categories c where c.id = category_id and c.is_active)
  );
create policy "category_attributes: pemilik tulis" on public.category_attributes
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "brands: semua baca" on public.brands
  for select to anon, authenticated using (true);
create policy "brands: pemilik tulis" on public.brands
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "products: publik baca yang aktif" on public.products
  for select to anon, authenticated
  using (
    public.is_staff()
    or (
      is_active
      and exists (select 1 from public.categories c where c.id = category_id and c.is_active)
    )
  );
create policy "products: pemilik tulis" on public.products
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "product_variants: publik baca yang aktif" on public.product_variants
  for select to anon, authenticated
  using (
    public.is_staff()
    or (is_active and exists (select 1 from public.products p where p.id = product_id))
  );
create policy "product_variants: pemilik tulis" on public.product_variants
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "product_images: publik baca kalau produknya terlihat" on public.product_images
  for select to anon, authenticated
  using (public.is_staff() or exists (select 1 from public.products p where p.id = product_id));
create policy "product_images: pemilik tulis" on public.product_images
  for all to authenticated using (public.is_owner()) with check (public.is_owner());
