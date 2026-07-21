import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { BottomNav } from '@/components/layout/bottom-nav';

/**
 * 대시보드 레이아웃
 * - 인증된 사용자만 접근 가능한 영역
 * - 데스크톱: Header + Sidebar + Content
 * - 모바일: Header + Content + BottomNav
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 상단 헤더 */}
      <Header />

      <div className="flex flex-1">
        {/* 사이드바 (데스크톱 전용) */}
        <Sidebar />

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl px-4 py-6 md:px-6 lg:px-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* 하단 네비게이션 (모바일 전용) */}
      <BottomNav />
    </div>
  );
}
