-- 밤하늘 초대코드 우회 차단 + 생성/입장 RPC 전용 계약 강화
--
-- 1) "Users can join skies as themselves"는 인증된 사용자가 임의의 sky_id로
--    자기 자신을 sky_members에 직접 INSERT 할 수 있게 해, 초대 코드 없이 아무 밤하늘에나
--    입장할 수 있는 우회 경로였다. 제거한다.
--    (정상 입장은 invite_code를 검증하는 join_sky_by_code RPC로만 가능)
DROP POLICY IF EXISTS "Users can join skies as themselves" ON sky_members;

-- 2) "Authenticated users can create skies" 직접 INSERT 정책은 현재 앱이 create_sky RPC만
--    사용하므로 죽은 경로다. 게다가 직접 skies INSERT 시 owner 추가 트리거가 (위에서 제거한)
--    sky_members INSERT 정책에 의존해 깨지는 회귀를 만든다. 제거하여 생성도 RPC 전용으로 못박는다.
--    (create_sky는 SECURITY DEFINER라 정책과 무관하게 정상 동작)
DROP POLICY IF EXISTS "Authenticated users can create skies" ON skies;

-- 3) join_sky_by_code(SECURITY DEFINER) 하드닝: search_path 고정 + 실행 권한 제한.
--    (다른 정의자 함수 create_sky/is_sky_member와 동일한 안전 패턴으로 통일)
CREATE OR REPLACE FUNCTION join_sky_by_code(p_code TEXT)
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

  SELECT id INTO v_sky_id
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

REVOKE EXECUTE ON FUNCTION join_sky_by_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION join_sky_by_code(TEXT) TO authenticated;
