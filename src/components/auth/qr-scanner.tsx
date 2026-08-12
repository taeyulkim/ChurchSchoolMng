'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function QrScanner() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (scannerRef.current) return;

    const onScanSuccess = (decodedText: string) => {
      if (isProcessing) return;
      
      if (decodedText.includes('/qr/')) {
        setIsProcessing(true);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
        
        window.location.href = decodedText;
      }
    };

    const onScanError = (errorMessage: string) => {
    };

    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(onScanSuccess, onScanError);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isProcessing]);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">로그인 처리 중입니다...</p>
        </div>
      ) : (
        <div className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border bg-white shadow-sm">
          <div id="qr-reader" className="w-full"></div>
        </div>
      )}
      
      <style jsx global>{`
        #qr-reader {
          border: none !important;
        }
        #qr-reader__scan_region {
          background-color: #f8fafc;
        }
        #qr-reader__dashboard {
          padding: 1rem;
        }
        #qr-reader button {
          background-color: #0ea5e9;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          margin: 0.25rem;
        }
        #qr-reader button:hover {
          background-color: #0284c7;
        }
        #qr-reader__dashboard_section_csr span {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
