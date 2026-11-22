-- Seed struktural LANTAI DUA (PRD §9.3, §9.6, §15). Aman dijalankan berulang kali.
-- Akun demo dibuat terpisah lewat `pnpm db:seed-users` (butuh Auth admin API).

-- Rak
insert into public.category_groups (slug, name, sort_order) values
  ('kontrol', 'Kontrol', 1),
  ('permukaan', 'Permukaan', 2),
  ('audio', 'Audio', 3)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

-- Kategori versi pertama
insert into public.categories (group_id, slug, name, try_mode, hygiene_note, is_active, sort_order)
select g.id, v.slug, v.name, v.try_mode::public.try_mode, v.hygiene_note, true, v.sort_order
from (values
  ('kontrol', 'mouse', 'Mouse', 'unit', null, 1),
  ('kontrol', 'keyboard', 'Keyboard', 'unit', null, 2),
  ('permukaan', 'mousepad', 'Mousepad kain', 'free', null, 3),
  ('permukaan', 'glasspad', 'Glasspad', 'free', null, 4),
  ('permukaan', 'deskmat', 'Deskmat', 'free', null, 5),
  ('audio', 'headset', 'Headset / headphone', 'unit',
    'Pasang cover telinga sekali pakai sebelum dipakai pelanggan.', 6)
) as v (group_slug, slug, name, try_mode, hygiene_note, sort_order)
join public.category_groups g on g.slug = v.group_slug
on conflict (slug) do update set
  group_id = excluded.group_id,
  name = excluded.name,
  try_mode = excluded.try_mode,
  hygiene_note = excluded.hygiene_note,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

-- Template spek. Kolom f = bisa difilter, c = bisa dibandingkan.
insert into public.category_attributes
  (category_id, key, label, type, scope, unit, options, is_filterable, is_comparable, sort_order)
select c.id, v.key, v.label, v.type::public.attribute_type, v.scope::public.attribute_scope,
  v.unit, v.options, v.f, v.c, v.sort_order
from (values
  -- mouse
  ('mouse', 'length_mm', 'Panjang', 'number', 'product', 'mm', null::text[], false, true, 1),
  ('mouse', 'width_mm', 'Lebar', 'number', 'product', 'mm', null, false, true, 2),
  ('mouse', 'height_mm', 'Tinggi', 'number', 'product', 'mm', null, false, true, 3),
  ('mouse', 'weight_g', 'Bobot', 'number', 'product', 'g', null, true, true, 4),
  ('mouse', 'shape', 'Bentuk', 'enum', 'product', null,
    array['Simetris', 'Ergonomis kanan'], true, true, 5),
  ('mouse', 'connectivity', 'Koneksi', 'multi_enum', 'product', null,
    array['Kabel', 'Wireless 2.4 GHz', 'Bluetooth'], true, true, 6),
  ('mouse', 'sensor', 'Sensor', 'text', 'product', null, null, false, true, 7),
  ('mouse', 'color', 'Warna', 'text', 'variant', null, null, false, false, 8),
  -- keyboard
  ('keyboard', 'layout', 'Layout', 'enum', 'product', null,
    array['Full size', 'TKL', '75%', '65%', '60%'], true, true, 1),
  ('keyboard', 'connectivity', 'Koneksi', 'multi_enum', 'product', null,
    array['Kabel', 'Wireless 2.4 GHz', 'Bluetooth'], true, true, 2),
  ('keyboard', 'hot_swap', 'Hot-swap', 'boolean', 'product', null, null, true, true, 3),
  ('keyboard', 'switch_type', 'Jenis switch', 'enum', 'variant', null,
    array['Linear', 'Tactile', 'Clicky', 'Magnetic'], true, true, 4),
  ('keyboard', 'switch_name', 'Nama switch', 'text', 'variant', null, null, false, true, 5),
  ('keyboard', 'color', 'Warna', 'text', 'variant', null, null, false, false, 6),
  -- headset
  ('headset', 'connectivity', 'Koneksi', 'multi_enum', 'product', null,
    array['3.5 mm', 'USB', 'Wireless 2.4 GHz', 'Bluetooth'], true, true, 1),
  ('headset', 'mic', 'Mic', 'enum', 'product', null,
    array['Lepas-pasang', 'Tetap', 'Tanpa mic'], true, true, 2),
  ('headset', 'back_type', 'Tipe', 'enum', 'product', null,
    array['Closed-back', 'Open-back'], true, true, 3),
  ('headset', 'weight_g', 'Bobot', 'number', 'product', 'g', null, false, true, 4),
  ('headset', 'color', 'Warna', 'text', 'variant', null, null, false, false, 5),
  -- mousepad kain
  ('mousepad', 'size', 'Ukuran', 'enum', 'product', null,
    array['S', 'M', 'L', 'XL', 'XXL'], true, true, 1),
  ('mousepad', 'surface', 'Permukaan', 'enum', 'product', null,
    array['Control', 'Speed', 'Hybrid'], true, true, 2),
  ('mousepad', 'length_mm', 'Panjang', 'number', 'product', 'mm', null, false, true, 3),
  ('mousepad', 'width_mm', 'Lebar', 'number', 'product', 'mm', null, false, true, 4),
  ('mousepad', 'thickness_mm', 'Ketebalan', 'number', 'product', 'mm', null, true, true, 5),
  ('mousepad', 'color', 'Warna', 'text', 'variant', null, null, false, false, 6),
  -- glasspad
  ('glasspad', 'length_mm', 'Panjang', 'number', 'product', 'mm', null, true, true, 1),
  ('glasspad', 'width_mm', 'Lebar', 'number', 'product', 'mm', null, false, true, 2),
  ('glasspad', 'thickness_mm', 'Ketebalan', 'number', 'product', 'mm', null, true, true, 3),
  ('glasspad', 'coating', 'Lapisan permukaan', 'text', 'product', null, null, false, true, 4),
  ('glasspad', 'color', 'Warna', 'text', 'variant', null, null, false, false, 5),
  -- deskmat
  ('deskmat', 'length_mm', 'Panjang', 'number', 'product', 'mm', null, true, true, 1),
  ('deskmat', 'width_mm', 'Lebar', 'number', 'product', 'mm', null, false, true, 2),
  ('deskmat', 'material', 'Bahan', 'enum', 'product', null,
    array['Kain', 'Kulit sintetis', 'Felt'], true, true, 3),
  ('deskmat', 'color', 'Warna', 'text', 'variant', null, null, false, false, 4)
) as v (category_slug, key, label, type, scope, unit, options, f, c, sort_order)
join public.categories c on c.slug = v.category_slug
on conflict (category_id, key) do update set
  label = excluded.label,
  type = excluded.type,
  scope = excluded.scope,
  unit = excluded.unit,
  options = excluded.options,
  is_filterable = excluded.is_filterable,
  is_comparable = excluded.is_comparable,
  sort_order = excluded.sort_order;

-- Area demo versi pertama
insert into public.demo_areas (slug, name, kind, capacity, is_reservable, sort_order) values
  ('meja-kontrol', 'Meja Kontrol', 'desk', 3, true, 1),
  ('meja-permukaan', 'Meja Permukaan', 'free', 0, false, 2)
on conflict (slug) do update set
  name = excluded.name,
  kind = excluded.kind,
  capacity = excluded.capacity,
  is_reservable = excluded.is_reservable,
  sort_order = excluded.sort_order;

-- Pengaturan toko (alamat fiktif)
insert into public.store_settings (id, address, whatsapp) values
  (true, 'Jl. Contoh Raya No. 2, Surabaya', '6281200000000')
on conflict (id) do update set address = excluded.address, whatsapp = excluded.whatsapp;

-- Jam buka: Senin–Sabtu 10.00–21.00, Minggu 12.00–20.00
insert into public.opening_hours (isodow, opens_at, closes_at) values
  (1, '10:00', '21:00'),
  (2, '10:00', '21:00'),
  (3, '10:00', '21:00'),
  (4, '10:00', '21:00'),
  (5, '10:00', '21:00'),
  (6, '10:00', '21:00'),
  (7, '12:00', '20:00')
on conflict (isodow) do update set opens_at = excluded.opens_at, closes_at = excluded.closes_at;
