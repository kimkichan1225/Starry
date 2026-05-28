-- 밤하늘 생성 RPC (SECURITY DEFINER)
-- skies INSERT의 RLS WITH CHECK가 어떤 이유로든 실패하지 않도록
-- 인증된 사용자가 호출하면 owner_id를 auth.uid() 로 강제하여 INSERT 한다.

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
  RETURNING skies.id, skies.name, skies.invite_code, skies.owner_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_sky(TEXT) TO authenticated;
