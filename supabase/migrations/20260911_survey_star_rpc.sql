-- 설문 별 전송 / 설문 페이지 밤하늘 조회를 서버 함수로 이전
-- 기존: 브라우저가 stars에 직접 INSERT/SELECT
--   → 누구나 모든 설문 응답·설문자 이름 조회, 임의 값(in_sky, 별 속성)으로 별 무제한 삽입 가능
-- 변경: 입력 검증·별 속성 계산·밤하늘 슬롯 판정·전송 제한을 서버에서 수행하고,
--       밤하늘 조회는 그리기용 컬럼만 반환한다.
-- 적용 순서: 이 파일 → 프론트 배포 → 20260911_survey_drop_public_star_policies.sql

BEGIN;

-- 1) 전송 기록 (전송 제한 집계 전용, 클라이언트 접근 불가) -----------------------
CREATE TABLE IF NOT EXISTS public.survey_submit_logs (
  id BIGSERIAL PRIMARY KEY,
  target_user_id UUID NOT NULL,
  device_key TEXT NOT NULL,          -- 기기 ID의 md5 (원문은 저장하지 않음)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_survey_submit_logs_target
  ON public.survey_submit_logs (target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_survey_submit_logs_device
  ON public.survey_submit_logs (device_key, target_user_id, created_at DESC);

ALTER TABLE public.survey_submit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.survey_submit_logs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.survey_submit_logs_id_seq FROM PUBLIC, anon, authenticated;

-- 2) 설문 별 전송 ------------------------------------------------------------
-- 실패 시 예외 대신 { success: false, error } 를 반환해 클라이언트가 사유별 안내를 띄울 수 있게 한다.
CREATE OR REPLACE FUNCTION public.submit_survey_star(
  p_target_user_id UUID,
  p_surveyor_name TEXT,
  p_answers JSONB,
  p_device_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- 같은 기기 → 같은 대상 재전송 대기 시간
  c_device_cooldown CONSTANT INTERVAL := interval '10 minutes';
  -- 대상 1명당 비정상 폭주 차단 한도 (스크립트 공격 대비, 정상 사용에서는 도달하지 않는 수준)
  c_target_per_minute CONSTANT INTEGER := 30;
  c_target_per_hour CONSTANT INTEGER := 300;
  c_options CONSTANT TEXT[] := ARRAY['a', 'b', 'c', 'd'];

  v_name TEXT := btrim(coalesce(p_surveyor_name, ''));
  v_device_key TEXT;
  v_max_slots INTEGER;
  v_last_sent TIMESTAMPTZ;
  v_values INTEGER[] := ARRAY[]::INTEGER[];
  v_option_idx INTEGER;
  v_sky_count INTEGER;
  v_in_sky BOOLEAN;
BEGIN
  -- 입력 검증 ----------------------------------------------------------------
  IF char_length(v_name) < 1 OR char_length(v_name) > 20 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_name');
  END IF;

  IF p_device_id IS NULL OR p_device_id !~ '^[A-Za-z0-9-]{16,64}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_request');
  END IF;

  -- 응답은 {"1": "a", ..., "5": "d"} 형태만 허용
  IF p_answers IS NULL
     OR jsonb_typeof(p_answers) <> 'object'
     OR (SELECT count(*) FROM jsonb_object_keys(p_answers)) <> 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_answers');
  END IF;

  FOR i IN 1..5 LOOP
    v_option_idx := array_position(c_options, p_answers ->> i::TEXT);
    IF v_option_idx IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'invalid_answers');
    END IF;
    v_values := v_values || v_option_idx;
  END LOOP;

  -- 대상 확인 + 같은 대상으로의 동시 전송 직렬화 (슬롯 판정/제한 집계 경합 방지) -----
  SELECT max_sky_slots INTO v_max_slots
  FROM public.profiles
  WHERE id = p_target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'target_not_found');
  END IF;

  -- 전송 제한 ----------------------------------------------------------------
  v_device_key := md5(p_device_id);

  SELECT max(created_at) INTO v_last_sent
  FROM public.survey_submit_logs
  WHERE device_key = v_device_key
    AND target_user_id = p_target_user_id
    AND created_at > now() - c_device_cooldown;

  IF v_last_sent IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'device_cooldown',
      'retry_after_seconds',
      GREATEST(1, ceil(extract(epoch FROM (v_last_sent + c_device_cooldown - now())))::INTEGER)
    );
  END IF;

  IF (SELECT count(*) FROM public.survey_submit_logs
      WHERE target_user_id = p_target_user_id
        AND created_at > now() - interval '1 minute') >= c_target_per_minute
     OR (SELECT count(*) FROM public.survey_submit_logs
         WHERE target_user_id = p_target_user_id
           AND created_at > now() - interval '1 hour') >= c_target_per_hour THEN
    RETURN jsonb_build_object('success', false, 'error', 'too_many_requests');
  END IF;

  -- 밤하늘 슬롯이 가득 찼으면 창고로, 아니면 밤하늘로 --------------------------------
  SELECT count(*) INTO v_sky_count
  FROM public.stars
  WHERE user_id = p_target_user_id AND in_sky = true;

  v_in_sky := v_sky_count < coalesce(v_max_slots, 11);

  INSERT INTO public.stars (
    user_id, surveyor_name,
    star_color, star_points, star_size, star_saturation, star_sharpness,
    answers, in_sky
  ) VALUES (
    p_target_user_id, v_name,
    v_values[1], v_values[2], v_values[3], v_values[4], v_values[5],
    p_answers, v_in_sky
  );

  INSERT INTO public.survey_submit_logs (target_user_id, device_key)
  VALUES (p_target_user_id, v_device_key);

  -- 오래된 기록 정리 (가끔만 수행)
  IF random() < 0.02 THEN
    DELETE FROM public.survey_submit_logs WHERE created_at < now() - interval '2 hours';
  END IF;

  RETURN jsonb_build_object('success', true, 'in_sky', v_in_sky);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_survey_star(UUID, TEXT, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_survey_star(UUID, TEXT, JSONB, TEXT) TO anon, authenticated;

-- 3) 설문 페이지 밤하늘 조회 ---------------------------------------------------
-- 밤하늘에 있는 별의 그리기용 컬럼과 연결선만 반환한다. (설문 응답·설문자 이름 제외)
CREATE OR REPLACE FUNCTION public.get_survey_night_sky(p_target_user_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'stars', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'star_color', s.star_color,
          'star_points', s.star_points,
          'star_size', s.star_size,
          'star_saturation', s.star_saturation,
          'star_sharpness', s.star_sharpness,
          'image_url', s.image_url,
          'position_x', s.position_x,
          'position_y', s.position_y
        )
        ORDER BY s.created_at
      )
      FROM public.stars s
      WHERE s.user_id = p_target_user_id AND s.in_sky = true
    ), '[]'::jsonb),
    'connections', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object('from_star_id', c.from_star_id, 'to_star_id', c.to_star_id)
      )
      FROM public.star_connections c
      WHERE c.user_id = p_target_user_id
    ), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.get_survey_night_sky(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_survey_night_sky(UUID) TO anon, authenticated;

COMMIT;

-- PostgREST가 새 함수를 즉시 인식하도록 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';
