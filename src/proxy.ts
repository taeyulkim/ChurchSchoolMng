import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Next.js Proxy
 * - 모든 요청에서 Supabase 세션을 갱신
 * - 인증 상태에 따라 라우트를 보호
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청에 프록시 적용:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (파비콘)
     * - manifest.json / sw.js (PWA 설치 및 서비스워커, 로그인 여부와 무관하게 접근 가능해야 함)
     * - public 폴더의 정적 리소스
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
