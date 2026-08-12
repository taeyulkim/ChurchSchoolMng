'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';
import { Database } from '@/lib/supabase/database.types';

type StudentRow = Database['public']['Tables']['students']['Row'];
type StudentInsert = Database['public']['Tables']['students']['Insert'];

let MOCK_STUDENTS: StudentRow[] = [
  { id: 1, name: '홍길동', gender: 'male', department: '어린이부', birth_date: '2015-01-01', school: '새소망초등학교', grade: '3학년', parent_name: '홍아빠', parent_contact: '010-1234-5678', total_talents: 1500, qr_token: '123e4567-e89b-12d3-a456-426614174001', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, name: '이순신', gender: 'male', department: '청소년부', birth_date: '2008-05-05', school: '새소망중학교', grade: '1학년', parent_name: '이아빠', parent_contact: '010-2345-6789', total_talents: 4200, qr_token: '123e4567-e89b-12d3-a456-426614174002', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export async function getStudents(): Promise<ActionResponse<StudentRow[]>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // Mock Data Fallback
      return {
        success: true,
        data: [...MOCK_STUDENTS]
      };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('students')
      .select('*')
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

export async function getStudentByToken(token: string): Promise<ActionResponse<StudentRow>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const student = MOCK_STUDENTS.find(s => s.qr_token === token);
      if (!student) return { success: false, error: '유효하지 않은 QR 코드입니다.' };
      return { success: true, data: student };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('qr_token', token)
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

export async function getStudentCount(): Promise<number> {
  // Mock Data Fallback
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return MOCK_STUDENTS.length;

  try {
    const supabase = await createClient();
    const { count } = await supabase.from('students').select('*', { count: 'exact', head: true });
    return count || 0;
  } catch {
    return 0;
  }
}
