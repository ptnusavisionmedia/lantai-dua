import Link from 'next/link';
import { CodeScanner } from '@/components/operator/code-scanner';
import { CodeSearch } from '@/components/operator/code-search';

/** Kode yang tidak ada: tampilkan lagi kolom kode supaya operator bisa mencoba lagi. */
export default function OperatorReservationNotFound() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/operator"
          className="inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline"
        >
          ← Hari ini
        </Link>
        <h1 className="font-display mt-2 text-2xl font-bold">Kode reservasi tidak ditemukan</h1>
        <p className="mt-2 text-ink-muted">Periksa lagi kodenya, atau scan ulang QR pelanggan.</p>
      </div>
      <CodeSearch>
        <CodeScanner />
      </CodeSearch>
    </div>
  );
}
