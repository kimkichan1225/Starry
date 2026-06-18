-- 사용자별 "오늘의 운세" 저장 테이블
-- (user_id, fortune_date)를 PK로 두어 아이디당 하루 1행만 존재하도록 강제한다.
-- daily-fortune Edge Function이 이 테이블을 캐시로 사용해
-- 같은 날 두 번째 요청부터는 OpenAI 재호출 없이 저장된 운세를 반환한다(아이디당 하루 1회).
CREATE TABLE IF NOT EXISTS daily_fortunes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fortune_date DATE NOT NULL,        -- 운세 기준 날짜 (Edge Function에서 UTC 기준으로 계산)
  fortune JSONB NOT NULL,            -- 운세 JSON (message, explanation, love/health/wealth, luckyItem, emotionImage 등)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, fortune_date)
);

-- RLS: Edge Function(service_role)만 접근. 클라이언트는 항상 Edge Function을 경유한다.
ALTER TABLE daily_fortunes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages daily_fortunes"
  ON daily_fortunes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 오래된 운세 정리용 인덱스(선택적 배치 삭제 시 활용)
CREATE INDEX IF NOT EXISTS idx_daily_fortunes_date
  ON daily_fortunes (fortune_date);
