-- Tamu hanya melihat unit demo yang aktif: belum pensiun, area-nya aktif, dan variannya terlihat publik
-- (PRD §11.2 "yang aktif saja"). Catatan internal staf tidak lagi disimpan di tabel publik ini;
-- di Fase 1 catatan pindah ke riwayat unit demo yang hanya bisa dibaca staf.

alter table public.demo_units drop column notes;

drop policy "demo_units: publik baca yang belum pensiun" on public.demo_units;

create policy "demo_units: publik baca yang aktif" on public.demo_units
  for select to anon, authenticated
  using (
    public.is_staff()
    or (
      status <> 'retired'
      and exists (select 1 from public.demo_areas a where a.id = area_id and a.is_active)
      and exists (select 1 from public.product_variants v where v.id = variant_id)
    )
  );
