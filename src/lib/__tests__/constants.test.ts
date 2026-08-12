import { describe, it, expect } from 'vitest';
import { ROUTES, ATTENDANCE_STATUS, TALENT_REASONS, ITEMS_PER_PAGE, ROLE_LABELS } from '../constants';
import { allNavItems, mainNavItems, subNavItems, settingsNavItem, bottomNavItems } from '../navigation';

describe('Constants', () => {
  // C-01: ROUTES 객체에 필수 경로 존재
  it('C-01: ROUTES - 모든 필수 경로가 정의되어 있다', () => {
    expect(ROUTES.HOME).toBe('/');
    expect(ROUTES.LOGIN).toBe('/login');
    expect(ROUTES.DASHBOARD).toBe('/dashboard');
    expect(ROUTES.STUDENTS).toBe('/students');
    expect(ROUTES.ATTENDANCE).toBe('/attendance');
    expect(ROUTES.TALENT).toBe('/talent');
    expect(ROUTES.BUDGET).toBe('/budget');
    expect(ROUTES.SCHEDULE).toBe('/schedule');
    expect(ROUTES.ITEMS).toBe('/items');
    expect(ROUTES.COUNSELING).toBe('/counseling');
    expect(ROUTES.SETTINGS).toBe('/settings');
    expect(ROUTES.PROFILE).toBe('/settings/profile');
  });

  // C-02: ATTENDANCE_STATUS 값 검증
  it('C-02: ATTENDANCE_STATUS - 출결 상태 코드가 올바르게 정의되어 있다', () => {
    expect(ATTENDANCE_STATUS.PRESENT).toBe('출석');
    expect(ATTENDANCE_STATUS.ABSENT).toBe('결석');
    expect(ATTENDANCE_STATUS.LATE).toBe('지각');
  });

  // C-03: TALENT_REASONS - 달란트 사유 목록 검증
  it('C-03: TALENT_REASONS - 달란트 사유 목록이 존재한다', () => {
    expect(TALENT_REASONS.length).toBeGreaterThan(0);
    expect(TALENT_REASONS).toContain('출석');
    expect(TALENT_REASONS).toContain('암송');
    expect(TALENT_REASONS).toContain('봉사');
  });

  // C-04: ITEMS_PER_PAGE 검증
  it('C-04: ITEMS_PER_PAGE - 페이지당 항목 수가 양의 정수이다', () => {
    expect(typeof ITEMS_PER_PAGE).toBe('number');
    expect(ITEMS_PER_PAGE).toBeGreaterThan(0);
    expect(Number.isInteger(ITEMS_PER_PAGE)).toBe(true);
  });

  // C-05: ROLE_LABELS 검증
  it('C-05: ROLE_LABELS - 역할 레이블이 정의되어 있다', () => {
    expect(ROLE_LABELS.teacher).toBe('교사');
  });
});

describe('Navigation', () => {
  // N-01: allNavItems에 필수 메뉴 존재
  it('N-01: allNavItems - 모든 메뉴 항목을 포함한다', () => {
    expect(allNavItems.length).toBeGreaterThanOrEqual(8);

    const hrefs = allNavItems.map(item => item.href);
    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/students');
    expect(hrefs).toContain('/attendance');
    expect(hrefs).toContain('/talent');
    expect(hrefs).toContain('/schedule');
    expect(hrefs).toContain('/items');
    expect(hrefs).toContain('/budget');
    expect(hrefs).toContain('/counseling');
  });

  // N-02: mainNavItems 구조 검증
  it('N-02: mainNavItems - 각 항목에 label, href, icon이 있다', () => {
    mainNavItems.forEach(item => {
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('href');
      expect(item).toHaveProperty('icon');
      expect(typeof item.label).toBe('string');
      expect(typeof item.href).toBe('string');
    });
  });

  // N-03: subNavItems 구조 검증
  it('N-03: subNavItems - 각 항목에 label, href, icon이 있다', () => {
    subNavItems.forEach(item => {
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('href');
      expect(item).toHaveProperty('icon');
    });
  });

  // N-04: settingsNavItem 존재 및 구조 검증
  it('N-04: settingsNavItem - 설정 메뉴가 올바르게 정의되어 있다', () => {
    expect(settingsNavItem).toBeDefined();
    expect(settingsNavItem.label).toBe('설정');
    expect(settingsNavItem.href).toBe('/settings');
    expect(settingsNavItem.icon).toBeDefined();
  });

  // N-05: bottomNavItems 검증
  it('N-05: bottomNavItems - 모바일 하단 네비게이션에 더보기 메뉴가 포함된다', () => {
    const hrefs = bottomNavItems.map(item => item.href);
    expect(hrefs).toContain('#more');
  });

  // N-06: allNavItems = mainNavItems + subNavItems
  it('N-06: allNavItems - mainNavItems와 subNavItems의 합집합이다', () => {
    expect(allNavItems.length).toBe(mainNavItems.length + subNavItems.length);
  });
});
