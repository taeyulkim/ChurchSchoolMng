'use client';

import { useState, useEffect } from 'react';
import { getProfiles, updateTeacherAccess, deleteTeacherAccount, isMasterAdmin, getProfilePhotoUrls } from '@/lib/actions/user';
import { AvatarCircle } from '@/components/common/avatar-circle';
import { Database } from '@/lib/supabase/database.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type Permissions = { [key: string]: boolean };

export default function UsersPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMaster, setIsMaster] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProfileRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  const fetchProfiles = async () => {
    setIsLoading(true);
    const [profilesRes, masterCheck] = await Promise.all([
      getProfiles(),
      isMasterAdmin(),
    ]);
    if (profilesRes.success && profilesRes.data) {
      setProfiles(profilesRes.data);
      const paths = profilesRes.data.map(p => p.photo_path).filter((p): p is string => !!p);
      if (paths.length > 0) {
        const photoRes = await getProfilePhotoUrls(paths);
        if (photoRes.success && photoRes.data) setPhotoUrls(photoRes.data);
      }
    }
    setIsMaster(masterCheck);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleApprove = async (id: string) => {
    const defaultPermissions = { attendance: true, talent: true, budget: false, items: false, schedule: true };
    const res = await updateTeacherAccess(id, { status: 'approved', permissions: defaultPermissions });
    if (res.success) {
      toast.success('교사를 승인했습니다.');
      fetchProfiles();
    } else {
      toast.error(res.error || '승인 처리 중 오류가 발생했습니다.');
    }
  };

  const handleReject = async (id: string) => {
    const res = await updateTeacherAccess(id, { status: 'rejected' });
    if (res.success) {
      toast.success('가입을 거절했습니다.');
      fetchProfiles();
    } else {
      toast.error(res.error || '처리 중 오류가 발생했습니다.');
    }
  };

  const handlePermissionChange = async (id: string, currentPerms: Permissions, key: string, checked: boolean) => {
    const newPerms = { ...currentPerms, [key]: checked };
    const res = await updateTeacherAccess(id, { permissions: newPerms });
    if (res.success) {
      toast.success('권한이 업데이트되었습니다.');
      fetchProfiles();
    } else {
      toast.error(res.error || '권한 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteTeacherAccount(deleteTarget.id);
      if (!res.success) {
        toast.error(res.error || '계정 삭제 중 오류가 발생했습니다.');
        return;
      }
      toast.success(`${deleteTarget.name} 계정이 삭제되었습니다.`);
      setDeleteTarget(null);
      fetchProfiles();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">사용자 및 권한 관리</h1>
        <p className="text-sm text-muted-foreground">교사들의 가입을 승인하고 메뉴 접근 권한을 설정합니다.</p>
      </div>

      {!isLoading && !isMaster && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <p className="text-sm">승인 상태와 권한 변경은 마스터 관리자만 할 수 있습니다. 아래 목록은 조회만 가능합니다.</p>
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="divide-y">
            {profiles.length > 0 ? profiles.map((profile) => {
              const perms = (profile.permissions as Permissions) || {};
              return (
                <div key={profile.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AvatarCircle
                      name={profile.name}
                      photoUrl={profile.photo_path ? photoUrls[profile.photo_path] : null}
                    />
                    <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{profile.name}</span>
                      <Badge variant="secondary">{profile.department}</Badge>
                      {profile.status === 'pending' && <Badge variant="destructive" className="bg-orange-500">대기 중</Badge>}
                      {profile.status === 'approved' && <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50">승인됨</Badge>}
                      {profile.status === 'rejected' && <Badge variant="destructive">거절됨</Badge>}
                      {profile.role === 'admin' && <Badge className="bg-blue-600">최고 관리자</Badge>}
                    </div>
                    <span className="text-sm text-muted-foreground font-mono">{profile.id}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                  {profile.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleReject(profile.id)} disabled={!isMaster}>
                        거절
                      </Button>
                      <Button onClick={() => handleApprove(profile.id)} disabled={!isMaster}>
                        가입 승인
                      </Button>
                    </div>
                  ) : profile.status === 'approved' && profile.role !== 'admin' ? (
                    <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`perm-att-${profile.id}`}
                          checked={!!perms.attendance}
                          disabled={!isMaster}
                          onCheckedChange={(c) => handlePermissionChange(profile.id, perms, 'attendance', !!c)}
                        />
                        <label htmlFor={`perm-att-${profile.id}`} className="text-sm font-medium leading-none cursor-pointer">출석</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`perm-tal-${profile.id}`}
                          checked={!!perms.talent}
                          disabled={!isMaster}
                          onCheckedChange={(c) => handlePermissionChange(profile.id, perms, 'talent', !!c)}
                        />
                        <label htmlFor={`perm-tal-${profile.id}`} className="text-sm font-medium leading-none cursor-pointer">달란트</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`perm-sch-${profile.id}`}
                          checked={!!perms.schedule}
                          disabled={!isMaster}
                          onCheckedChange={(c) => handlePermissionChange(profile.id, perms, 'schedule', !!c)}
                        />
                        <label htmlFor={`perm-sch-${profile.id}`} className="text-sm font-medium leading-none cursor-pointer">일정</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`perm-bud-${profile.id}`}
                          checked={!!perms.budget}
                          disabled={!isMaster}
                          onCheckedChange={(c) => handlePermissionChange(profile.id, perms, 'budget', !!c)}
                        />
                        <label htmlFor={`perm-bud-${profile.id}`} className="text-sm font-medium leading-none cursor-pointer">예산</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`perm-itm-${profile.id}`}
                          checked={!!perms.items}
                          disabled={!isMaster}
                          onCheckedChange={(c) => handlePermissionChange(profile.id, perms, 'items', !!c)}
                        />
                        <label htmlFor={`perm-itm-${profile.id}`} className="text-sm font-medium leading-none cursor-pointer">비품</label>
                      </div>
                    </div>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTarget(profile)}
                    disabled={!isMaster}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  </div>
                </div>
              );
            }) : (
              <div className="p-8 text-center text-muted-foreground">
                사용자가 없습니다.
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>계정 삭제</DialogTitle>
            <DialogDescription>
              {deleteTarget?.name} 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 해당 계정으로는 더 이상 로그인할 수 없습니다.
              그동안 기록한 출석/달란트/예산 내역은 남고 기록자 정보만 비워집니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
