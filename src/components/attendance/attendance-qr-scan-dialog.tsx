'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { QrCodeReader } from '@/components/common/qr-code-reader';
import { getStudentByToken } from '@/lib/actions/student';
import { upsertAttendance } from '@/lib/actions/attendance';

interface ScannedEntry {
  key: string;
  name: string;
  department: string;
}

interface AttendanceQrScanDialogProps {
  attendanceDate: string;
  onChecked: (studentId: number) => void;
}

function extractQrToken(decodedText: string): string | null {
  const match = decodedText.match(/\/qr\/([^/?#]+)/);
  return match ? match[1] : null;
}

/**
 * 학생 QR 코드를 스캔하면 즉시 해당 날짜로 출석 처리합니다.
 * 한 명을 처리한 뒤 자동으로 카메라를 재시작해 여러 명을 연속으로 스캔할 수 있습니다.
 */
export function AttendanceQrScanDialog({ attendanceDate, onChecked }: AttendanceQrScanDialogProps) {
  const [attempt, setAttempt] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState<ScannedEntry[]>([]);

  const handleDecode = async (decodedText: string) => {
    const token = extractQrToken(decodedText);
    if (!token) {
      setError('학생 QR 코드가 아닙니다.');
      setAttempt((n) => n + 1);
      return;
    }

    setIsProcessing(true);
    setError(null);

    const studentRes = await getStudentByToken(token);
    if (!studentRes.success || !studentRes.data) {
      setError(studentRes.error || '유효하지 않은 QR 코드입니다.');
      setIsProcessing(false);
      setAttempt((n) => n + 1);
      return;
    }

    const student = studentRes.data;
    const res = await upsertAttendance([
      { student_id: student.id, attendance_date: attendanceDate, is_present: true },
    ]);

    setIsProcessing(false);
    if (!res.success) {
      toast.error(`${student.name} 학생 출석 처리 중 오류가 발생했습니다.`);
    } else {
      onChecked(student.id);
      setScanned((prev) => [
        { key: `${student.id}-${Date.now()}`, name: student.name, department: student.department },
        ...prev,
      ]);
      toast.success(`${student.name} 학생 출석 처리되었습니다.`);
    }
    setAttempt((n) => n + 1);
  };

  return (
    <div className="space-y-4">
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">출석 처리 중입니다...</p>
        </div>
      ) : (
        <QrCodeReader key={attempt} onDecode={handleDecode} />
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {scanned.length > 0 && (
        <div className="rounded-lg border bg-muted/30 max-h-40 overflow-y-auto divide-y">
          {scanned.map((s) => (
            <div key={s.key} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="font-medium">{s.name}</span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {s.department}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
