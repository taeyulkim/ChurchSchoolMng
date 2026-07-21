'use server';

import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';

/**
 * 금주 출석률 통계를 가져옵니다.
 * 임시로 mock 데이터를 반환하거나 쿼리를 실행합니다.
 */
export async function getWeeklyAttendanceRate(): Promise<ActionResponse<{ rate: number, change: number }>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: { rate: 87, change: 3 } };
    }
    // 실제 출석률을 계산하는 로직은 추후 Attendance 도메인이 완벽히 구성되었을 때 고도화
    // 현재는 단순 연결 확인용 mock data 반환
    return { success: true, data: { rate: 87, change: 3 } };
  } catch (error) {
    return handleSupabaseError(error);
  }
}
