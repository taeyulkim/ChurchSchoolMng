'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Loader2, Upload, FileSpreadsheet, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { bulkCreateStudents, type BulkCreateResult } from '@/lib/actions/student';
import { Database } from '@/lib/supabase/database.types';

type StudentInsert = Database['public']['Tables']['students']['Insert'];
type Department = StudentInsert['department'];

const DEPARTMENTS: Department[] = ['유아부', '유치부', '어린이부', '청소년부', '청년부'];

interface UploadRow {
  [key: string]: string | number | Date | undefined;
}

function toBirthDateString(value: UploadRow[string]): string | null {
  if (!value) return null;
  if (value instanceof Date) return format(value, 'yyyy-MM-dd');
  const str = String(value).trim();
  return str || null;
}

function mapRow(row: UploadRow): StudentInsert {
  const genderText = String(row['성별'] ?? '').trim();
  const departmentText = String(row['부서'] ?? '').trim() as Department;

  return {
    name: String(row['이름'] ?? '').trim(),
    gender: genderText === '남' ? 'male' : genderText === '여' ? 'female' : ('' as never),
    department: DEPARTMENTS.includes(departmentText) ? departmentText : ('' as never),
    school: String(row['학교'] ?? '').trim() || null,
    grade: String(row['학년'] ?? '').trim() || null,
    parent_name: String(row['학부모성함'] ?? '').trim() || null,
    parent_contact: String(row['학부모연락처'] ?? '').trim() || null,
    birth_date: toBirthDateString(row['생년월일']),
  };
}

interface BulkUploadDialogProps {
  onSuccess?: () => void;
}

export function BulkUploadDialog({ onSuccess }: BulkUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<BulkCreateResult | null>(null);

  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      { 이름: '홍길동', 성별: '남', 부서: '어린이부', 학교: '새소망초등학교', 학년: '3학년', 학부모성함: '홍아빠', 학부모연락처: '010-1234-5678', 생년월일: '2015-01-01' },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, '학생_업로드_양식.xlsx');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<UploadRow>(sheet);

      if (rows.length === 0) {
        toast.error('엑셀 파일에 데이터가 없습니다.');
        return;
      }

      const students = rows.map(mapRow);
      const res = await bulkCreateStudents(students);

      if (!res.success || !res.data) {
        toast.error('일괄 업로드 중 오류가 발생했습니다.');
        return;
      }

      setResult(res.data);
      if (res.data.created > 0) {
        toast.success(`${res.data.created}명의 학생이 등록되었습니다.`);
        onSuccess?.();
      }
      if (res.data.failed.length > 0) {
        toast.error(`${res.data.failed.length}건은 등록에 실패했습니다.`);
      }
    } catch (error) {
      console.error(error);
      toast.error('엑셀 파일을 읽는 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 py-2">
      <p className="text-sm text-muted-foreground">
        이름·성별·부서는 필수 항목입니다. 먼저 양식을 다운로드해 형식에 맞게 작성해주세요.
      </p>

      <Button variant="outline" className="w-full" onClick={handleDownloadTemplate}>
        <Download className="mr-2 h-4 w-4" />
        엑셀 양식 다운로드
      </Button>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          엑셀 파일 선택 후 업로드
        </Button>
      </div>

      {result && (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-2">
          <div className="flex items-center gap-2 font-medium">
            <FileSpreadsheet className="h-4 w-4" />
            업로드 결과: 성공 {result.created}건 / 실패 {result.failed.length}건
          </div>
          {result.failed.length > 0 && (
            <ul className="max-h-32 overflow-y-auto space-y-1 text-xs text-destructive">
              {result.failed.map((f, i) => (
                <li key={i}>{f.row}행 ({f.name}): {f.error}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
