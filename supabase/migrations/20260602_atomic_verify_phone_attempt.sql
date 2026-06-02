-- SMS 인증 검증 원자화
-- 기존 verify-sms는 시도횟수 조회/검사/증가가 분리되어, 병렬 요청이 같은 attempts 값을 보고
-- 모두 통과하면 5회 제한을 우회해 6자리 OTP를 무차별 시도할 수 있었다.
-- 행 잠금(FOR UPDATE)으로 동일 행에 대한 검증을 직렬화하여 시도횟수 제한을 원자적으로 보장한다.
CREATE OR REPLACE FUNCTION verify_phone_attempt(p_phone TEXT, p_code_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row phone_verifications%ROWTYPE;
BEGIN
  -- 최신 미검증 행을 잠금 (동시 요청 직렬화)
  SELECT * INTO v_row
  FROM phone_verifications
  WHERE phone_number = p_phone AND verified = false
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  IF v_row.expires_at < now() THEN
    RETURN jsonb_build_object('status', 'expired');
  END IF;

  IF v_row.attempts >= 5 THEN
    RETURN jsonb_build_object('status', 'max_attempts');
  END IF;

  -- 시도 횟수 증가 (행 잠금 상태이므로 원자적)
  UPDATE phone_verifications
  SET attempts = attempts + 1
  WHERE id = v_row.id;

  -- 코드 불일치
  IF v_row.verification_code_hash <> p_code_hash THEN
    RETURN jsonb_build_object('status', 'invalid', 'remaining', GREATEST(5 - (v_row.attempts + 1), 0));
  END IF;

  -- 성공: verified 처리
  UPDATE phone_verifications
  SET verified = true, updated_at = now()
  WHERE id = v_row.id;

  RETURN jsonb_build_object('status', 'success', 'id', v_row.id);
END;
$$;

REVOKE EXECUTE ON FUNCTION verify_phone_attempt(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_phone_attempt(TEXT, TEXT) TO service_role;
