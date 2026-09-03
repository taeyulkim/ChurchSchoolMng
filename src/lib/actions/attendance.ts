'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';
import { Database } from '@/lib/supabase/database.types';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

type AttendanceRow = Database['public']['Tables']['attendance']['Row'];

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

async function calculateAttendanceRate(weekStart: Date, weekEnd: Date): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .gte('attendance_date', format(weekStart, 'yyyy-MM-dd'))
    .lte('attendance_date', format(weekEnd, 'yyyy-MM-dd'));

  if (error || !data || data.length === 0) return null;

  const rows = data as AttendanceRow[];
  const presentCount = rows.filter(a => a.is_present).length;
  return Math.round((presentCount / rows.length) * 100);
}

export async function getWeeklyAttendanceRate(): Promise<{ rate: number; change: number | null; label: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { rate: 85, change: 5, label: '지난주 대비 +5%' };

  try {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });

    const [thisWeekRate, lastWeekRate] = await Promise.all([
      calculateAttendanceRate(thisWeekStart, thisWeekEnd),
      calculateAttendanceRate(lastWeekStart, lastWeekEnd),
    ]);

    const rate = thisWeekRate ?? 0;

    if (thisWeekRate === null || lastWeekRate === null) {
      return { rate, change: null, label: '이번 주 출석 기록 기준' };
    }

    const diff = thisWeekRate - lastWeekRate;
    const sign = diff >= 0 ? '+' : '';
    return { rate, change: diff, label: `지난주 대비 ${sign}${diff}%` };
  } catch (error) {
    console.error(error);
    return { rate: 0, change: null, label: '이번 주 출석 기록 기준' };
  }
}
