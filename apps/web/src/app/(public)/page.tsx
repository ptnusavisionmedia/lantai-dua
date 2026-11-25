import { ButtonLink } from '@/components/button';
import { DemoRow } from '@/components/home/demo-row';
import { RackDoors } from '@/components/home/rack-doors';
import { listCatalogItems } from '@/lib/catalog-data';

export default async function HomePage() {
  const items = await listCatalogItems();
  return (
    <>
      <section className="mx-auto max-w-[1200px] px-4 pt-14 pb-12 md:px-8 md:pt-24">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          Toko periferal gaming · Surabaya
        </p>
        <h1 className="font-display mt-3 max-w-[14ch] text-[clamp(2.5rem,1.6rem+3.6vw,4rem)] leading-[1.02] font-bold tracking-[-0.02em] text-balance">
          Coba dulu. Baru pilih.
        </h1>
        <p className="mt-5 max-w-[52ch] text-lg leading-7 text-ink-muted">
          Semua produk berlabel demo bisa dicoba langsung di lantai dua sebelum dibeli. Cek unit
          yang tersedia, pesan mejanya, lalu datang.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/katalog">Lihat Katalog</ButtonLink>
          <ButtonLink href="/reservasi/baru" variant="demo">
            Reservasi Demo
          </ButtonLink>
        </div>
      </section>
      <DemoRow items={items} />
      <RackDoors items={items} />
    </>
  );
}
