-- 개인정보 노출 차단 1단계: 관리자 역할 기반 판정, 닉네임 단건 조회, 휴대폰 인증 후 이메일 중복 확인
-- 기존 프론트와 호환 — 즉시 적용 가능
-- ※ 적용 후 관리자 계정은 로그아웃 → 재로그인해야 새 권한(app_metadata.role)이 토큰에 반영된다.
-- 2단계(전체 닉네임 목록·가입 여부 조회 경로 제거)는 20260911_close_public_lookups.sql

BEGIN;

-- 1) 관리자 판정: 이메일 문자열 대신 JWT의 app_metadata.role (서버에서만 설정 가능) ------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 기존 관리자 계정에 역할 부여
UPDATE auth.users
SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'admin@admin.com';

-- 이메일 문자열로 관리자를 판정하던 모든 RLS 정책을 is_admin()으로 교체
-- (저장소 마이그레이션에 없는 운영 DB 정책까지 pg_policies 기준으로 모두 처리)
DO $$
DECLARE
  c_email_check CONSTANT TEXT := '((auth.jwt() ->> ''email''::text) = ''admin@admin.com''::text)';
  v_policy RECORD;
  v_using TEXT;
  v_check TEXT;
  v_sql TEXT;
BEGIN
  FOR v_policy IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE coalesce(qual, '') LIKE '%admin@admin.com%'
       OR coalesce(with_check, '') LIKE '%admin@admin.com%'
  LOOP
    v_using := replace(v_policy.qual, c_email_check, 'public.is_admin()');
    v_check := replace(v_policy.with_check, c_email_check, 'public.is_admin()');

    -- 예상과 다른 형태의 판정식이 있으면 중단한다 (트랜잭션 전체 롤백)
    IF coalesce(v_using, '') LIKE '%admin@admin.com%' OR coalesce(v_check, '') LIKE '%admin@admin.com%' THEN
      RAISE EXCEPTION '예상과 다른 관리자 정책: %.% (%)',
        v_policy.tablename, v_policy.policyname, coalesce(v_policy.qual, v_policy.with_check);
    END IF;

    v_sql := format('ALTER POLICY %I ON %I.%I', v_policy.policyname, v_policy.schemaname, v_policy.tablename);
    IF v_using IS NOT NULL THEN
      v_sql := v_sql || ' USING (' || v_using || ')';
    END IF;
    IF v_check IS NOT NULL THEN
      v_sql := v_sql || ' WITH CHECK (' || v_check || ')';
    END IF;

    EXECUTE v_sql;
  END LOOP;
END $$;

-- 관리자 통계용 연결선 전체 조회 (공개 조회 정책 제거 후 관리자 화면 연결 수 집계가 0으로 나오던 문제)
DROP POLICY IF EXISTS "Admins can view all star_connections" ON public.star_connections;
CREATE POLICY "Admins can view all star_connections"
  ON public.star_connections
  FOR SELECT
  USING (public.is_admin());

-- 관리자 회원 삭제 함수도 역할 기준으로 판정
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION '관리자 권한이 필요합니다.';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION '자기 자신은 삭제할 수 없습니다.';
  END IF;

  PERFORM public.delete_user_account(target_user_id);
END;
$$;

-- 2) 닉네임 조회: 전체 목록 대신 id를 알 때만 ----------------------------------------------------
-- 설문 링크(비로그인)에서 대상 회원 닉네임 표시용
CREATE OR REPLACE FUNCTION public.get_public_nickname(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nickname FROM public.profiles WHERE id = p_user_id;
$$;

REVOKE ALL ON FUNCTION public.get_public_nickname(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_nickname(UUID) TO anon, authenticated;

-- 3D 밤하늘 표시용: 밤하늘에 별자리를 등록한 회원의 닉네임만 (한 번에 최대 2000명)
CREATE OR REPLACE FUNCTION public.get_constellation_nicknames(p_user_ids UUID[])
RETURNS TABLE(id UUID, nickname TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.nickname
  FROM public.profiles p
  WHERE p.id = ANY (p_user_ids[1:2000])
    AND EXISTS (SELECT 1 FROM public.sky_constellations c WHERE c.user_id = p.id);
$$;

REVOKE ALL ON FUNCTION public.get_constellation_nicknames(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_constellation_nicknames(UUID[]) TO authenticated;

-- 3) 회원가입 이메일 중복 확인: 휴대폰 인증을 마친 요청만, 인증 1건당 분당 5회·시간당 20회 ------------------
-- (로그인 없이 임의 이메일의 가입 여부를 대량 조회하던 email_exists를 대체)
CREATE OR REPLACE FUNCTION public.check_signup_email(p_email TEXT, p_verification_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate_limit JSONB;
BEGIN
  -- 방금 휴대폰 인증을 마친(아직 가입에 사용되지 않은, 1시간 이내) 요청만 허용
  IF NOT EXISTS (
    SELECT 1 FROM public.phone_verifications
    WHERE id = p_verification_id
      AND verified = true
      AND consumed_at IS NULL
      AND updated_at >= now() - interval '1 hour'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'verification_required');
  END IF;

  v_rate_limit := public.ai_rate_limit_hit(p_verification_id::TEXT, 'signup-email-check', 5, 20);
  IF NOT coalesce((v_rate_limit->>'allowed')::BOOLEAN, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'too_many_requests');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'exists', EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(btrim(p_email)))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_signup_email(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_signup_email(TEXT, UUID) TO anon, authenticated;

-- verify-sms(service_role)가 인증 성공 시 이미 가입된 번호인지 확인할 수 있도록
GRANT EXECUTE ON FUNCTION public.phone_exists(TEXT) TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
