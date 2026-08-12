'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';

const MOCK_ATTENDANCE: any[] = [];

export async function getAttendanceByDate(date: string) {
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

export async function upsertAttendance(records: { student_id: number; attendance_date: string; is_present: boolean }[]) {
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
      return { success: true, data: records };
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

export async function getWeeklyAttendanceRate(): Promise<{ rate: number; label: string }> {
  // Mock Data Fallback
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { rate: 85, label: '지난주 대비 +5%' };
  
  return { rate: 85, label: '지난주 대비 +5%' };
}
