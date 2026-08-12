'use client';

import Link from 'next/link';
import { Menu, Church, LogOut, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { useUIStore } from '@/store';
import { signOutAction } from '@/lib/actions/auth';
import { Database } from '@/lib/supabase/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/**
 * 공통 상단 헤더
 * - 로고 + 앱 이름
 * - 모바일: 사이드바 토글 버튼
 * - 우측: 테마 토글 + 사용자 메뉴
 */
export function Header({ profile }: { profile?: ProfileRow }) {
  const { toggleSidebar, isSidebarOpen } = useUIStore();
  const name = profile?.name || '사용자';
  const roleName = profile?.role === 'admin' ? '최고관리자' : '교사';
  const initial = name.charAt(0);

  return (
    <header className="sticky top-0 z-50 glass-strong safe-top">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        {/* 사이드바 토글 (데스크톱) */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? '사이드바 접기' : '사이드바 펼치기'}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* 로고 + 앱 이름 */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 lg:mr-4"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Church className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold leading-tight tracking-tight">
              교회학교
            </span>
            <span className="text-[10px] font-medium text-muted-foreground leading-none hidden sm:block">
              관리 시스템
            </span>
          </div>
        </Link>

        {/* 스페이서 */}
        <div className="flex-1" />

        {/* 우측 액션 영역 */}
        <div className="flex items-center gap-1">
          {/* 테마 토글 */}
          <ThemeToggle />

          {/* 사용자 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center whitespace-nowrap h-9 gap-2 rounded-lg px-2 text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline-flex text-sm font-medium text-foreground">
                {name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 hidden sm:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">{name}</p>
                    <p className="text-xs text-muted-foreground leading-none">
                      {profile?.department || roleName}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="p-0">
                <Link href="/settings/profile" className="flex items-center w-full px-2 py-1.5 cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  프로필 설정
                </Link>
              </DropdownMenuItem>
              <form action={signOutAction}>
                <button type="submit" className="w-full">
                  <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
