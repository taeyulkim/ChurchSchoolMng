'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Loader2, Camera, ImageUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

let instanceCounter = 0;

interface QrCodeReaderProps {
  /** QR 코드를 한 번 인식하면 카메라를 멈추고 정확히 한 번 호출됩니다. */
  onDecode: (decodedText: string) => void;
}

/**
 * 카메라 기반 QR 스캐너 (재사용 가능한 코어).
 * 인식에 성공하면 카메라를 멈추고 onDecode를 호출합니다.
 * 다시 스캔하려면 부모 컴포넌트에서 key를 바꿔 이 컴포넌트를 재마운트하세요.
 */
export function QrCodeReader({ onDecode }: QrCodeReaderProps) {
  const [readerId] = useState(() => `qr-reader-${++instanceCounter}`);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasDecodedRef = useRef(false);
  const [isStarting, setIsStarting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = (decodedText: string) => {
    if (hasDecodedRef.current) return;
    hasDecodedRef.current = true;
    html5QrCodeRef.current?.stop().catch(() => {});
    onDecode(decodedText);
  };

  const startCamera = async () => {
    setError(null);
    setIsStarting(true);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(readerId, /* verbose= */ false);
      }
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleDecode,
        () => {}
      );
    } catch (err) {
      console.error(err);
      setError('카메라를 시작할 수 없습니다. 브라우저의 카메라 권한을 허용했는지 확인해주세요.');
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      const instance = html5QrCodeRef.current;
      if (instance && instance.isScanning) {
        instance.stop().catch(() => {}).finally(() => instance.clear());
      } else {
        instance?.clear();
      }
      html5QrCodeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(readerId, false);
      }
      const decodedText = await html5QrCodeRef.current.scanFile(file, false);
      handleDecode(decodedText);
    } catch (err) {
      console.error(err);
      setError('QR 코드를 인식하지 못했습니다. 다른 이미지를 시도해주세요.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      <div className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border bg-black shadow-sm relative aspect-square">
        <div id={readerId} className="w-full h-full" />
        {isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/80 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">카메라를 준비하고 있습니다...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="w-full max-w-sm flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-2 w-full max-w-sm">
        <Button variant="outline" className="flex-1" onClick={startCamera} disabled={isStarting}>
          <Camera className="mr-2 h-4 w-4" />
          카메라 다시 시도
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
          <ImageUp className="mr-2 h-4 w-4" />
          이미지로 스캔
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileScan}
      />
    </div>
  );
}
