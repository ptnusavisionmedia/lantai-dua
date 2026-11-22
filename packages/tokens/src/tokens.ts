/**
 * Sumber kebenaran token desain LANTAI DUA (palet A · Petrol & Tembaga).
 * Nilai mengikuti design-system/lantai-dua/MASTER.md. Dipakai web (lewat theme.css) dan aplikasi.
 */
export const tokens = {
  color: {
    bg: '#F5F4F0',
    surface: '#FFFFFF',
    'surface-sunken': '#ECEBE6',
    border: '#DDDBD4',
    'border-input': '#8A8E92',
    ink: '#141719',
    'ink-muted': '#565B5F',
    'ink-subtle': '#7C8185',
    'on-primary': '#FFFFFF',
    primary: '#0E4B57',
    'primary-hover': '#0A3A44',
    'primary-soft': '#E2EDEE',
    accent: '#B5612C',
    'accent-ink': '#95491C',
    'accent-soft': '#F6E9DF',
    success: '#1E7A4E',
    'success-soft': '#E3F2EA',
    warning: '#8A5A00',
    'warning-soft': '#FBF0D9',
    danger: '#B42318',
    'danger-soft': '#FBE7E5',
  },
  fontFamily: {
    display: 'Archivo',
    text: 'Instrument Sans',
    mono: 'Geist Mono',
  },
  fontStretch: {
    display: '85%',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '24px',
  },
  shadow: {
    overlay: '0 1px 2px rgb(20 23 25 / 0.06), 0 8px 24px rgb(20 23 25 / 0.08)',
  },
  /** Milidetik. */
  duration: {
    instant: 90,
    fast: 150,
    base: 220,
    slow: 320,
    showcase: 640,
    stagger: 40,
  },
  /** Pengganti saat prefers-reduced-motion aktif (MASTER §6.5), dalam milidetik. */
  reducedMotion: {
    base: 120,
    slow: 120,
    showcase: 0,
    stagger: 0,
  },
  easing: {
    out: [0.22, 1, 0.36, 1],
    'in-out': [0.65, 0, 0.35, 1],
    exit: [0.4, 0, 1, 1],
  },
  spring: {
    ui: { stiffness: 380, damping: 32 },
    layout: { stiffness: 220, damping: 28 },
  },
} as const;

export type Tokens = typeof tokens;
export type ColorToken = keyof Tokens['color'];
