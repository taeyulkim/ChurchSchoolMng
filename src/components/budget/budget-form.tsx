'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { createBudgetTransaction } from '@/lib/actions/budget';

const budgetSchema = z.object({
  transaction_date: z.date(),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, '카테고리를 입력해주세요.'),
  description: z.string().min(2, '내역(설명)을 2글자 이상 입력해주세요.'),
  amount: z.number().min(1, '1 이상의 금액을 입력해주세요.'),
  department: z.enum(['유아부', '유치부', '어린이부', '청소년부', '청년부']),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BudgetForm({ onSuccess, onCancel }: BudgetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      type: 'expense',
      category: '',
      description: '',
      department: '어린이부',
    },
  });

  const txDate = watch('transaction_date');
  const txType = watch('type');

  const onSubmit = async (data: BudgetFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await createBudgetTransaction({
        transaction_date: format(data.transaction_date, 'yyyy-MM-dd'),
        type: data.type,
        category: data.category,
        description: data.description,
        amount: data.amount,
        department: data.department,
      });
      
      if (!res.success) {
        toast.error('예산 등록 중 오류가 발생했습니다.');
        return;
      }
      
      toast.success('예산 내역이 등록되었습니다.');
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error('시스템 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 flex flex-col">
          <Label>날짜 <span className="text-destructive">*</span></Label>
          <Popover>
            <PopoverTrigger render={
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !txDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {txDate ? format(txDate, 'PPP', { locale: ko }) : <span>날짜 선택</span>}
              </Button>
            } />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={txDate}
                onSelect={(date) => date && setValue('transaction_date', date)}
                locale={ko}
              />
            </PopoverContent>
          </Popover>
          {errors.transaction_date && <p className="text-xs text-destructive">{errors.transaction_date.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="type">유형 <span className="text-destructive">*</span></Label>
          <Select defaultValue="expense" onValueChange={(val) => setValue('type', val as 'income' | 'expense')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income" className="text-emerald-600 font-medium">수입</SelectItem>
              <SelectItem value="expense" className="text-rose-600 font-medium">지출</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">소속 부서 <span className="text-destructive">*</span></Label>
        <Select defaultValue="어린이부" onValueChange={(val) => setValue('department', val as any)}>
          <SelectTrigger>
            <SelectValue placeholder="부서 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="유아부">유아부</SelectItem>
            <SelectItem value="유치부">유치부</SelectItem>
            <SelectItem value="어린이부">어린이부</SelectItem>
            <SelectItem value="청소년부">청소년부</SelectItem>
            <SelectItem value="청년부">청년부</SelectItem>
          </SelectContent>
        </Select>
        {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">카테고리 <span className="text-destructive">*</span></Label>
          <Input id="category" placeholder={txType === 'income' ? '예: 헌금, 지원금' : '예: 행사비, 식대'} {...register('category')} />
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">금액 <span className="text-destructive">*</span></Label>
          <Input id="amount" type="number" placeholder="0" {...register('amount', { valueAsNumber: true })} />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">내역 (설명) <span className="text-destructive">*</span></Label>
        <Input id="description" placeholder="상세 내역을 입력해주세요" {...register('description')} />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            취소
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className={cn(
            txType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
          )}
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          등록하기
        </Button>
      </div>
    </form>
  );
}
