'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Coins, Search, ArrowUpRight, ArrowDownRight, Loader2, Plus, Minus } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { getStudents } from '@/lib/actions/student';
import { createTalentTransaction } from '@/lib/actions/talent';
import { Database } from '@/lib/supabase/database.types';

type StudentRow = Database['public']['Tables']['students']['Row'];

const talentSchema = z.object({
  type: z.enum(['grant', 'deduct']),
  amount: z.number({ message: '수량을 입력해주세요.' }).min(1, '1 이상의 수량을 입력해주세요.'),
});

const QUICK_ADD_VALUES = [1, 5, 10];

type TalentFormValues = z.infer<typeof talentSchema>;

export default function TalentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [talentsData, setTalentsData] = useState<StudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const loadData = async () => {
    setIsLoading(true);
    const res = await getStudents();
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

  const filteredTalents = talentsData.filter(student => student.name.includes(searchQuery));

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

  const openDialog = (student: StudentRow, type: 'grant' | 'deduct') => {
    setSelectedStudent(student);
    reset({ type, amount: 0 });
    setIsDialogOpen(true);
  };

  const handleQuickAdd = (value: number) => {
    setValue('amount', (amount || 0) + value, { shouldValidate: true });
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
        toast.error('달란트 처리 중 오류가 발생했습니다.');
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">달란트 관리</h1>
        <p className="text-sm text-muted-foreground">학생들의 달란트 현황을 조회하고 부여/차감합니다.</p>
      </div>

      {/* 검색 바 및 엑셀 다운로드 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center w-full">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름으로 학생 검색..."
            className="pl-9 h-11 bg-card rounded-xl shadow-sm border-transparent focus-visible:bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
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
                disabled={isSubmitting}
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
    </div>
  );
}
