-- Menjaga spek yang sudah tersimpan tetap valid saat template kategori berubah
-- atau saat produk dipindah ke kategori lain (temuan review akhir Fase 0, I1).

-- Memeriksa ulang semua spek produk dan atribut varian di satu kategori.
create function public.revalidate_category_values(p_category_id uuid)
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
end;
$$;

create function public.guard_category_attribute_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.revalidate_category_values(old.category_id);
  else
    perform public.revalidate_category_values(new.category_id);
    if old.category_id is distinct from new.category_id then
      perform public.revalidate_category_values(old.category_id);
    end if;
  end if;
  return null;
end;
$$;

create trigger category_attributes_keep_values_valid
  after update or delete on public.category_attributes
  for each row execute function public.guard_category_attribute_change();

-- Produk pindah kategori: variannya juga harus cocok dengan template kategori baru.
create function public.validate_variants_after_category_move()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  rec record;
begin
  for rec in select v.attributes from public.product_variants v where v.product_id = new.id loop
    perform public.validate_spec_values(new.category_id, 'variant', rec.attributes);
  end loop;
  return null;
end;
$$;

create trigger products_validate_variants_after_move
  after update of category_id on public.products
  for each row
  when (old.category_id is distinct from new.category_id)
  execute function public.validate_variants_after_category_move();

-- Fungsi validasi hanya dipakai trigger, tidak perlu bisa dipanggil lewat API.
revoke execute on function public.validate_spec_values(uuid, public.attribute_scope, jsonb)
  from public, anon, authenticated;
revoke execute on function public.revalidate_category_values(uuid)
  from public, anon, authenticated;
