'use server';

import { createClient } from '@/lib/supabase/server';
import { getEvents } from './event';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';
import { Database } from '@/lib/supabase/database.types';

type EventRow = Database['public']['Tables']['events']['Row'];

export interface ScheduleItem {
  id: string;
  title: string;
  event_date: string;
  end_date: string | null;
  location: string | null;
  type: 'special' | 'meeting' | 'worship' | 'birthday';
  department: string | null;
  isBirthday: boolean;
  /** 실제 events 테이블 일정인 경우에만 존재 (생일 항목은 없음, 수정/삭제 불가) */
  sourceEvent?: EventRow;
}

interface BirthdayCandidate {
  id: string | number;
  name: string;
  birth_date: string | null;
  department: string | null;
}

function thisYearOccurrence(birthDate: string, year: number): string {
  const d = new Date(birthDate);
  // 로컬 자정 기준으로 생성해 날짜가 하루 밀리지 않도록 합니다.
  return new Date(year, d.getUTCMonth(), d.getUTCDate()).toISOString();
}

/**
 * 일정 관리용 통합 일정 목록.
 * 실제 events 테이블의 일정 + 학생/교사 생일(매년 자동 계산)을 합쳐서 반환합니다.
 * 생일은 해당 인물의 소속 부서 일정으로 취급되어, department 필터가 동일하게 적용됩니다.
 */
export async function getScheduleItems(department?: string | null): Promise<ActionResponse<ScheduleItem[]>> {
  try {
    const eventsRes = await getEvents(department);
    if (!eventsRes.success || !eventsRes.data) {
      return { success: false, error: eventsRes.error };
    }

    const items: ScheduleItem[] = eventsRes.data.map((e) => ({
      id: `event-${e.id}`,
      title: e.title,
      event_date: e.event_date,
      end_date: e.end_date,
      location: e.location,
      type: e.type,
      department: e.department,
      isBirthday: false,
      sourceEvent: e,
    }));

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: items };
    }

    const supabase = await createClient();
    const currentYear = new Date().getFullYear();

    let studentQuery = supabase
      .from('students')
      .select('*')
      .eq('is_active', true)
      .not('birth_date', 'is', null);
    if (department) studentQuery = studentQuery.eq('department', department);

    let teacherQuery = supabase
      .from('profiles')
      .select('*')
      .eq('status', 'approved')
      .not('birth_date', 'is', null);
    if (department) teacherQuery = teacherQuery.eq('department', department);

    const [studentsRes, teachersRes] = await Promise.all([studentQuery, teacherQuery]);

    if (studentsRes.error) return handleSupabaseError(studentsRes.error);
    if (teachersRes.error) return handleSupabaseError(teachersRes.error);

    const students = (studentsRes.data ?? []) as unknown as BirthdayCandidate[];
    const teachers = (teachersRes.data ?? []) as unknown as BirthdayCandidate[];

    students.forEach((s) => {
      if (!s.birth_date) return;
      items.push({
        id: `birthday-student-${s.id}`,
        title: `${s.name} 학생 생일 🎂`,
        event_date: thisYearOccurrence(s.birth_date, currentYear),
        end_date: null,
        location: null,
        type: 'birthday',
        department: s.department,
        isBirthday: true,
      });
    });

    teachers.forEach((t) => {
      if (!t.birth_date) return;
      items.push({
        id: `birthday-teacher-${t.id}`,
        title: `${t.name} 선생님 생일 🎂`,
        event_date: thisYearOccurrence(t.birth_date, currentYear),
        end_date: null,
        location: null,
        type: 'birthday',
        department: t.department,
        isBirthday: true,
      });
    });

    items.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

    return { success: true, data: items };
  } catch (err) {
    return handleSupabaseError(err);
  }
}
