'use client';

import { useState, useEffect } from 'react';
import { format, isSameWeek, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Plus, Search, MapPin, Clock, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EventForm } from '@/components/schedule/event-form';
import { getEvents } from '@/lib/actions/event';
import { Database } from '@/lib/supabase/database.types';

type EventRow = Database['public']['Tables']['events']['Row'];

const EVENT_TYPE_LABEL: Record<string, string> = {
  special: '특별 행사',
  meeting: '회의',
  worship: '예배',
};

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailEvent, setDetailEvent] = useState<EventRow | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    const res = await getEvents();
    if (res.success && res.data) {
      setEvents(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.includes(searchQuery) || (event.location ?? '').includes(searchQuery);
    const matchesDate = date ? isSameWeek(parseISO(event.event_date), date, { weekStartsOn: 0 }) : true;
    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">일정 관리</h1>
          <p className="text-sm text-muted-foreground">교회 학교의 주요 행사 및 일정을 관리합니다.</p>
        </div>
        <Button className="w-full sm:w-auto shadow-sm" onClick={() => setIsAddOpen(true)}>
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
            {isLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && filteredEvents.map(event => {
              const eventDate = parseISO(event.event_date);
              return (
              <div
                key={event.id}
                className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-lg p-3 flex flex-col items-center justify-center min-w-[3.5rem]">
                    <span className="text-xs font-semibold text-primary">{format(eventDate, 'MMM', { locale: ko })}</span>
                    <span className="text-xl font-bold text-primary leading-none mt-1">{format(eventDate, 'd')}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location || '장소 미정'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {format(eventDate, 'a h:mm', { locale: ko })}
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
                    {EVENT_TYPE_LABEL[event.type] ?? event.type}
                  </Badge>
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => setDetailEvent(event)}>
                    상세 보기
                  </Button>
                </div>
              </div>
              );
            })}

            {!isLoading && filteredEvents.length === 0 && (
              <div className="text-center py-12 bg-card border rounded-xl shadow-sm text-muted-foreground">
                <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>일정이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>새 일정 등록</DialogTitle>
            <DialogDescription>
              교회 학교의 새로운 일정이나 행사를 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <EventForm
            onSuccess={() => {
              setIsAddOpen(false);
              fetchEvents();
            }}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailEvent} onOpenChange={(open) => !open && setDetailEvent(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{detailEvent?.title}</DialogTitle>
            <DialogDescription>일정 상세 정보</DialogDescription>
          </DialogHeader>
          {detailEvent && (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn(
                  "text-xs bg-muted/50",
                  detailEvent.type === 'special' && "border-rose-200 text-rose-700 bg-rose-50",
                  detailEvent.type === 'meeting' && "border-indigo-200 text-indigo-700 bg-indigo-50",
                  detailEvent.type === 'worship' && "border-emerald-200 text-emerald-700 bg-emerald-50",
                )}>
                  {EVENT_TYPE_LABEL[detailEvent.type] ?? detailEvent.type}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                {format(parseISO(detailEvent.event_date), 'PPP (eee) a h:mm', { locale: ko })}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {detailEvent.location || '장소 미정'}
              </div>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setDetailEvent(null)}>닫기</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
