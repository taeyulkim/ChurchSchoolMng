'use server';

import { createClient } from '@/lib/supabase/server';
import { isMasterAdmin } from './user';

export type ActivityCategory = 'talent' | 'budget' | 'student' | 'attendance';

export interface RecentActivity {
  id: string;
  actor: string;
  action: string;
  createdAt: string;
  category: ActivityCategory;
}

export interface ActivityLogFilter {
  /** ISO 날짜/일시 문자열, 포함 */
  startDate?: string;
  /** ISO 날짜/일시 문자열, 포함 */
  endDate?: string;
  limit?: number;
}

interface ProfileName {
  name: string | null;
}

interface TalentActivityRow {
  id: number;
  type: 'grant' | 'deduct';
  amount: number;
  reason: string;
  created_at: string | null;
  profiles: ProfileName | null;
}

interface BudgetActivityRow {
  id: number;
  type: 'income' | 'expense';
  description: string | null;
  created_at: string;
  profiles: ProfileName | null;
}

interface StudentActivityRow {
  id: number;
  name: string;
  department: string;
  created_at: string | null;
}

interface AttendanceActivityRow {
  attendance_date: string;
  created_at: string | null;
  profiles: ProfileName | null;
}

const MOCK_ACTIVITIES: RecentActivity[] = [
  { id: 'mock-1', actor: '김교사', action: '초등부 출석 체크 완료', createdAt: new Date().toISOString(), category: 'attendance' },
  { id: 'mock-2', actor: '이교사', action: '달란트 15개 부여 (암송)', createdAt: new Date().toISOString(), category: 'talent' },
  { id: 'mock-3', actor: '박부장', action: '7월 예산 등록', createdAt: new Date().toISOString(), category: 'budget' },
  { id: 'mock-4', actor: '최교사', action: '학생 2명 신규 등록', createdAt: new Date().toISOString(), category: 'student' },
];

/**
 * 여러 테이블의 활동을 합쳐서 최신순으로 반환하는 내부 함수.
 * startDate/endDate가 있으면 "최근 N건"이 아니라 해당 기간 전체를 대상으로 조회합니다
 * (기간 필터 시 안전 상한을 높여, 상위 limit건만 자르는 것이 아니라 기간 내 데이터를 폭넓게 가져옵니다).
 */
async function fetchActivities({ limit, startDate, endDate }: { limit: number; startDate?: string; endDate?: string }): Promise<RecentActivity[]> {
  const supabase = await createClient();
  const isFiltered = !!(startDate || endDate);
  const perTableLimit = isFiltered ? Math.max(limit, 1000) : limit;

  let talentQuery = supabase
    .from('talent_transactions')
    .select('id, type, amount, reason, created_at, profiles(name)')
    .order('created_at', { ascending: false });
  let budgetQuery = supabase
    .from('budget_transactions')
    .select('id, type, description, created_at, profiles(name)')
    .order('created_at', { ascending: false });
  let studentQuery = supabase
    .from('students')
    .select('id, name, department, created_at')
    .order('created_at', { ascending: false });
  let attendanceQuery = supabase
    .from('attendance')
    .select('attendance_date, created_at, profiles(name)')
    .order('created_at', { ascending: false });

  if (startDate) {
    talentQuery = talentQuery.gte('created_at', startDate);
    budgetQuery = budgetQuery.gte('created_at', startDate);
    studentQuery = studentQuery.gte('created_at', startDate);
    attendanceQuery = attendanceQuery.gte('created_at', startDate);
  }
  if (endDate) {
    talentQuery = talentQuery.lte('created_at', endDate);
    budgetQuery = budgetQuery.lte('created_at', endDate);
    studentQuery = studentQuery.lte('created_at', endDate);
    attendanceQuery = attendanceQuery.lte('created_at', endDate);
  }

  const [talentRes, budgetRes, studentRes, attendanceRes] = await Promise.all([
    talentQuery.limit(perTableLimit),
    budgetQuery.limit(perTableLimit),
    studentQuery.limit(perTableLimit),
    attendanceQuery.limit(perTableLimit * 5),
  ]);

  const activities: RecentActivity[] = [];

  ((talentRes.data as unknown as TalentActivityRow[]) ?? []).forEach((t) => {
    if (!t.created_at) return;
    activities.push({
      id: `talent-${t.id}`,
      actor: t.profiles?.name ?? '관리자',
      action: `달란트 ${t.amount}개 ${t.type === 'grant' ? '부여' : '차감'} (${t.reason})`,
      createdAt: t.created_at,
      category: 'talent',
    });
  });

  ((budgetRes.data as unknown as BudgetActivityRow[]) ?? []).forEach((b) => {
    activities.push({
      id: `budget-${b.id}`,
      actor: b.profiles?.name ?? '관리자',
      action: `${b.description ?? (b.type === 'income' ? '수입' : '지출')} 등록`,
      createdAt: b.created_at,
      category: 'budget',
    });
  });

  ((studentRes.data as unknown as StudentActivityRow[]) ?? []).forEach((s) => {
    if (!s.created_at) return;
    activities.push({
      id: `student-${s.id}`,
      actor: '관리자',
      action: `${s.name} 학생 신규 등록 (${s.department})`,
      createdAt: s.created_at,
      category: 'student',
    });
  });

  const attendanceSessions = new Map<string, { actor: string; count: number; createdAt: string }>();
  ((attendanceRes.data as unknown as AttendanceActivityRow[]) ?? []).forEach((a) => {
    if (!a.created_at) return;
    const actor = a.profiles?.name ?? '관리자';
    const key = `${actor}__${a.attendance_date}`;
    const existing = attendanceSessions.get(key);
    if (existing) {
      existing.count += 1;
      if (a.created_at > existing.createdAt) existing.createdAt = a.created_at;
    } else {
      attendanceSessions.set(key, { actor, count: 1, createdAt: a.created_at });
    }
  });
  attendanceSessions.forEach((session, key) => {
    activities.push({
      id: `attendance-${key}`,
      actor: session.actor,
      action: `출석 체크 완료 (${session.count}명)`,
      createdAt: session.createdAt,
      category: 'attendance',
    });
  });

  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return activities.slice(0, limit);
}

export async function getRecentActivities(limit = 5): Promise<RecentActivity[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return MOCK_ACTIVITIES;

  try {
    return await fetchActivities({ limit });
  } catch (error) {
    console.error(error);
    return [];
  }
}

/**
 * 설정 > 로그 관리 화면 전용 (마스터 관리자 전용).
 * 대시보드 "최근 활동" 위젯은 누구나 볼 수 있지만, 전체 이력 조회는 마스터 관리자로 제한합니다.
 * startDate/endDate로 기간을 지정하면 해당 기간 전체를 대상으로 조회합니다.
 */
export async function getActivityLog(filter: ActivityLogFilter = {}): Promise<RecentActivity[]> {
  if (!(await isMasterAdmin())) return [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return MOCK_ACTIVITIES;

  // 기간을 지정한 경우, 최근 200건이 아니라 해당 기간 내 데이터를 폭넓게 반환합니다.
  const isFiltered = !!(filter.startDate || filter.endDate);
  const limit = filter.limit ?? (isFiltered ? 1000 : 200);

  try {
    return await fetchActivities({ limit, startDate: filter.startDate, endDate: filter.endDate });
  } catch (error) {
    console.error(error);
    return [];
  }
}
