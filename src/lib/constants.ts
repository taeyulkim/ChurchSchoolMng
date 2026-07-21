/**
 * 애플리케이션 상수 정의
 */

// ============================================
// App Info
// ============================================
export const APP_NAME = '교회학교 관리 시스템';
export const APP_SHORT_NAME = '교회학교';
export const APP_DESCRIPTION = '교회학교 출석, 달란트, 예산, 일정을 효율적으로 관리하는 시스템';

// ============================================
// Routes
// ============================================
export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  AUTH_CALLBACK: '/callback',

  // Dashboard
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  ATTENDANCE: '/attendance',
  TALENT: '/talent',
  TALENT_MARKET: '/talent/market',
  BUDGET: '/budget',
  SCHEDULE: '/schedule',
  ITEMS: '/items',
  COUNSELING: '/counseling',
  TASKS: '/tasks',

  // Settings
  SETTINGS: '/settings',
  PROFILE: '/settings/profile',
} as const;

// ============================================
// RBAC Role Labels
// ============================================
export const ROLE_LABELS = {
  super_admin: '최고 관리자',
  pastor: '교역자',
  teacher: '교사',
  parent: '학부모',
} as const;

export const ROLE_HIERARCHY = {
  super_admin: 4,
  pastor: 3,
  teacher: 2,
  parent: 1,
} as const;

// ============================================
// Attendance
// ============================================
export const ATTENDANCE_STATUS = {
  PRESENT: '출석',
  ABSENT: '결석',
  LATE: '지각',
} as const;

export const ATTENDANCE_STATUS_COLORS = {
  출석: 'text-emerald-500',
  결석: 'text-rose-500',
  지각: 'text-amber-500',
} as const;

// ============================================
// Talent (달란트)
// ============================================
export const TALENT_REASONS = [
  '출석',
  '암송',
  '과제',
  '봉사',
  '마켓 차감',
  '보너스',
  '기타',
] as const;

// ============================================
// UI
// ============================================
export const ITEMS_PER_PAGE = 20;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;
