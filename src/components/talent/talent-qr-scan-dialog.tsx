'use client';

import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QrCodeReader } from '@/components/common/qr-code-reader';
import { getStudentByToken } from '@/lib/actions/student';
import { Database } from '@/lib/supabase/database.types';

type StudentRow = Database['public']['Tables']['students']['Row'];

interface TalentQrScanDialogProps {
  onFound: (student: StudentRow) => void;
}

function extractQrToken(decodedText: string): string | null {
  const match = decodedText.match(/\/qr\/([^/?#]+)/);
  return match ? match[1] : null;
}

export function TalentQrScanDialog({ onFound }: TalentQrScanDialogProps) {
  const [attempt, setAttempt] = useState(0);
  const [isLooking, setIsLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = async (decodedText: string) => {
    const token = extractQrToken(decodedText);
    if (!token) {
      setError('학생 QR 코드가 아닙니다.');
      return;
    }

    setIsLooking(true);
    const res = await getStudentByToken(token);
    setIsLooking(false);

    if (!res.success || !res.data) {
      setError(res.error || '유효하지 않은 QR 코드입니다.');
      return;
    }

    onFound(res.data);
  };

  const retry = () => {
    setError(null);
    setAttempt((n) => n + 1);
  };

  if (isLooking) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">학생 정보를 확인하고 있습니다...</p>
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
