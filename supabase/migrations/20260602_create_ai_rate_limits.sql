-- AI Edge Function(daily-fortune, analyze-constellation) 호출 rate limit 기록
-- cost-DoS(인증 없는 무제한 OpenAI 호출) 방지를 위해 식별자(IP 또는 user id) + 엔드포인트별로 호출을 집계한다.
CREATE TABLE IF NOT EXISTS ai_rate_limits (
  id BIGSERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,        -- 비로그인: IP, 로그인: user id
  endpoint TEXT NOT NULL,          -- 'daily-fortune' | 'analyze-constellation'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 윈도우 집계 조회 최적화
CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_lookup
  ON ai_rate_limits (identifier, endpoint, created_at DESC);

-- RLS: Edge Function(service_role)만 접근
ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages ai_rate_limits"
  ON ai_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 원자적 rate limit 체크+기록
-- 동일 (identifier, endpoint)에 대해 advisory lock으로 직렬화하여
-- 동시 요청이 같은 카운트를 보고 모두 통과하는 race를 방지한다.
CREATE OR REPLACE FUNCTION ai_rate_limit_hit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_per_minute INT,
  p_per_hour INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_minute_count INT;
  v_hour_count INT;
BEGIN
  -- identifier+endpoint 단위 직렬화 (트랜잭션 종료 시 자동 해제)
  PERFORM pg_advisory_xact_lock(hashtext(p_identifier || ':' || p_endpoint));

  SELECT count(*) INTO v_hour_count
  FROM ai_rate_limits
  WHERE identifier = p_identifier AND endpoint = p_endpoint
    AND created_at >= now() - interval '1 hour';

  SELECT count(*) INTO v_minute_count
  FROM ai_rate_limits
  WHERE identifier = p_identifier AND endpoint = p_endpoint
    AND created_at >= now() - interval '1 minute';

  IF v_minute_count >= p_per_minute THEN
    RETURN jsonb_build_object('allowed', false, 'retry_after', 60);
  END IF;
  IF v_hour_count >= p_per_hour THEN
    RETURN jsonb_build_object('allowed', false, 'retry_after', 3600);
  END IF;

  INSERT INTO ai_rate_limits (identifier, endpoint) VALUES (p_identifier, p_endpoint);

  -- 오래된 기록 정리(과부하 방지 위해 가끔만 수행)
  IF random() < 0.02 THEN
    DELETE FROM ai_rate_limits WHERE created_at < now() - interval '2 hours';
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION ai_rate_limit_hit(TEXT, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ai_rate_limit_hit(TEXT, TEXT, INT, INT) TO service_role;
