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

export async function getRecentActivities(limit = 5): Promise<RecentActivity[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return MOCK_ACTIVITIES;

  try {
    const supabase = await createClient();

    const [talentRes, budgetRes, studentRes, attendanceRes] = await Promise.all([
      supabase
        .from('talent_transactions')
        .select('id, type, amount, reason, created_at, profiles(name)')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('budget_transactions')
        .select('id, type, description, created_at, profiles(name)')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('students')
        .select('id, name, department, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('attendance')
        .select('attendance_date, created_at, profiles(name)')
        .order('created_at', { ascending: false })
        .limit(limit * 5),
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
  } catch (error) {
    console.error(error);
    return [];
  }
}

/**
 * 설정 > 로그 관리 화면 전용 (마스터 관리자 전용).
 * 대시보드 "최근 활동" 위젯은 누구나 볼 수 있지만, 전체 이력 조회는 마스터 관리자로 제한합니다.
 */
export async function getActivityLog(limit = 200): Promise<RecentActivity[]> {
  if (!(await isMasterAdmin())) return [];
  return getRecentActivities(limit);
}
