import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../auth-store';
import type { User } from '@/types/database';

const MOCK_USER: User = {
  id: 'test-user-123',
  email: 'teacher@church.org',
  role: 'teacher',
  department_id: 1,
  full_name: '김교사',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
} as User;

describe('Auth Store (인증 스토어)', () => {
  // Reset store before each test
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: true });
  });

  // ST-01: 초기 상태 검증
  it('ST-01: 초기 상태는 user=null, isLoading=true이다', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  // ST-02: setUser 동작 검증
  it('ST-02: setUser 호출 시 사용자 정보를 설정하고 로딩을 false로 변경한다', () => {
    useAuthStore.getState().setUser(MOCK_USER);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(MOCK_USER);
    expect(state.user?.email).toBe('teacher@church.org');
    expect(state.isLoading).toBe(false);
  });

  // ST-03: setUser(null) 동작 검증
  it('ST-03: setUser(null) 호출 시 사용자 정보를 초기화한다', () => {
    useAuthStore.setState({ user: MOCK_USER, isLoading: false });
    useAuthStore.getState().setUser(null);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  // ST-04: setLoading 동작 검증
  it('ST-04: setLoading 호출 시 로딩 상태를 변경한다', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);

    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  // ST-05: reset 동작 검증
  it('ST-05: reset 호출 시 user=null, isLoading=false로 초기화된다', () => {
    useAuthStore.setState({ user: MOCK_USER, isLoading: true });

    useAuthStore.getState().reset();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  // ST-06: isAuthenticated 계산 검증 (user 유무로 확인)
  it('ST-06: 사용자가 설정된 경우 user 속성이 존재한다', () => {
    useAuthStore.getState().setUser(MOCK_USER);
    expect(useAuthStore.getState().user).not.toBeNull();
  });
});
