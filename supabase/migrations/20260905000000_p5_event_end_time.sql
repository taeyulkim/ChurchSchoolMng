-- 일정에 종료 시각을 별도로 기록할 수 있도록 컬럼 추가 (선택 입력, NULL 허용)
ALTER TABLE public.events
ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
