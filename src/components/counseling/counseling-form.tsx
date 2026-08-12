'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PlusCircle } from 'lucide-react';
import { createCounselingRecord } from '@/lib/actions/counseling';
import { Database } from '@/lib/supabase/database.types';

type StudentRow = Database['public']['Tables']['students']['Row'];

const formSchema = z.object({
  counseling_date: z.string().min(1, '상담 일자를 입력해주세요'),
  content: z.string().min(5, '상담 내용을 5자 이상 입력해주세요.'),
});

interface CounselingFormProps {
  student: StudentRow;
  onSuccess?: () => void;
}

export function CounselingForm({ student, onSuccess }: CounselingFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      counseling_date: new Date().toISOString().split('T')[0],
      content: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await createCounselingRecord({
      student_id: student.id,
      counseling_date: values.counseling_date,
      content: values.content,
    });

    if (result.success) {
      toast.success('상담록이 저장되었습니다.');
      setOpen(false);
      form.reset();
      onSuccess?.();
    } else {
      toast.error('상담록 저장에 실패했습니다.');
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="gap-2" />}>
        <PlusCircle className="h-4 w-4" />
        상담 추가
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{student.name} 학생 상담 추가</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="counseling_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상담 일자</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상담 내용</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="상담 내용을 입력하세요 (5자 이상)"
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '저장 중...' : '저장'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
