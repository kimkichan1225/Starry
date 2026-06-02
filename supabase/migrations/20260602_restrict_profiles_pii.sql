-- 전화번호/이메일 등 PII 전체 공개 차단
-- 기존 "Anyone can view profiles" USING(true) 정책은 phone/email/birthdate를 포함한
-- 모든 사용자 프로필을 anon 포함 누구나 select 할 수 있게 해, 전화번호/이메일 대량 수집이 가능했다.
--
-- 변경:
-- 1) profiles SELECT는 본인 + 관리자만 가능하도록 제한
-- 2) 공개로 필요한 닉네임/슬롯은 public_profiles 뷰로만 노출 (PII 컬럼 제외)
-- 3) 회원가입 중복확인/아이디·비번찾기 등 민감 조회는 최소 정보만 반환하는 RPC로 대체

-- 1) 전체 공개 SELECT 정책 제거 ----------------------------------------------
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- 본인만 자신의 전체 프로필 조회 가능
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 관리자(admin@admin.com)는 전체 조회 가능 (AdminPage 통계/목록용)
-- JWT의 email 클레임을 사용한다(정책 USING에서 auth.users 직접 조회는 권한 문제로 실패할 수 있음).
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    (auth.jwt() ->> 'email') = 'admin@admin.com'
  );

-- 2) 공개 프로필 뷰 (PII 제외: id, nickname, max_sky_slots만) ------------------
-- 정의자(postgres) 권한으로 동작해 profiles RLS를 우회하되, 안전한 컬럼만 노출한다.
-- (설문 공유/3D 밤하늘에서 타인의 닉네임 표시에 사용)
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, nickname, max_sky_slots
  FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 3) 민감 조회 RPC ------------------------------------------------------------
-- 이메일 가입 여부 (회원가입 중복확인 / 비밀번호 찾기). boolean만 반환.
CREATE OR REPLACE FUNCTION public.email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE email = p_email);
$$;

REVOKE EXECUTE ON FUNCTION public.email_exists(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_exists(TEXT) TO anon, authenticated;

-- 전화번호 가입 여부 (회원가입/프로필설정 중복확인). boolean만 반환.
CREATE OR REPLACE FUNCTION public.phone_exists(p_phone TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE phone = p_phone);
$$;

REVOKE EXECUTE ON FUNCTION public.phone_exists(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.phone_exists(TEXT) TO anon, authenticated;

-- 아이디(이메일) 찾기: 호출자가 방금 수행한 SMS 인증(verificationId)을 단회성으로 소비하고,
-- 그 인증의 전화번호에 해당하는 이메일을 반환한다.
-- (verificationId는 인증을 직접 수행한 호출자에게만 전달되는 비밀 UUID → 타인 전화번호로 조회 불가.
--  원자 소비로 재사용/리플레이 차단. phone은 클라 입력이 아니라 소비된 행에서 읽는다.)
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

  SELECT email INTO v_email FROM public.profiles WHERE phone = v_phone LIMIT 1;
  RETURN v_email;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.find_email_by_phone(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_email_by_phone(UUID) TO anon, authenticated;
