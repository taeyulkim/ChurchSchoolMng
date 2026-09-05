-- 일정을 부서별 또는 공통으로 등록할 수 있도록 department 컬럼 추가.
-- NULL = 모든 부서에 공개되는 공통 일정.
ALTER TABLE public.events
ADD COLUMN department department_type;
