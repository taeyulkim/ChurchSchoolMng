import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

/**
 * 서버(Server Component / Server Action / Route Handler) 환경용 Supabase 클라이언트
 * - Server Components, Server Actions, API Route에서 사용
 * - 쿠키를 통해 사용자 세션을 읽고 갱신
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서는 쿠키 설정이 불가능하므로 무시
            // Middleware나 Server Action에서는 정상 작동
          }
        },
      },
    }
  );
}
