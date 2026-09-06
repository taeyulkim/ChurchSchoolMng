/**
 * 임시로 비활성화된 기능 목록.
 * 여기서 제거하면 즉시 다시 활성화됩니다 (별도 배포 외 추가 작업 불필요).
 */
export const DISABLED_FEATURES = ['items', 'budget', 'counseling'] as const;

export function isFeatureDisabled(key: string): boolean {
  return (DISABLED_FEATURES as readonly string[]).includes(key);
}
