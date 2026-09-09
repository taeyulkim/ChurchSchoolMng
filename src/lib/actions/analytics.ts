'use server';

import { createClient } from '@/lib/supabase/server';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { getKstNow } from '@/lib/date-kst';
import { Database } from '@/lib/supabase/database.types';

type Department = Database['public']['Tables']['students']['Row']['department'];

const DEPARTMENTS: Department[] = ['유아부', '유치부', '어린이부', '청소년부', '청년부'];

export interface WeeklyPoint {
  label: string;
  value: number;
}

export interface TopTalentStudent {
  name: string;
  department: Department;
  total_talents: number;
}

export interface DepartmentTrend {
  department: Department;
  points: WeeklyPoint[];
}

interface WeekBucket {
  start: Date;
  end: Date;
  label: string;
}

function buildWeekBuckets(now: Date, weeks: number): WeekBucket[] {
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const end = endOfWeek(start, { weekStartsOn: 1 });
    buckets.push({ start, end, label: format(start, 'M/d') });
  }
  return buckets;
}

function findBucketIndex(buckets: WeekBucket[], dateStr: string): number {
  const d = new Date(dateStr);
  return buckets.findIndex((b) => d >= b.start && d <= b.end);
}

/**
 * 최근 N주간 전체 출석률 추이 (해당 주에 기록된 출석 데이터 기준).
 */
export async function getAttendanceRateTrend(weeks = 8): Promise<WeeklyPoint[]> {
  const now = getKstNow();
  const buckets = buildWeekBuckets(now, weeks);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return buckets.map((b, i) => ({ label: b.label, value: 55 + ((i * 7) % 35) }));
  }

  try {
    const supabase = await createClient();
    const rangeStart = format(buckets[0].start, 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('attendance')
      .select('attendance_date, is_present')
      .gte('attendance_date', rangeStart);

    if (error || !data) return buckets.map((b) => ({ label: b.label, value: 0 }));

    const totals = buckets.map(() => ({ present: 0, total: 0 }));
    (data as { attendance_date: string; is_present: boolean }[]).forEach((row) => {
      const idx = findBucketIndex(buckets, row.attendance_date);
      if (idx === -1) return;
      totals[idx].total += 1;
      if (row.is_present) totals[idx].present += 1;
    });

    return buckets.map((b, i) => ({
      label: b.label,
      value: totals[i].total > 0 ? Math.round((totals[i].present / totals[i].total) * 100) : 0,
    }));
  } catch {
    return buckets.map((b) => ({ label: b.label, value: 0 }));
  }
}

/**
 * 최근 N주간 부서별 출석률 추이 (해당 부서에 그 주 기록된 출석 데이터 기준).
 * 전체를 하나로 합친 수치보다, 어느 부서의 출석이 줄고 있는지 바로 보여줍니다.
 */
export async function getDepartmentAttendanceRateTrend(weeks = 8): Promise<DepartmentTrend[]> {
  const now = getKstNow();
  const buckets = buildWeekBuckets(now, weeks);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return DEPARTMENTS.map((department) => ({
      department,
      points: buckets.map((b, i) => ({ label: b.label, value: 50 + ((i * 7 + department.length * 3) % 45) })),
    }));
  }

  try {
    const supabase = await createClient();
    const rangeStart = format(buckets[0].start, 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('attendance')
      .select('attendance_date, is_present, students(department)')
      .gte('attendance_date', rangeStart);

    if (error || !data) {
      return DEPARTMENTS.map((dept) => ({ department: dept, points: buckets.map((b) => ({ label: b.label, value: 0 })) }));
    }

    interface DeptWeekAgg {
      present: number;
      total: number;
    }
    const table = new Map<string, DeptWeekAgg>();
    const keyFor = (dept: string, idx: number) => `${dept}__${idx}`;
    DEPARTMENTS.forEach((dept) => buckets.forEach((_, idx) => table.set(keyFor(dept, idx), { present: 0, total: 0 })));

    interface AttendanceJoinRow {
      attendance_date: string;
      is_present: boolean;
      students: { department: Department } | null;
    }
    (data as unknown as AttendanceJoinRow[]).forEach((row) => {
      const dept = row.students?.department;
      if (!dept) return;
      const idx = findBucketIndex(buckets, row.attendance_date);
      if (idx === -1) return;
      const entry = table.get(keyFor(dept, idx));
      if (!entry) return;
      entry.total += 1;
      if (row.is_present) entry.present += 1;
    });

    return DEPARTMENTS.map((dept) => ({
      department: dept,
      points: buckets.map((b, idx) => {
        const entry = table.get(keyFor(dept, idx))!;
        return { label: b.label, value: entry.total > 0 ? Math.round((entry.present / entry.total) * 100) : 0 };
      }),
    }));
  } catch {
    return DEPARTMENTS.map((dept) => ({ department: dept, points: buckets.map((b) => ({ label: b.label, value: 0 })) }));
  }
}

export interface FrequentAbsentee {
  id: number;
  name: string;
  department: Department;
  absentWeeks: number;
  recordedWeeks: number;
  lastPresentLabel: string | null;
}

/**
 * 최근 N주 중 출석 기록이 있는 주 가운데 결석이 minAbsences주 이상인 학생 목록.
 * 출석이 뜸해지고 있는 학생을 조기에 찾아 심방/연락 대상으로 삼기 위한 목록입니다.
 * (출석 체크 자체가 없었던 주는 결석으로 세지 않습니다.)
 */
export async function getFrequentAbsentees(weeks = 4, minAbsences = 2): Promise<FrequentAbsentee[]> {
  const now = getKstNow();
  const buckets = buildWeekBuckets(now, weeks);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return [
      { id: 1, name: '홍길동', department: '어린이부', absentWeeks: 3, recordedWeeks: 4, lastPresentLabel: buckets[0].label },
      { id: 2, name: '이순신', department: '청소년부', absentWeeks: 2, recordedWeeks: 4, lastPresentLabel: buckets[1].label },
    ];
  }

  try {
    const supabase = await createClient();
    const rangeStart = format(buckets[0].start, 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('attendance')
      .select('student_id, attendance_date, is_present, students(name, department, is_active)')
      .gte('attendance_date', rangeStart);

    if (error || !data) return [];

    interface AttendanceJoinRow {
      student_id: number | null;
      attendance_date: string;
      is_present: boolean;
      students: { name: string; department: Department; is_active: boolean } | null;
    }

    interface StudentWeekState {
      name: string;
      department: Department;
      isActive: boolean;
      weekStatus: (boolean | null)[]; // true=출석, false=결석, null=기록 없음
    }

    const byStudent = new Map<number, StudentWeekState>();

    (data as unknown as AttendanceJoinRow[]).forEach((row) => {
      if (row.student_id == null || !row.students) return;
      const idx = findBucketIndex(buckets, row.attendance_date);
      if (idx === -1) return;

      let state = byStudent.get(row.student_id);
      if (!state) {
        state = {
          name: row.students.name,
          department: row.students.department,
          isActive: row.students.is_active,
          weekStatus: buckets.map(() => null),
        };
        byStudent.set(row.student_id, state);
      }
      if (row.is_present) state.weekStatus[idx] = true;
      else if (state.weekStatus[idx] !== true) state.weekStatus[idx] = false;
    });

    const results: FrequentAbsentee[] = [];
    byStudent.forEach((state, studentId) => {
      if (!state.isActive) return;
      const recordedWeeks = state.weekStatus.filter((w) => w !== null).length;
      const absentWeeks = state.weekStatus.filter((w) => w === false).length;
      if (absentWeeks < minAbsences) return;

      let lastPresentLabel: string | null = null;
      for (let i = buckets.length - 1; i >= 0; i--) {
        if (state.weekStatus[i] === true) {
          lastPresentLabel = buckets[i].label;
          break;
        }
      }

      results.push({
        id: studentId,
        name: state.name,
        department: state.department,
        absentWeeks,
        recordedWeeks,
        lastPresentLabel,
      });
    });

    results.sort((a, b) => b.absentWeeks - a.absentWeeks || a.name.localeCompare(b.name, 'ko'));
    return results;
  } catch {
    return [];
  }
}

/**
 * 누적 달란트 기준 상위 학생 (학생별 달란트 획득 분석).
 */
export async function getTopTalentStudents(limit = 10): Promise<TopTalentStudent[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const names = ['홍길동', '이순신', '유관순', '안중근', '신사임당'];
    return names.slice(0, limit).map((name, i) => ({
      name,
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      total_talents: 5000 - i * 700,
    }));
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('students')
      .select('name, department, total_talents')
      .eq('is_active', true)
      .order('total_talents', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return (data as { name: string; department: Department; total_talents: number | null }[])
      .map((s) => ({ name: s.name, department: s.department, total_talents: s.total_talents ?? 0 }));
  } catch {
    return [];
  }
}

/**
 * 최근 N주간 부서별 "출석 인원 1명당 부여된 달란트" 추이.
 * 부서 규모 차이를 배제하고 부서별 보상 수준을 비교하기 위한 지표입니다.
 */
export async function getDepartmentTalentPerAttendeeTrend(weeks = 8): Promise<DepartmentTrend[]> {
  const now = getKstNow();
  const buckets = buildWeekBuckets(now, weeks);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return DEPARTMENTS.map((department) => ({
      department,
      points: buckets.map((b, i) => ({ label: b.label, value: Math.round(((i + 1) * 3 + department.length) % 15) })),
    }));
  }

  try {
    const supabase = await createClient();
    const rangeStartDate = format(buckets[0].start, 'yyyy-MM-dd');
    const rangeStartIso = buckets[0].start.toISOString();

    const [attendanceRes, talentRes] = await Promise.all([
      supabase
        .from('attendance')
        .select('student_id, attendance_date, is_present, students(department)')
        .eq('is_present', true)
        .gte('attendance_date', rangeStartDate),
      supabase
        .from('talent_transactions')
        .select('amount, created_at, students(department)')
        .eq('type', 'grant')
        .gte('created_at', rangeStartIso),
    ]);

    interface DeptWeekAgg {
      attendeeIds: Set<number>;
      talent: number;
    }

    const table = new Map<string, DeptWeekAgg>();
    const keyFor = (dept: string, idx: number) => `${dept}__${idx}`;
    DEPARTMENTS.forEach((dept) => {
      buckets.forEach((_, idx) => table.set(keyFor(dept, idx), { attendeeIds: new Set(), talent: 0 }));
    });

    interface AttendanceJoinRow {
      student_id: number | null;
      attendance_date: string;
      students: { department: Department } | null;
    }
    ((attendanceRes.data as unknown as AttendanceJoinRow[]) ?? []).forEach((row) => {
      const dept = row.students?.department;
      if (!dept || row.student_id == null) return;
      const idx = findBucketIndex(buckets, row.attendance_date);
      if (idx === -1) return;
      table.get(keyFor(dept, idx))?.attendeeIds.add(row.student_id);
    });

    interface TalentJoinRow {
      amount: number;
      created_at: string;
      students: { department: Department } | null;
    }
    ((talentRes.data as unknown as TalentJoinRow[]) ?? []).forEach((row) => {
      const dept = row.students?.department;
      if (!dept) return;
      const idx = findBucketIndex(buckets, row.created_at.slice(0, 10));
      if (idx === -1) return;
      const entry = table.get(keyFor(dept, idx));
      if (entry) entry.talent += row.amount;
    });

    return DEPARTMENTS.map((dept) => ({
      department: dept,
      points: buckets.map((b, idx) => {
        const entry = table.get(keyFor(dept, idx))!;
        const count = entry.attendeeIds.size;
        return { label: b.label, value: count > 0 ? Math.round((entry.talent / count) * 10) / 10 : 0 };
      }),
    }));
  } catch {
    return DEPARTMENTS.map((dept) => ({ department: dept, points: buckets.map((b) => ({ label: b.label, value: 0 })) }));
  }
}
