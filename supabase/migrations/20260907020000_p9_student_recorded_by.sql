-- 학생 등록 로그에 실제 등록한 교사 이름이 남도록 recorded_by 컬럼 추가
-- (달란트/출석/예산과 동일하게, 교사 계정이 삭제되어도 기록 자체는 남고 기록자만 비워짐)

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
