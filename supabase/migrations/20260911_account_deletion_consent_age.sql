-- 회원 탈퇴 · 약관 동의 기록 · 만 14세 미만 가입 차단 · 휴대폰 인증 기록 파기
-- 기존 프론트와 호환 — 즉시 적용 가능
-- (탈퇴·동의 기능 자체는 새 프론트와 delete-account Edge Function 배포 후 사용)

BEGIN;

-- 1) 약관·개인정보 동의 기록 컬럼 ----------------------------------------------------------
--    클라이언트는 직접 쓸 수 없고 record_consent RPC만 서버 시각으로 기록한다.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS privacy_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_version TEXT;

REVOKE INSERT (terms_agreed_at, terms_version, privacy_agreed_at, privacy_version),
       UPDATE (terms_agreed_at, terms_version, privacy_agreed_at, privacy_version)
  ON public.profiles FROM anon, authenticated;

-- 2) 만 14세 미만 생년월일 저장 거부 -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_min_signup_age()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_birthdate DATE;
BEGIN
  IF NEW.birthdate IS NULL OR NEW.birthdate::TEXT = '' THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_birthdate := NEW.birthdate::TEXT::DATE;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'invalid_birthdate' USING ERRCODE = '22007';
  END;

  IF v_birthdate > (current_date - interval '14 years')::DATE THEN
    RAISE EXCEPTION 'under_14' USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_min_signup_age ON public.profiles;
CREATE TRIGGER trg_profiles_min_signup_age
  BEFORE INSERT OR UPDATE OF birthdate ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_min_signup_age();

-- 3) 동의 기록 RPC ------------------------------------------------------------------------
--    생년월일이 먼저 profiles에 저장돼 있어야 하며, 만 14세 미만이면 기록하지 않는다.
--    (동의 기록이 없으면 프론트 라우트 가드가 서비스 이용을 막는다)
CREATE OR REPLACE FUNCTION public.record_consent(p_terms_version TEXT, p_privacy_version TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_birthdate_text TEXT;
  v_birthdate DATE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF coalesce(btrim(p_terms_version), '') = '' OR coalesce(btrim(p_privacy_version), '') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_request');
  END IF;

  SELECT birthdate::TEXT INTO v_birthdate_text FROM public.profiles WHERE id = v_uid;

  BEGIN
    v_birthdate := nullif(v_birthdate_text, '')::DATE;
  EXCEPTION WHEN OTHERS THEN
    v_birthdate := NULL;
  END;

  IF v_birthdate IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'birthdate_required');
  END IF;

  IF v_birthdate > (current_date - interval '14 years')::DATE THEN
    RETURN jsonb_build_object('success', false, 'error', 'under_14');
  END IF;

  UPDATE public.profiles
  SET terms_agreed_at = now(),
      terms_version = left(btrim(p_terms_version), 20),
      privacy_agreed_at = now(),
      privacy_version = left(btrim(p_privacy_version), 20)
  WHERE id = v_uid;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.record_consent(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_consent(TEXT, TEXT) TO authenticated;

-- 4) 회원 탈퇴: 계정과 데이터 즉시 삭제 ----------------------------------------------------------
--    delete-account Edge Function(본인 탈퇴)과 admin_delete_user(관리자)가 공통으로 사용한다. service_role 전용.
--    ※ 결제기록(payments, star_dust_transactions)은 현재 테스트 결제뿐이라 계정과 함께 삭제된다.
--      실결제(포트원) 전환 시 전자상거래법 5년 보존 대상으로 분리해야 한다.
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_sky RECORD;
  v_next_owner UUID;
BEGIN
  SELECT raw_app_meta_data->>'phone' INTO v_phone FROM auth.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- 방장인 비공개 밤하늘: 가장 먼저 들어온 다른 멤버에게 방장 이전, 다른 멤버가 없으면 삭제
  FOR v_sky IN SELECT id FROM public.skies WHERE owner_id = p_user_id FOR UPDATE LOOP
    SELECT user_id INTO v_next_owner
    FROM public.sky_members
    WHERE sky_id = v_sky.id AND user_id <> p_user_id
    ORDER BY joined_at ASC NULLS LAST, user_id
    LIMIT 1;

    IF v_next_owner IS NULL THEN
      DELETE FROM public.skies WHERE id = v_sky.id;
    ELSE
      UPDATE public.skies SET owner_id = v_next_owner WHERE id = v_sky.id;
    END IF;
  END LOOP;

  DELETE FROM public.star_connections WHERE user_id = p_user_id;
  DELETE FROM public.stars WHERE user_id = p_user_id;
  DELETE FROM public.survey_submit_logs WHERE target_user_id = p_user_id;
  DELETE FROM public.ai_rate_limits WHERE identifier = p_user_id::TEXT;

  IF v_phone IS NOT NULL THEN
    DELETE FROM public.phone_verifications WHERE phone_number = v_phone;
  END IF;

  -- auth.users 삭제 시 profiles, sky_constellations, sky_members, daily_fortunes,
  -- payments, star_dust_transactions는 ON DELETE CASCADE로 함께 삭제된다.
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account(UUID) TO service_role;

-- 5) admin_delete_user: 같은 삭제 로직 사용 + search_path 고정 (실행 권한은 기존 유지) ---------------------
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_email TEXT;
BEGIN
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();

  IF caller_email IS NULL OR caller_email != 'admin@admin.com' THEN
    RAISE EXCEPTION '관리자 권한이 필요합니다.';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION '자기 자신은 삭제할 수 없습니다.';
  END IF;

  PERFORM public.delete_user_account(target_user_id);
END;
$$;

-- 6) 휴대폰 인증 기록 파기: 만료 후 30일이 지난 기록을 새 인증 요청이 들어올 때 정리 -----------------------------
CREATE OR REPLACE FUNCTION public.cleanup_expired_phone_verifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.phone_verifications WHERE expires_at < now() - interval '30 days';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_expired_phone_verifications ON public.phone_verifications;
CREATE TRIGGER trg_cleanup_expired_phone_verifications
  AFTER INSERT ON public.phone_verifications
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_expired_phone_verifications();

COMMIT;

NOTIFY pgrst, 'reload schema';
