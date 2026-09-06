'use client';

import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QrCodeReader } from '@/components/common/qr-code-reader';

export function QrScanner() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const handleDecode = (decodedText: string) => {
    if (decodedText.includes('/qr/')) {
      setIsProcessing(true);
      window.location.href = decodedText;
    } else {
      setError('유효한 로그인 QR 코드가 아닙니다.');
    }
  };

  const retry = () => {
    setError(null);
    setAttempt((n) => n + 1);
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">로그인 처리 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-full max-w-sm flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
        <Button variant="outline" onClick={retry}>다시 스캔하기</Button>
      </div>
    );
  }

  return <QrCodeReader key={attempt} onDecode={handleDecode} />;
}
