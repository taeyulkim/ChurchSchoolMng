'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';
import { Database } from '@/lib/supabase/database.types';

type StudentRow = Database['public']['Tables']['students']['Row'];
type StudentInsert = Database['public']['Tables']['students']['Insert'];
type StudentUpdate = Database['public']['Tables']['students']['Update'];

const MOCK_STUDENTS: StudentRow[] = [
  { id: 1, name: '홍길동', gender: 'male', department: '어린이부', birth_date: '2015-01-01', school: '새소망초등학교', grade: '3학년', parent_name: '홍아빠', parent_contact: '010-1234-5678', total_talents: 1500, qr_token: '123e4567-e89b-12d3-a456-426614174001', is_active: true, photo_path: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, name: '이순신', gender: 'male', department: '청소년부', birth_date: '2008-05-05', school: '새소망중학교', grade: '1학년', parent_name: '이아빠', parent_contact: '010-2345-6789', total_talents: 4200, qr_token: '123e4567-e89b-12d3-a456-426614174002', is_active: true, photo_path: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export async function getStudents(): Promise<ActionResponse<StudentRow[]>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // Mock Data Fallback
      return {
        success: true,
        data: MOCK_STUDENTS.filter(s => s.is_active)
      };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) return handleSupabaseError(error);

    return {
      success: true,
      data: data as StudentRow[],
    };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function updateStudent(id: number, student: StudentUpdate): Promise<ActionResponse<StudentRow>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const idx = MOCK_STUDENTS.findIndex(s => s.id === id);
      if (idx === -1) return { success: false, error: '학생을 찾을 수 없습니다.' };
      MOCK_STUDENTS[idx] = { ...MOCK_STUDENTS[idx], ...student, updated_at: new Date().toISOString() };
      revalidatePath('/students');
      return { success: true, data: MOCK_STUDENTS[idx] };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('students')
      .update({ ...student, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) return handleSupabaseError(error);

    revalidatePath('/students');
    revalidatePath('/dashboard');

    return { success: true, data: data as StudentRow };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function deactivateStudent(id: number): Promise<ActionResponse<StudentRow>> {
  return updateStudent(id, { is_active: false });
}

export async function getStudentByToken(token: string): Promise<ActionResponse<StudentRow>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const student = MOCK_STUDENTS.find(s => s.qr_token === token);
      if (!student) return { success: false, error: '유효하지 않은 QR 코드입니다.' };
      return { success: true, data: student };
    }

    const supabase = await createClient();
    // QR 로그인은 Supabase Auth 세션 없이(anon) 조회되므로, RLS를 우회하되
    // 토큰이 정확히 일치하는 학생 1명만 반환하는 DB 함수를 사용합니다.
    const { data, error } = await (supabase as any)
      .rpc('get_student_by_qr_token', { p_token: token })
      .single();

    if (error || !data) return { success: false, error: '유효하지 않은 QR 코드입니다.' };

    return { success: true, data: data as StudentRow };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function createStudent(student: StudentInsert): Promise<ActionResponse<StudentRow>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const newStudent: StudentRow = {
        id: Math.max(0, ...MOCK_STUDENTS.map(s => s.id)) + 1,
        ...student,
        total_talents: 0,
        qr_token: crypto.randomUUID(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any;
      MOCK_STUDENTS.push(newStudent);
      revalidatePath('/students');
      return { success: true, data: newStudent };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('students')
      .insert(student as any)
      .select()
      .single();

    if (error) return handleSupabaseError(error);

    revalidatePath('/students');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: data as StudentRow,
    };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export interface BulkCreateResult {
  created: number;
  failed: { row: number; name: string; error: string }[];
}

export async function bulkCreateStudents(students: StudentInsert[]): Promise<ActionResponse<BulkCreateResult>> {
  const failed: BulkCreateResult['failed'] = [];
  let created = 0;

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      students.forEach((s, i) => {
        if (!s.name || !s.gender || !s.department) {
          failed.push({ row: i + 2, name: s.name || '(이름 없음)', error: '필수 항목 누락' });
          return;
        }
        MOCK_STUDENTS.push({
          id: Math.max(0, ...MOCK_STUDENTS.map(m => m.id)) + 1,
          ...s,
          total_talents: 0,
          qr_token: crypto.randomUUID(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
        created++;
      });
      revalidatePath('/students');
      return { success: true, data: { created, failed } };
    }

    const supabase = await createClient();

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (!s.name || !s.gender || !s.department) {
        failed.push({ row: i + 2, name: s.name || '(이름 없음)', error: '필수 항목(이름/성별/부서) 누락' });
        continue;
      }

      const { error } = await supabase.from('students').insert(s as any);

      if (error) {
        failed.push({ row: i + 2, name: s.name, error: error.message });
      } else {
        created++;
      }
    }

    revalidatePath('/students');
    revalidatePath('/dashboard');

    return { success: true, data: { created, failed } };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

const PHOTO_BUCKET = 'student-photos';

export async function uploadStudentPhoto(studentId: number, formData: FormData): Promise<ActionResponse<{ photo_path: string }>> {
  try {
    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: '사진 파일이 없습니다.' };
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const idx = MOCK_STUDENTS.findIndex(s => s.id === studentId);
      if (idx === -1) return { success: false, error: '학생을 찾을 수 없습니다.' };
      const photoPath = `mock/${studentId}_${file.name}`;
      MOCK_STUDENTS[idx] = { ...MOCK_STUDENTS[idx], photo_path: photoPath };
      revalidatePath('/students');
      return { success: true, data: { photo_path: photoPath } };
    }

    const supabase = await createClient();

    const { data: existing } = await supabase
      .from('students')
      .select('photo_path')
      .eq('id', studentId)
      .single();

    const buffer = Buffer.from(await file.arrayBuffer());
    const photoPath = `${studentId}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(photoPath, buffer, { contentType: file.type || 'image/jpeg' });

    if (uploadError) return handleSupabaseError(uploadError);

    const { error } = await supabase
      .from('students')
      .update({ photo_path: photoPath } as never)
      .eq('id', studentId);

    if (error) return handleSupabaseError(error);

    const oldPath = (existing as { photo_path: string | null } | null)?.photo_path;
    if (oldPath && oldPath !== photoPath) {
      await supabase.storage.from(PHOTO_BUCKET).remove([oldPath]);
    }

    revalidatePath('/students');
    return { success: true, data: { photo_path: photoPath } };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function removeStudentPhoto(studentId: number): Promise<ActionResponse<null>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const idx = MOCK_STUDENTS.findIndex(s => s.id === studentId);
      if (idx === -1) return { success: false, error: '학생을 찾을 수 없습니다.' };
      MOCK_STUDENTS[idx] = { ...MOCK_STUDENTS[idx], photo_path: null };
      revalidatePath('/students');
      return { success: true, data: null };
    }

    const supabase = await createClient();

    const { data: existing } = await supabase
      .from('students')
      .select('photo_path')
      .eq('id', studentId)
      .single();

    const { error } = await supabase
      .from('students')
      .update({ photo_path: null } as never)
      .eq('id', studentId);

    if (error) return handleSupabaseError(error);

    const oldPath = (existing as { photo_path: string | null } | null)?.photo_path;
    if (oldPath) {
      await supabase.storage.from(PHOTO_BUCKET).remove([oldPath]);
    }

    revalidatePath('/students');
    return { success: true, data: null };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function getStudentPhotoUrls(paths: string[]): Promise<ActionResponse<Record<string, string>>> {
  try {
    const uniquePaths = [...new Set(paths.filter(Boolean))];
    if (uniquePaths.length === 0) return { success: true, data: {} };

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: {} };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrls(uniquePaths, 3600);

    if (error) return handleSupabaseError(error);

    const urlMap: Record<string, string> = {};
    (data ?? []).forEach((entry) => {
      if (entry.path && entry.signedUrl) urlMap[entry.path] = entry.signedUrl;
    });

    return { success: true, data: urlMap };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function getStudentCount(): Promise<number> {
  // Mock Data Fallback
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return MOCK_STUDENTS.filter(s => s.is_active).length;

  try {
    const supabase = await createClient();
    const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true);
    return count || 0;
  } catch {
    return 0;
  }
}
