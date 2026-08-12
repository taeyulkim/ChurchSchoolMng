import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTalentTransactions, createTalentTransaction } from '../talent';

vi.mock('@/lib/supabase/server', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'teacher-user-id' } } }),
    },
  };
  return {
    createClient: vi.fn(() => Promise.resolve(mockSupabase)),
  };
});

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Talent Actions', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { createClient } = await import('@/lib/supabase/server');
    mockSupabase = await (createClient as any)();
  });

  // T-01: 전체 달란트 거래 내역 조회
  it('T-01: getTalentTransactions - studentId 없이 전체 내역을 조회한다', async () => {
    const mockData = [
      { id: 1, student_id: 1, type: 'grant', amount: 100, reason: '출석' },
      { id: 2, student_id: 2, type: 'deduct', amount: 50, reason: '마켓' },
    ];
    mockSupabase.order.mockResolvedValueOnce({ data: mockData, error: null });

    const result = await getTalentTransactions();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
    expect(mockSupabase.from).toHaveBeenCalledWith('talent_transactions');
    expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  // T-02: 특정 학생 달란트 거래 내역 조회 (studentId 필터)
  it('T-02: getTalentTransactions - studentId 필터로 특정 학생 내역을 조회한다', async () => {
    const mockData = [{ id: 1, student_id: 5, type: 'grant', amount: 200, reason: '암송' }];
    mockSupabase.eq.mockResolvedValueOnce({ data: mockData, error: null });

    const result = await getTalentTransactions(5);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
    expect(mockSupabase.eq).toHaveBeenCalledWith('student_id', 5);
  });

  // T-03: 달란트 거래 내역 조회 실패
  it('T-03: getTalentTransactions - DB 오류 시 에러 응답을 반환한다', async () => {
    const mockError = { message: '달란트 조회 실패', code: 'DB_ERR' };
    mockSupabase.order.mockResolvedValueOnce({ data: null, error: mockError });

    const result = await getTalentTransactions();

    expect(result.success).toBe(false);
    expect(result.error).toBe('달란트 조회 실패');
  });

  // T-04: 달란트 부여 트랜잭션 생성 성공
  it('T-04: createTalentTransaction - 달란트 부여(grant) 트랜잭션을 생성한다', async () => {
    const { revalidatePath } = await import('next/cache');
    const tx = { student_id: 1, type: 'grant' as const, amount: 100, reason: '출석' };
    const mockResult = { id: 1, ...tx, recorded_by: 'teacher-user-id' };

    mockSupabase.single.mockResolvedValueOnce({ data: mockResult, error: null });

    const result = await createTalentTransaction(tx);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockResult);
    expect(mockSupabase.insert).toHaveBeenCalledWith({ ...tx, recorded_by: 'teacher-user-id' });
    expect(revalidatePath).toHaveBeenCalledWith('/talent');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });

  // T-05: 달란트 차감 트랜잭션 생성 성공
  it('T-05: createTalentTransaction - 달란트 차감(deduct) 트랜잭션을 생성한다', async () => {
    const tx = { student_id: 2, type: 'deduct' as const, amount: 50, reason: '마켓 차감' };
    const mockResult = { id: 2, ...tx, recorded_by: 'teacher-user-id' };

    mockSupabase.single.mockResolvedValueOnce({ data: mockResult, error: null });

    const result = await createTalentTransaction(tx);

    expect(result.success).toBe(true);
    expect(result.data?.type).toBe('deduct');
    expect(result.data?.amount).toBe(50);
  });

  // T-06: 달란트 생성 실패
  it('T-06: createTalentTransaction - DB 오류 시 에러 응답을 반환한다', async () => {
    const mockError = { message: '달란트 트랜잭션 실패', code: 'DB_ERR' };
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: mockError });

    const tx = { student_id: 1, type: 'grant' as const, amount: 100, reason: '테스트' };
    const result = await createTalentTransaction(tx);

    expect(result.success).toBe(false);
    expect(result.error).toBe('달란트 트랜잭션 실패');
  });
});
