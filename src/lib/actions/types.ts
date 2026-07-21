/**
 * Server Actions 표준 응답 인터페이스
 */
export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
