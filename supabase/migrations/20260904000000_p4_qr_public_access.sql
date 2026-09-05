-- QR 로그인은 Supabase Auth 세션이 없는(anon) 상태로 학생 본인 정보를 조회해야 합니다.
-- students 테이블 RLS는 authenticated 역할에게만 허용되어 있어 anon 요청은 항상 0건이 반환되었습니다.
-- 테이블 자체를 anon에 공개하는 대신, qr_token으로 정확히 일치하는 학생 1명만 반환하는
-- SECURITY DEFINER 함수를 만들어 최소 권한으로 우회합니다.

CREATE OR REPLACE FUNCTION public.get_student_by_qr_token(p_token uuid)
RETURNS SETOF public.students
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.students
  WHERE qr_token = p_token AND is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_student_by_qr_token(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_student_by_qr_token(uuid) TO anon, authenticated;

-- 학생 본인의 최근 달란트 내역 (qr_token으로 본인 것만 조회, 다른 학생 정보는 노출하지 않음)
CREATE OR REPLACE FUNCTION public.get_student_talent_history(p_token uuid, p_limit int DEFAULT 5)
RETURNS SETOF public.talent_transactions
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tt.* FROM public.talent_transactions tt
  JOIN public.students s ON s.id = tt.student_id
  WHERE s.qr_token = p_token AND s.is_active = true
  ORDER BY tt.created_at DESC
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.get_student_talent_history(uuid, int) FROM public;
GRANT EXECUTE ON FUNCTION public.get_student_talent_history(uuid, int) TO anon, authenticated;

-- events는 개인정보가 없는 교회학교 공지 일정이므로 비로그인 학생도 조회 가능하도록 허용
CREATE POLICY "Allow anon read access to events" ON public.events FOR SELECT TO anon USING (true);
