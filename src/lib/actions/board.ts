'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';
import { Database } from '@/lib/supabase/database.types';

type PostRow = Database['public']['Tables']['posts']['Row'];

const BUCKET = 'documents';

export interface PostWithAuthor extends PostRow {
  author_name: string;
}

interface PostJoinRow extends PostRow {
  profiles: { name: string } | null;
}

let MOCK_POSTS: PostWithAuthor[] = [];

export async function getPosts(): Promise<ActionResponse<PostWithAuthor[]>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: MOCK_POSTS };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(name)')
      .order('created_at', { ascending: false });

    if (error) return handleSupabaseError(error);

    const rows = (data ?? []) as unknown as PostJoinRow[];
    const posts: PostWithAuthor[] = rows.map(({ profiles, ...row }) => ({
      ...row,
      author_name: profiles?.name ?? '알 수 없음',
    }));

    return { success: true, data: posts };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function createPost(formData: FormData): Promise<ActionResponse<null>> {
  try {
    const title = String(formData.get('title') ?? '').trim();
    const content = String(formData.get('content') ?? '').trim();
    const file = formData.get('file') as File | null;

    if (!title || !content) {
      return { success: false, error: '제목과 내용을 입력해주세요.' };
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      MOCK_POSTS = [
        {
          id: Math.max(0, ...MOCK_POSTS.map(p => p.id)) + 1,
          title,
          content,
          file_path: file && file.size > 0 ? `mock/${file.name}` : null,
          file_name: file && file.size > 0 ? file.name : null,
          author_id: 'mock-user',
          author_name: '관리자',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...MOCK_POSTS,
      ];
      revalidatePath('/board');
      return { success: true, data: null };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: '인증되지 않은 사용자입니다.' };

    let filePath: string | null = null;
    let fileName: string | null = null;

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, buffer, { contentType: file.type || undefined });

      if (uploadError) return handleSupabaseError(uploadError);
      fileName = file.name;
    }

    const { error } = await supabase.from('posts').insert({
      title,
      content,
      file_path: filePath,
      file_name: fileName,
      author_id: user.id,
    } as never);

    if (error) return handleSupabaseError(error);

    revalidatePath('/board');
    return { success: true, data: null };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function updatePost(id: number, updates: { title: string; content: string }): Promise<ActionResponse<null>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      MOCK_POSTS = MOCK_POSTS.map(p => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p);
      revalidatePath('/board');
      return { success: true, data: null };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('posts')
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq('id', id);

    if (error) return handleSupabaseError(error);

    revalidatePath('/board');
    return { success: true, data: null };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function deletePost(id: number, filePath: string | null): Promise<ActionResponse<null>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      MOCK_POSTS = MOCK_POSTS.filter(p => p.id !== id);
      revalidatePath('/board');
      return { success: true, data: null };
    }

    const supabase = await createClient();

    if (filePath) {
      await supabase.storage.from(BUCKET).remove([filePath]);
    }

    const { error } = await supabase.from('posts').delete().eq('id', id);

    if (error) return handleSupabaseError(error);

    revalidatePath('/board');
    return { success: true, data: null };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function getPostFileUrl(filePath: string): Promise<ActionResponse<string>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: '#' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 60);

    if (error || !data) return handleSupabaseError(error ?? new Error('URL 생성 실패'));

    return { success: true, data: data.signedUrl };
  } catch (err) {
    return handleSupabaseError(err);
  }
}
