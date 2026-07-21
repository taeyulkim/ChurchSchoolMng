import { redirect } from "next/navigation";

/**
 * 루트 페이지
 * - 로그인 상태에 따라 대시보드 또는 로그인 페이지로 리다이렉트
 * - 미들웨어에서 인증 체크를 수행하므로 여기서는 대시보드로 리다이렉트
 */
export default function HomePage() {
  redirect("/dashboard");
}
