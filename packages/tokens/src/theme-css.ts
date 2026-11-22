import type { Tokens } from './tokens.ts';

/** Variabel CSS yang dibuat next/font di apps/web/src/app/layout.tsx. */
const FONT_VARIABLE = {
  display: '--font-archivo',
  text: '--font-instrument-sans',
  mono: '--font-geist-mono',
} as const;

const FONT_FALLBACK = {
  display: 'ui-sans-serif, system-ui, sans-serif',
  text: 'ui-sans-serif, system-ui, sans-serif',
  mono: 'ui-monospace, monospace',
} as const;

const bezier = (curve: readonly number[]) => `cubic-bezier(${curve.join(', ')})`;

const durationVariable = (name: string) => (name === 'stagger' ? '--stagger' : `--dur-${name}`);

/** Membuat CSS tema Tailwind v4 dari token. Hasilnya ditulis ke packages/tokens/theme.css. */
export function buildThemeCss(t: Tokens): string {
  const lines = [
    '/* Dibuat otomatis oleh packages/tokens/scripts/write-theme.ts. Jangan diedit manual. */',
    '@theme {',
    '  --color-*: initial;',
  ];
  for (const [name, value] of Object.entries(t.color)) lines.push(`  --color-${name}: ${value};`);
  for (const [name, value] of Object.entries(t.radius)) lines.push(`  --radius-${name}: ${value};`);
  for (const [name, value] of Object.entries(t.shadow)) lines.push(`  --shadow-${name}: ${value};`);
  for (const [name, curve] of Object.entries(t.easing))
    lines.push(`  --ease-${name}: ${bezier(curve)};`);
  lines.push('}', '', '@theme inline {');
  for (const role of ['display', 'text', 'mono'] as const) {
    lines.push(`  --font-${role}: var(${FONT_VARIABLE[role]}), ${FONT_FALLBACK[role]};`);
  }
  lines.push('}', '', ':root {', `  --font-display-stretch: ${t.fontStretch.display};`);
  for (const [name, ms] of Object.entries(t.duration))
    lines.push(`  ${durationVariable(name)}: ${ms}ms;`);
  lines.push('}', '', '@media (prefers-reduced-motion: reduce) {', '  :root {');
  for (const [name, ms] of Object.entries(t.reducedMotion)) {
    lines.push(`    ${durationVariable(name)}: ${ms}ms;`);
  }
  lines.push('  }', '}', '');
  return lines.join('\n');
}
