'use server';

import { createClient } from '@/lib/supabase/server';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';

/**
 * 활성 학생 수를 가져옵니다. (대시보드 통계용)
 */
export async function getStudentCount(): Promise<ActionResponse<number>> {
  try {
    const supabase = await createClient();

    // 임시: DB 연결 전이면 mock 반환 (Supabase 환경변수 체크용)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: 128 };
    }

    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      return handleSupabaseError(error);
    }

    return { success: true, data: count || 0 };
  } catch (error) {
    return handleSupabaseError(error);
  }
}
