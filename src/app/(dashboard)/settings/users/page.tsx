'use client';

import { useState, useEffect } from 'react';
import { getProfiles, updateProfile } from '@/lib/actions/user';
import { Database } from '@/lib/supabase/database.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type Permissions = { [key: string]: boolean };

export default function UsersPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = async () => {
    setIsLoading(true);
    const res = await getProfiles();
    if (res.success && res.data) {
      setProfiles(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleApprove = async (id: string) => {
    const defaultPermissions = { attendance: true, talent: true, budget: false, items: false, schedule: true };
    const res = await updateProfile(id, { status: 'approved', permissions: defaultPermissions as any });
    if (res.success) {
      toast.success('교사를 승인했습니다.');
      fetchProfiles();
    } else {
      toast.error('승인 처리 중 오류가 발생했습니다.');
    }
  };

  const handleReject = async (id: string) => {
    const res = await updateProfile(id, { status: 'rejected' });
    if (res.success) {
      toast.success('가입을 거절했습니다.');
      fetchProfiles();
    } else {
      toast.error('처리 중 오류가 발생했습니다.');
    }
  };

  const handlePermissionChange = async (id: string, currentPerms: Permissions, key: string, checked: boolean) => {
    const newPerms = { ...currentPerms, [key]: checked };
    const res = await updateProfile(id, { permissions: newPerms as any });
    if (res.success) {
      toast.success('권한이 업데이트되었습니다.');
      fetchProfiles();
    } else {
      toast.error('권한 업데이트 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">사용자 및 권한 관리</h1>
        <p className="text-sm text-muted-foreground">교사들의 가입을 승인하고 메뉴 접근 권한을 설정합니다.</p>
      </div>

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

                  {profile.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleReject(profile.id)}>
                        거절
                      </Button>
                      <Button onClick={() => handleApprove(profile.id)}>
                        가입 승인
                      </Button>
                    </div>
                  ) : profile.status === 'approved' && profile.role !== 'admin' ? (
                    <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`perm-att-${profile.id}`} 
                          checked={!!perms.attendance}
                          onCheckedChange={(c) => handlePermissionChange(profile.id, perms, 'attendance', !!c)}
                        />
                        <label htmlFor={`perm-att-${profile.id}`} className="text-sm font-medium leading-none cursor-pointer">출석</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`perm-tal-${profile.id}`} 
                          checked={!!perms.talent}
                          onCheckedChange={(c) => handlePermissionChange(profile.id, perms, 'talent', !!c)}
                        />
                        <label htmlFor={`perm-tal-${profile.id}`} className="text-sm font-medium leading-none cursor-pointer">달란트</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`perm-sch-${profile.id}`} 
                          checked={!!perms.schedule}
                          onCheckedChange={(c) => handlePermissionChange(profile.id, perms, 'schedule', !!c)}
                        />
                        <label htmlFor={`perm-sch-${profile.id}`} className="text-sm font-medium leading-none cursor-pointer">일정</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`perm-bud-${profile.id}`} 
                          checked={!!perms.budget}
                          onCheckedChange={(c) => handlePermissionChange(profile.id, perms, 'budget', !!c)}
                        />
                        <label htmlFor={`perm-bud-${profile.id}`} className="text-sm font-medium leading-none cursor-pointer">예산</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`perm-itm-${profile.id}`} 
                          checked={!!perms.items}
                          onCheckedChange={(c) => handlePermissionChange(profile.id, perms, 'items', !!c)}
                        />
                        <label htmlFor={`perm-itm-${profile.id}`} className="text-sm font-medium leading-none cursor-pointer">비품</label>
                      </div>
                    </div>
                  ) : null}
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
    </div>
  );
}
