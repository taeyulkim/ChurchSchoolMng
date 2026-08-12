'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Church } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { subNavItems, settingsNavItem } from '@/lib/navigation';

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions?: Record<string, boolean>;
}

export function MobileDrawer({ open, onOpenChange, permissions = {} }: MobileDrawerProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  const filteredSubItems = subNavItems.filter(item => {
    const key = item.href.replace('/', '');
    if (['budget', 'items', 'schedule', 'counseling'].includes(key)) {
      if (key === 'counseling') return true;
      return permissions[key] === true;
    }
    return true;
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
        <SheetHeader className="pb-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Church className="h-4 w-4" />
            </div>
            추가 메뉴
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="grid grid-cols-2 gap-2 pb-3">
            {filteredSubItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200',
                    active
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <Separator className="my-2" />

          {/* 설정 */}
          <Link
            href={settingsNavItem.href}
            onClick={() => onOpenChange(false)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
              isActive(settingsNavItem.href)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <settingsNavItem.icon className="h-5 w-5" />
            <span className="text-sm font-medium">{settingsNavItem.label}</span>
          </Link>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
