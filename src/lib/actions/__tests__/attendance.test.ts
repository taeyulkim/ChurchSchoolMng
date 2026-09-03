import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAttendanceByDate, upsertAttendance, getWeeklyAttendanceRate } from '../attendance';

vi.mock('@/lib/supabase/server', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-user-id' } } }),
    },
  };
  return {
    createClient: vi.fn(() => Promise.resolve(mockSupabase)),
  };
});

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Attendance Actions', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Force real Supabase path (not mock branch)
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';

    const { createClient } = await import('@/lib/supabase/server');
    mockSupabase = await (createClient as any)();
  });

  // A-01: 특정 날짜 출석 기록 조회 성공
  it('A-01: getAttendanceByDate - 특정 날짜의 출석 기록을 성공적으로 조회한다', async () => {
    const targetDate = '2026-07-20';
    const mockData = [
      { id: 1, student_id: 1, attendance_date: targetDate, is_present: true },
      { id: 2, student_id: 2, attendance_date: targetDate, is_present: false },
    ];
    mockSupabase.eq.mockResolvedValueOnce({ data: mockData, error: null });

    const result = await getAttendanceByDate(targetDate);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
    expect(mockSupabase.from).toHaveBeenCalledWith('attendance');
    expect(mockSupabase.select).toHaveBeenCalledWith('*');
    expect(mockSupabase.eq).toHaveBeenCalledWith('attendance_date', targetDate);
  });

  // A-02: 출석 기록 조회 실패
  it('A-02: getAttendanceByDate - DB 오류 시 에러 응답을 반환한다', async () => {
    const mockError = { message: '출석 조회 실패', code: 'DB_ERR' };
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: mockError });

    const result = await getAttendanceByDate('2026-07-20');

    expect(result.success).toBe(false);
    expect(result.error).toBe('출석 조회 실패');
  });

  // A-03: 출석 기록 저장(upsert) 성공 + recorded_by 포함
  it('A-03: upsertAttendance - recorded_by를 포함하여 출석을 저장한다', async () => {
    const records = [
      { student_id: 1, attendance_date: '2026-07-20', is_present: true },
      { student_id: 2, attendance_date: '2026-07-20', is_present: false },
    ];

    const expectedWithUser = records.map(r => ({ ...r, recorded_by: 'admin-user-id' }));
    mockSupabase.select.mockResolvedValueOnce({ data: expectedWithUser, error: null });

    const result = await upsertAttendance(records);

    expect(result.success).toBe(true);
    expect(mockSupabase.upsert).toHaveBeenCalledWith(
      expectedWithUser,
      { onConflict: 'student_id, attendance_date' }
    );
  });

  // A-04: 출석 저장 후 캐시 revalidate 확인
  it('A-04: upsertAttendance - 저장 완료 후 관련 경로 캐시를 초기화한다', async () => {
    const { revalidatePath } = await import('next/cache');
    const records = [{ student_id: 1, attendance_date: '2026-07-20', is_present: true }];
    const expected = [{ ...records[0], recorded_by: 'admin-user-id' }];

    mockSupabase.select.mockResolvedValueOnce({ data: expected, error: null });

    await upsertAttendance(records);

    expect(revalidatePath).toHaveBeenCalledWith('/attendance');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });

  // A-05: 출석 저장 실패
  it('A-05: upsertAttendance - DB 오류 시 에러 응답을 반환한다', async () => {
    const mockError = { message: '출석 저장 실패', code: 'DB_ERR' };
    mockSupabase.select.mockResolvedValueOnce({ data: null, error: mockError });

    const records = [{ student_id: 1, attendance_date: '2026-07-20', is_present: true }];
    const result = await upsertAttendance(records);

    expect(result.success).toBe(false);
    expect(result.error).toBe('출석 저장 실패');
  });

  // A-06: 주간 출석률 조회
  it('A-06: getWeeklyAttendanceRate - 출석률과 레이블을 반환한다', async () => {
    const result = await getWeeklyAttendanceRate();

    expect(result).toHaveProperty('rate');
    expect(result).toHaveProperty('label');
    expect(typeof result.rate).toBe('number');
    expect(result.rate).toBeGreaterThanOrEqual(0);
    expect(result.rate).toBeLessThanOrEqual(100);
  });
});
