-- 교사 계정에도 학생처럼 "비활성화" 상태를 추가합니다.
-- 계정과 그동안 기록한 출석/달란트/예산 이력은 그대로 남기고 로그인만 막습니다.
-- (ADD VALUE는 같은 트랜잭션 내에서 바로 사용할 수 없으므로 이 값만 단독으로 추가합니다.)

ALTER TYPE public.profile_status ADD VALUE IF NOT EXISTS 'deactivated';
