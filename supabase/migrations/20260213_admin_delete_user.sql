-- 관리자 회원 삭제 함수
-- SECURITY DEFINER로 RLS를 우회하여 관리자가 다른 사용자 데이터를 삭제할 수 있게 함
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  caller_email TEXT;
BEGIN
  -- 호출자의 이메일 확인
  SELECT email INTO caller_email
  FROM auth.users
  WHERE id = auth.uid();

  -- 관리자 이메일인지 확인
  IF caller_email IS NULL OR caller_email != 'admin@admin.com' THEN
    RAISE EXCEPTION '관리자 권한이 필요합니다.';
  END IF;

  -- 자기 자신은 삭제 불가
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION '자기 자신은 삭제할 수 없습니다.';
  END IF;

  -- 관련 데이터 삭제 (CASCADE 없는 테이블 먼저 삭제)
  DELETE FROM public.star_connections WHERE user_id = target_user_id;
  DELETE FROM public.stars WHERE user_id = target_user_id;
  -- auth.users 삭제 시 profiles, sky_constellations는 ON DELETE CASCADE로 자동 삭제
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
