-- 상점(별가루/스토어) 기능을 위한 테이블
-- 구성: 별가루 잔액(profiles) + 상품 통합 테이블(store_products) + 이용내역(star_dust_transactions) + 결제 추적(payments)
--
-- 보안 원칙:
--   - 별가루 잔액/결제 상태는 클라이언트가 직접 올릴 수 없다. 반드시 Edge Function(토스 결제 검증) 또는
--     아래 SECURITY DEFINER 함수(별가루로 별 구매)를 통해서만 변경된다.
--   - profiles.max_sky_slots는 기존에 클라이언트가 직접 update 하도록 되어 있었으나(StarsContext.expandSkySlots),
--     이제 실제 결제 상품이 되므로 컬럼 단위로 클라이언트 write를 막는다.
--     (expandSkySlots는 결제 연동 단계에서 Edge Function 호출로 교체 필요)

-- 1) 별가루 잔액 -----------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS star_dust_balance INTEGER NOT NULL DEFAULT 0 CHECK (star_dust_balance >= 0);

-- 클라이언트(authenticated/anon)가 잔액·보관함 슬롯을 직접 수정하지 못하도록 컬럼 권한 차단
-- (행 단위 RLS는 "Users can update own profile"로 이미 열려 있어, 컬럼 권한으로 별도 차단이 필요함)
REVOKE UPDATE (star_dust_balance, max_sky_slots) ON public.profiles FROM authenticated, anon;

-- 2) 상점 상품 (통합 테이블: 스타리 별 구매 / 별가루 충전권 / 보관소 확장) -------
CREATE TABLE IF NOT EXISTS public.store_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_type TEXT NOT NULL CHECK (product_type IN ('star_item', 'star_dust_package', 'storage_expansion')),
  name TEXT NOT NULL,
  tag TEXT,                      -- 배지 표시용 (예: 'N', 'H', '인기', '추천'), 없으면 NULL
  price_krw INTEGER,             -- 원화 결제 상품(star_dust_package, storage_expansion)
  price_star_dust INTEGER,       -- 별가루 결제 상품(star_item)
  star_dust_amount INTEGER,      -- 충전권 기본 지급량(star_dust_package)
  bonus_star_dust INTEGER,       -- 충전권 보너스 지급량(star_dust_package)
  slot_count INTEGER,            -- 보관소 확장 칸수(storage_expansion)
  star_preset JSONB,             -- 별 프리셋(star_item): {star_color, star_points, star_size, star_saturation, star_sharpness}
  stock INTEGER,                 -- 재고(NULL = 무제한, 0 이하 = 품절)
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT store_products_fields_check CHECK (
    (product_type = 'star_item' AND price_star_dust IS NOT NULL AND star_preset IS NOT NULL)
    OR (product_type = 'star_dust_package' AND price_krw IS NOT NULL AND star_dust_amount IS NOT NULL)
    OR (product_type = 'storage_expansion' AND price_krw IS NOT NULL AND slot_count IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_store_products_type_active
  ON public.store_products (product_type, is_active, sort_order);

ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

-- 활성 상품은 누구나(로그인 사용자) 조회 가능 - 상점 화면
CREATE POLICY "Anyone can view active store products"
  ON public.store_products
  FOR SELECT
  USING (is_active = true);

-- 관리자는 전체 조회/추가/수정/삭제 가능
CREATE POLICY "Admins can manage store products"
  ON public.store_products
  FOR ALL
  USING ((auth.jwt() ->> 'email') = 'admin@admin.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@admin.com');

-- 3) 별가루 이용내역 (충전 +, 구매 -) ----------------------------------------
CREATE TABLE IF NOT EXISTS public.star_dust_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('charge', 'purchase')),
  amount INTEGER NOT NULL,       -- 충전: 양수, 구매: 음수
  description TEXT NOT NULL,
  product_id UUID REFERENCES public.store_products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_star_dust_transactions_user
  ON public.star_dust_transactions (user_id, created_at DESC);

ALTER TABLE public.star_dust_transactions ENABLE ROW LEVEL SECURITY;

-- 본인 내역만 조회 가능
CREATE POLICY "Users can view own star dust transactions"
  ON public.star_dust_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 쓰기는 service_role(Edge Function/RPC)만
CREATE POLICY "service role manages star dust transactions"
  ON public.star_dust_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4) 결제 추적 (토스페이먼츠) -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE,   -- 토스 orderId
  payment_key TEXT,                -- 토스 paymentKey (승인 후 저장)
  product_id UUID REFERENCES public.store_products(id) ON DELETE SET NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('star_dust_package', 'storage_expansion')),
  amount_krw INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'canceled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_user
  ON public.payments (user_id, created_at DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 본인 결제 내역만 조회 가능
CREATE POLICY "Users can view own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- 생성/승인/실패 처리는 service_role(Edge Function)만
CREATE POLICY "service role manages payments"
  ON public.payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5) 별가루로 별 아이템 구매 (원화 결제 없이 즉시 처리 가능하므로 RPC로 원자 처리) ---
-- 잔액 확인 -> 재고 확인/차감 -> 별가루 차감 -> stars 테이블에 별 추가 -> 이용내역 기록을
-- 하나의 트랜잭션으로 원자 처리한다. SECURITY DEFINER로 실행되어 profiles.star_dust_balance
-- 컬럼 권한 제한과 무관하게 안전하게 잔액을 변경할 수 있다.
CREATE OR REPLACE FUNCTION public.purchase_star_item(p_product_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_product RECORD;
  v_balance INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  -- 상품 행 잠금 (동시 구매로 인한 재고 초과 판매 방지)
  SELECT * INTO v_product
  FROM public.store_products
  WHERE id = p_product_id AND product_type = 'star_item' AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'product_not_found');
  END IF;

  IF v_product.stock IS NOT NULL AND v_product.stock <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'sold_out');
  END IF;

  -- 잔액 행 잠금 후 확인
  SELECT star_dust_balance INTO v_balance
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < v_product.price_star_dust THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance');
  END IF;

  UPDATE public.profiles
  SET star_dust_balance = star_dust_balance - v_product.price_star_dust
  WHERE id = v_user_id;

  IF v_product.stock IS NOT NULL THEN
    UPDATE public.store_products SET stock = stock - 1 WHERE id = v_product.id;
  END IF;

  INSERT INTO public.star_dust_transactions (user_id, type, amount, description, product_id)
  VALUES (v_user_id, 'purchase', -v_product.price_star_dust, v_product.name, v_product.id);

  INSERT INTO public.stars (
    user_id, surveyor_name, star_color, star_points, star_size, star_saturation, star_sharpness, answers, in_sky
  )
  VALUES (
    v_user_id,
    '스토어 구매',
    (v_product.star_preset->>'star_color')::INTEGER,
    (v_product.star_preset->>'star_points')::INTEGER,
    (v_product.star_preset->>'star_size')::INTEGER,
    (v_product.star_preset->>'star_saturation')::INTEGER,
    (v_product.star_preset->>'star_sharpness')::INTEGER,
    '{}'::JSONB,
    false
  );

  RETURN jsonb_build_object('success', true, 'balance', v_balance - v_product.price_star_dust);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purchase_star_item(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_star_item(UUID) TO authenticated;
