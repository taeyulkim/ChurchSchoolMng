'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';
import { Database } from '@/lib/supabase/database.types';

type TalentTransactionRow = Database['public']['Tables']['talent_transactions']['Row'];

const MOCK_TRANSACTIONS: TalentTransactionRow[] = [];

export async function getTalentTransactions(studentId?: number): Promise<ActionResponse<TalentTransactionRow[]>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const data = studentId ? MOCK_TRANSACTIONS.filter(t => t.student_id === studentId) : MOCK_TRANSACTIONS;
      return { success: true, data };
    }

    const supabase = await createClient();
    let query = supabase.from('talent_transactions').select('*').order('created_at', { ascending: false });
    
    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;

    if (error) return handleSupabaseError(error);

    return {
      success: true,
      data,
    };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export interface TalentHistoryEntry {
  id: number;
  student_id: number | null;
  student_name: string;
  type: 'grant' | 'deduct';
  amount: number;
  reason: string;
  recorded_by_name: string;
  created_at: string;
}

interface TalentHistoryRow {
  id: number;
  student_id: number | null;
  type: 'grant' | 'deduct';
  amount: number;
  reason: string;
  created_at: string | null;
  students: { name: string } | null;
  profiles: { name: string } | null;
}

/**
 * 달란트 변경 이력 조회 (학생/기록자 이름 포함).
 * @param studentId 지정 시 해당 학생 이력만, 생략 시 전체 이력을 반환합니다.
 */
export async function getTalentHistory(studentId?: number): Promise<ActionResponse<TalentHistoryEntry[]>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: [] };
    }

    const supabase = await createClient();
    let query = supabase
      .from('talent_transactions')
      .select('id, student_id, type, amount, reason, created_at, students(name), profiles(name)')
      .order('created_at', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;

    if (error) return handleSupabaseError(error);

    const rows = (data ?? []) as unknown as TalentHistoryRow[];
    const history: TalentHistoryEntry[] = rows.map((row) => ({
      id: row.id,
      student_id: row.student_id,
      student_name: row.students?.name ?? '알 수 없음',
      type: row.type,
      amount: row.amount,
      reason: row.reason,
      recorded_by_name: row.profiles?.name ?? '관리자',
      created_at: row.created_at ?? '',
    }));

    return { success: true, data: history };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

/**
 * QR 로그인(비인증 학생 세션)용: 토큰으로 본인 달란트 내역만 조회합니다.
 * RLS가 authenticated 역할에만 허용되어 있어 anon 세션에서는 DB 함수를 통해 우회합니다.
 */
export async function getStudentTalentHistory(token: string, limit = 5): Promise<ActionResponse<TalentTransactionRow[]>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: MOCK_TRANSACTIONS.slice(0, limit) };
    }

    const supabase = await createClient();
    const { data, error } = await (supabase as any).rpc('get_student_talent_history', {
      p_token: token,
      p_limit: limit,
    });

    if (error) return handleSupabaseError(error);

    return { success: true, data: (data ?? []) as TalentTransactionRow[] };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function createTalentTransaction(tx: { student_id: number; type: 'grant' | 'deduct'; amount: number; reason: string }): Promise<ActionResponse<TalentTransactionRow>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const newTx = {
        id: Math.max(0, ...MOCK_TRANSACTIONS.map(t => t.id)) + 1,
        ...tx,
        recorded_by: user?.id || null,
        created_at: new Date().toISOString(),
      };
      MOCK_TRANSACTIONS.push(newTx);
      revalidatePath('/talent');
      revalidatePath('/dashboard');
      return { success: true, data: newTx };
    }

    const { data, error } = await supabase
      .from('talent_transactions')
      .insert({
        ...tx,
        recorded_by: user?.id || null
      } as any)
      .select()
      .single();

    if (error) return handleSupabaseError(error);

    revalidatePath('/talent');
    revalidatePath('/dashboard');

    return {
      success: true,
      data,
    };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function getWeeklyTalentSum(): Promise<number> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return MOCK_TRANSACTIONS.filter(t => t.type === 'grant').reduce((sum, t) => sum + t.amount, 0) || 2450;
  }

  try {
    const supabase = await createClient();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('talent_transactions')
      .select('amount')
      .eq('type', 'grant')
      .gte('created_at', oneWeekAgo.toISOString());

    if (error) {
      console.error(error);
      return 2450;
    }

    return (data as any[]).reduce((sum, row) => sum + row.amount, 0);
  } catch (error) {
    console.error(error);
    return 2450;
  }
}
