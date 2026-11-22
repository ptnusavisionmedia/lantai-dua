import type { Metadata } from 'next';
import { Archivo, Geist_Mono, Instrument_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
});
const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap',
});
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s · LANTAI DUA',
    default: 'LANTAI DUA · Coba dulu. Baru pilih.',
  },
  description:
    'Toko periferal gaming di Surabaya. Semua produk berlabel demo bisa dicoba langsung di lantai dua sebelum dibeli.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      className={`${archivo.variable} ${instrumentSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
