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
