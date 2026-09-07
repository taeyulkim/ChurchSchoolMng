'use client';

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Loader2, Save, Camera, X } from 'lucide-react';
import { resizeImageFile } from '@/lib/image';
import { AvatarCircle } from '@/components/common/avatar-circle';

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
import { Database } from '@/lib/supabase/database.types';

type StudentRow = Database['public']['Tables']['students']['Row'];

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
  department: z.enum(['유아부', '유치부', '어린이부', '청소년부', '청년부'], {
    message: '부서를 선택해주세요.',
  }),
  parent_name: z.string().optional(),
  parent_contact: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  student?: StudentRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StudentForm({ student, onSuccess, onCancel }: StudentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!student;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  useEffect(() => {
    if (!student?.photo_path) return;
    let cancelled = false;
    (async () => {
      const { getStudentPhotoUrls } = await import('@/lib/actions/student');
      const res = await getStudentPhotoUrls([student.photo_path as string]);
      if (!cancelled && res.success && res.data) {
        setExistingPhotoUrl(res.data[student.photo_path as string] ?? null);
      }
    })();
    return () => { cancelled = true; };
  }, [student?.photo_path]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      const resized = await resizeImageFile(file);
      setNewPhotoFile(resized);
      setRemovePhoto(false);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(resized));
    } catch {
      toast.error('사진을 처리하지 못했습니다. 다른 사진을 시도해주세요.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setNewPhotoFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setExistingPhotoUrl(null);
    setRemovePhoto(true);
  };

  const displayPhotoUrl = previewUrl ?? (removePhoto ? null : existingPhotoUrl);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: student
      ? {
          name: student.name,
          gender: student.gender,
          department: student.department,
          birth_date: student.birth_date ? new Date(student.birth_date) : undefined,
          school: student.school ?? '',
          grade: student.grade ?? '',
          parent_name: student.parent_name ?? '',
          parent_contact: student.parent_contact ?? '',
        }
      : {
          name: '',
          school: '',
          grade: '',
          parent_name: '',
          parent_contact: '',
        },
  });

  const birthDate = useWatch({ control, name: 'birth_date' });

  const applyPhotoChanges = async (studentId: number) => {
    const { uploadStudentPhoto, removeStudentPhoto } = await import('@/lib/actions/student');
    if (newPhotoFile) {
      const photoFormData = new FormData();
      photoFormData.set('file', newPhotoFile);
      const res = await uploadStudentPhoto(studentId, photoFormData);
      if (!res.success) toast.error('사진 저장 중 오류가 발생했습니다.');
    } else if (removePhoto) {
      await removeStudentPhoto(studentId);
    }
  };

  const onSubmit = async (data: StudentFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const { updateStudent } = await import('@/lib/actions/student');
        const res = await updateStudent(student.id, {
          ...data,
          birth_date: format(data.birth_date, 'yyyy-MM-dd'),
        });

        if (!res.success) {
          toast.error('학생 정보 수정 중 오류가 발생했습니다.');
          return;
        }

        await applyPhotoChanges(student.id);
        toast.success(`${data.name} 학생 정보가 수정되었습니다.`);
      } else {
        const { createStudent } = await import('@/lib/actions/student');
        const res = await createStudent(data as any);

        if (!res.success) {
          toast.error('학생 등록 중 오류가 발생했습니다.');
          return;
        }

        if (newPhotoFile && res.data) {
          await applyPhotoChanges(res.data.id);
        }
        toast.success(`${data.name} 학생이 성공적으로 등록되었습니다.`);
      }
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error('처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
      {/* 학생 사진 */}
      <div className="flex items-center gap-4">
        <AvatarCircle name={student?.name || '학생'} photoUrl={displayPhotoUrl} className="h-16 w-16 text-lg" />
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isProcessingPhoto}
            onClick={() => fileInputRef.current?.click()}
          >
            {isProcessingPhoto ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
            사진 {displayPhotoUrl ? '변경' : '등록'}
          </Button>
          {displayPhotoUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={handleRemovePhoto}>
              <X className="mr-1 h-4 w-4" />
              삭제
            </Button>
          )}
        </div>
      </div>

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
          <Select defaultValue={student?.gender} onValueChange={(val) => val && setValue('gender', val as 'male' | 'female')}>
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
          <Select defaultValue={student?.department} onValueChange={(val) => val && setValue('department', val as '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부')}>
            <SelectTrigger id="department">
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
                defaultMonth={birthDate}
                captionLayout="dropdown"
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
          {isEditMode ? '수정하기' : '학생 등록'}
        </Button>
      </div>
    </form>
  );
}
