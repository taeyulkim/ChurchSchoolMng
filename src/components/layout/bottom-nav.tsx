'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { mainNavItems, subNavItems, settingsNavItem } from '@/lib/navigation';
import { MobileDrawer } from './mobile-drawer';

/**
 * 모바일 하단 네비게이션 바
 * - 4개 메인 메뉴 + 더보기
 * - 현재 페이지 하이라이트 (아이콘 + 라벨)
 * - Safe area 대응
 * - 마이크로 애니메이션
 */
export function BottomNav({ permissions = {} }: { permissions?: Record<string, boolean> }) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const filteredMainItems = mainNavItems.filter(item => {
    if (item.href === '/dashboard' || item.href === '/students') return true;
    const key = item.href.replace('/', '');
    if (['attendance', 'talent'].includes(key)) {
      return permissions[key] === true;
    }
    return true;
  });

  // 서브메뉴 중 하나가 활성화된 경우 "더보기"도 활성
  const isMoreActive = [...subNavItems, settingsNavItem].some((item) =>
    isActive(item.href)
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-strong safe-bottom">
        <div className="flex items-center justify-around px-1 py-1">
          {filteredMainItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex flex-1 flex-col items-center gap-0.5 py-2 transition-all duration-200',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {/* 활성 인디케이터 */}
                {active && (
                  <span className="absolute -top-1 h-0.5 w-6 rounded-full bg-primary animate-fade-in" />
                )}
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    active ? 'scale-110' : 'group-active:scale-95'
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium leading-none transition-all duration-200',
                    active ? 'font-semibold' : ''
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* 더보기 버튼 */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className={cn(
              'group relative flex flex-1 flex-col items-center gap-0.5 py-2 transition-all duration-200',
              isMoreActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {isMoreActive && (
              <span className="absolute -top-1 h-0.5 w-6 rounded-full bg-primary animate-fade-in" />
            )}
            <svg
              className={cn(
                'h-5 w-5 transition-transform duration-200',
                isMoreActive ? 'scale-110' : 'group-active:scale-95'
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
            <span
              className={cn(
                'text-[10px] font-medium leading-none',
                isMoreActive ? 'font-semibold' : ''
              )}
            >
              더보기
            </span>
          </button>
        </div>
      </nav>

      {/* 모바일 드로어 */}
      <MobileDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        permissions={permissions}
      />

      {/* 하단 네비게이션 높이만큼 콘텐츠 패딩 (모바일) */}
      <div className="h-[calc(3.5rem+env(safe-area-inset-bottom,0px))] lg:hidden" />
    </>
  );
}
