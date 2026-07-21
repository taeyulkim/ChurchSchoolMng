/**
 * 대시보드 메인 페이지 (Placeholder)
 * - 사용자 역할에 따른 대시보드 위젯 표시
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          교회학교 관리 시스템에 오신 것을 환영합니다.
        </p>
      </div>

      {/* TODO: 역할별 대시보드 위젯 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">총 학생 수</h3>
          <p className="text-2xl font-bold">-</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">금주 출석률</h3>
          <p className="text-2xl font-bold">-</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">달란트 발급 현황</h3>
          <p className="text-2xl font-bold">-</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">이번 달 예산</h3>
          <p className="text-2xl font-bold">-</p>
        </div>
      </div>
    </div>
  );
}
