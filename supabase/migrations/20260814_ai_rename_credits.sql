-- AI 별자리 이름 바꾸기 유료화: 무료 N회 제공 후 별가루 차감
-- 무료 횟수/가격은 관리자 설정(settings 테이블)에서 조정 가능하게 한다.
--
-- 부수 발견: settings 테이블에 RLS가 걸려 있지 않아 인증 없이도 누구나 값을 바꿀 수 있었다
-- (점검모드/회원가입허용 플래그 포함). 이번에 가격/무료횟수를 여기 저장하므로 먼저 잠근다.

-- 1) settings 테이블 잠금 -----------------------------------------------------
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view settings" ON public.settings;
CREATE POLICY "Anyone can view settings"
  ON public.settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings"
  ON public.settings
  FOR ALL
  USING ((auth.jwt() ->> 'email') = 'admin@admin.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@admin.com');

-- 기본값 seed (관리자 설정 페이지에서 언제든 수정 가능)
INSERT INTO public.settings (key, value, updated_at)
VALUES
  ('ai_rename_free_count', '3', now()),
  ('ai_rename_price', '5', now())
ON CONFLICT (key) DO NOTHING;

-- 2) 무료 사용 횟수 카운터 -----------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_rename_used_count INTEGER NOT NULL DEFAULT 0;

-- 클라이언트가 직접 카운트를 조작 못 하도록 컬럼 권한 차단 (RPC로만 변경)
REVOKE UPDATE (ai_rename_used_count) ON public.profiles FROM authenticated, anon;

-- 3) 이용권 소비 (무료 우선, 소진 시 별가루 차감) -------------------------------
-- analyze-constellation Edge Function이 OpenAI 호출 직전에 service_role로만 호출한다.
CREATE OR REPLACE FUNCTION public.consume_ai_rename_credit(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_count INTEGER;
  v_price INTEGER;
  v_used INTEGER;
  v_balance INTEGER;
BEGIN
  SELECT (value #>> '{}')::INTEGER INTO v_free_count
  FROM public.settings WHERE key = 'ai_rename_free_count';
  v_free_count := COALESCE(v_free_count, 3);

  SELECT (value #>> '{}')::INTEGER INTO v_price
  FROM public.settings WHERE key = 'ai_rename_price';
  v_price := COALESCE(v_price, 5);

  SELECT ai_rename_used_count, star_dust_balance INTO v_used, v_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_used IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'profile_not_found');
  END IF;

  IF v_used < v_free_count THEN
    UPDATE public.profiles SET ai_rename_used_count = ai_rename_used_count + 1 WHERE id = p_user_id;
    RETURN jsonb_build_object('allowed', true, 'method', 'free', 'remaining', v_free_count - v_used - 1);
  END IF;

  IF v_balance < v_price THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'insufficient_balance', 'price', v_price);
  END IF;

  UPDATE public.profiles SET star_dust_balance = star_dust_balance - v_price WHERE id = p_user_id;
  INSERT INTO public.star_dust_transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'purchase', -v_price, 'AI 별자리 이름 바꾸기');

  RETURN jsonb_build_object('allowed', true, 'method', 'star_dust', 'balance', v_balance - v_price, 'price', v_price);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_ai_rename_credit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_rename_credit(UUID) TO service_role;

-- 4) 생성 실패 시 환불 --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refund_ai_rename_credit(
  p_user_id UUID,
  p_method TEXT,
  p_price INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_method = 'free' THEN
    UPDATE public.profiles
    SET ai_rename_used_count = GREATEST(0, ai_rename_used_count - 1)
    WHERE id = p_user_id;
  ELSIF p_method = 'star_dust' THEN
    UPDATE public.profiles SET star_dust_balance = star_dust_balance + p_price WHERE id = p_user_id;
    INSERT INTO public.star_dust_transactions (user_id, type, amount, description)
    VALUES (p_user_id, 'charge', p_price, 'AI 별자리 이름 바꾸기 실패 환불');
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refund_ai_rename_credit(UUID, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refund_ai_rename_credit(UUID, TEXT, INTEGER) TO service_role;
