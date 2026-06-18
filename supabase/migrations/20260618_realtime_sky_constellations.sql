-- 3D 밤하늘 실시간 반영을 위해 sky_constellations 테이블을 Realtime publication에 등록한다.
-- 이 설정이 있어야 클라이언트의 postgres_changes 구독으로 추가/수정/삭제 이벤트가 전달된다.
-- (Realtime은 RLS를 적용하므로 sky_constellations에 SELECT 정책이 있어야 구독자가 변경을 수신함)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sky_constellations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sky_constellations;
  END IF;
END
$$;

-- UPDATE/DELETE 이벤트에서 행 식별이 가능하도록 전체 행을 복제 식별자로 사용
ALTER TABLE sky_constellations REPLICA IDENTITY FULL;
