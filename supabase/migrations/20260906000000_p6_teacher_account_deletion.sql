-- 교사 계정 삭제를 지원하기 위해, recorded_by(누가 기록했는지) 외래키를
-- ON DELETE SET NULL로 변경합니다. 계정이 삭제되어도 출석/달란트/예산
-- 기록 자체는 남고, "기록자" 정보만 NULL로 남습니다.

ALTER TABLE public.attendance
  DROP CONSTRAINT attendance_recorded_by_fkey,
  ADD CONSTRAINT attendance_recorded_by_fkey
    FOREIGN KEY (recorded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.talent_transactions
  DROP CONSTRAINT talent_transactions_recorded_by_fkey,
  ADD CONSTRAINT talent_transactions_recorded_by_fkey
    FOREIGN KEY (recorded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.budget_transactions
  DROP CONSTRAINT budget_transactions_recorded_by_fkey,
  ADD CONSTRAINT budget_transactions_recorded_by_fkey
    FOREIGN KEY (recorded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
