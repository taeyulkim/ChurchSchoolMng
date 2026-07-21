/**
 * 대시보드 레이아웃 (Placeholder)
 * - 인증된 사용자만 접근 가능한 영역
 * - 공통 사이드바/헤더/하단 네비게이션을 감싸는 레이아웃
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* TODO: Header 컴포넌트 */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <span className="font-bold text-lg">교회학교</span>
        </div>
      </header>

      <div className="flex flex-1">
        {/* TODO: Sidebar 컴포넌트 (데스크톱) */}
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* TODO: BottomNav 컴포넌트 (모바일) */}
    </div>
  );
}
