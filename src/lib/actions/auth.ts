'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';

export async function signInWithPassword(email: string, password: string): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const supabase = await createClient();
    
    // DB 연결이 안되어있는 환경(Mock)을 위한 방어 코드
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: { success: true } }; // Mock login success
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return handleSupabaseError(error);
    }

    if (authData.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', authData.user.id)
        .maybeSingle() as { data: { status: string | null } | null };
      
      if (!profile) {
        await supabase.auth.signOut();
        return { success: false, error: '프로필 정보가 누락되었습니다. 관리자에게 문의하세요.' };
      }

      if (profile.status === 'pending') {
        await supabase.auth.signOut();
        return { success: false, error: '관리자 승인 대기 중입니다.' };
      }
      
      if (profile.status === 'rejected') {
        await supabase.auth.signOut();
        return { success: false, error: '가입이 거절되었습니다.' };
      }

      if (profile.status === 'deactivated') {
        await supabase.auth.signOut();
        return { success: false, error: '비활성화된 계정입니다. 관리자에게 문의하세요.' };
      }
    }

    return { success: true, data: { success: true } };
  } catch (error) {
    return handleSupabaseError(error);
  }
}

export async function signUpWithPassword(email: string, password: string, name: string, department: string): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const supabase = await createClient();
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: { success: true } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          department,
        }
      }
    });

    if (error) return handleSupabaseError(error);

    return { success: true, data: { success: true } };
  } catch (error) {
    return handleSupabaseError(error);
  }
}

export async function updateAuthUser(password: string): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const supabase = await createClient();
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: { success: true } };
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return handleSupabaseError(error);
    return { success: true, data: { success: true } };
  } catch (error) {
    return handleSupabaseError(error);
  }
}

export async function signOutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    }
  } catch (error) {
    console.error('Logout exception:', error);
  }

  redirect('/login');
}
