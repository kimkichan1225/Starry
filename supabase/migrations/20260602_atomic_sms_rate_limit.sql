-- SMS 발송 rate limit 원자화 + fail-open 제거
-- 기존 _shared/rate-limit.ts는 (1) 조회 에러 시 allowed=true로 통과(fail-open)하고,
-- (2) 검사와 기록(recordRequest)이 분리되어 동시 요청이 같은 카운트를 보고 모두 통과하는
-- race가 있었다. 이를 advisory lock 기반 원자 RPC로 대체한다(에러는 호출측에서 fail-closed).
CREATE OR REPLACE FUNCTION public.sms_rate_limit_hit(
  p_phone TEXT,
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
  -- 전화번호 단위 직렬화 (트랜잭션 종료 시 자동 해제)
  PERFORM pg_advisory_xact_lock(hashtext('sms_rl:' || p_phone));

  SELECT count(*) INTO v_hour_count
  FROM public.sms_rate_limits
  WHERE phone_number = p_phone
    AND window_start >= now() - interval '1 hour';

  SELECT count(*) INTO v_minute_count
  FROM public.sms_rate_limits
  WHERE phone_number = p_phone
    AND window_start >= now() - interval '1 minute';

  IF v_minute_count >= p_per_minute THEN
    RETURN jsonb_build_object('allowed', false, 'retry_after', 60);
  END IF;
  IF v_hour_count >= p_per_hour THEN
    RETURN jsonb_build_object('allowed', false, 'retry_after', 3600);
  END IF;

  INSERT INTO public.sms_rate_limits (phone_number, request_count, window_start)
  VALUES (p_phone, 1, now())
  ON CONFLICT (phone_number, window_start) DO NOTHING;

  -- 오래된 기록 정리(가끔만)
  IF random() < 0.05 THEN
    DELETE FROM public.sms_rate_limits WHERE window_start < now() - interval '1 hour';
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sms_rate_limit_hit(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sms_rate_limit_hit(TEXT, INT, INT) TO service_role;
