-- Fase 1C-2: reservasi yang lupa ditutup (PRD §9.6 R12) dan pembaruan realtime (O6).
--   - Job pg_cron setiap 15 menit menutup reservasi yang sudah lewat batas tutupnya:
--     Check-in menjadi Selesai, Terjadwal menjadi Tidak tercatat.
--   - Batas tutup = yang paling akhir dari (jam tutup hari sesi + 2 jam) dan (akhir sesi + 2 jam).
--   - Tabel reservations masuk publikasi realtime. RLS tetap berlaku untuk setiap pelanggan realtime.

create extension if not exists pg_cron with schema pg_catalog;

create function public.close_overdue_reservations()
returns int
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  with due as (
    select r.id
    from public.reservations r
    left join public.opening_hours h
      on h.isodow = extract(isodow from (r.starts_at at time zone 'Asia/Jakarta'))::int
    where r.status in ('scheduled', 'checked_in')
      and r.starts_at < now()
      and now() >= greatest(
        coalesce(
          ((r.starts_at at time zone 'Asia/Jakarta')::date + h.closes_at) at time zone 'Asia/Jakarta',
          r.ends_at
        ) + interval '2 hours',
        r.ends_at + interval '2 hours'
      )
    -- Baris yang sedang diubah staf dilewati, lalu diproses di putaran berikutnya.
    for update of r skip locked
  )
  update public.reservations r
    set status = case r.status
      when 'checked_in' then 'completed'::public.reservation_status
      else 'unrecorded'::public.reservation_status
    end
    from due
    where r.id = due.id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

select cron.schedule(
  'tutup-reservasi-terlewat',
  '*/15 * * * *',
  $$select public.close_overdue_reservations()$$
);

alter publication supabase_realtime add table public.reservations;

-- Pemeriksaan untuk tes: skema cron dan katalog publikasi tidak terbuka lewat API.
create function public.reservation_ops_check()
returns table (job_schedule text, job_active boolean, realtime_published boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select j.schedule from cron.job j where j.jobname = 'tutup-reservasi-terlewat'),
    (select j.active from cron.job j where j.jobname = 'tutup-reservasi-terlewat'),
    exists (
      select 1 from pg_catalog.pg_publication_tables t
      where t.pubname = 'supabase_realtime' and t.schemaname = 'public' and t.tablename = 'reservations'
    );
$$;

-- ── Hak akses ─────────────────────────────────────────────────────────────────

revoke execute on function public.close_overdue_reservations() from public, anon, authenticated;
revoke execute on function public.reservation_ops_check() from public, anon, authenticated;
grant execute on function public.close_overdue_reservations() to service_role;
grant execute on function public.reservation_ops_check() to service_role;
