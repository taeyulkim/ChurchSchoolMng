'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';
import { Database } from '@/lib/supabase/database.types';
import { format } from 'date-fns';

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
            created_at: new Date().toISOString()
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

export async function getTodayAttendanceByDepartment(): Promise<DepartmentAttendance[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return DEPARTMENTS.map(department => ({ department, total: 20, present: 15, rate: 75 }));
  }

  try {
    const supabase = await createClient();
    const today = format(new Date(), 'yyyy-MM-dd');

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
