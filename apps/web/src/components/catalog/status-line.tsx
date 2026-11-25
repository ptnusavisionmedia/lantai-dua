import type { Tone } from '@lantai-dua/shared/catalog';
import type { ComponentType, SVGProps } from 'react';
import { ArrowUpRight, CircleCheck, CircleMinus, CircleX, Clock } from '../icons';

const TONE: Record<Tone, { className: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  ok: { className: 'bg-success-soft text-success', Icon: CircleCheck },
  warn: { className: 'bg-warning-soft text-warning', Icon: Clock },
  bad: { className: 'bg-danger-soft text-danger', Icon: CircleX },
  demo: { className: 'bg-accent-soft text-accent-ink', Icon: ArrowUpRight },
  none: { className: 'bg-surface-sunken text-ink-muted', Icon: CircleMinus },
};

/** Chip status: ikon + teks + latar lembut (design system §2.3). Status tidak pernah ditandai warna saja. */
export function StatusLine({ tone, text }: { tone: Tone; text: string }) {
  const { className, Icon } = TONE[tone];
  return (
    <span
      className={`inline-flex min-h-6 max-w-full items-center gap-1.5 rounded-sm px-2 text-[13px] leading-tight font-medium ${className}`}
    >
      <Icon width={14} height={14} className="shrink-0" />
      <span className="min-w-0">{text}</span>
    </span>
  );
}
