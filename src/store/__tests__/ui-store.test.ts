import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../ui-store';

describe('UI Store (UI 상태 스토어)', () => {
  beforeEach(() => {
    useUIStore.setState({ isSidebarOpen: true, isMobileNavOpen: false });
  });

  // ST-07: 초기 상태 검증
  it('ST-07: 초기 상태는 isSidebarOpen=true, isMobileNavOpen=false이다', () => {
    const state = useUIStore.getState();
    expect(state.isSidebarOpen).toBe(true);
    expect(state.isMobileNavOpen).toBe(false);
  });

  // ST-08: toggleSidebar 동작 검증
  it('ST-08: toggleSidebar 호출 시 사이드바 상태를 반전시킨다', () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().isSidebarOpen).toBe(false);

    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().isSidebarOpen).toBe(true);
  });

  // ST-09: setSidebarOpen 직접 설정
  it('ST-09: setSidebarOpen 호출 시 지정한 값으로 사이드바 상태를 설정한다', () => {
    useUIStore.getState().setSidebarOpen(false);
    expect(useUIStore.getState().isSidebarOpen).toBe(false);

    useUIStore.getState().setSidebarOpen(true);
    expect(useUIStore.getState().isSidebarOpen).toBe(true);
  });

  // ST-10: toggleMobileNav 동작 검증
  it('ST-10: toggleMobileNav 호출 시 모바일 네비 상태를 반전시킨다', () => {
    expect(useUIStore.getState().isMobileNavOpen).toBe(false);

    useUIStore.getState().toggleMobileNav();
    expect(useUIStore.getState().isMobileNavOpen).toBe(true);

    useUIStore.getState().toggleMobileNav();
    expect(useUIStore.getState().isMobileNavOpen).toBe(false);
  });

  // ST-11: setMobileNavOpen 직접 설정
  it('ST-11: setMobileNavOpen 호출 시 지정한 값으로 모바일 네비 상태를 설정한다', () => {
    useUIStore.getState().setMobileNavOpen(true);
    expect(useUIStore.getState().isMobileNavOpen).toBe(true);

    useUIStore.getState().setMobileNavOpen(false);
    expect(useUIStore.getState().isMobileNavOpen).toBe(false);
  });

  // ST-12: 사이드바와 모바일 네비 독립성 검증
  it('ST-12: 사이드바와 모바일 네비 상태는 독립적으로 동작한다', () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().isSidebarOpen).toBe(false);
    expect(useUIStore.getState().isMobileNavOpen).toBe(false); // 변경 없음

    useUIStore.getState().toggleMobileNav();
    expect(useUIStore.getState().isSidebarOpen).toBe(false); // 변경 없음
    expect(useUIStore.getState().isMobileNavOpen).toBe(true);
  });
});
