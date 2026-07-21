import { create } from 'zustand';
import type { User } from '@/types/database';

/**
 * 인증 상태 관리 스토어
 */
interface AuthState {
  /** 현재 로그인한 사용자 */
  user: User | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 사용자 정보 설정 */
  setUser: (user: User | null) => void;
  /** 로딩 상태 설정 */
  setLoading: (isLoading: boolean) => void;
  /** 로그아웃 (상태 초기화) */
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, isLoading: false }),
}));
