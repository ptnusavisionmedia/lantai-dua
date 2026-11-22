import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildThemeCss } from './theme-css.ts';
import { tokens } from './tokens.ts';

const css = buildThemeCss(tokens);

describe('buildThemeCss', () => {
  it('exposes palette A to Tailwind', () => {
    expect(css).toContain('--color-primary: #0E4B57;');
    expect(css).toContain('--color-accent-ink: #95491C;');
    expect(css).toContain('--ease-out: cubic-bezier(0.22, 1, 0.36, 1);');
    expect(css).toContain('--dur-showcase: 640ms;');
  });

  it('removes the default Tailwind palette so only token colours exist', () => {
    expect(css).toContain('--color-*: initial;');
  });

  it('points fonts at the next/font variables', () => {
    expect(css).toContain('--font-display: var(--font-archivo),');
    expect(css).toContain('--font-text: var(--font-instrument-sans),');
    expect(css).toContain('--font-mono: var(--font-geist-mono),');
  });

  it('honours reduced motion', () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*--dur-showcase: 0ms;/);
  });

  it('keeps theme.css in sync with tokens.ts', () => {
    expect(readFileSync(new URL('../theme.css', import.meta.url), 'utf8')).toBe(css);
  });
});
