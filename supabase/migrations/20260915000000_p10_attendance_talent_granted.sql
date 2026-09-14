-- 출석 인원 일괄 달란트 부여 기능: 이미 부여된 출석 건에 중복 부여하지 않기 위한 표시 컬럼
alter table public.attendance
  add column if not exists talent_granted_at timestamptz;
