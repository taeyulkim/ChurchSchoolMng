'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

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
import { toast } from 'sonner';
import { createItem, updateItem } from '@/lib/actions/item';
import { Database } from '@/lib/supabase/database.types';

type ItemRow = Database['public']['Tables']['items']['Row'];

const itemSchema = z.object({
  name: z.string().min(2, '비품 이름을 2글자 이상 입력해주세요.'),
  category: z.string().min(1, '카테고리를 입력해주세요.'),
  quantity: z.number().min(0, '수량은 0 이상이어야 합니다.'),
  location: z.string().optional(),
  status: z.enum(['good', 'missing', 'repair']),
  department: z.enum(['유아부', '유치부', '어린이부', '청소년부', '청년부']),
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface ItemFormProps {
  initialData?: ItemRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ItemForm({ initialData, onSuccess, onCancel }: ItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: initialData?.name || '',
      category: initialData?.category || '',
      quantity: initialData?.quantity || 1,
      location: initialData?.location || '',
      status: initialData?.status || 'good',
      department: initialData?.department || '어린이부',
    },
  });

  const onSubmit = async (data: ItemFormValues) => {
    setIsSubmitting(true);
    try {
      let res;
      if (initialData?.id) {
        res = await updateItem(initialData.id, data);
      } else {
        res = await createItem(data);
      }
      
      if (!res.success) {
        toast.error('비품 저장 중 오류가 발생했습니다.');
        return;
      }
      
      toast.success(initialData ? '비품이 수정되었습니다.' : '비품이 등록되었습니다.');
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
        <Label htmlFor="name">비품명 <span className="text-destructive">*</span></Label>
        <Input id="name" placeholder="예: 마이크" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">카테고리 <span className="text-destructive">*</span></Label>
          <Input id="category" placeholder="예: 음향기기" {...register('category')} />
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">수량</Label>
          <Input id="quantity" type="number" {...register('quantity', { valueAsNumber: true })} />
          {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">소속 부서 <span className="text-destructive">*</span></Label>
        <Select defaultValue={initialData?.department || '어린이부'} onValueChange={(val) => setValue('department', val as any)}>
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
          <Label htmlFor="status">상태</Label>
          <Select defaultValue={initialData?.status || 'good'} onValueChange={(val) => setValue('status', val as any)}>
            <SelectTrigger>
              <SelectValue placeholder="상태 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="good">정상</SelectItem>
              <SelectItem value="missing">분실</SelectItem>
              <SelectItem value="repair">수리 필요</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">위치</Label>
          <Input id="location" placeholder="예: 본당 방송실" {...register('location')} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {initialData ? '수정하기' : '등록하기'}
        </Button>
      </div>
    </form>
  );
}
