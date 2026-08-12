import { describe, it, expect, vi } from 'vitest';
import { handleSupabaseError } from '../utils';

describe('handleSupabaseError', () => {
  it('should handle PostgrestError objects', () => {
    const error = { code: '23505', message: 'duplicate key value violates unique constraint', details: '', hint: '' };
    const result = handleSupabaseError(error);
    expect(result).toEqual({
      success: false,
      error: 'duplicate key value violates unique constraint'
    });
  });

  it('should handle standard Error objects', () => {
    const error = new Error('Standard JS error');
    const result = handleSupabaseError(error);
    expect(result).toEqual({
      success: false,
      error: 'Standard JS error'
    });
  });

  it('should handle string errors (fallback)', () => {
    const result = handleSupabaseError('Something went wrong');
    expect(result).toEqual({
      success: false,
      error: '알 수 없는 오류가 발생했습니다.'
    });
  });

  it('should fallback to default database error message if PostgrestError has no message', () => {
    const error = { code: 'some-code' };
    const result = handleSupabaseError(error);
    expect(result).toEqual({
      success: false,
      error: '데이터베이스 오류가 발생했습니다.'
    });
  });
});
