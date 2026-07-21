'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Save, Loader2, CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

// Mock Data
const MOCK_ATTENDANCE_LIST = [
  { id: 1, name: '홍길동', department: '초등부', school: '새소망초등학교', grade: '3학년' },
  { id: 2, name: '이순신', department: '초등부', school: '새소망초등학교', grade: '5학년' },
  { id: 3, name: '유관순', department: '초등부', school: '새소망초등학교', grade: '5학년' },
  { id: 4, name: '안중근', department: '초등부', school: '새소망초등학교', grade: '1학년' },
];

export default function AttendancePage() {
  const [date, setDate] = useState<Date>(new Date());
  const [department, setDepartment] = useState('초등부');
  const [attendance, setAttendance] = useState<Record<number, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (studentId: number) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: 실제 Supabase API 호출
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const presentCount = Object.values(attendance).filter(Boolean).length;
      toast.success(`${format(date, 'M월 d일')} 출석이 저장되었습니다. (출석: ${presentCount}명)`);
    } catch (error) {
      console.error(error);
      toast.error('출석 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    const newState: Record<number, boolean> = {};
    MOCK_ATTENDANCE_LIST.forEach(student => {
      newState[student.id] = checked;
    });
    setAttendance(newState);
  };

  const allChecked = MOCK_ATTENDANCE_LIST.length > 0 && MOCK_ATTENDANCE_LIST.every(s => attendance[s.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">출석 체크</h1>
          <p className="text-sm text-muted-foreground">날짜와 부서를 선택하여 출석을 기록합니다.</p>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto shadow-sm">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          출석 저장
        </Button>
      </div>

      {/* 컨트롤 패널 */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border rounded-xl shadow-sm">
        <div className="space-y-1.5 flex-1">
          <label className="text-xs font-medium text-muted-foreground">출석일</label>
          <Popover>
            <PopoverTrigger render={
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP', { locale: ko }) : <span>날짜 선택</span>}
              </Button>
            } />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                autoFocus
                locale={ko}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-1.5 flex-1">
          <label className="text-xs font-medium text-muted-foreground">부서</label>
          <Select value={department} onValueChange={(val) => val && setDepartment(val)}>
            <SelectTrigger>
              <SelectValue placeholder="부서 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="초등부">초등부</SelectItem>
              <SelectItem value="중등부">중등부</SelectItem>
              <SelectItem value="고등부">고등부</SelectItem>
              <SelectItem value="청년부">청년부</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 출석 리스트 */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        {/* 리스트 헤더 (전체 선택) */}
        <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
          <div className="flex items-center gap-3">
            <Checkbox
              id="selectAll"
              checked={allChecked}
              onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label htmlFor="selectAll" className="text-sm font-medium cursor-pointer select-none">
              전체 선택
            </label>
          </div>
          <div className="text-sm text-muted-foreground">
            총 <span className="font-semibold text-foreground">{MOCK_ATTENDANCE_LIST.length}</span>명
          </div>
        </div>

        {/* 리스트 아이템 */}
        <div className="divide-y">
          {MOCK_ATTENDANCE_LIST.map((student) => {
            const isPresent = attendance[student.id] || false;
            
            return (
              <div 
                key={student.id} 
                className={cn(
                  "p-4 flex items-center justify-between transition-colors cursor-pointer sm:hover:bg-muted/30 active:bg-muted/50",
                  isPresent ? "bg-primary/5 sm:hover:bg-primary/10" : ""
                )}
                onClick={() => handleToggle(student.id)}
              >
                <div className="flex items-center gap-4">
                  <Checkbox 
                    checked={isPresent} 
                    onCheckedChange={() => handleToggle(student.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary pointer-events-none"
                  />
                  <div>
                    <div className="font-semibold">{student.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {student.school} {student.grade}
                    </div>
                  </div>
                </div>
                
                <div>
                  {isPresent ? (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      <CheckCircle2 className="h-4 w-4" />
                      출석
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-muted-foreground px-2 py-1">
                      결석
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
