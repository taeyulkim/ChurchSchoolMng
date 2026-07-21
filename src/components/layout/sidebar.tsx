'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { allNavItems, settingsNavItem } from '@/lib/navigation';
import { useUIStore } from '@/store';

/**
 * 데스크톱 사이드바
 * - 접기/펼치기 지원 (아이콘 only ↔ 아이콘+라벨)
 * - 현재 페이지 하이라이트
 * - 부드러운 전환 애니메이션
 */
export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen } = useUIStore();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar',
        'transition-all duration-300 ease-in-out',
        isSidebarOpen ? 'w-60' : 'w-[68px]'
      )}
    >
      <ScrollArea className="flex-1 py-3">
        <nav className="flex flex-col gap-1 px-2">
          {/* 메인 네비게이션 */}
          {allNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return isSidebarOpen ? (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                  'transition-all duration-200',
                  active
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-[18px] w-[18px] shrink-0',
                    active
                      ? ''
                      : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'
                  )}
                />
                <span className="truncate animate-fade-in">
                  {item.label}
                </span>
              </Link>
            ) : (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  className={cn(
                    'flex h-10 w-11 items-center justify-center rounded-xl mx-auto',
                    'transition-all duration-200',
                    active
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                  onClick={() => {
                    window.location.href = item.href;
                  }}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </ScrollArea>

      {/* 하단: 설정 */}
      <div className="px-2 py-3">
        <Separator className="mb-3" />
        {isSidebarOpen ? (
          <Link
            href={settingsNavItem.href}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
              'transition-all duration-200',
              isActive(settingsNavItem.href)
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <settingsNavItem.icon className="h-[18px] w-[18px] shrink-0 text-muted-foreground group-hover:text-sidebar-accent-foreground" />
            <span className="truncate">{settingsNavItem.label}</span>
          </Link>
        ) : (
          <Tooltip>
            <TooltipTrigger
              className={cn(
                'flex h-10 w-11 items-center justify-center rounded-xl mx-auto',
                'transition-all duration-200',
                isActive(settingsNavItem.href)
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
              onClick={() => {
                window.location.href = settingsNavItem.href;
              }}
            >
              <settingsNavItem.icon className="h-[18px] w-[18px]" />
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {settingsNavItem.label}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  );
}
