'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Loader2, QrCode, Download, Upload } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import QRCode from 'qrcode';

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
import { getStudents, deactivateStudent, getStudentPhotoUrls } from '@/lib/actions/student';
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

  const handleBulkDownload = async () => {
    if (filteredStudents.length === 0) return;
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      for (const student of filteredStudents) {
        if (!student.qr_token) continue;
        const qrUrl = `${baseUrl}/qr/${student.qr_token}`;
        // Generate QR code as data URL
        const dataUrl = await QRCode.toDataURL(qrUrl, {
          width: 300,
          margin: 2,
          errorCorrectionLevel: 'H'
        });
        
        // Strip data prefix
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        zip.file(`${student.department}_${student.name}_QR.png`, base64Data, { base64: true });
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const fileName = departmentFilter === '전체' ? '전체_QR코드.zip' : `${departmentFilter}_QR코드.zip`;
      saveAs(content, fileName);
    } catch (error) {
      console.error(error);
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
            {isDownloadingZip ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            QR 일괄 다운로드
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
                <TableRow key={student.id} className="hover:bg-muted/30">
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
    </div>
  );
}
