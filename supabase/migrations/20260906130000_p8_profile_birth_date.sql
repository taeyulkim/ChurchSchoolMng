-- 교사(profiles)의 생일을 일정 관리에 자동으로 표시하기 위해 생년월일 컬럼 추가
ALTER TABLE public.profiles
ADD COLUMN birth_date DATE;
