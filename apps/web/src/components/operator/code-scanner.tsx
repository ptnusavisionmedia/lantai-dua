'use client';

import { normalizeReservationCode } from '@lantai-dua/shared/reservation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../button';

const CAMERA_FAILED = 'Kamera tidak bisa dipakai. Ketik kodenya saja.';
const NOT_OURS = 'QR ini bukan kode reservasi LANTAI DUA.';
const SCAN_EVERY_MS = 250;
/** Lebar gambar maksimum untuk jsQR, supaya HP kelas menengah tidak berat. */
const DECODE_WIDTH = 640;

type Detect = (video: HTMLVideoElement) => Promise<string | null>;

type BarcodeDetectorLike = {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
};
type BarcodeDetectorCtor = {
  new (options: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats(): Promise<string[]>;
};

/** `BarcodeDetector` bawaan browser kalau mendukung QR; kalau tidak, jsQR lewat canvas. */
async function makeDetector(): Promise<Detect> {
  const Native = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  if (Native) {
    try {
      if ((await Native.getSupportedFormats()).includes('qr_code')) {
        const detector = new Native({ formats: ['qr_code'] });
        return async (video) => (await detector.detect(video))[0]?.rawValue ?? null;
      }
    } catch {
      // Lanjut ke jsQR.
    }
  }
  const { default: jsQR } = await import('jsqr');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  return async (video) => {
    if (!context || video.videoWidth === 0) return null;
    const scale = Math.min(1, DECODE_WIDTH / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(image.data, image.width, image.height)?.data ?? null;
  };
}

/**
 * Scan QR reservasi lewat kamera (desain 1C-2 §5.2). Tombolnya tampil di browser yang bisa membuka
 * kamera. Kamera selalu dimatikan saat QR terbaca, dialog ditutup, atau halaman ditinggalkan.
 */
export function CodeScanner() {
  const router = useRouter();
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stopRef = useRef<() => void>(() => {});
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setAvailable(window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia));
    return () => stopRef.current();
  }, []);

  const open = async () => {
    setError(null);
    setMessage(null);
    dialog.current?.showModal();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
    } catch {
      setError(CAMERA_FAILED);
      return;
    }
    const v = video.current;
    if (!dialog.current?.open || !v) {
      for (const t of stream.getTracks()) t.stop();
      return;
    }

    let stopped = false;
    let busy = false;
    let timer: number | undefined;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      window.clearInterval(timer);
      for (const t of stream.getTracks()) t.stop();
      v.srcObject = null;
    };
    stopRef.current = stop;

    v.srcObject = stream;
    await v.play().catch(() => {});
    let detect: Detect;
    try {
      detect = await makeDetector();
    } catch {
      stop();
      setError(CAMERA_FAILED);
      return;
    }
    if (stopped) return;
    timer = window.setInterval(async () => {
      if (busy || stopped) return;
      busy = true;
      try {
        const text = await detect(v);
        if (!text) return;
        const code = normalizeReservationCode(text);
        if (!code) {
          setMessage(NOT_OURS);
          return;
        }
        stop();
        dialog.current?.close();
        router.push(`/operator/reservasi/${code}`);
      } catch {
        // Bingkai yang belum siap dilewati.
      } finally {
        busy = false;
      }
    }, SCAN_EVERY_MS);
  };

  if (!available) return null;

  return (
    <>
      <Button variant="secondary" onClick={open}>
        Scan kamera
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby={`${id}-judul`}
        onClose={() => stopRef.current()}
        className="m-auto w-[min(480px,calc(100vw-32px))] rounded-lg border border-border bg-surface p-5 text-ink backdrop:bg-ink/40"
      >
        <h2 id={`${id}-judul`} className="font-display text-lg font-semibold">
          Scan QR reservasi
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Arahkan kamera ke QR reservasi</p>
        <video
          ref={video}
          playsInline
          muted
          className={`mt-4 aspect-[4/3] w-full rounded-md bg-ink/90 object-cover ${error ? 'hidden' : ''}`}
        />
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-md bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger"
          >
            {error}
          </p>
        )}
        {message && !error && (
          <p role="status" className="mt-3 text-sm font-medium text-warning">
            {message}
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => dialog.current?.close()}>
            Tutup
          </Button>
        </div>
      </dialog>
    </>
  );
}
