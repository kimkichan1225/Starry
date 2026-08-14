-- 별 보관소 확장을 원화 결제(토스)가 아니라 별가루로 구매하도록 변경
-- (스타리 별 구매처럼 이미 갖고 있는 별가루로 바로 구매)

-- 0) 예전 제약(storage_expansion에 price_krw 필수)부터 먼저 없앤다.
--    이 순서가 아니면, price_krw를 NULL로 옮기는 UPDATE 자체가 "아직 살아있는 예전 제약"을
--    위반해서 실패한다 (실제로 겪은 문제).
ALTER TABLE public.store_products
  DROP CONSTRAINT IF EXISTS store_products_fields_check;

-- 1) 기존에 원화(price_krw)로 등록해둔 보관소 확장 상품을 별가루 가격으로 그대로 옮긴다
--    (예: "3"을 3원으로 등록했던 테스트 상품 -> price_star_dust=3으로 이전)
UPDATE public.store_products
SET price_star_dust = price_krw, price_krw = NULL
WHERE product_type = 'storage_expansion' AND price_star_dust IS NULL AND price_krw IS NOT NULL;

-- 2) 새 제약 추가: storage_expansion은 price_krw 대신 price_star_dust 필수 --------------
ALTER TABLE public.store_products
  ADD CONSTRAINT store_products_fields_check CHECK (
    (product_type = 'star_item' AND price_star_dust IS NOT NULL AND image_url IS NOT NULL)
    OR (product_type = 'star_dust_package' AND price_krw IS NOT NULL AND star_dust_amount IS NOT NULL)
    OR (product_type = 'storage_expansion' AND price_star_dust IS NOT NULL AND slot_count IS NOT NULL)
  );

-- 3) 별가루로 보관소 확장 구매 (잔액 확인 -> 차감 -> 슬롯 증가 -> 내역 기록을 원자 처리) ---
CREATE OR REPLACE FUNCTION public.purchase_storage_expansion(p_product_id UUID)
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

  SELECT * INTO v_product
  FROM public.store_products
  WHERE id = p_product_id AND product_type = 'storage_expansion' AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'product_not_found');
  END IF;

  SELECT star_dust_balance INTO v_balance
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < v_product.price_star_dust THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance');
  END IF;

  UPDATE public.profiles
  SET star_dust_balance = star_dust_balance - v_product.price_star_dust,
      max_sky_slots = max_sky_slots + v_product.slot_count
  WHERE id = v_user_id;

  INSERT INTO public.star_dust_transactions (user_id, type, amount, description, product_id)
  VALUES (v_user_id, 'purchase', -v_product.price_star_dust, v_product.name, v_product.id);

  RETURN jsonb_build_object('success', true, 'balance', v_balance - v_product.price_star_dust);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purchase_storage_expansion(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_storage_expansion(UUID) TO authenticated;
