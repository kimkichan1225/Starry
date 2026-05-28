-- create_sky RPC 의 반환 타입 불일치 수정
-- skies.name 은 VARCHAR(100), invite_code 는 VARCHAR(16) 이라
-- RETURNS TABLE 의 TEXT 와 일치하지 않아 42804 오류가 발생했다.
-- → RETURNING 절에서 명시적으로 ::TEXT 캐스트.

DROP FUNCTION IF EXISTS create_sky(TEXT);

CREATE OR REPLACE FUNCTION create_sky(p_name TEXT)
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

GRANT EXECUTE ON FUNCTION create_sky(TEXT) TO authenticated;
