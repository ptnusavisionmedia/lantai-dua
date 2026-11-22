-- Trigger validasi spek berjalan dengan hak pengguna yang mengedit (pemilik lewat API),
-- jadi fungsi validasinya harus bisa dieksekusi role authenticated. Tamu (anon) tetap tidak.
grant execute on function public.validate_spec_values(uuid, public.attribute_scope, jsonb)
  to authenticated;
grant execute on function public.revalidate_category_values(uuid) to authenticated;
