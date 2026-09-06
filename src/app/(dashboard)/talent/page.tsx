'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Coins, Search, ArrowUpRight, ArrowDownRight, Loader2, Plus, Minus, History, Download, RotateCcw, AlertTriangle, Filter, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { getStudents } from '@/lib/actions/student';
import { createTalentTransaction, getTalentHistory, resetAllTalents, TalentHistoryEntry } from '@/lib/actions/talent';
import { isMasterAdmin } from '@/lib/actions/user';
import { Database } from '@/lib/supabase/database.types';
import { TalentQrScanDialog } from '@/components/talent/talent-qr-scan-dialog';

type StudentRow = Database['public']['Tables']['students']['Row'];

const DEPARTMENTS = ['전체', '유아부', '유치부', '어린이부', '청소년부', '청년부'];

const talentSchema = z.object({
  type: z.enum(['grant', 'deduct']),
  amount: z.number({ message: '수량을 입력해주세요.' }).min(1, '1 이상의 수량을 입력해주세요.'),
});

const QUICK_ADD_VALUES = [1, 5, 10];

type TalentFormValues = z.infer<typeof talentSchema>;

const QUARTERS = [
  { value: 'all', label: '전체' },
  { value: 'q1', label: '1분기 (1~3월)' },
  { value: 'q2', label: '2분기 (4~6월)' },
  { value: 'q3', label: '3분기 (7~9월)' },
  { value: 'q4', label: '4분기 (10~12월)' },
] as const;

type Quarter = typeof QUARTERS[number]['value'];

function getQuarterRange(year: number, quarter: Quarter): { startDate: string; endDate: string } {
  const ranges: Record<Quarter, [string, string]> = {
    all: [`${year}-01-01`, `${year}-12-31`],
    q1: [`${year}-01-01`, `${year}-03-31`],
    q2: [`${year}-04-01`, `${year}-06-30`],
    q3: [`${year}-07-01`, `${year}-09-30`],
    q4: [`${year}-10-01`, `${year}-12-31`],
  };
  const [start, end] = ranges[quarter];
  return { startDate: `${start}T00:00:00`, endDate: `${end}T23:59:59.999` };
}

export default function TalentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('전체');
  const [talentsData, setTalentsData] = useState<StudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [historyStudent, setHistoryStudent] = useState<StudentRow | null>(null);
  const [historyEntries, setHistoryEntries] = useState<TalentHistoryEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportQuarter, setExportQuarter] = useState<Quarter>('all');

  const [isMaster, setIsMaster] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [isQrScanOpen, setIsQrScanOpen] = useState(false);
  const [qrFoundStudent, setQrFoundStudent] = useState<StudentRow | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [res, masterCheck] = await Promise.all([getStudents(), isMasterAdmin()]);
    setIsMaster(masterCheck);
    if (res.success && res.data) {
      setTalentsData(res.data);
    } else {
      toast.error('학생 데이터를 불러오지 못했습니다.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTalents = talentsData.filter(student => {
    const matchesSearch = student.name.includes(searchQuery);
    const matchesDepartment = departmentFilter === '전체' || student.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<TalentFormValues>({
    resolver: zodResolver(talentSchema),
    defaultValues: {
      type: 'grant',
      amount: 0,
    },
  });

  const txType = useWatch({ control, name: 'type' });
  const amount = useWatch({ control, name: 'amount' });

  const currentBalance = selectedStudent?.total_talents ?? 0;
  const exceedsBalance = txType === 'deduct' && (amount || 0) > currentBalance;

  const openDialog = (student: StudentRow, type: 'grant' | 'deduct') => {
    setSelectedStudent(student);
    reset({ type, amount: 0 });
    setIsDialogOpen(true);
  };

  const handleQrFound = (student: StudentRow) => {
    setIsQrScanOpen(false);
    setQrFoundStudent(student);
  };

  const handleQuickAdd = (value: number) => {
    setValue('amount', (amount || 0) + value, { shouldValidate: true });
  };

  const openHistory = async (student: StudentRow) => {
    setHistoryStudent(student);
    setIsHistoryLoading(true);
    const res = await getTalentHistory({ studentId: student.id });
    if (res.success && res.data) {
      setHistoryEntries(res.data);
    } else {
      toast.error('달란트 이력을 불러오지 못했습니다.');
    }
    setIsHistoryLoading(false);
  };

  const handleExportHistory = async () => {
    setIsExporting(true);
    try {
      const { startDate, endDate } = getQuarterRange(exportYear, exportQuarter);
      const res = await getTalentHistory({ startDate, endDate });
      if (!res.success || !res.data) {
        toast.error('이력을 불러오지 못했습니다.');
        return;
      }
      if (res.data.length === 0) {
        toast.error('선택한 기간에 이력이 없습니다.');
        return;
      }
      const rows = res.data.map((entry) => ({
        일시: format(new Date(entry.created_at), 'yyyy-MM-dd HH:mm', { locale: ko }),
        학생: entry.student_name,
        구분: entry.type === 'grant' ? '부여' : '차감',
        수량: entry.amount,
        사유: entry.reason,
        기록자: entry.recorded_by_name,
      }));
      const quarterLabel = QUARTERS.find(q => q.value === exportQuarter)?.label ?? '';
      const { downloadExcel } = await import('@/lib/export');
      downloadExcel(rows, `달란트_변경이력_${exportYear}_${quarterLabel.replace(/\s/g, '')}`);
      setIsExportDialogOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetAll = async () => {
    setIsResetting(true);
    try {
      const res = await resetAllTalents();
      if (!res.success) {
        toast.error(res.error || '초기화 중 오류가 발생했습니다.');
        return;
      }
      toast.success(`${res.data?.count ?? 0}명의 달란트가 초기화되었습니다.`);
      setIsResetDialogOpen(false);
      loadData();
    } finally {
      setIsResetting(false);
    }
  };

  const onSubmit = async (data: TalentFormValues) => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    try {
      const res = await createTalentTransaction({
        student_id: selectedStudent.id,
        type: data.type,
        amount: data.amount,
        reason: data.type === 'grant' ? '달란트 부여' : '달란트 차감',
      });

      if (!res.success) {
        toast.error(res.error || '달란트 처리 중 오류가 발생했습니다.');
        return;
      }
      
      const actionText = data.type === 'grant' ? '부여' : '차감';
      toast.success(`${selectedStudent.name} 학생에게 ${data.amount} 달란트를 ${actionText}했습니다.`);
      setIsDialogOpen(false);
      loadData(); // Refresh data
    } catch (error) {
      console.error(error);
      toast.error('시스템 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">달란트 관리</h1>
          <p className="text-sm text-muted-foreground">학생들의 달란트 현황을 조회하고 부여/차감합니다.</p>
        </div>
        {isMaster && (
          <Button
            variant="outline"
            className="w-full sm:w-auto shadow-sm text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setIsResetDialogOpen(true)}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            전 인원 달란트 초기화
          </Button>
        )}
      </div>

      {/* 검색 바 및 엑셀 다운로드 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center w-full">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:flex-1">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이름으로 학생 검색..."
              className="pl-9 h-11 bg-card rounded-xl shadow-sm border-transparent focus-visible:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={departmentFilter} onValueChange={(val) => val && setDepartmentFilter(val)}>
            <SelectTrigger className="w-full sm:w-[140px] h-11 bg-card shadow-sm">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="부서 선택" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept === '전체' ? '전체 부서' : dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full sm:w-auto h-11 shadow-sm" onClick={() => setIsQrScanOpen(true)}>
            <QrCode className="mr-2 h-4 w-4" />
            QR로 찾기
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto shadow-sm" onClick={() => {
            const dataToExport = filteredTalents.map(s => ({
              부서: s.department,
              이름: s.name,
              학교: s.school || '',
              학년: s.grade || '',
              누적달란트: s.total_talents || 0
            }));
            import('@/lib/export').then(m => m.downloadExcel(dataToExport, `달란트현황`));
          }}>
            엑셀 다운로드
          </Button>
          <Button variant="outline" className="w-full sm:w-auto shadow-sm" onClick={() => setIsExportDialogOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            변경 이력 엑셀 다운로드
          </Button>
        </div>
      </div>

      {/* 달란트 현황 리스트 (카드 기반 반응형) */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTalents.map((student) => (
            <div key={student.id} className="bg-card rounded-2xl border p-5 shadow-sm flex flex-col gap-4 group hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{student.name}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground border-0">
                        {student.department}
                      </Badge>
                    </div>
                  </div>
                </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold tracking-tight text-primary flex items-center gap-1 justify-end">
                  <Coins className="h-5 w-5" />
                  {(student.total_talents || 0).toLocaleString()}
                </div>
                <div className="text-xs font-medium text-muted-foreground">누적 달란트</div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-muted/50 mt-1">
              <Button 
                variant="outline" 
                className="flex-1 h-9 bg-emerald-50/50 hover:bg-emerald-100/50 hover:text-emerald-700 text-emerald-600 border-emerald-200"
                onClick={() => openDialog(student, 'grant')}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                부여
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 h-9 bg-rose-50/50 hover:bg-rose-100/50 hover:text-rose-700 text-rose-600 border-rose-200"
                onClick={() => openDialog(student, 'deduct')}
              >
                <Minus className="mr-1.5 h-3.5 w-3.5" />
                차감
              </Button>
              <Button
                variant="ghost"
                className="h-9 px-2 text-muted-foreground"
                onClick={() => openHistory(student)}
              >
                <History className="h-3.5 w-3.5" />
              </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 달란트 트랜잭션 폼 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>달란트 {txType === 'grant' ? '부여' : '차감'}</DialogTitle>
            <DialogDescription>
              <span className="font-bold text-foreground">{selectedStudent?.name}</span> 학생에게 달란트를 {txType === 'grant' ? '지급' : '차감'}합니다.
              {txType === 'deduct' && <> (보유: {currentBalance.toLocaleString()})</>}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">수량 <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  className="pl-9 text-lg font-semibold"
                  {...register('amount', { valueAsNumber: true })}
                />
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              {exceedsBalance && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  보유 달란트({currentBalance.toLocaleString()})보다 많이 차감할 수 없습니다.
                </p>
              )}

              <div className="flex gap-2 pt-1">
                {QUICK_ADD_VALUES.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleQuickAdd(value)}
                  >
                    +{value}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || exceedsBalance}
                className={cn(
                  txType === 'grant' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : txType === 'grant' ? (
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                ) : (
                  <ArrowDownRight className="mr-2 h-4 w-4" />
                )}
                {txType === 'grant' ? '부여하기' : '차감하기'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 달란트 변경 이력 다이얼로그 */}
      <Dialog open={!!historyStudent} onOpenChange={(open) => !open && setHistoryStudent(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{historyStudent?.name} 학생 달란트 이력</DialogTitle>
            <DialogDescription>최근 변경 이력을 최신순으로 보여줍니다.</DialogDescription>
          </DialogHeader>
          {isHistoryLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : historyEntries.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {historyEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/40 border">
                  <div>
                    <p className="font-medium">{entry.reason}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(entry.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })} · {entry.recorded_by_name}
                    </p>
                  </div>
                  <span className={entry.type === 'grant' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {entry.type === 'grant' ? '+' : '-'}{entry.amount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">변경 이력이 없습니다.</p>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setHistoryStudent(null)}>닫기</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 변경 이력 다운로드 기간 선택 다이얼로그 */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>변경 이력 엑셀 다운로드</DialogTitle>
            <DialogDescription>다운로드할 기간을 선택해주세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>연도</Label>
              <Select value={String(exportYear)} onValueChange={(val) => setExportYear(Number(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}년</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>기간</Label>
              <Select value={exportQuarter} onValueChange={(val) => val && setExportQuarter(val as Quarter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUARTERS.map((q) => (
                    <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)} disabled={isExporting}>
              취소
            </Button>
            <Button onClick={handleExportHistory} disabled={isExporting}>
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              다운로드
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 전 인원 달란트 초기화 확인 다이얼로그 */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>전 인원 달란트 초기화</DialogTitle>
            <DialogDescription>
              모든 학생의 달란트를 0으로 초기화하시겠습니까? 초기화 내역은 변경 이력에 남지만, 되돌리려면 다시 일일이 부여해야 합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)} disabled={isResetting}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleResetAll} disabled={isResetting}>
              {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              초기화
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR 스캔 다이얼로그 */}
      <Dialog open={isQrScanOpen} onOpenChange={setIsQrScanOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>QR로 학생 찾기</DialogTitle>
            <DialogDescription>학생의 QR 코드를 카메라에 비춰주세요.</DialogDescription>
          </DialogHeader>
          {isQrScanOpen && <TalentQrScanDialog onFound={handleQrFound} />}
        </DialogContent>
      </Dialog>

      {/* QR로 찾은 학생 확인 다이얼로그 */}
      <Dialog open={!!qrFoundStudent} onOpenChange={(open) => !open && setQrFoundStudent(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>학생을 찾았습니다</DialogTitle>
            <DialogDescription>부여 또는 차감을 선택해주세요.</DialogDescription>
          </DialogHeader>
          {qrFoundStudent && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                  {qrFoundStudent.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{qrFoundStudent.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground border-0">
                      {qrFoundStudent.department}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    누적 달란트 {(qrFoundStudent.total_talents || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-emerald-50/50 hover:bg-emerald-100/50 hover:text-emerald-700 text-emerald-600 border-emerald-200"
                  onClick={() => { openDialog(qrFoundStudent, 'grant'); setQrFoundStudent(null); }}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  부여
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-rose-50/50 hover:bg-rose-100/50 hover:text-rose-700 text-rose-600 border-rose-200"
                  onClick={() => { openDialog(qrFoundStudent, 'deduct'); setQrFoundStudent(null); }}
                >
                  <Minus className="mr-1.5 h-3.5 w-3.5" />
                  차감
                </Button>
              </div>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setQrFoundStudent(null)}>취소</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
