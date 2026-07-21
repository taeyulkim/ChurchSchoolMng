import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

/**
 * Middleware용 Supabase 클라이언트 & 세션 갱신
 * - 요청마다 세션 토큰을 갱신하여 자동 로그아웃 방지
 * - 인증 상태에 따른 라우트 보호
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 (중요: getUser()를 사용해야 토큰이 갱신됨)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 인증이 필요한 경로 보호
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isCallbackPage = request.nextUrl.pathname.startsWith('/callback');
  const isPublicPage = request.nextUrl.pathname === '/';

  // 로그인하지 않은 사용자가 보호된 페이지에 접근하면 로그인 페이지로 리다이렉트
  if (!user && !isAuthPage && !isCallbackPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 이미 로그인된 사용자가 로그인 페이지에 접근하면 대시보드로 리다이렉트
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
