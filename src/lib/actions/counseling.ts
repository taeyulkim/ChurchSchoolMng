'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';
import { Database } from '@/lib/supabase/database.types';

type CounselingRow = Database['public']['Tables']['counseling_records']['Row'];
type CounselingInsert = Database['public']['Tables']['counseling_records']['Insert'];

// Mock Data
let MOCK_COUNSELING: CounselingRow[] = [
  {
    id: 'c1',
    student_id: 1,
    counselor_id: 'mock-admin',
    counseling_date: new Date().toISOString().split('T')[0],
    content: '새 친구 적응 상태 양호함. 율동 시간에 매우 적극적으로 참여함.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function getCounselingRecords(studentId?: number): Promise<ActionResponse<CounselingRow[]>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      if (studentId) {
        return { success: true, data: MOCK_COUNSELING.filter(c => c.student_id === studentId) };
      }
      return { success: true, data: MOCK_COUNSELING };
    }

    const supabase = await createClient();
    let query = supabase.from('counseling_records').select('*').order('counseling_date', { ascending: false });
    
    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;
    if (error) return handleSupabaseError(error);

    return { success: true, data: data as CounselingRow[] };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function createCounselingRecord(record: CounselingInsert): Promise<ActionResponse<CounselingRow>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const newRecord = {
        ...record,
        id: `mock-c-${Date.now()}`,
        counselor_id: 'mock-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as CounselingRow;
      MOCK_COUNSELING = [newRecord, ...MOCK_COUNSELING];
      revalidatePath('/counseling');
      return { success: true, data: newRecord };
    }

    const supabase = await createClient();
    
    // 현재 사용자 ID 주입
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      record.counselor_id = user.id;
    }

    const { data, error } = await supabase
      .from('counseling_records')
      .insert(record as any)
      .select()
      .single();

    if (error) return handleSupabaseError(error);

    revalidatePath('/counseling');
    return { success: true, data: data as CounselingRow };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function deleteCounselingRecord(id: string): Promise<ActionResponse<{ success: true }>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      MOCK_COUNSELING = MOCK_COUNSELING.filter(c => c.id !== id);
      revalidatePath('/counseling');
      return { success: true, data: { success: true } };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('counseling_records')
      .delete()
      .eq('id', id);

    if (error) return handleSupabaseError(error);

    revalidatePath('/counseling');
    return { success: true, data: { success: true } };
  } catch (err) {
    return handleSupabaseError(err);
  }
}
