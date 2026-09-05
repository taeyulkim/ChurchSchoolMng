'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';
import { Database } from '@/lib/supabase/database.types';

type EventRow = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];

const MOCK_EVENTS: EventRow[] = [
  { id: 1, title: '여름 성경 학교', event_date: new Date(Date.now() + 5 * 86400000).toISOString(), location: '본당', type: 'special', department: null, created_at: new Date().toISOString() },
  { id: 2, title: '교사 기도회', event_date: new Date(Date.now() + 2 * 86400000).toISOString(), location: '소예배실', type: 'meeting', department: null, created_at: new Date().toISOString() },
  { id: 3, title: '주일 학교 예배', event_date: new Date(Date.now() + 12 * 86400000).toISOString(), location: '본당', type: 'worship', department: null, created_at: new Date().toISOString() },
];

/**
 * 일정 조회
 * @param department 지정 시 해당 부서 일정 + 공통(department가 null인) 일정만 반환합니다.
 *                    생략 시 전체 일정을 반환합니다 (대시보드 등 관리자 화면용).
 */
export async function getEvents(department?: string | null): Promise<ActionResponse<EventRow[]>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const data = department
        ? MOCK_EVENTS.filter(e => e.department === null || e.department === department)
        : MOCK_EVENTS;
      return { success: true, data: [...data] };
    }

    const supabase = await createClient();
    let query = supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (department) {
      query = query.or(`department.is.null,department.eq.${department}`);
    }

    const { data, error } = await query;

    if (error) return handleSupabaseError(error);

    return { success: true, data };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function createEvent(event: EventInsert): Promise<ActionResponse<EventRow>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const newEvent: EventRow = {
        id: Math.max(0, ...MOCK_EVENTS.map(e => e.id)) + 1,
        ...event,
        created_at: new Date().toISOString(),
      } as any;
      MOCK_EVENTS.push(newEvent);
      revalidatePath('/schedule');
      revalidatePath('/dashboard');
      return { success: true, data: newEvent };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('events')
      .insert(event as any)
      .select()
      .single();

    if (error) return handleSupabaseError(error);

    revalidatePath('/schedule');
    revalidatePath('/dashboard');

    return { success: true, data };
  } catch (err) {
    return handleSupabaseError(err);
  }
}
