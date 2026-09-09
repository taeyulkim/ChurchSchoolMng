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

  // 비활성화/거절된 계정은 세션이 남아있어도 즉시 로그아웃시킵니다.
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .maybeSingle() as { data: { status: string | null } | null };

    if (profile?.status === 'deactivated' || profile?.status === 'rejected') {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'deactivated');
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }
  }

  // 인증이 필요한 경로 보호
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup') || request.nextUrl.pathname.startsWith('/qr-login');
  const isCallbackPage = request.nextUrl.pathname.startsWith('/callback');
  const isPublicPage = request.nextUrl.pathname === '/';
  const isQrPage = request.nextUrl.pathname.startsWith('/qr');
  const isStudentPage = request.nextUrl.pathname.startsWith('/my');

  const studentToken = request.cookies.get('student_token')?.value;

  // 학생 페이지 접근 (학생 토큰이 없으면 로그인으로)
  if (isStudentPage) {
    if (!studentToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // 로그인하지 않은 사용자가 보호된 교사 전용 페이지에 접근하면 로그인 페이지로 리다이렉트
  if (!user && !isAuthPage && !isCallbackPage && !isPublicPage && !isQrPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 이미 로그인된 교사가 인증 페이지(login/signup)에 접근하면 대시보드로 리다이렉트
  if (user && isAuthPage) {
    if (request.nextUrl.searchParams.get('error') === 'no_profile') {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
