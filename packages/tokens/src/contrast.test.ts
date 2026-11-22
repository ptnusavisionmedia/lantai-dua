import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast.ts';
import { tokens } from './tokens.ts';

describe('contrastRatio', () => {
  it('computes WCAG ratios', () => {
    expect(contrastRatio('#FFFFFF', '#0E4B57')).toBeCloseTo(9.71, 1);
    expect(contrastRatio('#0E4B57', '#FFFFFF')).toBeCloseTo(9.71, 1);
  });
});

describe('palette A contrast', () => {
  it.each([
    ['on-primary', 'primary', 4.5],
    ['primary', 'bg', 4.5],
    ['ink', 'bg', 4.5],
    ['ink-muted', 'bg', 4.5],
    ['ink-muted', 'surface-sunken', 4.5],
    ['accent-ink', 'bg', 4.5],
    ['accent-ink', 'accent-soft', 4.5],
    ['accent-ink', 'surface', 4.5],
    ['success', 'success-soft', 4.5],
    ['warning', 'warning-soft', 4.5],
    ['danger', 'danger-soft', 4.5],
    ['accent', 'bg', 3],
    ['border-input', 'surface', 3],
  ] as const)('%s on %s reaches %d:1', (fg, bg, min) => {
    expect(contrastRatio(tokens.color[fg], tokens.color[bg])).toBeGreaterThanOrEqual(min);
  });
});
