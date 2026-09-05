'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Paperclip } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { createPost, updatePost, type PostWithAuthor } from '@/lib/actions/board';

const postSchema = z.object({
  title: z.string().min(2, '제목을 2글자 이상 입력해주세요.'),
  content: z.string().min(2, '내용을 입력해주세요.'),
});

type PostFormValues = z.infer<typeof postSchema>;

interface PostFormProps {
  post?: PostWithAuthor;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PostForm({ post, onSuccess, onCancel }: PostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const isEditMode = !!post;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: post?.title ?? '',
      content: post?.content ?? '',
    },
  });

  const onSubmit = async (data: PostFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const res = await updatePost(post.id, data);
        if (!res.success) {
          toast.error('게시글 수정 중 오류가 발생했습니다.');
          return;
        }
        toast.success('게시글이 수정되었습니다.');
      } else {
        const formData = new FormData();
        formData.set('title', data.title);
        formData.set('content', data.content);
        if (selectedFile) {
          formData.set('file', selectedFile);
        }

        const res = await createPost(formData);
        if (!res.success) {
          toast.error(res.error || '게시글 등록 중 오류가 발생했습니다.');
          return;
        }
        toast.success('게시글이 등록되었습니다.');
      }
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
        <Label htmlFor="title">제목 <span className="text-destructive">*</span></Label>
        <Input id="title" placeholder="예: 2026년 여름 성경학교 계획서 양식" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">내용 <span className="text-destructive">*</span></Label>
        <Textarea id="content" rows={6} placeholder="문서에 대한 설명을 입력해주세요." {...register('content')} />
        {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
      </div>

      {!isEditMode && (
        <div className="space-y-2">
          <Label htmlFor="file">첨부파일</Label>
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <Input id="file" type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isEditMode ? '수정하기' : '등록하기'}
        </Button>
      </div>
    </form>
  );
}
