-- 개인정보 노출 차단 2단계: 로그인 없이 전체 회원 정보를 조회하던 경로 제거
-- 적용 조건: 20260911_admin_role_nickname_lookup.sql 적용 후
-- 운영 영향: 새 프론트 배포 전까지 구버전 화면의 설문 닉네임 표시, 3D 밤하늘 닉네임 표시,
--           회원가입 전화번호·이메일 중복 확인, 아이디·비밀번호 찾기 사전 확인이 실패한다.

BEGIN;

-- 1) 전체 회원 id·닉네임 목록 조회 차단 (닉네임은 get_public_nickname / get_constellation_nicknames로만 조회)
REVOKE ALL ON public.public_profiles FROM PUBLIC, anon, authenticated;

-- 2) 로그인 없이 이메일·전화번호 가입 여부를 무제한 조회하던 함수 차단
--    (이메일은 check_signup_email, 전화번호는 verify-sms 응답으로 인증을 마친 본인에게만 알려준다)
REVOKE EXECUTE ON FUNCTION public.email_exists(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.phone_exists(TEXT) FROM PUBLIC, anon, authenticated;

-- 3) 3D 밤하늘 별자리 목록은 로그인 사용자만 조회 (비로그인으로 회원 id 목록을 수집하는 경로 차단)
--    설문 링크의 밤하늘 보기는 get_survey_night_sky RPC를 사용하므로 영향 없음
DROP POLICY IF EXISTS "Anyone can view sky constellations" ON public.sky_constellations;
CREATE POLICY "Authenticated users can view sky constellations"
  ON public.sky_constellations
  FOR SELECT
  TO authenticated
  USING (true);

COMMIT;

NOTIFY pgrst, 'reload schema';
