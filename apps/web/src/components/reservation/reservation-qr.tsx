import QRCode from 'qrcode';

/** QR berisi kode reservasi, dibuat di server sebagai SVG (dipindai operator saat check-in). */
export async function ReservationQr({ code, size = 168 }: { code: string; size?: number }) {
  const svg = await QRCode.toString(code, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#111111', light: '#ffffff' },
  });
  return (
    // biome-ignore lint/performance/noImgElement: SVG data URL kecil yang dibuat di server, bukan foto.
    <img
      src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
      alt={`QR ${code}`}
      width={size}
      height={size}
      className="rounded-md border border-border bg-white p-2"
    />
  );
}
