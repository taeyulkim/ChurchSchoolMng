'use client';

import { QRCodeCanvas } from 'qrcode.react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Database } from '@/lib/supabase/database.types';
import { useEffect, useState } from 'react';

type StudentRow = Database['public']['Tables']['students']['Row'];

interface QrDialogProps {
  student: StudentRow | null;
  onClose: () => void;
}

export function QrDialog({ student, onClose }: QrDialogProps) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (student?.qr_token) {
      // Get the base URL (window.location.origin works on client)
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      setQrUrl(`${baseUrl}/qr/${student.qr_token}`);
    }
  }, [student]);

  if (!student) return null;

  const downloadQR = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    let downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `${student.name}_QR.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        {qrUrl ? (
          <QRCodeCanvas 
            id="qr-canvas"
            value={qrUrl} 
            size={200}
            level="H"
            includeMargin={true}
          />
        ) : (
          <div className="w-[200px] h-[200px] bg-muted flex items-center justify-center text-sm text-muted-foreground rounded-lg">
            토큰 없음
          </div>
        )}
      </div>
      
      <div className="text-center space-y-1">
        <h3 className="font-semibold text-lg">{student.name}</h3>
        <p className="text-sm text-muted-foreground">{student.department}</p>
      </div>

      <Button onClick={downloadQR} className="w-full" disabled={!qrUrl}>
        <Download className="w-4 h-4 mr-2" />
        이미지 다운로드
      </Button>
    </div>
  );
}
