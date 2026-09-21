'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';
import { Database } from '@/lib/supabase/database.types';
import { isMasterAdmin } from './user';
import {
  DEFAULT_TALENT_RULES,
  RULE_CATEGORIES,
  type RuleCategory,
  type TalentRule,
} from '@/lib/talent-categories';

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
  category: string | null;
  corrects_id: number | null;
  recorded_by_name: string;
  created_at: string;
}

interface TalentHistoryRow {
  id: number;
  student_id: number | null;
  type: 'grant' | 'deduct';
  amount: number;
  reason: string;
  category: string | null;
  corrects_id: number | null;
  created_at: string | null;
  students: { name: string } | null;
  profiles: { name: string } | null;
}

export interface TalentHistoryFilter {
  studentId?: number;
  /** ISO 날짜 문자열 (예: '2026-01-01'), 포함 */
  startDate?: string;
  /** ISO 날짜 문자열 (예: '2026-03-31'), 포함 */
  endDate?: string;
}

/**
 * 달란트 변경 이력 조회 (학생/기록자 이름 포함).
 * @param filter studentId 지정 시 해당 학생 이력만, startDate/endDate 지정 시 해당 기간만 반환합니다.
 */
export async function getTalentHistory(filter: TalentHistoryFilter = {}): Promise<ActionResponse<TalentHistoryEntry[]>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: [] };
    }

    const { studentId, startDate, endDate } = filter;

    const supabase = await createClient();
    let query = supabase
      .from('talent_transactions')
      .select('id, student_id, type, amount, reason, category, corrects_id, created_at, students(name), profiles(name)')
      .order('created_at', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
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
      category: row.category,
      corrects_id: row.corrects_id,
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

export async function createTalentTransaction(tx: {
  student_id: number;
  type: 'grant' | 'deduct';
  amount: number;
  reason: string;
  category?: string;
  corrects_id?: number;
}): Promise<ActionResponse<TalentTransactionRow>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && tx.type === 'deduct') {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', tx.student_id)
        .single();

      if (studentError) return handleSupabaseError(studentError);
      const currentBalance = (student as { total_talents: number | null } | null)?.total_talents ?? 0;
      if (tx.amount > currentBalance) {
        return { success: false, error: `보유 달란트(${currentBalance})보다 차감 수량이 많습니다.` };
      }
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const newTx = {
        id: Math.max(0, ...MOCK_TRANSACTIONS.map(t => t.id)) + 1,
        ...tx,
        category: tx.category ?? null,
        corrects_id: tx.corrects_id ?? null,
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

/**
 * 전체 학생의 달란트를 0으로 초기화합니다 (마스터 관리자 전용).
 * students.total_talents를 직접 덮어쓰지 않고, 현재 잔액을 상쇄하는
 * grant/deduct 트랜잭션을 생성해 DB 트리거가 자연스럽게 0으로 맞추도록 합니다.
 * 이렇게 하면 "초기화했다"는 사실 자체가 이력에 남아 감사(audit)가 가능합니다.
 */
export async function resetAllTalents(): Promise<ActionResponse<{ count: number }>> {
  if (!(await isMasterAdmin())) {
    return { success: false, error: '달란트 초기화는 마스터 관리자만 가능합니다.' };
  }

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: { count: 0 } };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, total_talents')
      .eq('is_active', true);

    if (studentsError) return handleSupabaseError(studentsError);

    const targets = ((students ?? []) as { id: number; total_talents: number | null }[])
      .filter(s => (s.total_talents ?? 0) !== 0);

    if (targets.length === 0) {
      return { success: true, data: { count: 0 } };
    }

    const rows = targets.map(s => ({
      student_id: s.id,
      type: (s.total_talents ?? 0) > 0 ? 'deduct' : 'grant',
      amount: Math.abs(s.total_talents ?? 0),
      reason: '전체 달란트 초기화',
      category: (s.total_talents ?? 0) > 0 ? 'use' : 'other',
      recorded_by: user?.id ?? null,
    }));

    const { error } = await supabase.from('talent_transactions').insert(rows as never);

    if (error) return handleSupabaseError(error);

    revalidatePath('/talent');
    revalidatePath('/dashboard');

    return { success: true, data: { count: targets.length } };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

/**
 * 달란트 부여 규정을 조회합니다. 규정 테이블을 읽지 못하면 기본 규정(2025)을 돌려줍니다.
 */
export async function getTalentRules(): Promise<ActionResponse<TalentRule[]>> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { success: true, data: DEFAULT_TALENT_RULES };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('talent_rules')
      .select('category, label, amount')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return { success: true, data: DEFAULT_TALENT_RULES };
    }

    return { success: true, data: data as TalentRule[] };
  } catch {
    return { success: true, data: DEFAULT_TALENT_RULES };
  }
}

/**
 * 규정 금액을 수정합니다 (마스터 관리자 전용, DB 정책으로도 강제).
 */
export async function updateTalentRule(category: RuleCategory, amount: number): Promise<ActionResponse<null>> {
  if (!(await isMasterAdmin())) {
    return { success: false, error: '달란트 규정은 마스터 관리자만 수정할 수 있습니다.' };
  }
  if (!RULE_CATEGORIES.includes(category)) {
    return { success: false, error: '알 수 없는 항목입니다.' };
  }
  if (!Number.isInteger(amount) || amount < 1 || amount > 1000) {
    return { success: false, error: '금액은 1~1000 사이의 정수여야 합니다.' };
  }

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: null };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('talent_rules')
      .update({ amount, updated_at: new Date().toISOString() } as never)
      .eq('category', category)
      .select();

    if (error) return handleSupabaseError(error);
    if (!data || data.length === 0) {
      return { success: false, error: '규정을 수정하지 못했습니다. 권한 또는 규정 테이블을 확인해주세요.' };
    }

    revalidatePath('/settings/talent-rules');
    revalidatePath('/talent');
    return { success: true, data: null };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export interface TalentGrantItem {
  category: RuleCategory | 'other';
  /** 기타 항목일 때만 사용합니다. 규정 항목은 서버가 규정 금액을 적용합니다. */
  amount?: number;
  /** 기타 항목의 사유 */
  memo?: string;
}

/**
 * 한 학생에게 여러 항목을 한 번에 부여합니다 (통장의 한 행).
 * 규정 항목(출석/암송/전도/성경책/생일)은 클라이언트가 보낸 금액이 아니라
 * 서버가 조회한 현재 규정 금액을 사용합니다.
 */
export async function grantTalentsBatch(
  studentId: number,
  items: TalentGrantItem[]
): Promise<ActionResponse<{ total: number }>> {
  if (items.length === 0) return { success: false, error: '부여할 항목을 선택해주세요.' };

  try {
    const rulesRes = await getTalentRules();
    const rules = new Map((rulesRes.data ?? DEFAULT_TALENT_RULES).map((r) => [r.category, r]));

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const rows: {
      student_id: number;
      type: 'grant';
      amount: number;
      reason: string;
      category: string;
      recorded_by: string | null;
    }[] = [];

    for (const item of items) {
      if (item.category === 'other') {
        const amount = item.amount ?? 0;
        if (!Number.isInteger(amount) || amount < 1 || amount > 1000) {
          return { success: false, error: '기타 항목의 수량은 1~1000 사이의 정수여야 합니다.' };
        }
        rows.push({
          student_id: studentId,
          type: 'grant',
          amount,
          reason: item.memo?.trim() ? item.memo.trim().slice(0, 100) : '기타',
          category: 'other',
          recorded_by: user?.id ?? null,
        });
        continue;
      }

      const rule = rules.get(item.category);
      if (!rule) return { success: false, error: '알 수 없는 항목입니다.' };
      rows.push({
        student_id: studentId,
        type: 'grant',
        amount: rule.amount,
        reason: rule.label,
        category: item.category,
        recorded_by: user?.id ?? null,
      });
    }

    const total = rows.reduce((sum, r) => sum + r.amount, 0);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: { total } };
    }

    const { error } = await supabase.from('talent_transactions').insert(rows as never);
    if (error) return handleSupabaseError(error);

    revalidatePath('/talent');
    revalidatePath('/dashboard');

    return { success: true, data: { total } };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

/**
 * 잘못 부여한 건을 정정합니다. 원본 이력을 지우지 않고 같은 항목의 마이너스 행을 추가해
 * 통장에 "−2" 줄이 남도록 합니다. 부여 건 하나당 한 번만 정정할 수 있습니다.
 */
export async function correctTalentTransaction(transactionId: number): Promise<ActionResponse<TalentTransactionRow>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: false, error: '개발용 목업 환경에서는 정정할 수 없습니다.' };
    }

    const supabase = await createClient();
    const { data: original, error } = await supabase
      .from('talent_transactions')
      .select('id, student_id, type, amount, reason, category, corrects_id')
      .eq('id', transactionId)
      .single();

    if (error) return handleSupabaseError(error);

    const tx = original as unknown as Pick<
      TalentTransactionRow,
      'id' | 'student_id' | 'type' | 'amount' | 'reason' | 'category' | 'corrects_id'
    > | null;
    if (!tx || tx.student_id == null) return { success: false, error: '정정할 이력을 찾지 못했습니다.' };
    if (tx.type !== 'grant' || tx.corrects_id != null) {
      return { success: false, error: '부여 이력만 정정할 수 있습니다.' };
    }

    const { data: existing, error: existingError } = await supabase
      .from('talent_transactions')
      .select('id')
      .eq('corrects_id', transactionId)
      .limit(1);

    if (existingError) return handleSupabaseError(existingError);
    if (existing && existing.length > 0) {
      return { success: false, error: '이미 정정된 이력입니다.' };
    }

    const res = await createTalentTransaction({
      student_id: tx.student_id,
      type: 'deduct',
      amount: tx.amount,
      reason: `정정: ${tx.reason}`,
      category: tx.category ?? 'other',
      corrects_id: tx.id,
    });

    if (!res.success && res.error && res.error.includes('보유 달란트')) {
      return { success: false, error: '이미 사용해서 잔액이 부족해 정정할 수 없습니다.' };
    }
    return res;
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
