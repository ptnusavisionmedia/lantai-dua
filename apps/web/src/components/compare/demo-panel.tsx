import {
  type ComparePair,
  hasDemoUnit,
  slotDemoLabel,
  slotItem,
  slotName,
  tryBothHref,
} from '@lantai-dua/shared/compare';
import type { CompareViewer } from '@/lib/compare-data';
import { Button, ButtonLink } from '../button';
import { StatusLine } from '../catalog/status-line';

/** Status unit demo kedua mouse, tombol Coba keduanya, saran B8, dan tautan EloShapes. */
export function DemoPanel({ pair, viewer }: { pair: ComparePair; viewer: CompareViewer }) {
  const { current, target } = pair;
  if (!current || !target) return null;

  const href = tryBothHref(pair);
  const destination = href && viewer === 'guest' ? `/masuk?next=${encodeURIComponent(href)}` : href;
  const slots = [
    { role: 'Mouse sekarang', name: slotName(current), label: slotDemoLabel(current) },
    { role: 'Incaran', name: slotName(target), label: slotDemoLabel(target) },
  ];
  const shapes = [slotItem(current), target].filter(
    (item, i, all): item is NonNullable<typeof item> =>
      item?.eloshapesUrl != null && all.findIndex((x) => x?.id === item.id) === i,
  );

  return (
    <section aria-labelledby="unit-demo" className="border-t border-border pt-6">
      <h2 id="unit-demo" className="font-display text-lg font-semibold">
        Unit demo
      </h2>
      <ul className="mt-3 space-y-2">
        {slots.map((s) => (
          <li key={s.role} className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm text-ink">
              <span className="text-ink-muted">{s.role}:</span> {s.name}
            </span>
            <StatusLine tone={s.label.tone} text={s.label.text} />
          </li>
        ))}
      </ul>

      <div className="mt-5">
        {destination ? (
          <ButtonLink variant="demo" href={destination}>
            Coba keduanya di Surabaya
          </ButtonLink>
        ) : (
          <>
            <Button variant="demo" disabled aria-describedby="tanpa-unit-demo">
              Coba keduanya di Surabaya
            </Button>
            <p id="tanpa-unit-demo" className="mt-2 text-sm text-ink-muted">
              Dua mouse ini belum ada unit demonya.
            </p>
          </>
        )}
        {!hasDemoUnit(current) && (
          <p className="mt-3 max-w-[60ch] text-sm text-ink-muted">
            Mouse lama lu nggak ada di showroom? Bawa aja dari rumah biar bisa dibandingin langsung.
          </p>
        )}
      </div>

      {shapes.length > 0 && (
        <ul className="mt-4 space-y-1">
          {shapes.map((item) => (
            <li key={item.id}>
              <a
                href={item.eloshapesUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline"
              >
                Bandingkan bentuknya di EloShapes: {slotName(item)}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
