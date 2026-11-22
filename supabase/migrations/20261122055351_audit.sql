-- Log audit: siapa mengubah apa dan kapan (PRD §9.11 PM6). Pencatatan berjalan sejak Fase 0.

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null check (action in ('insert', 'update', 'delete')),
  table_name text not null,
  row_id text not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_table_created_idx on public.audit_logs (table_name, created_at desc);
create index audit_logs_row_id_idx on public.audit_logs (row_id);

comment on table public.audit_logs is 'Riwayat perubahan. Hanya pemilik yang bisa membaca; ditulis oleh trigger.';

-- Argumen opsional: daftar kolom (dipisah koma) yang disimpan. Kolom id selalu ikut disimpan.
create function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb;
  new_row jsonb;
  row_key text;
  kept text[];
begin
  if tg_op <> 'INSERT' then old_row := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then new_row := to_jsonb(new); end if;

  row_key := coalesce(new_row ->> 'id', old_row ->> 'id', new_row ->> 'isodow', old_row ->> 'isodow');

  if tg_nargs > 0 then
    kept := array['id'] || string_to_array(tg_argv[0], ',');
    select jsonb_object_agg(e.key, e.value) into old_row
      from jsonb_each(old_row) as e where e.key = any (kept);
    select jsonb_object_agg(e.key, e.value) into new_row
      from jsonb_each(new_row) as e where e.key = any (kept);
  end if;

  insert into public.audit_logs (actor_id, action, table_name, row_id, before, after)
  values (auth.uid(), lower(tg_op), tg_table_name, row_key, old_row, new_row);
  return null;
end;
$$;

create trigger audit_categories after insert or update or delete on public.categories
  for each row execute function public.audit_row_change();
create trigger audit_category_attributes after insert or update or delete on public.category_attributes
  for each row execute function public.audit_row_change();
create trigger audit_products after insert or update or delete on public.products
  for each row execute function public.audit_row_change();
create trigger audit_product_variants after insert or update or delete on public.product_variants
  for each row execute function public.audit_row_change();
create trigger audit_demo_areas after insert or update or delete on public.demo_areas
  for each row execute function public.audit_row_change();
create trigger audit_demo_units after insert or update or delete on public.demo_units
  for each row execute function public.audit_row_change();
create trigger audit_store_settings after insert or update or delete on public.store_settings
  for each row execute function public.audit_row_change();
create trigger audit_opening_hours after insert or update or delete on public.opening_hours
  for each row execute function public.audit_row_change();

-- Profil: hanya perubahan peran/status, dan hanya kolom itu (nomor WhatsApp tidak ikut tercatat).
create trigger audit_profiles_privileges after update on public.profiles
  for each row
  when (old.role is distinct from new.role or old.is_active is distinct from new.is_active)
  execute function public.audit_row_change('role,is_active');

alter table public.audit_logs enable row level security;

create policy "audit_logs: pemilik baca" on public.audit_logs
  for select to authenticated using (public.is_owner());
