import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * 서비스 롤 키를 사용하는 관리자 전용 Supabase 클라이언트.
 * - Auth 사용자 삭제 등 RLS/일반 세션으로는 불가능한 관리자 작업에만 사용합니다.
 * - 절대 클라이언트(브라우저)에 노출되면 안 되며, 'use server' 액션 내부에서만 사용하세요.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key-here') {
    return null;
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
