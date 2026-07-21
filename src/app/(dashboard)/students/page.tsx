'use client';

import { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StudentForm } from '@/components/student/student-form';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock Data
const MOCK_STUDENTS = [
  { id: 1, name: '홍길동', department: '초등부', school: '새소망초등학교', grade: '3학년', status: '활성', lastAttend: '2023-10-15' },
  { id: 2, name: '이순신', department: '고등부', school: '새소망고등학교', grade: '1학년', status: '활성', lastAttend: '2023-10-15' },
  { id: 3, name: '유관순', department: '초등부', school: '새소망초등학교', grade: '5학년', status: '장기결석', lastAttend: '2023-09-01' },
  { id: 4, name: '김구', department: '중등부', school: '새소망중학교', grade: '2학년', status: '활성', lastAttend: '2023-10-08' },
  { id: 5, name: '안중근', department: '청년부', school: '새소망대학교', grade: '1학년', status: '활성', lastAttend: '2023-10-15' },
];

export default function StudentsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* 헤더 및 액션 영역 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">학생 관리</h1>
          <p className="text-sm text-muted-foreground">교회학교 학생들을 등록하고 관리합니다.</p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          학생 등록
        </Button>
      </div>

      {/* 필터 및 검색 바 */}
      <div className="flex flex-col gap-3 sm:flex-row items-center justify-between bg-card p-2 rounded-xl border shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름 또는 학교 검색..."
            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <Button variant="outline" size="sm" className="h-9 whitespace-nowrap">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            초등부
          </Button>
          <Button variant="outline" size="sm" className="h-9 whitespace-nowrap">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            중등부
          </Button>
          <Button variant="outline" size="sm" className="h-9 whitespace-nowrap">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            상태 필터
          </Button>
        </div>
      </div>

      {/* 데이터 리스트 영역 */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* 데스크톱 테이블 뷰 (sm 이상) */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[100px]">이름</TableHead>
                <TableHead>부서</TableHead>
                <TableHead>학교/학년</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">마지막 출석</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_STUDENTS.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                      {student.department}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {student.school} <span className="text-muted-foreground text-xs">{student.grade}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={student.status === '활성' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-amber-600 border-amber-200 bg-amber-50'}
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {student.lastAttend}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex items-center justify-center whitespace-nowrap h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>상세 보기</DropdownMenuItem>
                        <DropdownMenuItem>정보 수정</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">비활성화</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* 모바일 카드 뷰 (sm 미만) */}
        <div className="grid grid-cols-1 sm:hidden divide-y">
          {MOCK_STUDENTS.map((student) => (
            <div key={student.id} className="p-4 flex items-center justify-between gap-3 active:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {student.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{student.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                      {student.department}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {student.school} {student.grade}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge
                  variant="outline"
                  className={student.status === '활성' ? 'text-[10px] px-1.5 py-0 h-4 text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-[10px] px-1.5 py-0 h-4 text-amber-600 border-amber-200 bg-amber-50'}
                >
                  {student.status}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{student.lastAttend}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 등록 다이얼로그 */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>학생 등록</DialogTitle>
            <DialogDescription>
              새로운 학생 정보를 입력합니다. 필수 입력 항목(*)을 확인해주세요.
            </DialogDescription>
          </DialogHeader>
          <StudentForm
            onSuccess={() => setIsAddOpen(false)}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
