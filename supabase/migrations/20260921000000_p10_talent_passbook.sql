-- 달란트 통장 기능
-- 1) talent_transactions에 항목 구분(category)과 정정 연결(corrects_id)을 추가합니다.
-- 2) 달란트 부여 규정(talent_rules) 테이블을 만들고 2025 규정으로 초기화합니다.

-- 1) 항목 구분 / 정정 연결
ALTER TABLE public.talent_transactions
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS corrects_id bigint REFERENCES public.talent_transactions(id) ON DELETE SET NULL;

-- 기존 이력 채우기: 차감은 '사용', 출석 일괄 부여는 '출석', 나머지는 '기타'
UPDATE public.talent_transactions
SET category = CASE
  WHEN type = 'deduct' THEN 'use'
  WHEN reason = '출석 일괄 부여' THEN 'attendance'
  ELSE 'other'
END
WHERE category IS NULL;

ALTER TABLE public.talent_transactions DROP CONSTRAINT IF EXISTS talent_transactions_category_check;
ALTER TABLE public.talent_transactions
  ADD CONSTRAINT talent_transactions_category_check
  CHECK (category IS NULL OR category IN ('attendance', 'verse', 'evangelism', 'bible', 'birthday', 'other', 'use'));

-- 하나의 부여 건에는 정정을 한 번만 할 수 있습니다 (중복 정정 방지)
CREATE UNIQUE INDEX IF NOT EXISTS talent_transactions_one_correction_per_tx
  ON public.talent_transactions (corrects_id)
  WHERE corrects_id IS NOT NULL;

-- 2) 달란트 부여 규정
CREATE TABLE IF NOT EXISTS public.talent_rules (
  category text PRIMARY KEY CHECK (category IN ('attendance', 'verse', 'evangelism', 'bible', 'birthday')),
  label text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.talent_rules (category, label, amount, sort_order) VALUES
  ('attendance', '출석', 2, 1),
  ('verse', '암송', 1, 2),
  ('evangelism', '전도', 5, 3),
  ('bible', '성경책', 1, 4),
  ('birthday', '생일', 5, 5)
ON CONFLICT (category) DO NOTHING;

ALTER TABLE public.talent_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "talent_rules_select_authenticated" ON public.talent_rules;
CREATE POLICY "talent_rules_select_authenticated" ON public.talent_rules
  FOR SELECT TO authenticated USING (true);

-- 규정 수정은 마스터 관리자만 (앱 코드와 별개로 DB에서도 강제)
DROP POLICY IF EXISTS "talent_rules_update_master" ON public.talent_rules;
CREATE POLICY "talent_rules_update_master" ON public.talent_rules
  FOR UPDATE TO authenticated
  USING (COALESCE(auth.jwt() ->> 'email', '') = 'mykty276@gmail.com')
  WITH CHECK (COALESCE(auth.jwt() ->> 'email', '') = 'mykty276@gmail.com');
