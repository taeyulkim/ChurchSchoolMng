'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';
import { Database } from '@/lib/supabase/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type Permissions = { [key: string]: boolean };

const MASTER_ADMIN_EMAIL = 'mykty276@gmail.com';

/**
 * 현재 로그인한 계정이 마스터 관리자(김태율)인지 확인합니다.
 * 승인 상태/권한/역할 변경 UI는 이 값으로만 노출 여부를 결정하고,
 * 실제 강제는 profiles 테이블의 DB 트리거가 담당합니다.
 */
export async function isMasterAdmin(): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return true;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email === MASTER_ADMIN_EMAIL;
  } catch {
    return false;
  }
}

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

/**
 * 교사 승인 상태 / 메뉴 권한 변경 (마스터 관리자 전용).
 * DB 트리거로도 동일하게 강제되지만, 여기서 먼저 체크해 더 친절한 에러 메시지를 줍니다.
 */
export async function updateTeacherAccess(
  id: string,
  updates: { status?: ProfileRow['status']; permissions?: Permissions }
): Promise<ActionResponse<ProfileRow>> {
  if (!(await isMasterAdmin())) {
    return { success: false, error: '승인 상태/권한 변경은 마스터 관리자만 가능합니다.' };
  }

  return updateProfile(id, updates as Partial<ProfileRow>);
}

/**
 * 교사 계정을 완전히 삭제합니다 (마스터 관리자 전용).
 * Supabase Auth 계정 자체를 삭제하며, profiles 행은 ON DELETE CASCADE로 함께 삭제됩니다.
 * 그 교사가 기록한 출석/달란트/예산 이력은 남고 "기록자"만 비워집니다(ON DELETE SET NULL).
 */
export async function deleteTeacherAccount(id: string): Promise<ActionResponse<null>> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    revalidatePath('/settings/users');
    return { success: true, data: null };
  }

  if (!(await isMasterAdmin())) {
    return { success: false, error: '계정 삭제는 마스터 관리자만 가능합니다.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === id) {
    return { success: false, error: '본인(마스터 관리자) 계정은 삭제할 수 없습니다.' };
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY가 설정되지 않아 계정을 삭제할 수 없습니다.' };
  }

  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) return handleSupabaseError(error);

  revalidatePath('/settings/users');
  return { success: true, data: null };
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
