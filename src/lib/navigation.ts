import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Coins,
  CalendarDays,
  Package,
  Receipt,
  MessageSquareMore,
  FileText,
  Settings,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';

/**
 * 네비게이션 메뉴 아이템 타입
 */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  /** 부장 교사 이상만 볼 수 있는 메뉴 */
  managerOnly?: boolean;
}

/**
 * 메인 네비게이션 메뉴
 */
export const mainNavItems: NavItem[] = [
  {
    label: '대시보드',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: '전체 현황 요약',
  },
  {
    label: '학생 관리',
    href: '/students',
    icon: Users,
    description: '학생 정보 관리',
  },
  {
    label: '출석 관리',
    href: '/attendance',
    icon: ClipboardCheck,
    description: '출석 체크 및 통계',
  },
  {
    label: '달란트',
    href: '/talent',
    icon: Coins,
    description: '달란트 부여/차감 및 마켓',
  },
];

/**
 * 서브 네비게이션 메뉴 (더보기에 포함)
 */
export const subNavItems: NavItem[] = [
  {
    label: '일정 관리',
    href: '/schedule',
    icon: CalendarDays,
    description: '일정 관리 및 장소 예약',
  },
  {
    label: '물품 관리',
    href: '/items',
    icon: Package,
    description: '물품 현황 관리',
  },
  {
    label: '예산 관리',
    href: '/budget',
    icon: Receipt,
    description: '예산 수입/지출 관리',
    managerOnly: true,
  },
  {
    label: '상담록',
    href: '/counseling',
    icon: MessageSquareMore,
    description: '학생 상담 기록',
  },
  {
    label: '게시판',
    href: '/board',
    icon: FileText,
    description: '문서 공유 게시판',
  },
];

/**
 * 설정 메뉴
 */
export const settingsNavItem: NavItem = {
  label: '설정',
  href: '/settings',
  icon: Settings,
  description: '시스템 설정',
};

/**
 * 모바일 하단 네비게이션 (4개 메인 + 더보기)
 */
export const bottomNavItems: NavItem[] = [
  ...mainNavItems,
  {
    label: '더보기',
    href: '#more',
    icon: MoreHorizontal,
    description: '추가 메뉴',
  },
];

/**
 * 전체 사이드바 메뉴 (데스크톱)
 */
export const allNavItems: NavItem[] = [...mainNavItems, ...subNavItems];
