import { create } from 'zustand';

/**
 * UI 상태 관리 스토어
 * - 사이드바, 모달 등 전역 UI 상태
 */
interface UIState {
  /** 사이드바 열림 여부 (데스크톱) */
  isSidebarOpen: boolean;
  /** 모바일 네비게이션 열림 여부 */
  isMobileNavOpen: boolean;
  /** 사이드바 토글 */
  toggleSidebar: () => void;
  /** 사이드바 설정 */
  setSidebarOpen: (isOpen: boolean) => void;
  /** 모바일 네비게이션 토글 */
  toggleMobileNav: () => void;
  /** 모바일 네비게이션 설정 */
  setMobileNavOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isMobileNavOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
  setMobileNavOpen: (isOpen) => set({ isMobileNavOpen: isOpen }),
}));
