'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, ShieldAlert, GraduationCap, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  previewYearlyPromotion,
  applyYearlyPromotion,
  type PromotionPreview,
} from '@/lib/actions/promotion';
import { isMasterAdmin } from '@/lib/actions/user';

export default function PromotionPage() {
  const [isMaster, setIsMaster] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preview, setPreview] = useState<PromotionPreview | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const loadPreview = useCallback(async () => {
    setIsLoading(true);
    const res = await previewYearlyPromotion();
    if (res.success && res.data) {
      setPreview(res.data);
    } else {
      toast.error(res.error || '진급 대상을 불러오지 못했습니다.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      const masterCheck = await isMasterAdmin();
      setIsMaster(masterCheck);
      if (masterCheck) await loadPreview();
      else setIsLoading(false);
    }
    init();
  }, [loadPreview]);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const res = await applyYearlyPromotion();
      if (!res.success || !res.data) {
        toast.error(res.error || '진급 처리 중 오류가 발생했습니다.');
        return;
      }
      setIsConfirmOpen(false);
      if (res.data.failed > 0) {
        toast.error(`${res.data.count}명 적용 완료, ${res.data.failed}명 처리 실패했습니다.`);
      } else {
        toast.success(`${res.data.count}명의 학년/부서가 갱신되었습니다.`);
      }
      await loadPreview();
    } catch {
      toast.error('시스템 오류가 발생했습니다.');
    } finally {
      setIsApplying(false);
    }
  };

  if (!isLoading && !isMaster) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="bg-amber-50 text-amber-600 p-6 rounded-full">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold">접근 권한이 없습니다</h1>
        <p className="text-muted-foreground text-sm">학년/부서 진급 처리는 마스터 관리자만 가능합니다.</p>
      </div>
    );
  }

  const departmentChanges = preview?.changes.filter((c) => c.departmentChanged) ?? [];
  const gradeOnlyChanges = preview?.changes.filter((c) => !c.departmentChanged) ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">학년/부서 진급 처리</h1>
        <p className="text-sm text-muted-foreground">
          생년월일을 기준으로 {preview?.year ?? new Date().getFullYear()}년 기준 학년과 소속 부서를 다시 계산합니다.
          아래 내용을 확인한 뒤 적용해주세요.
        </p>
      </div>

      <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">전환 기준 (그 해 기준 만 나이)</p>
        <p>0~4세 유아부 · 5~6세 유치부 · 7~12세 어린이부(초1~초6) · 13~18세 청소년부(중1~고3) · 19세 이상 청년부</p>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <p className="font-semibold">부서가 변경되는 학생</p>
                <p className="text-sm text-muted-foreground">{departmentChanges.length}명</p>
              </div>
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            {departmentChanges.length > 0 ? (
              <div className="divide-y max-h-80 overflow-y-auto">
                {departmentChanges.map((c) => (
                  <div key={c.studentId} className="p-4 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{c.name}</span>
                    <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                      <Badge variant="outline">{c.fromDepartment}{c.fromGrade ? ` ${c.fromGrade}` : ''}</Badge>
                      <ArrowRight className="h-3.5 w-3.5" />
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {c.toDepartment}{c.toGrade ? ` ${c.toGrade}` : ''}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-center text-sm text-muted-foreground">부서가 바뀌는 학생이 없습니다.</p>
            )}
          </div>

          {gradeOnlyChanges.length > 0 && (
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <div className="p-5 border-b">
                <p className="font-semibold">학년 표기만 갱신되는 학생</p>
                <p className="text-sm text-muted-foreground">{gradeOnlyChanges.length}명 (부서는 그대로 유지됩니다)</p>
              </div>
              <div className="divide-y max-h-60 overflow-y-auto">
                {gradeOnlyChanges.map((c) => (
                  <div key={c.studentId} className="p-4 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{c.name}</span>
                    <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                      <Badge variant="outline">{c.fromGrade ?? '-'}</Badge>
                      <ArrowRight className="h-3.5 w-3.5" />
                      <Badge className="bg-primary/10 text-primary border-primary/20">{c.toGrade ?? '-'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview && preview.missingBirthDate.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-2">
              <p className="font-medium flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                생년월일이 없어 자동 계산할 수 없는 학생 ({preview.missingBirthDate.length}명)
              </p>
              <p className="flex flex-wrap gap-1.5">
                {preview.missingBirthDate.map((s) => (
                  <Badge key={s.studentId} variant="outline" className="border-amber-300 text-amber-800 bg-amber-100/60">
                    {s.name} ({s.department})
                  </Badge>
                ))}
              </p>
              <p className="text-xs">학생관리에서 생년월일을 등록한 뒤 다시 확인해주세요.</p>
            </div>
          )}

          {preview && preview.changes.length === 0 ? (
            <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-4 text-sm text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              현재 모든 학생의 학년/부서가 생년월일 기준과 일치합니다.
            </div>
          ) : (
            <div className="flex justify-end">
              <Button onClick={() => setIsConfirmOpen(true)} disabled={isLoading}>
                <GraduationCap className="mr-2 h-4 w-4" />
                진급 적용하기 ({preview?.changes.length ?? 0}명)
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>학년/부서 진급 적용</DialogTitle>
            <DialogDescription>
              총 {preview?.changes.length ?? 0}명의 학년/부서 정보가 갱신됩니다. 생년월일 기준으로 다시 계산되므로,
              수동으로 특별히 조정해둔 학생이 있다면 적용 전에 다시 한번 확인해주세요. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isApplying}>
              취소
            </Button>
            <Button onClick={handleApply} disabled={isApplying}>
              {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              적용
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
