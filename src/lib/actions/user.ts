'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';
import { Database } from '@/lib/supabase/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type Permissions = { [key: string]: boolean };

export async function getProfiles(): Promise<ActionResponse<ProfileRow[]>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // Mock Data
      return {
        success: true,
        data: [
          {
            id: 'mock-1',
            name: '김관리',
            role: 'admin',
            department: '청년부',
            status: 'approved',
            permissions: { attendance: true, talent: true, budget: true, items: true, schedule: true, users: true },
            created_at: new Date().toISOString()
          },
          {
            id: 'mock-2',
            name: '이교사',
            role: 'teacher',
            department: '어린이부',
            status: 'pending',
            permissions: { attendance: false, talent: false, budget: false, items: false, schedule: false },
            created_at: new Date().toISOString()
          }
        ] as any
      };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return handleSupabaseError(error);

    return {
      success: true,
      data: data as ProfileRow[],
    };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function updateProfile(id: string, updates: Partial<ProfileRow>): Promise<ActionResponse<ProfileRow>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      revalidatePath('/settings/users');
      return { success: true, data: { id, ...updates } as any };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();

    if (error) return handleSupabaseError(error);

    revalidatePath('/settings/users');
    return { success: true, data: data as ProfileRow };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function getCurrentProfile(): Promise<ActionResponse<ProfileRow>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return {
        success: true,
        data: {
          id: 'mock-1',
          name: '김관리',
          role: 'admin',
          department: '청년부',
          status: 'approved',
          permissions: { attendance: true, talent: true, budget: true, items: true, schedule: true, users: true },
          created_at: new Date().toISOString()
        } as any
      };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: '인증되지 않은 사용자입니다.' };

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) return handleSupabaseError(error);
    if (!data) return { success: false, error: '프로필 정보가 없습니다.' };

    return { success: true, data: data as ProfileRow };
  } catch (err) {
    return handleSupabaseError(err);
  }
}
