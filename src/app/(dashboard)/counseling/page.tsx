'use client';

import { useState, useEffect } from 'react';
import { getStudents } from '@/lib/actions/student';
import { getCounselingRecords, deleteCounselingRecord } from '@/lib/actions/counseling';
import { Database } from '@/lib/supabase/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageSquareMore, Calendar, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { CounselingForm } from '@/components/counseling/counseling-form';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { isFeatureDisabled } from '@/lib/feature-flags';
import { FeatureDisabled } from '@/components/common/feature-disabled';

type StudentRow = Database['public']['Tables']['students']['Row'];
type CounselingRow = Database['public']['Tables']['counseling_records']['Row'];

export default function CounselingPage() {
  if (isFeatureDisabled('counseling')) {
    return <FeatureDisabled title="상담록" />;
  }
  return <CounselingPageContent />;
}

function CounselingPageContent() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  
  const [records, setRecords] = useState<CounselingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  useEffect(() => {
    async function init() {
      const res = await getStudents();
      if (res.success && res.data) {
        setStudents(res.data);
        setFilteredStudents(res.data);
      }
      setIsLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    setFilteredStudents(students.filter(s => 
      s.name.toLowerCase().includes(term) || s.department.includes(term)
    ));
  }, [search, students]);

  const fetchRecords = async (studentId: number) => {
    setIsLoadingRecords(true);
    const res = await getCounselingRecords(studentId);
    if (res.success && res.data) {
      setRecords(res.data);
    }
    setIsLoadingRecords(false);
  };

  const handleSelectStudent = (student: StudentRow) => {
    setSelectedStudent(student);
    fetchRecords(student.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 상담록을 삭제하시겠습니까?')) return;
    const res = await deleteCounselingRecord(id);
    if (res.success) {
      toast.success('삭제되었습니다.');
      if (selectedStudent) fetchRecords(selectedStudent.id);
    } else {
      toast.error('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">상담록 관리</h1>
        <p className="text-sm text-muted-foreground">학생들과의 상담 내용을 기록하고 관리합니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* 학생 목록 사이드바 */}
        <Card className="md:col-span-1 h-full flex flex-col overflow-hidden">
          <CardHeader className="pb-3 border-b space-y-3">
            <CardTitle className="text-lg">학생 목록</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름 또는 부서 검색"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filteredStudents.length > 0 ? (
              <div className="p-2 space-y-1">
                {filteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-colors flex justify-between items-center ${
                      selectedStudent?.id === student.id 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>{student.name}</span>
                    <Badge variant="outline" className="text-xs bg-white">{student.department}</Badge>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</div>
            )}
          </ScrollArea>
        </Card>

        {/* 상담 타임라인 영역 */}
        <Card className="md:col-span-2 h-full flex flex-col overflow-hidden">
          {selectedStudent ? (
            <>
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {selectedStudent.name} <span className="text-sm font-normal text-muted-foreground">{selectedStudent.department}</span>
                  </CardTitle>
                  <CardDescription>상담 내역 타임라인</CardDescription>
                </div>
                <CounselingForm student={selectedStudent} onSuccess={() => fetchRecords(selectedStudent.id)} />
              </CardHeader>
              
              <ScrollArea className="flex-1 bg-slate-50/50 p-4 md:p-6">
                {isLoadingRecords ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : records.length > 0 ? (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {records.map((record, index) => (
                      <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                          <MessageSquareMore className="h-4 w-4 text-primary" />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <time className="text-xs font-semibold text-primary flex items-center">
                              <Calendar className="mr-1 h-3 w-3" />
                              {format(new Date(record.counseling_date), 'yyyy년 MM월 dd일')}
                            </time>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(record.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{record.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <MessageSquareMore className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-medium text-slate-600 mb-1">상담 내역이 없습니다</p>
                    <p className="text-sm text-muted-foreground">오른쪽 상단의 버튼을 눌러 첫 상담 기록을 추가해보세요.</p>
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquareMore className="h-12 w-12 mb-4 opacity-20" />
              <p>좌측에서 학생을 선택해주세요.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
