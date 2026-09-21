'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';
import { Database } from '@/lib/supabase/database.types';
import { getKstDateString } from '@/lib/date-kst';
import { DEFAULT_TALENT_RULES } from '@/lib/talent-categories';

type AttendanceRow = Database['public']['Tables']['attendance']['Row'];
type StudentDepartment = Database['public']['Tables']['students']['Row']['department'];

export interface DepartmentAttendance {
  department: StudentDepartment;
  total: number;
  present: number;
  rate: number;
}

const DEPARTMENTS: StudentDepartment[] = ['유아부', '유치부', '어린이부', '청소년부', '청년부'];

const MOCK_ATTENDANCE: AttendanceRow[] = [];

export async function getAttendanceByDate(date: string): Promise<ActionResponse<AttendanceRow[]>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: MOCK_ATTENDANCE.filter(a => a.attendance_date === date) };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('attendance_date', date);

    if (error) return handleSupabaseError(error);

    return {
      success: true,
      data,
    };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function upsertAttendance(records: { student_id: number; attendance_date: string; is_present: boolean }[]): Promise<ActionResponse<AttendanceRow[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      records.forEach(r => {
        const idx = MOCK_ATTENDANCE.findIndex(a => a.student_id === r.student_id && a.attendance_date === r.attendance_date);
        if (idx !== -1) {
          MOCK_ATTENDANCE[idx].is_present = r.is_present;
        } else {
          MOCK_ATTENDANCE.push({
            id: Math.max(0, ...MOCK_ATTENDANCE.map(a => a.id)) + 1,
            ...r,
            recorded_by: user?.id || null,
            created_at: new Date().toISOString(),
            talent_granted_at: null,
          });
        }
      });
      revalidatePath('/attendance');
      revalidatePath('/dashboard');
      return {
        success: true,
        data: MOCK_ATTENDANCE.filter(a => records.some(r => r.student_id === a.student_id && r.attendance_date === a.attendance_date)),
      };
    }
    
    const recordsWithUser = records.map(r => ({
      ...r,
      recorded_by: user?.id || null
    }));

    const { data, error } = await supabase
      .from('attendance')
      .upsert(recordsWithUser as any, { onConflict: 'student_id, attendance_date' })
      .select();

    if (error) return handleSupabaseError(error);

    revalidatePath('/attendance');
    revalidatePath('/dashboard');

    return {
      success: true,
      data,
    };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export interface GrantAttendanceTalentsResult {
  count: number;
  /** 학생 1명에게 부여한 달란트 (현재 출석 규정 금액) */
  amount: number;
}

/**
 * 선택한 학생들 중 해당 날짜에 출석 처리되었고 아직 달란트가 부여되지 않은 학생에게
 * 일괄로 달란트를 부여합니다. 금액은 달란트 규정의 '출석' 금액을 사용합니다.
 * attendance.talent_granted_at으로 중복 부여를 막습니다
 * (같은 버튼을 여러 번 눌러도 이미 부여된 학생은 대상에서 자동으로 빠집니다).
 */
export async function grantAttendanceTalents(
  studentIds: number[],
  attendanceDate: string
): Promise<ActionResponse<GrantAttendanceTalentsResult>> {
  try {
    const defaultAmount = DEFAULT_TALENT_RULES.find((r) => r.category === 'attendance')?.amount ?? 2;

    if (studentIds.length === 0) return { success: true, data: { count: 0, amount: defaultAmount } };

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: { count: 0, amount: defaultAmount } };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: rule } = await supabase
      .from('talent_rules')
      .select('amount')
      .eq('category', 'attendance')
      .maybeSingle();
    const amount = (rule as { amount: number } | null)?.amount ?? defaultAmount;

    const { data: rows, error: fetchError } = await supabase
      .from('attendance')
      .select('id, student_id')
      .in('student_id', studentIds)
      .eq('attendance_date', attendanceDate)
      .eq('is_present', true)
      .is('talent_granted_at', null);

    if (fetchError) return handleSupabaseError(fetchError);

    const targets = (rows ?? []) as { id: number; student_id: number | null }[];
    if (targets.length === 0) return { success: true, data: { count: 0, amount } };

    const txRows = targets
      .filter((r) => r.student_id != null)
      .map((r) => ({
        student_id: r.student_id as number,
        type: 'grant' as const,
        amount,
        reason: '출석 일괄 부여',
        category: 'attendance',
        recorded_by: user?.id ?? null,
      }));

    const { error: insertError } = await supabase.from('talent_transactions').insert(txRows as never);
    if (insertError) return handleSupabaseError(insertError);

    const { error: updateError } = await supabase
      .from('attendance')
      .update({ talent_granted_at: new Date().toISOString() } as never)
      .in('id', targets.map((r) => r.id));

    if (updateError) return handleSupabaseError(updateError);

    revalidatePath('/attendance');
    revalidatePath('/dashboard');
    revalidatePath('/talent');

    return { success: true, data: { count: targets.length, amount } };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function getTodayAttendanceByDepartment(): Promise<DepartmentAttendance[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return DEPARTMENTS.map(department => ({ department, total: 20, present: 15, rate: 75 }));
  }

  try {
    const supabase = await createClient();
    // 서버가 UTC로 실행되어도(예: Vercel) 한국 날짜 기준 "오늘"을 사용합니다.
    const today = getKstDateString();

    const [studentsRes, attendanceRes] = await Promise.all([
      supabase.from('students').select('id, department').eq('is_active', true),
      supabase.from('attendance').select('student_id, is_present').eq('attendance_date', today),
    ]);

    const students = (studentsRes.data ?? []) as { id: number; department: StudentDepartment }[];
    const presentStudentIds = new Set(
      ((attendanceRes.data ?? []) as Pick<AttendanceRow, 'student_id' | 'is_present'>[])
        .filter(a => a.is_present && a.student_id != null)
        .map(a => a.student_id)
    );

    return DEPARTMENTS.map(department => {
      const deptStudents = students.filter(s => s.department === department);
      const total = deptStudents.length;
      const present = deptStudents.filter(s => presentStudentIds.has(s.id)).length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      return { department, total, present, rate };
    });
  } catch (error) {
    console.error(error);
    return DEPARTMENTS.map(department => ({ department, total: 0, present: 0, rate: 0 }));
  }
}
