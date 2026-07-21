import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * 브라우저(클라이언트) 환경용 Supabase 클라이언트
 * - React 컴포넌트, 클라이언트 훅에서 사용
 * - 자동으로 세션을 쿠키에 저장/복원
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
