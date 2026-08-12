-- 1. `students` 테이블에 `qr_token` 컬럼 추가 (학생용 QR 로그인 식별자)
ALTER TABLE public.students 
ADD COLUMN qr_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- 2. 교사 가입 승인 및 권한 부여를 위한 상태 타입 및 컬럼 추가
CREATE TYPE public.profile_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE public.profiles
ADD COLUMN status profile_status DEFAULT 'pending',
ADD COLUMN permissions JSONB DEFAULT '{"attendance": false, "talent": false, "budget": false, "items": false, "schedule": false}'::jsonb;

-- 기존 계정들은 모두 승인 상태로 변경 및 모든 권한 부여 (기존 시스템 유지)
UPDATE public.profiles
SET status = 'approved',
    permissions = '{"attendance": true, "talent": true, "budget": true, "items": true, "schedule": true, "users": true}'::jsonb;

-- 3. 학생(인증되지 않은 사용자)이 본인의 정보만 볼 수 있도록 RLS 정책 임시 설정 또는 Application Layer에서 보호
-- 이번 P2 단계에서는 서버 액션(Application Layer)에서 qr_token을 검증하여 데이터를 반환하는 방식으로 안전하게 구현합니다.

-- 끝.
