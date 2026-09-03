'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Loader2, Camera, ImageUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const READER_ELEMENT_ID = 'qr-reader';

export function QrScanner() {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleScanSuccess = (decodedText: string) => {
    if (decodedText.includes('/qr/')) {
      setIsProcessing(true);
      html5QrCodeRef.current?.stop().catch(() => {});
      window.location.href = decodedText;
    }
  };

  const startCamera = async () => {
    setError(null);
    setIsStarting(true);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(READER_ELEMENT_ID, /* verbose= */ false);
      }
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanSuccess,
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
        html5QrCodeRef.current = new Html5Qrcode(READER_ELEMENT_ID, false);
      }
      const decodedText = await html5QrCodeRef.current.scanFile(file, false);
      handleScanSuccess(decodedText);
    } catch (err) {
      console.error(err);
      setError('QR 코드를 인식하지 못했습니다. 다른 이미지를 시도해주세요.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">로그인 처리 중입니다...</p>
        </div>
      ) : (
        <>
          <div className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border bg-black shadow-sm relative aspect-square">
            <div id={READER_ELEMENT_ID} className="w-full h-full" />
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
        </>
      )}
    </div>
  );
}
