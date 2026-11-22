import type { Metadata } from 'next';
import { Button } from '@/components/button';
import { signOut } from '../actions';

export const metadata: Metadata = { title: 'Akun nonaktif' };

export default function AkunNonaktifPage() {
  return (
    <>
      <h1 className="font-display text-[30px] leading-9 font-semibold tracking-[-0.01em]">
        Akun ini sedang dinonaktifkan
      </h1>
      <p className="mt-2 text-ink-muted">Hubungi pemilik toko kalau ini keliru.</p>
      <form action={signOut} className="mt-6">
        <Button type="submit" variant="secondary">
          Keluar
        </Button>
      </form>
    </>
  );
}
