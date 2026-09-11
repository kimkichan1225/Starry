-- 전화번호·이메일 선점 방지 1단계 (기존 프론트와 호환 — 즉시 적용 가능)
-- 기존: 가입 트리거가 클라이언트가 보낸 메타데이터의 phone을 그대로 profiles에 복사하고,
--       email_exists / phone_exists / find_email_by_phone이 클라이언트가 쓸 수 있는 profiles 컬럼을 기준으로 동작
--   → 남의 번호·이메일로 먼저 가입해 실제 주인의 가입을 막거나, 이메일 찾기 결과를 오염시킬 수 있었다.
-- 변경: 서버가 확정한 값(auth.users.email, app_metadata.phone)만 기준으로 삼는다.
-- 2단계(클라이언트의 phone/email 쓰기 권한 회수)는 20260911_phone_verified_enforcement.sql (프론트 배포 시 적용)

BEGIN;

-- 1) 가입 트리거: 메타데이터의 phone은 복사하지 않고, email은 auth.users에서 채운다 ------------
--    (profiles.phone은 confirm-phone Edge Function이 인증 확정 시 서버에서 기록)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'nickname', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2) auth.users 이메일 변경 시 profiles.email 동기화 -----------------------------------
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_profile_email();

-- 3) 기존 데이터 정리 ---------------------------------------------------------------
-- profiles.email을 실제 계정 이메일로 맞춘다
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id
  AND p.email IS DISTINCT FROM u.email;

-- 서버 인증으로 확정되지 않은 전화번호는 비운다 (미인증 계정의 번호 선점 해제)
UPDATE public.profiles p
SET phone = NULL
FROM auth.users u
WHERE u.id = p.id
  AND p.phone IS NOT NULL
  AND (
    coalesce(u.raw_app_meta_data->>'phone_verified', 'false') <> 'true'
    OR u.raw_app_meta_data->>'phone' IS DISTINCT FROM p.phone
  );

-- 4) 가입 여부/이메일 찾기 함수: 서버 확정 값 기준으로 교체 (시그니처·실행 권한은 기존 유지) ---------
CREATE OR REPLACE FUNCTION public.email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE lower(email) = lower(btrim(p_email))
  );
$$;

CREATE OR REPLACE FUNCTION public.phone_exists(p_phone TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE raw_app_meta_data->>'phone' = p_phone
      AND raw_app_meta_data->>'phone_verified' = 'true'
  );
$$;

CREATE OR REPLACE FUNCTION public.find_email_by_phone(p_verification_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_email TEXT;
BEGIN
  -- 원자 소비: 미사용 + verified + 최근(10분) 기록만
  UPDATE public.phone_verifications
  SET consumed_at = now()
  WHERE id = p_verification_id
    AND verified = true
    AND consumed_at IS NULL
    AND updated_at >= now() - interval '10 minutes'
  RETURNING phone_number INTO v_phone;

  IF v_phone IS NULL THEN
    RETURN NULL;
  END IF;

  -- 해당 번호로 서버 인증을 마친 계정의 실제 이메일
  SELECT email INTO v_email
  FROM auth.users
  WHERE raw_app_meta_data->>'phone' = v_phone
    AND raw_app_meta_data->>'phone_verified' = 'true'
  ORDER BY created_at
  LIMIT 1;

  RETURN v_email;
END;
$$;

-- 5) 휴대전화 인증 여부 (JWT의 서버 확정 app_metadata 기준) — RLS·함수에서 사용 ------------------
CREATE OR REPLACE FUNCTION public.is_phone_verified()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'phone_verified', 'false') = 'true';
$$;

REVOKE ALL ON FUNCTION public.is_phone_verified() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_phone_verified() TO anon, authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
