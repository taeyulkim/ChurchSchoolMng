'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Loader2, Save } from 'lucide-react';

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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

/**
 * 학생 등록 폼 스키마
 */
const studentSchema = z.object({
  name: z.string().min(2, '이름은 2글자 이상이어야 합니다.').max(20),
  gender: z.enum(['male', 'female'], {
    message: '성별을 선택해주세요.',
  }),
  birth_date: z.date({
    message: '생년월일을 선택해주세요.',
  }),
  school: z.string().optional(),
  grade: z.string().optional(),
  department: z.enum(['초등부', '중등부', '고등부', '청년부'], {
    message: '부서를 선택해주세요.',
  }),
  parent_name: z.string().optional(),
  parent_contact: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StudentForm({ onSuccess, onCancel }: StudentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      school: '',
      grade: '',
      parent_name: '',
      parent_contact: '',
    },
  });

  const birthDate = useWatch({ control, name: 'birth_date' });

  const onSubmit = async (data: StudentFormValues) => {
    setIsSubmitting(true);
    try {
      // TODO: 실제 Supabase API 호출
      console.log('Submitted data:', data);
      
      // 시뮬레이션 지연
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success(`${data.name} 학생이 성공적으로 등록되었습니다.`);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error('학생 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        {/* 이름 */}
        <div className="space-y-2">
          <Label htmlFor="name">이름 <span className="text-destructive">*</span></Label>
          <Input id="name" placeholder="홍길동" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        {/* 성별 */}
        <div className="space-y-2">
          <Label htmlFor="gender">성별 <span className="text-destructive">*</span></Label>
          <Select onValueChange={(val) => val && setValue('gender', val as 'male' | 'female')}>
            <SelectTrigger id="gender">
              <SelectValue placeholder="성별 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">남자</SelectItem>
              <SelectItem value="female">여자</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
        </div>

        {/* 부서 */}
        <div className="space-y-2">
          <Label htmlFor="department">소속 부서 <span className="text-destructive">*</span></Label>
          <Select onValueChange={(val) => val && setValue('department', val as '초등부' | '중등부' | '고등부' | '청년부')}>
            <SelectTrigger id="department">
              <SelectValue placeholder="부서 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="초등부">초등부</SelectItem>
              <SelectItem value="중등부">중등부</SelectItem>
              <SelectItem value="고등부">고등부</SelectItem>
              <SelectItem value="청년부">청년부</SelectItem>
            </SelectContent>
          </Select>
          {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
        </div>

        {/* 생년월일 */}
        <div className="space-y-2">
          <Label>생년월일 <span className="text-destructive">*</span></Label>
          <Popover>
            <PopoverTrigger render={
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !birthDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {birthDate ? format(birthDate, 'PPP', { locale: ko }) : <span>날짜 선택</span>}
              </Button>
            } />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={birthDate}
                onSelect={(date) => setValue('birth_date', date as Date)}
                autoFocus
                locale={ko}
              />
            </PopoverContent>
          </Popover>
          {errors.birth_date && <p className="text-xs text-destructive">{errors.birth_date.message}</p>}
        </div>

        {/* 학교 & 학년 */}
        <div className="space-y-2">
          <Label htmlFor="school">학교</Label>
          <Input id="school" placeholder="새소망초등학교" {...register('school')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="grade">학년</Label>
          <Input id="grade" placeholder="3학년" {...register('grade')} />
        </div>

        {/* 보호자 정보 */}
        <div className="space-y-2">
          <Label htmlFor="parent_name">보호자 이름</Label>
          <Input id="parent_name" placeholder="홍아빠" {...register('parent_name')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parent_contact">보호자 연락처</Label>
          <Input id="parent_contact" placeholder="010-0000-0000" {...register('parent_contact')} />
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          학생 등록
        </Button>
      </div>
    </form>
  );
}
