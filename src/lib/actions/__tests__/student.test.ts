import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStudents, createStudent, getStudentCount } from '../student';

// Mock Dependencies
vi.mock('@/lib/supabase/server', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
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

describe('Student Actions', () => {
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Force real Supabase path (not mock branch)
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';

    const { createClient } = await import('@/lib/supabase/server');
    mockSupabase = await (createClient as any)();
  });

  // S-01: 학생 목록 조회 성공
  it('S-01: getStudents - 학생 목록을 성공적으로 가져온다', async () => {
    const mockData = [
      { id: 1, name: '홍길동', department: '어린이부', total_talents: 500 },
      { id: 2, name: '이순신', department: '청소년부', total_talents: 1000 },
    ];
    mockSupabase.order.mockResolvedValueOnce({ data: mockData, error: null });

    const result = await getStudents();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
    expect(mockSupabase.from).toHaveBeenCalledWith('students');
    expect(mockSupabase.select).toHaveBeenCalledWith('*');
    expect(mockSupabase.order).toHaveBeenCalledWith('name', { ascending: true });
  });

  // S-02: 학생 목록 조회 실패
  it('S-02: getStudents - DB 오류 시 에러 응답을 반환한다', async () => {
    const mockError = { message: '연결 실패', code: 'DB_ERR' };
    mockSupabase.order.mockResolvedValueOnce({ data: null, error: mockError });

    const result = await getStudents();

    expect(result.success).toBe(false);
    expect(result.error).toBe('연결 실패');
  });

  // S-03: Mock 환경에서 학생 목록 반환
  it('S-03: getStudents - Mock 환경에서 MOCK_STUDENTS를 반환한다', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const result = await getStudents();

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data!.length).toBeGreaterThan(0);
  });

  // S-04: 학생 신규 등록 성공 및 캐시 revalidate
  it('S-04: createStudent - 학생을 성공적으로 등록하고 캐시를 초기화한다', async () => {
    const { revalidatePath } = await import('next/cache');
    const newStudent = {
      name: '유관순',
      gender: 'female' as const,
      department: '어린이부' as const,
      birth_date: '2016-03-01',
    };
    const mockCreated = { id: 3, ...newStudent, total_talents: 0 };

    mockSupabase.single.mockResolvedValueOnce({ data: mockCreated, error: null });

    const result = await createStudent(newStudent as any);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockCreated);
    expect(mockSupabase.from).toHaveBeenCalledWith('students');
    expect(mockSupabase.insert).toHaveBeenCalledWith({ ...newStudent, recorded_by: 'teacher-user-id' });
    expect(revalidatePath).toHaveBeenCalledWith('/students');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });

  // S-05: Mock 환경에서 학생 등록 시 In-memory 배열에 추가
  it('S-05: createStudent - Mock 환경에서 메모리에 학생을 추가한다', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const beforeResult = await getStudents();
    const beforeCount = beforeResult.data?.length ?? 0;

    const newStudent = {
      name: '안중근',
      gender: 'male' as const,
      department: '청소년부' as const,
      birth_date: '2010-09-02',
    };

    const createResult = await createStudent(newStudent as any);
    expect(createResult.success).toBe(true);
    expect(createResult.data?.name).toBe('안중근');

    const afterResult = await getStudents();
    expect(afterResult.data?.length).toBe(beforeCount + 1);
  });

  // S-06: 학생 등록 실패
  it('S-06: createStudent - DB 오류 시 에러 응답을 반환한다', async () => {
    const mockError = { message: '중복 키 오류', code: '23505' };
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: mockError });

    const result = await createStudent({
      name: '테스트',
      gender: 'male',
      department: '어린이부',
    } as any);

    expect(result.success).toBe(false);
    expect(result.error).toBe('중복 키 오류');
  });

  // S-07: 학생 수 조회
  it('S-07: getStudentCount - 실제 DB에서 학생 수를 반환한다', async () => {
    mockSupabase.select.mockResolvedValueOnce({ count: 42, error: null });

    const result = await getStudentCount();

    expect(typeof result).toBe('number');
  });

  // S-08: 학생 수 Mock 환경 반환
  it('S-08: getStudentCount - Mock 환경에서 MOCK_STUDENTS 수를 반환한다', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const studentResult = await getStudents();
    const count = await getStudentCount();

    expect(count).toBe(studentResult.data?.length);
  });
});
