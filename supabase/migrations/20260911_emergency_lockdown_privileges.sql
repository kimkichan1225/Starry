-- 긴급 권한 차단 (2026-09-11 출시 전 점검에서 라이브 DB로 확인된 항목)
-- Supabase는 public 스키마의 새 테이블/뷰/함수에 anon·authenticated 권한을 직접 부여한다.
-- 기존 마이그레이션의 `REVOKE ... FROM PUBLIC`과 컬럼 단위 REVOKE로는 이 권한이 회수되지 않았다.
-- 클라이언트 기능을 깨지 않는 범위의 최소 차단만 포함한다. (설문 stars SELECT 공개 등 코드 변경이 필요한 항목은 별도)

BEGIN;

-- 1) public_profiles 뷰: 자동 쓰기 가능 뷰 + 정의자 권한이라 anon이 profiles RLS를 우회해 UPDATE/DELETE 가능했음
--    클라이언트는 SELECT(nickname, max_sky_slots)만 사용한다.
REVOKE ALL ON public.public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2) service_role 전용 함수: anon/authenticated가 rpc로 직접 호출해 별가루 발급·차감, 레이트리밋 조작이 가능했음
--    모두 Edge Function의 service role 클라이언트(admin)에서만 호출한다.
REVOKE EXECUTE ON FUNCTION public.credit_star_dust(UUID, INTEGER, TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expand_storage(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_ai_rename_credit(UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_ai_rename_credit(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sms_rate_limit_hit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_phone_attempt(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ai_rate_limit_hit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;

-- admin_delete_user는 AdminPage(로그인 사용자)에서 호출하고 함수 내부에서 관리자 여부를 검사한다. anon만 회수.
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

-- 앞으로 만드는 함수는 기본적으로 anon/authenticated가 실행할 수 없게 한다.
-- (클라이언트용 RPC는 기존 마이그레이션처럼 GRANT EXECUTE ... TO authenticated를 명시해야 함)
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- 3) profiles: 테이블 단위 INSERT/UPDATE가 남아 있어 컬럼 단위 REVOKE가 무효였음
--    테이블 단위 권한을 회수하고, 권한성 컬럼(잔액/슬롯/AI 사용횟수)을 제외한 컬럼만 다시 부여한다.
--    SignupPage/ProfileSetupPage upsert는 id, email, nickname, phone, birthdate, social_linked만 보낸다.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE INSERT, UPDATE ON public.profiles FROM authenticated;

DO $$
DECLARE
  v_cols TEXT;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
    INTO v_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name NOT IN ('star_dust_balance', 'max_sky_slots', 'ai_rename_used_count');

  EXECUTE format('GRANT INSERT (%s), UPDATE (%s) ON public.profiles TO authenticated', v_cols, v_cols);
END $$;

-- 4) stars INSERT: WITH CHECK (true)라 image_url에 상점 이미지를 넣어 유료 별을 무료로 만들 수 있었음
--    설문 저장은 image_url을 보내지 않고, 구매는 purchase_star_item(SECURITY DEFINER)이 넣으므로 영향 없음.
DROP POLICY IF EXISTS "Anyone can insert stars" ON public.stars;
CREATE POLICY "Anyone can insert stars"
  ON public.stars
  FOR INSERT
  WITH CHECK (image_url IS NULL);

-- 5) notices: 정책이 하나도 없었음. RLS를 켜고 조회는 공개, 쓰기는 관리자만 허용한다.
--    (관리자 판정은 기존 정책과 동일한 이메일 기준 — app_metadata.role 전환은 별도 작업)
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view notices" ON public.notices;
CREATE POLICY "Anyone can view notices"
  ON public.notices
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage notices" ON public.notices;
CREATE POLICY "Admins can manage notices"
  ON public.notices
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'admin@admin.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@admin.com');

COMMIT;
