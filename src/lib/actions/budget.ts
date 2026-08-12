'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';
import { Database } from '@/lib/supabase/database.types';

type BudgetRow = Database['public']['Tables']['budget_transactions']['Row'];
type BudgetInsert = Database['public']['Tables']['budget_transactions']['Insert'];

let MOCK_BUDGETS: BudgetRow[] = [
  { id: 1, transaction_date: '2026-07-15', category: '행사비', description: '여름 성경 학교 간식', type: 'expense', amount: 150000, department: '어린이부', created_at: new Date().toISOString(), recorded_by: null },
  { id: 2, transaction_date: '2026-07-10', category: '헌금', description: '주일 헌금', type: 'income', amount: 320000, department: '어린이부', created_at: new Date().toISOString(), recorded_by: null },
  { id: 3, transaction_date: '2026-07-05', category: '비품비', description: '복사 용지 구매', type: 'expense', amount: 18000, department: '청소년부', created_at: new Date().toISOString(), recorded_by: null },
  { id: 4, transaction_date: '2026-07-01', category: '이월금', description: '전월 이월', type: 'income', amount: 1250000, department: '어린이부', created_at: new Date().toISOString(), recorded_by: null },
];

export async function getBudgetTransactions(): Promise<ActionResponse<BudgetRow[]>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: [...MOCK_BUDGETS] };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('budget_transactions')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (error) return handleSupabaseError(error);

    return { success: true, data };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function createBudgetTransaction(tx: BudgetInsert): Promise<ActionResponse<BudgetRow>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const newTx: BudgetRow = {
        id: Math.max(0, ...MOCK_BUDGETS.map(t => t.id)) + 1,
        ...tx,
        recorded_by: user?.id || null,
        created_at: new Date().toISOString(),
      } as any;
      MOCK_BUDGETS.push(newTx);
      revalidatePath('/budget');
      revalidatePath('/dashboard');
      return { success: true, data: newTx };
    }

    const { data, error } = await supabase
      .from('budget_transactions')
      .insert({
        ...tx,
        recorded_by: user?.id || null
      } as any)
      .select()
      .single();

    if (error) return handleSupabaseError(error);

    revalidatePath('/budget');
    revalidatePath('/dashboard');

    return { success: true, data };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function getMonthlyBudgetSummary(): Promise<{ totalBudget: number; spentPercentage: number }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyTxs = MOCK_BUDGETS.filter(b => b.transaction_date.startsWith(thisMonth));
    const income = monthlyTxs.filter(b => b.type === 'income').reduce((sum, b) => sum + b.amount, 0) || 1250000;
    const expense = monthlyTxs.filter(b => b.type === 'expense').reduce((sum, b) => sum + b.amount, 0) || 168000;
    const spentPercentage = income > 0 ? Math.round((expense / income) * 100) : 0;
    return { totalBudget: income, spentPercentage: spentPercentage || 62 };
  }

  try {
    const supabase = await createClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('budget_transactions')
      .select('type, amount')
      .gte('transaction_date', startOfMonth)
      .lte('transaction_date', endOfMonth);

    if (error) return { totalBudget: 0, spentPercentage: 0 };

    let income = 0;
    let expense = 0;

    (data as BudgetRow[]).forEach(tx => {
      if (tx.type === 'income') income += tx.amount;
      if (tx.type === 'expense') expense += tx.amount;
    });

    const spentPercentage = income > 0 ? Math.round((expense / income) * 100) : 0;

    return {
      totalBudget: income,
      spentPercentage
    };
  } catch (error) {
    console.error(error);
    return { totalBudget: 0, spentPercentage: 0 };
  }
}
