'use client';

import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Plus, Search, MapPin, Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';

// Mock Data
const MOCK_EVENTS = [
  { id: 1, title: '여름 성경 학교', date: addDays(new Date(), 5), location: '본당', type: 'special' },
  { id: 2, title: '교사 기도회', date: addDays(new Date(), 2), location: '소예배실', type: 'meeting' },
  { id: 3, title: '중등부 야외 예배', date: addDays(new Date(), 12), location: '한강공원', type: 'worship' },
  { id: 4, title: '성탄절 발표회 연습', date: addDays(new Date(), 20), location: '유년부실', type: 'special' },
];

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = MOCK_EVENTS.filter(event => 
    event.title.includes(searchQuery) || event.location.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">일정 관리</h1>
          <p className="text-sm text-muted-foreground">교회 학교의 주요 행사 및 일정을 관리합니다.</p>
        </div>
        <Button className="w-full sm:w-auto shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          새 일정 등록
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 사이드바 달력 */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="bg-card border rounded-xl shadow-sm p-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="w-full mx-auto"
              locale={ko}
            />
          </div>
        </div>

        {/* 메인 리스트 영역 */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="일정 검색..."
              className="pl-9 bg-card shadow-sm border-transparent focus-visible:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {filteredEvents.map(event => (
              <div 
                key={event.id} 
                className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-lg p-3 flex flex-col items-center justify-center min-w-[3.5rem]">
                    <span className="text-xs font-semibold text-primary">{format(event.date, 'MMM', { locale: ko })}</span>
                    <span className="text-xl font-bold text-primary leading-none mt-1">{format(event.date, 'd')}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        오전 10:00
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Badge variant="outline" className={cn(
                    "text-xs bg-muted/50",
                    event.type === 'special' && "border-rose-200 text-rose-700 bg-rose-50",
                    event.type === 'meeting' && "border-indigo-200 text-indigo-700 bg-indigo-50",
                    event.type === 'worship' && "border-emerald-200 text-emerald-700 bg-emerald-50",
                  )}>
                    {event.type === 'special' ? '특별 행사' : event.type === 'meeting' ? '회의' : '예배'}
                  </Badge>
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                    상세 보기
                  </Button>
                </div>
              </div>
            ))}

            {filteredEvents.length === 0 && (
              <div className="text-center py-12 bg-card border rounded-xl shadow-sm text-muted-foreground">
                <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>일정이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
