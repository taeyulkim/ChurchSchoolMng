import Link from 'next/link';
import {
  Users,
  ClipboardCheck,
  Coins,
  TrendingUp,
  CalendarDays,
  ArrowUpRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getStudentCount } from '@/lib/actions/student';
import { getTodayAttendanceByDepartment } from '@/lib/actions/attendance';
import { getWeeklyTalentSum } from '@/lib/actions/talent';
import { getScheduleItems } from '@/lib/actions/schedule';
import { getCurrentProfile } from '@/lib/actions/user';
import { getRecentActivities } from '@/lib/actions/activity';
import { format, parseISO, formatDistanceToNow, endOfMonth, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getKstNow } from '@/lib/date-kst';

/**
 * 대시보드 메인 페이지
 * - 역할에 따른 통계 위젯 카드
 * - 오늘 부서별 출석 현황, 최근 활동
 */
export default async function DashboardPage() {
  const [studentCount, departmentAttendance, weeklyTalent, profileRes, recentActivities] = await Promise.all([
    getStudentCount(),
    getTodayAttendanceByDepartment(),
    getWeeklyTalentSum(),
    getCurrentProfile(),
    getRecentActivities(),
  ]);

  const totalStudents = departmentAttendance.reduce((sum, d) => sum + d.total, 0);
  const totalPresent = departmentAttendance.reduce((sum, d) => sum + d.present, 0);
  const overallAttendanceRate = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

  const myDepartment = profileRes.success ? profileRes.data?.department : null;
  const scheduleRes = await getScheduleItems(myDepartment);

  // 서버가 UTC로 실행되어도(예: Vercel) 한국 날짜 기준 오늘/이번 달 경계를 사용합니다.
  const now = getKstNow();
  const todayStart = startOfDay(now);
  const monthEnd = endOfMonth(now);
  const upcomingEvents = scheduleRes.success && scheduleRes.data
    ? scheduleRes.data
        .filter(e => {
          const d = new Date(e.event_date);
          return d >= todayStart && d <= monthEnd;
        })
        .slice(0, 5)
    : [];

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 총 학생 수 */}
        <div className="group relative rounded-2xl border bg-card p-5 shadow-sm card-hover overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                총 학생 수
              </p>
              <p className="text-3xl font-bold tracking-tight">{studentCount}</p>
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

        {/* 오늘 출석률 */}
        <div className="group relative rounded-2xl border bg-card p-5 shadow-sm card-hover overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                오늘 출석률
              </p>
              <p className="text-3xl font-bold tracking-tight">{overallAttendanceRate}<span className="text-lg text-muted-foreground">%</span></p>
              <div className="flex items-center gap-1 text-xs">
                <Badge variant="secondary" className="gap-0.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-0">
                  <ClipboardCheck className="h-3 w-3" />
                  {totalPresent}/{totalStudents}명
                </Badge>
                <span className="text-muted-foreground">전체 학생 대비</span>
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
              <p className="text-3xl font-bold tracking-tight">{weeklyTalent.toLocaleString()}</p>
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
      </div>

      {/* 오늘 부서별 출석 현황 */}
      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            오늘 부서별 출석 현황
          </h2>
          <Link href="/attendance" className="text-xs text-primary hover:underline flex items-center gap-0.5 font-medium">
            출석 체크하러 가기
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {departmentAttendance.map((dept) => (
            <div key={dept.department} className="rounded-xl border p-4 space-y-2">
              <p className="text-sm font-medium">{dept.department}</p>
              <p className="text-2xl font-bold tracking-tight">
                {dept.rate}<span className="text-sm text-muted-foreground">%</span>
              </p>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${dept.rate}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{dept.present} / {dept.total}명 출석</p>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 패널 (이달의 일정 + 최근 활동) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 이달의 일정 */}
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              이달의 일정
            </h2>
            <Link href="/schedule" className="text-xs text-primary hover:underline flex items-center gap-0.5 font-medium">
              전체 보기
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {upcomingEvents.length > 0 ? upcomingEvents.map((event, idx) => {
              const eventDate = parseISO(event.event_date);
              const color = idx % 3 === 0 ? 'bg-primary' : idx % 3 === 1 ? 'bg-emerald-500' : 'bg-amber-500';
              return (
                <div
                  key={event.id}
                  className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${color} text-white text-xs font-bold shrink-0`}
                  >
                    {format(eventDate, 'eee', { locale: ko })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{format(eventDate, 'MM.dd')}</p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground py-4 text-center">예정된 일정이 없습니다.</p>
            )}
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
            {recentActivities.length > 0 ? recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                  {activity.actor.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.actor}</span>
                    <span className="text-muted-foreground">님이 </span>
                    <span className="font-medium">{activity.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: ko })}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground py-4 text-center">최근 활동 내역이 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
