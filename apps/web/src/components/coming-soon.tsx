export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pt-16 md:px-8 md:pt-24">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
        Segera hadir
      </p>
      <h1 className="font-display mt-3 text-[40px] leading-[1.1] font-bold tracking-[-0.015em] text-balance">
        {title}
      </h1>
      <p className="mt-4 max-w-[62ch] text-lg text-ink-muted">{description}</p>
    </section>
  );
}
