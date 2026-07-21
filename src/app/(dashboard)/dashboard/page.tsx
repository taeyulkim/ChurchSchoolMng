import {
  Users,
  ClipboardCheck,
  Coins,
  Receipt,
  TrendingUp,
  CalendarDays,
  ArrowUpRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * 대시보드 메인 페이지
 * - 역할에 따른 통계 위젯 카드
 * - 금주 요약, 최근 활동
 */
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* 환영 메시지 */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          안녕하세요, <span className="text-gradient">관리자</span>님 👋
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          이번 주 교회학교 현황을 확인하세요.
        </p>
      </div>

      {/* 통계 카드 그리드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 총 학생 수 */}
        <div className="group relative rounded-2xl border bg-card p-5 shadow-sm card-hover overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                총 학생 수
              </p>
              <p className="text-3xl font-bold tracking-tight">128</p>
              <div className="flex items-center gap-1 text-xs">
                <Badge variant="secondary" className="gap-0.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-0">
                  <TrendingUp className="h-3 w-3" />
                  +5
                </Badge>
                <span className="text-muted-foreground">이번 달</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* 금주 출석률 */}
        <div className="group relative rounded-2xl border bg-card p-5 shadow-sm card-hover overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                금주 출석률
              </p>
              <p className="text-3xl font-bold tracking-tight">87<span className="text-lg text-muted-foreground">%</span></p>
              <div className="flex items-center gap-1 text-xs">
                <Badge variant="secondary" className="gap-0.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-0">
                  <TrendingUp className="h-3 w-3" />
                  +3%
                </Badge>
                <span className="text-muted-foreground">전주 대비</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ClipboardCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* 달란트 발급 현황 */}
        <div className="group relative rounded-2xl border bg-card p-5 shadow-sm card-hover overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                달란트 발급
              </p>
              <p className="text-3xl font-bold tracking-tight">2,450</p>
              <div className="flex items-center gap-1 text-xs">
                <Badge variant="secondary" className="gap-0.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-0">
                  <Coins className="h-3 w-3" />
                  금주
                </Badge>
                <span className="text-muted-foreground">총 발급량</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Coins className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* 이번 달 예산 */}
        <div className="group relative rounded-2xl border bg-card p-5 shadow-sm card-hover overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                이번 달 예산
              </p>
              <p className="text-3xl font-bold tracking-tight">85<span className="text-lg text-muted-foreground">만원</span></p>
              <div className="flex items-center gap-1 text-xs">
                <Badge variant="secondary" className="gap-0.5 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950 border-0">
                  <Receipt className="h-3 w-3" />
                  62%
                </Badge>
                <span className="text-muted-foreground">집행률</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 하단 패널 (금주 일정 + 최근 활동) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 금주 일정 */}
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              금주 일정
            </h2>
            <button className="text-xs text-primary hover:underline flex items-center gap-0.5 font-medium">
              전체 보기
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {[
              { day: '일', title: '주일 예배 및 출석 체크', time: '09:00 - 12:00', color: 'bg-primary' },
              { day: '수', title: '수요 성경 공부', time: '19:00 - 20:30', color: 'bg-emerald-500' },
              { day: '토', title: '달란트 마켓 행사', time: '14:00 - 16:00', color: 'bg-amber-500' },
            ].map((event) => (
              <div
                key={event.title}
                className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${event.color} text-white text-xs font-bold shrink-0`}
                >
                  {event.day}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              최근 활동
            </h2>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {[
              { user: '김교사', action: '초등부 출석 체크 완료', time: '10분 전', avatar: '김' },
              { user: '이교사', action: '달란트 15개 부여 (암송)', time: '25분 전', avatar: '이' },
              { user: '박부장', action: '7월 예산 등록', time: '1시간 전', avatar: '박' },
              { user: '최교사', action: '학생 2명 신규 등록', time: '2시간 전', avatar: '최' },
            ].map((activity) => (
              <div
                key={activity.time}
                className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                  {activity.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>
                    <span className="text-muted-foreground">님이 </span>
                    <span className="font-medium">{activity.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
