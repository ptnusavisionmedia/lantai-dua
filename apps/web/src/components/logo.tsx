/** Simbol LANTAI DUA: angka 2 bersudut yang sekaligus berbentuk anak tangga (versi sementara). */
export function Logo({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-ink">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="shrink-0">
        <rect width="28" height="28" rx="7" fill="var(--color-ink)" />
        <path
          d="M8 8.5h11.5v5.5H8.5v5.5H20"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="square"
        />
      </svg>
      {withWordmark && (
        <span className="font-display text-[17px] font-bold tracking-[0.06em]">LANTAI DUA</span>
      )}
    </span>
  );
}
