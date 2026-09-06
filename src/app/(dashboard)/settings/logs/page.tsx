'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Loader2, ScrollText, Search, ShieldAlert, CalendarSearch, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getActivityLog, type RecentActivity, type ActivityCategory } from '@/lib/actions/activity';
import { isMasterAdmin } from '@/lib/actions/user';

const CATEGORY_LABEL: Record<ActivityCategory, string> = {
  attendance: '출석',
  talent: '달란트',
  budget: '예산',
  student: '학생 등록',
};

const CATEGORY_BADGE_CLASS: Record<ActivityCategory, string> = {
  attendance: 'border-emerald-200 text-emerald-700 bg-emerald-50',
  talent: 'border-amber-200 text-amber-700 bg-amber-50',
  budget: 'border-violet-200 text-violet-700 bg-violet-50',
  student: 'border-indigo-200 text-indigo-700 bg-indigo-50',
};

const DEFAULT_LOG_LIMIT = 200;

export default function LogsPage() {
  const [logs, setLogs] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMaster, setIsMaster] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategory | 'all'>('all');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedRange, setAppliedRange] = useState<{ startDate?: string; endDate?: string }>({});

  const fetchLogs = async (range: { startDate?: string; endDate?: string } = {}) => {
    setIsLoading(true);
    const logsRes = await getActivityLog({
      startDate: range.startDate ? `${range.startDate}T00:00:00` : undefined,
      endDate: range.endDate ? `${range.endDate}T23:59:59.999` : undefined,
    });
    setLogs(logsRes);
    setIsLoading(false);
  };

  useEffect(() => {
    async function init() {
      const masterCheck = await isMasterAdmin();
      setIsMaster(masterCheck);
      await fetchLogs();
    }
    init();
  }, []);

  const handleSearchByDate = () => {
    const range = { startDate: startDate || undefined, endDate: endDate || undefined };
    setAppliedRange(range);
    fetchLogs(range);
  };

  const handleResetDate = () => {
    setStartDate('');
    setEndDate('');
    setAppliedRange({});
    fetchLogs();
  };

  const isDateFiltered = !!(appliedRange.startDate || appliedRange.endDate);

  const filteredLogs = logs.filter((log) => {
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesSearch = log.actor.includes(searchQuery) || log.action.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  if (!isLoading && !isMaster) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="bg-amber-50 text-amber-600 p-6 rounded-full">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold">접근 권한이 없습니다</h1>
        <p className="text-muted-foreground text-sm">로그 관리는 마스터 관리자만 조회할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">로그 관리</h1>
        <p className="text-sm text-muted-foreground">
          출석/달란트/예산/학생 등록 등 전체 활동 이력을 최신순으로 조회합니다.
          데이터는 기간 제한 없이 계속 보관되며, 아래 표시 개수는 화면에 한 번에 불러오는 양일 뿐입니다.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름 또는 내용으로 검색..."
            className="pl-9 bg-card shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={(val) => val && setCategoryFilter(val as ActivityCategory | 'all')}>
          <SelectTrigger className="w-full sm:w-[160px] bg-card shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="attendance">출석</SelectItem>
            <SelectItem value="talent">달란트</SelectItem>
            <SelectItem value="budget">예산</SelectItem>
            <SelectItem value="student">학생 등록</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 bg-card p-3 rounded-xl border shadow-sm">
        <div className="space-y-1.5 flex-1">
          <Label htmlFor="start-date" className="text-xs text-muted-foreground">시작일</Label>
          <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1.5 flex-1">
          <Label htmlFor="end-date" className="text-xs text-muted-foreground">종료일</Label>
          <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSearchByDate} disabled={isLoading}>
            <CalendarSearch className="mr-2 h-4 w-4" />
            기간 조회
          </Button>
          {isDateFiltered && (
            <Button variant="ghost" onClick={handleResetDate} disabled={isLoading}>
              <X className="mr-2 h-4 w-4" />
              초기화
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="divide-y">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{log.actor}</span>
                    <span className="text-muted-foreground">님이 </span>
                    <span className="font-medium">{log.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(log.createdAt), 'yyyy.MM.dd HH:mm:ss', { locale: ko })}
                  </p>
                </div>
                <Badge variant="outline" className={`text-xs shrink-0 ${CATEGORY_BADGE_CLASS[log.category]}`}>
                  {CATEGORY_LABEL[log.category]}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>표시할 로그가 없습니다.</p>
          </div>
        )}
      </div>

      {!isLoading && logs.length >= (isDateFiltered ? 1000 : DEFAULT_LOG_LIMIT) && (
        <p className="text-xs text-muted-foreground text-center">
          {isDateFiltered
            ? '조회 결과가 많아 일부만 표시됩니다. 기간을 좁혀서 다시 조회해보세요.'
            : `최근 ${DEFAULT_LOG_LIMIT}건만 표시됩니다. 그 이전 기록은 기간 조회로 확인할 수 있습니다.`}
        </p>
      )}
    </div>
  );
}
