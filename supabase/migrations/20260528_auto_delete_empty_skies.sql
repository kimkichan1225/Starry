-- 멤버가 한 명도 남지 않은 밤하늘을 자동 삭제하는 트리거
-- sky_members 의 마지막 멤버가 나가면 skies 행도 함께 제거된다.

CREATE OR REPLACE FUNCTION delete_empty_sky()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- skies CASCADE 삭제 중 호출된 경우엔 (skies 행이 이미 사라짐) 아무것도 안 함
  IF NOT EXISTS (SELECT 1 FROM skies WHERE id = OLD.sky_id) THEN
    RETURN OLD;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM sky_members WHERE sky_id = OLD.sky_id) THEN
    DELETE FROM skies WHERE id = OLD.sky_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_delete_empty_sky ON sky_members;
CREATE TRIGGER trg_delete_empty_sky
  AFTER DELETE ON sky_members
  FOR EACH ROW
  EXECUTE FUNCTION delete_empty_sky();
