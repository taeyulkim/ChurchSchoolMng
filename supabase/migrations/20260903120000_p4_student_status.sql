-- 학생 비활성화(퇴반/휴반) 처리를 위한 상태 컬럼 추가
ALTER TABLE public.students
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
