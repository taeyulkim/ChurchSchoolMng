'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Loader2, QrCode, IdCard, Upload, UserX, RotateCcw, Trash2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { renderStudentIdCard } from '@/lib/student-id-card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StudentForm } from '@/components/student/student-form';
import { QrDialog } from '@/components/student/qr-dialog';
import { BulkUploadDialog } from '@/components/student/bulk-upload-dialog';
import { AvatarCircle } from '@/components/common/avatar-circle';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  getStudents,
  deactivateStudent,
  getStudentPhotoUrls,
  bulkDeactivateStudents,
  getInactiveStudents,
  reactivateStudent,
  deleteStudentPermanently,
} from '@/lib/actions/student';
import { isMasterAdmin } from '@/lib/actions/user';
import { Database } from '@/lib/supabase/database.types';
import { toast } from 'sonner';

type StudentRow = Database['public']['Tables']['students']['Row'];

export default function StudentsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('전체');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  const [qrStudent, setQrStudent] = useState<StudentRow | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const [detailStudent, setDetailStudent] = useState<StudentRow | null>(null);
  const [editStudent, setEditStudent] = useState<StudentRow | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<StudentRow | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkDeactivateOpen, setIsBulkDeactivateOpen] = useState(false);
  const [isBulkDeactivating, setIsBulkDeactivating] = useState(false);

  const [isInactiveOpen, setIsInactiveOpen] = useState(false);
  const [inactiveStudents, setInactiveStudents] = useState<StudentRow[]>([]);
  const [isLoadingInactive, setIsLoadingInactive] = useState(false);
  const [reactivatingId, setReactivatingId] = useState<number | null>(null);

  const [isMaster, setIsMaster] = useState(false);
  const [deleteForeverTarget, setDeleteForeverTarget] = useState<StudentRow | null>(null);
  const [isDeletingForever, setIsDeletingForever] = useState(false);

  useEffect(() => {
    isMasterAdmin().then(setIsMaster);
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    const res = await getStudents();
    if (res.success && res.data) {
      setStudents(res.data);
      const paths = res.data.map(s => s.photo_path).filter((p): p is string => !!p);
      if (paths.length > 0) {
        const photoRes = await getStudentPhotoUrls(paths);
        if (photoRes.success && photoRes.data) setPhotoUrls(photoRes.data);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setIsDeactivating(true);
    try {
      const res = await deactivateStudent(deactivateTarget.id);
      if (!res.success) {
        toast.error('학생 비활성화 중 오류가 발생했습니다.');
        return;
      }
      toast.success(`${deactivateTarget.name} 학생이 비활성화되었습니다.`);
      setDeactivateTarget(null);
      fetchStudents();
    } finally {
      setIsDeactivating(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.includes(searchQuery) || (student.school && student.school.includes(searchQuery));
    const matchesDept = departmentFilter === '전체' || student.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id));

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredStudents.forEach(s => { if (checked) next.add(s.id); else next.delete(s.id); });
      return next;
    });
  };

  const handleBulkDeactivate = async () => {
    setIsBulkDeactivating(true);
    try {
      const ids = Array.from(selectedIds);
      const res = await bulkDeactivateStudents(ids);
      if (!res.success) {
        toast.error('선택한 학생 비활성화 중 오류가 발생했습니다.');
        return;
      }
      toast.success(`${res.data?.count ?? ids.length}명의 학생이 비활성화되었습니다.`);
      setSelectedIds(new Set());
      setIsBulkDeactivateOpen(false);
      fetchStudents();
    } finally {
      setIsBulkDeactivating(false);
    }
  };

  const openInactiveDialog = async () => {
    setIsInactiveOpen(true);
    setIsLoadingInactive(true);
    const res = await getInactiveStudents();
    if (res.success && res.data) setInactiveStudents(res.data);
    setIsLoadingInactive(false);
  };

  const handleReactivate = async (student: StudentRow) => {
    setReactivatingId(student.id);
    try {
      const res = await reactivateStudent(student.id);
      if (!res.success) {
        toast.error('재활성화 중 오류가 발생했습니다.');
        return;
      }
      toast.success(`${student.name} 학생이 다시 활성화되었습니다.`);
      setInactiveStudents(prev => prev.filter(s => s.id !== student.id));
      fetchStudents();
    } finally {
      setReactivatingId(null);
    }
  };

  const handleDeleteForever = async () => {
    if (!deleteForeverTarget) return;
    setIsDeletingForever(true);
    try {
      const res = await deleteStudentPermanently(deleteForeverTarget.id);
      if (!res.success) {
        toast.error(res.error || '학생 삭제 중 오류가 발생했습니다.');
        return;
      }
      toast.success(`${deleteForeverTarget.name} 학생 정보가 완전히 삭제되었습니다.`);
      setInactiveStudents(prev => prev.filter(s => s.id !== deleteForeverTarget.id));
      setDeleteForeverTarget(null);
      fetchStudents();
    } finally {
      setIsDeletingForever(false);
    }
  };

  const handleBulkDownload = async () => {
    if (filteredStudents.length === 0) return;
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      for (const student of filteredStudents) {
        if (!student.qr_token) continue;
        const qrUrl = `${baseUrl}/qr/${student.qr_token}`;
        const photoUrl = student.photo_path ? photoUrls[student.photo_path] : null;

        const blob = await renderStudentIdCard({
          name: student.name,
          department: student.department,
          grade: student.grade,
          qrUrl,
          photoUrl,
        });

        zip.file(`${student.department}_${student.name}_학생증.png`, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const fileName = departmentFilter === '전체' ? '전체_학생증.zip' : `${departmentFilter}_학생증.zip`;
      saveAs(content, fileName);
    } catch (error) {
      console.error(error);
      toast.error('학생증 생성 중 오류가 발생했습니다.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 및 액션 영역 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">학생 관리</h1>
          <p className="text-sm text-muted-foreground">교회학교 학생들을 등록하고 관리합니다.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button onClick={() => {
            const dataToExport = filteredStudents.map(s => ({
              부서: s.department,
              이름: s.name,
              성별: s.gender === 'male' ? '남' : '여',
              학교: s.school || '',
              학년: s.grade || '',
              학부모성함: s.parent_name || '',
              학부모연락처: s.parent_contact || '',
              누적달란트: s.total_talents || 0
            }));
            import('@/lib/export').then(m => m.downloadExcel(dataToExport, `${departmentFilter}_학생명부`));
          }} variant="outline" className="w-full sm:w-auto shadow-sm">
            엑셀 다운로드
          </Button>
          <Button onClick={() => setIsBulkUploadOpen(true)} variant="outline" className="w-full sm:w-auto shadow-sm">
            <Upload className="mr-2 h-4 w-4" />
            엑셀 일괄 업로드
          </Button>
          <Button onClick={handleBulkDownload} variant="outline" disabled={isDownloadingZip || filteredStudents.length === 0} className="w-full sm:w-auto shadow-sm">
            {isDownloadingZip ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <IdCard className="mr-2 h-4 w-4" />}
            학생증 다운로드
          </Button>
          <Button onClick={openInactiveDialog} variant="outline" className="w-full sm:w-auto shadow-sm">
            <UserX className="mr-2 h-4 w-4" />
            비활성 학생
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            학생 등록
          </Button>
        </div>
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
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-2 sm:pb-0">
          <Select value={departmentFilter} onValueChange={(val) => val && setDepartmentFilter(val)}>
            <SelectTrigger className="w-[120px] h-9">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="부서 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">전체 부서</SelectItem>
              <SelectItem value="유아부">유아부</SelectItem>
              <SelectItem value="유치부">유치부</SelectItem>
              <SelectItem value="어린이부">어린이부</SelectItem>
              <SelectItem value="청소년부">청소년부</SelectItem>
              <SelectItem value="청년부">청년부</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 다중 선택 액션 바 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl p-3">
          <p className="text-sm font-medium">{selectedIds.size}명 선택됨</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              선택 해제
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setIsBulkDeactivateOpen(true)}>
              선택 비활성화
            </Button>
          </div>
        </div>
      )}

      {/* 데이터 리스트 영역 */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
        {/* 데스크톱 테이블 뷰 (sm 이상) */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[36px]">
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={(checked) => toggleSelectAll(checked as boolean)}
                    aria-label="전체 선택"
                  />
                </TableHead>
                <TableHead className="w-[60px]"></TableHead>
                <TableHead className="w-[100px]">이름</TableHead>
                <TableHead>부서</TableHead>
                <TableHead>학교/학년</TableHead>
                <TableHead>달란트</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/30" data-state={selectedIds.has(student.id) ? 'selected' : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(student.id)}
                      onCheckedChange={() => toggleSelect(student.id)}
                      aria-label={`${student.name} 선택`}
                    />
                  </TableCell>
                  <TableCell>
                    <AvatarCircle
                      name={student.name}
                      photoUrl={student.photo_path ? photoUrls[student.photo_path] : null}
                      className="h-9 w-9 text-xs"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                      {student.department}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {student.school || '-'} <span className="text-muted-foreground text-xs">{student.grade || ''}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-emerald-600 border-emerald-200 bg-emerald-50"
                    >
                      {student.total_talents?.toLocaleString()} 달란트
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex items-center justify-center whitespace-nowrap h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setQrStudent(student);
                          setIsQrOpen(true);
                        }}>
                          <QrCode className="mr-2 h-4 w-4" />
                          QR 코드 보기
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDetailStudent(student)}>상세 보기</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditStudent(student)}>정보 수정</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeactivateTarget(student)}>비활성화</DropdownMenuItem>
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
          {filteredStudents.map((student) => (
            <div key={student.id} className="p-4 flex items-center justify-between gap-3 active:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <AvatarCircle
                  name={student.name}
                  photoUrl={student.photo_path ? photoUrls[student.photo_path] : null}
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{student.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                      {student.department}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {student.school || '-'} {student.grade || ''}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 text-emerald-600 border-emerald-200 bg-emerald-50 mb-1"
                >
                  {student.total_talents?.toLocaleString()} 달란트
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setQrStudent(student);
                    setIsQrOpen(true);
                  }}
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        </>
        )}
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
            onSuccess={() => {
              setIsAddOpen(false);
              fetchStudents();
            }}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
      {/* 엑셀 일괄 업로드 다이얼로그 */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>학생 엑셀 일괄 업로드</DialogTitle>
            <DialogDescription>
              엑셀 파일로 여러 학생을 한 번에 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <BulkUploadDialog onSuccess={fetchStudents} />
        </DialogContent>
      </Dialog>
      {/* QR 다이얼로그 */}
      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>학생 QR 코드</DialogTitle>
            <DialogDescription>
              이 QR 코드를 스캔하면 학생 전용 대시보드로 이동합니다.
            </DialogDescription>
          </DialogHeader>
          <QrDialog student={qrStudent} onClose={() => setIsQrOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* 상세 보기 다이얼로그 */}
      <Dialog open={!!detailStudent} onOpenChange={(open) => !open && setDetailStudent(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{detailStudent?.name}</DialogTitle>
            <DialogDescription>학생 상세 정보</DialogDescription>
          </DialogHeader>
          {detailStudent && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 py-2 text-sm">
              <div className="col-span-2 flex justify-center pb-2">
                <AvatarCircle
                  name={detailStudent.name}
                  photoUrl={detailStudent.photo_path ? photoUrls[detailStudent.photo_path] : null}
                  className="h-20 w-20 text-2xl"
                />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">부서</p>
                <p className="font-medium">{detailStudent.department}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">성별</p>
                <p className="font-medium">{detailStudent.gender === 'male' ? '남' : '여'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">생년월일</p>
                <p className="font-medium">{detailStudent.birth_date || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">누적 달란트</p>
                <p className="font-medium">{detailStudent.total_talents?.toLocaleString() ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">학교</p>
                <p className="font-medium">{detailStudent.school || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">학년</p>
                <p className="font-medium">{detailStudent.grade || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">보호자 이름</p>
                <p className="font-medium">{detailStudent.parent_name || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">보호자 연락처</p>
                <p className="font-medium">{detailStudent.parent_contact || '-'}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setDetailStudent(null)}>닫기</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 정보 수정 다이얼로그 */}
      <Dialog open={!!editStudent} onOpenChange={(open) => !open && setEditStudent(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>학생 정보 수정</DialogTitle>
            <DialogDescription>
              {editStudent?.name} 학생의 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          {editStudent && (
            <StudentForm
              student={editStudent}
              onSuccess={() => {
                setEditStudent(null);
                fetchStudents();
              }}
              onCancel={() => setEditStudent(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 비활성화 확인 다이얼로그 */}
      <Dialog open={!!deactivateTarget} onOpenChange={(open) => !open && setDeactivateTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>학생 비활성화</DialogTitle>
            <DialogDescription>
              {deactivateTarget?.name} 학생을 비활성화하시겠습니까? 비활성화된 학생은 목록에서 숨겨지며, 데이터는 삭제되지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeactivateTarget(null)} disabled={isDeactivating}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={isDeactivating}>
              {isDeactivating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              비활성화
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 다중 비활성화 확인 다이얼로그 */}
      <Dialog open={isBulkDeactivateOpen} onOpenChange={setIsBulkDeactivateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>선택한 학생 비활성화</DialogTitle>
            <DialogDescription>
              선택한 {selectedIds.size}명의 학생을 비활성화하시겠습니까? 비활성화된 학생은 목록에서 숨겨지며, 데이터는 삭제되지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsBulkDeactivateOpen(false)} disabled={isBulkDeactivating}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleBulkDeactivate} disabled={isBulkDeactivating}>
              {isBulkDeactivating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              비활성화
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 비활성 학생 목록 / 재활성화 다이얼로그 */}
      <Dialog open={isInactiveOpen} onOpenChange={setIsInactiveOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>비활성 학생</DialogTitle>
            <DialogDescription>비활성화된 학생을 다시 활성화하거나, 완전히 삭제할 수 있습니다.</DialogDescription>
          </DialogHeader>
          {isLoadingInactive ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : inactiveStudents.length > 0 ? (
            <div className="max-h-96 overflow-y-auto divide-y -mx-6">
              {inactiveStudents.map((student) => (
                <div key={student.id} className="px-6 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <AvatarCircle name={student.name} photoUrl={null} className="h-9 w-9 text-xs shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {student.department} · {student.school || '-'} {student.grade || ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReactivate(student)}
                      disabled={reactivatingId === student.id}
                    >
                      {reactivatingId === student.id ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      재활성화
                    </Button>
                    {isMaster && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteForeverTarget(student)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">비활성화된 학생이 없습니다.</div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setIsInactiveOpen(false)}>닫기</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 완전 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteForeverTarget} onOpenChange={(open) => !open && setDeleteForeverTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>학생 완전 삭제</DialogTitle>
            <DialogDescription>
              {deleteForeverTarget?.name} 학생 정보를 완전히 삭제하시겠습니까? 출석/달란트 이력을 포함한 모든 기록이 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteForeverTarget(null)} disabled={isDeletingForever}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteForever} disabled={isDeletingForever}>
              {isDeletingForever ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              완전 삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
