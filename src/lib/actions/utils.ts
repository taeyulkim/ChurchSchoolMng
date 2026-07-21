import { PostgrestError } from '@supabase/supabase-js';
import { ActionResponse } from './types';

/**
 * Supabase 에러를 공통 ActionResponse 형식으로 변환합니다.
 */
export function handleSupabaseError<T = never>(error: unknown): ActionResponse<T> {
  console.error('[Supabase Error]:', error);

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const pgError = error as PostgrestError;
    return {
      success: false,
      error: pgError.message || '데이터베이스 오류가 발생했습니다.',
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: false,
    error: '알 수 없는 오류가 발생했습니다.',
  };
}
