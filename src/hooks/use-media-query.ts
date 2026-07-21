'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { BREAKPOINTS } from '@/lib/constants';

/**
 * 반응형 미디어 쿼리 훅
 * useSyncExternalStore를 사용하여 안전하게 동기화
 * @param query - CSS 미디어 쿼리 문자열 (예: '(min-width: 768px)')
 * @returns 미디어 쿼리 매칭 여부
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', callback);
      return () => media.removeEventListener('change', callback);
    },
    [query]
  );

  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * 모바일 여부 판별 훅
 * @returns true if viewport width < md breakpoint (768px)
 */
export function useIsMobile(): boolean {
  return !useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
}

/**
 * 데스크톱 여부 판별 훅
 * @returns true if viewport width >= lg breakpoint (1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}

