-- 교사 승인 상태(status), 메뉴 권한(permissions), 역할(role) 변경은
-- 오직 마스터 관리자(mykty276@gmail.com, 김태율) 계정만 할 수 있도록 강제합니다.
-- 애플리케이션 코드에서의 체크와 별개로, DB 트리거로 강제해서 API를 직접
-- 호출하는 방식으로도 우회할 수 없게 합니다.

CREATE OR REPLACE FUNCTION public.enforce_master_admin_permission_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.status IS DISTINCT FROM OLD.status
      OR NEW.permissions IS DISTINCT FROM OLD.permissions
      OR NEW.role IS DISTINCT FROM OLD.role)
     AND COALESCE(auth.jwt() ->> 'email', '') <> 'mykty276@gmail.com' THEN
    RAISE EXCEPTION '승인 상태/권한/역할 변경은 마스터 관리자만 가능합니다.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_master_admin_profile_changes ON public.profiles;
CREATE TRIGGER trg_enforce_master_admin_profile_changes
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_master_admin_permission_changes();
