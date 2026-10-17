import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'unsupported' | 'error';

interface UseCameraOptions {
  /** Called when a barcode is detected in the live video (Chrome/Edge/Android via BarcodeDetector). */
  onBarcode?: (code: string) => void;
  /** Turn continuous barcode scanning on/off (e.g. pause while a lookup is running). */
  scanBarcodes?: boolean;
}

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf'];

function getBarcodeDetectorCtor(): any {
  return typeof window !== 'undefined' ? (window as any).BarcodeDetector : undefined;
}

export function useCamera({ onBarcode, scanBarcodes = false }: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const onBarcodeRef = useRef(onBarcode);
  onBarcodeRef.current = onBarcode;

  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const barcodeSupported = Boolean(getBarcodeDetectorCtor());

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setTorchOn(false);
    setTorchSupported(false);
    setStatus((s) => (s === 'active' || s === 'requesting' ? 'idle' : s));
  }, []);

  const start = useCallback(
    async (mode: 'environment' | 'user' = facingMode) => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setStatus('unsupported');
        setErrorMessage(
          typeof window !== 'undefined' && !window.isSecureContext
            ? 'Camera needs a secure (https://) connection.'
            : 'This browser does not support camera access.'
        );
        return;
      }

      streamRef.current?.getTracks().forEach((t) => t.stop());
      setStatus('requesting');
      setErrorMessage('');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        streamRef.current = stream;
        setFacingMode(mode);

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.setAttribute('playsinline', 'true');
          video.muted = true;
          await video.play().catch(() => {});
        }

        const track = stream.getVideoTracks()[0];
        const caps: any = track?.getCapabilities?.() || {};
        setTorchSupported(Boolean(caps.torch));
        setStatus('active');
      } catch (err: any) {
        const name = err?.name || '';
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setStatus('denied');
          setErrorMessage('Camera permission was blocked. Allow camera access in your browser settings and try again.');
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setStatus('error');
          setErrorMessage('No camera was found on this device.');
        } else if (name === 'NotReadableError') {
          setStatus('error');
          setErrorMessage('The camera is being used by another app. Close it and try again.');
        } else {
          setStatus('error');
          setErrorMessage(err?.message || 'Could not start the camera.');
        }
      }
    },
    [facingMode]
  );

  const flip = useCallback(() => {
    start(facingMode === 'environment' ? 'user' : 'environment');
  }, [facingMode, start]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !torchSupported) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn(!torchOn);
    } catch (e) {}
  }, [torchOn, torchSupported]);

  /** Grabs the current video frame as a JPEG data URL. */
  const captureFrame = useCallback((maxWidth = 1024): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  const getDetector = useCallback(() => {
    const Ctor = getBarcodeDetectorCtor();
    if (!Ctor) return null;
    if (!detectorRef.current) {
      try {
        detectorRef.current = new Ctor({ formats: BARCODE_FORMATS });
      } catch (e) {
        detectorRef.current = new Ctor();
      }
    }
    return detectorRef.current;
  }, []);

  /** One-shot barcode detection on the current frame. */
  const detectBarcodeOnce = useCallback(async (): Promise<string | null> => {
    const detector = getDetector();
    const video = videoRef.current;
    if (!detector || !video || !video.videoWidth) return null;
    try {
      const codes = await detector.detect(video);
      const value = codes?.[0]?.rawValue;
      return value ? String(value) : null;
    } catch (e) {
      return null;
    }
  }, [getDetector]);

  // Continuous barcode scanning while the camera is live
  useEffect(() => {
    if (status !== 'active' || !scanBarcodes || !barcodeSupported) return;
    let cancelled = false;
    let busy = false;
    const id = window.setInterval(async () => {
      if (busy || cancelled) return;
      busy = true;
      const code = await detectBarcodeOnce();
      busy = false;
      if (code && !cancelled) {
        cancelled = true;
        window.clearInterval(id);
        if (navigator.vibrate) navigator.vibrate(80);
        onBarcodeRef.current?.(code);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [status, scanBarcodes, barcodeSupported, detectBarcodeOnce]);

  // Always release the camera when the component unmounts
  useEffect(() => () => stop(), [stop]);

  // Release the camera while the tab is hidden (saves battery, turns off the camera light)
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && streamRef.current) stop();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [stop]);

  return {
    videoRef,
    status,
    errorMessage,
    start,
    stop,
    flip,
    facingMode,
    torchSupported,
    torchOn,
    toggleTorch,
    captureFrame,
    detectBarcodeOnce,
    barcodeSupported,
  };
}
