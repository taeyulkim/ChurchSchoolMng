import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getStudentByToken } from '@/lib/actions/student';
import { getTalentTransactions } from '@/lib/actions/talent';
import { getEvents } from '@/lib/actions/event';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, CalendarDays, History } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default async function StudentMyPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('student_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const res = await getStudentByToken(token);
  if (!res.success || !res.data) {
    redirect('/login');
  }
  const student = res.data;

  // 병렬로 데이터 로드
  const [talentRes, eventsRes] = await Promise.all([
    getTalentTransactions(),
    getEvents()
  ]);

  const talents = talentRes.success ? (talentRes.data || []).filter(t => t.student_id === student.id).slice(0, 5) : [];
  
  // 금주 일정 3개
  const today = new Date();
  const events = eventsRes.success ? (eventsRes.data || [])
    .filter(e => new Date(e.event_date) >= today)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 3) : [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 웰컴 섹션 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-primary/5 p-6 rounded-2xl border border-primary/10">
        <div>
          <Badge className="mb-2 bg-primary/20 text-primary hover:bg-primary/30 border-0">
            {student.department}
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold">
            환영합니다, <span className="text-primary">{student.name}</span> 학생! 👋
          </h1>
          <p className="text-muted-foreground mt-1">오늘도 즐거운 교회학교 되세요!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 달란트 현황 */}
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg text-primary">
              <Coins className="mr-2 h-5 w-5" />
              나의 달란트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-foreground tracking-tight">
              {student.total_talents?.toLocaleString()} <span className="text-2xl font-semibold text-muted-foreground">달란트</span>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3 flex items-center text-muted-foreground">
                <History className="mr-2 h-4 w-4" /> 최근 달란트 내역
              </h4>
              <div className="space-y-3">
                {talents.length > 0 ? talents.map((t) => (
                  <div key={t.id} className="flex justify-between items-center text-sm p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-700">{t.reason}</span>
                    <span className={t.type === 'grant' ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                      {t.type === 'grant' ? '+' : '-'}{t.amount}
                    </span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">최근 내역이 없습니다.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 금주 일정 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg text-primary">
              <CalendarDays className="mr-2 h-5 w-5" />
              다가오는 일정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {events.length > 0 ? events.map(event => (
                <div key={event.id} className="flex gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex flex-col items-center justify-center min-w-14 h-14 bg-white rounded-lg border shadow-sm">
                    <span className="text-xs font-semibold text-red-500">
                      {format(new Date(event.event_date), 'MMM', { locale: ko })}
                    </span>
                    <span className="text-lg font-bold text-slate-700 leading-none">
                      {format(new Date(event.event_date), 'dd')}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="font-semibold text-slate-800">{event.title}</h4>
                    {event.location && (
                      <span className="text-xs text-muted-foreground mt-0.5">{event.location}</span>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  예정된 일정이 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
