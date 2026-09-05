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
import { createEvent } from '@/lib/actions/event';

const DEPARTMENTS = ['유아부', '유치부', '어린이부', '청소년부', '청년부'] as const;
const COMMON_DEPARTMENT = '공통';

const eventSchema = z.object({
  title: z.string().min(2, '제목을 2글자 이상 입력해주세요.'),
  event_date: z.date(),
  location: z.string().optional(),
  type: z.enum(['special', 'meeting', 'worship']),
  department: z.string(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EventForm({ onSuccess, onCancel }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      location: '',
      type: 'special',
      department: COMMON_DEPARTMENT,
    },
  });

  const eventDate = watch('event_date');

  const onSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await createEvent({
        title: data.title,
        event_date: data.event_date.toISOString(),
        location: data.location || null,
        type: data.type,
        department: data.department === COMMON_DEPARTMENT ? null : data.department as typeof DEPARTMENTS[number],
      });
      
      if (!res.success) {
        toast.error('일정 등록 중 오류가 발생했습니다.');
        return;
      }
      
      toast.success('일정이 성공적으로 등록되었습니다.');
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
      <div className="space-y-2">
        <Label htmlFor="title">일정 제목 <span className="text-destructive">*</span></Label>
        <Input id="title" placeholder="예: 여름 성경 학교" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2 flex flex-col">
        <Label>일정 날짜 <span className="text-destructive">*</span></Label>
        <Popover>
          <PopoverTrigger render={
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !eventDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {eventDate ? format(eventDate, 'PPP', { locale: ko }) : <span>날짜 선택</span>}
            </Button>
          } />
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={eventDate}
              onSelect={(date) => date && setValue('event_date', date)}
              locale={ko}
            />
          </PopoverContent>
        </Popover>
        {errors.event_date && <p className="text-xs text-destructive">{errors.event_date.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">장소</Label>
        <Input id="location" placeholder="예: 본당" {...register('location')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">일정 유형 <span className="text-destructive">*</span></Label>
        <Select onValueChange={(val) => setValue('type', val as 'special' | 'meeting' | 'worship')} defaultValue="special">
          <SelectTrigger>
            <SelectValue placeholder="유형 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="worship">예배</SelectItem>
            <SelectItem value="meeting">회의</SelectItem>
            <SelectItem value="special">특별 행사</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">대상 부서 <span className="text-destructive">*</span></Label>
        <Select onValueChange={(val) => val && setValue('department', val)} defaultValue={COMMON_DEPARTMENT}>
          <SelectTrigger id="department">
            <SelectValue placeholder="대상 부서 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={COMMON_DEPARTMENT}>공통 (전체 부서)</SelectItem>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          등록하기
        </Button>
      </div>
    </form>
  );
}
