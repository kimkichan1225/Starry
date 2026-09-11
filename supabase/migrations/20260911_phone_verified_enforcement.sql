-- 전화번호·이메일 선점 방지 2단계 + 휴대전화 인증 서버 강제
-- 적용 조건: 프론트(SignupPage/ProfileSetupPage가 profiles에 phone·email을 보내지 않는 버전)와
--           confirm-phone Edge Function(profiles.phone 서버 기록 버전)이 배포된 뒤
--   (먼저 적용하면 구버전 가입 화면의 profiles 저장이 권한 오류로 실패한다)

BEGIN;

-- 1) profiles.phone / email은 서버만 기록 ------------------------------------------------
--    phone: confirm-phone Edge Function(service role) / email: 가입·이메일 동기화 트리거
REVOKE INSERT (email, phone), UPDATE (email, phone) ON public.profiles FROM authenticated;

-- 2) 3D 하늘 별자리 등록·수정은 휴대전화 인증을 마친 계정만 --------------------------------------
DROP POLICY IF EXISTS "Users can insert their own constellation" ON public.sky_constellations;
CREATE POLICY "Users can insert their own constellation"
  ON public.sky_constellations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_phone_verified());

DROP POLICY IF EXISTS "Users can update their own constellation" ON public.sky_constellations;
CREATE POLICY "Users can update their own constellation"
  ON public.sky_constellations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.is_phone_verified());

-- 3) 비공개 밤하늘 생성·입장도 휴대전화 인증 계정만 (기존 본문 + 인증 확인) ---------------------------
CREATE OR REPLACE FUNCTION public.create_sky(p_name TEXT)
RETURNS TABLE(id UUID, name TEXT, invite_code TEXT, owner_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_clean TEXT := trim(coalesce(p_name, ''));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;
  IF NOT public.is_phone_verified() THEN
    RAISE EXCEPTION 'Phone verification required' USING ERRCODE = '42501';
  END IF;
  IF length(v_clean) = 0 THEN
    RAISE EXCEPTION 'Name is required' USING ERRCODE = '22023';
  END IF;
  IF length(v_clean) > 100 THEN
    v_clean := substr(v_clean, 1, 100);
  END IF;

  RETURN QUERY
  INSERT INTO skies (name, owner_id)
  VALUES (v_clean, v_uid)
  RETURNING skies.id, skies.name::TEXT, skies.invite_code::TEXT, skies.owner_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_sky_by_code(p_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sky_id UUID;
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;
  IF NOT public.is_phone_verified() THEN
    RAISE EXCEPTION 'Phone verification required' USING ERRCODE = '42501';
  END IF;

  SELECT skies.id INTO v_sky_id
  FROM skies
  WHERE invite_code = upper(trim(p_code));

  IF v_sky_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO sky_members (sky_id, user_id)
  VALUES (v_sky_id, v_uid)
  ON CONFLICT DO NOTHING;

  RETURN v_sky_id;
END;
$$;

COMMIT;
