import Link from 'next/link';
import { UserCog, Users, ChevronRight } from 'lucide-react';
import { isMasterAdmin } from '@/lib/actions/user';

export default async function SettingsPage() {
  const isMaster = await isMasterAdmin();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">시스템 설정</h1>
        <p className="text-sm text-muted-foreground">계정 정보와 사용자 권한을 관리합니다.</p>
      </div>

      <div className="space-y-3">
        <Link
          href="/settings/profile"
          className="flex items-center justify-between rounded-2xl border bg-card p-5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">내 정보 관리</p>
              <p className="text-sm text-muted-foreground">이름, 담당 부서, 비밀번호를 변경합니다.</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>

        {isMaster && (
          <Link
            href="/settings/users"
            className="flex items-center justify-between rounded-2xl border bg-card p-5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">사용자 및 권한 관리</p>
                <p className="text-sm text-muted-foreground">교사 가입을 승인하고 메뉴 접근 권한을 설정합니다.</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        )}
      </div>
    </div>
  );
}
