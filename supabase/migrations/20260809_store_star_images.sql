-- 스타리 별 구매 상품을 절차적 프리셋 대신 커스텀 이미지(SVG/PNG)로 판매하기 위한 변경
-- - store_products.image_url: 상품 카드에 쓰는 이미지
-- - stars.image_url: 구매 시점 이미지를 별 자체에 복사(상품이 나중에 바뀌거나 삭제돼도 이미 산 별은 유지)
-- - star-images 스토리지 버킷: 공개 읽기, 업로드/수정/삭제는 관리자만

-- 1) store_products: image_url 추가, star_item 필수 조건을 star_preset -> image_url로 변경 ---
ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.store_products
  DROP CONSTRAINT IF EXISTS store_products_fields_check;

ALTER TABLE public.store_products
  ADD CONSTRAINT store_products_fields_check CHECK (
    (product_type = 'star_item' AND price_star_dust IS NOT NULL AND image_url IS NOT NULL)
    OR (product_type = 'star_dust_package' AND price_krw IS NOT NULL AND star_dust_amount IS NOT NULL)
    OR (product_type = 'storage_expansion' AND price_krw IS NOT NULL AND slot_count IS NOT NULL)
  );

-- 2) stars: image_url 추가, 이미지 기반 별은 star_color 등을 안 쓰므로 NOT NULL이었다면 해제 ---
ALTER TABLE public.stars
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.stars ALTER COLUMN star_color DROP NOT NULL;
ALTER TABLE public.stars ALTER COLUMN star_points DROP NOT NULL;
ALTER TABLE public.stars ALTER COLUMN star_size DROP NOT NULL;
ALTER TABLE public.stars ALTER COLUMN star_saturation DROP NOT NULL;
ALTER TABLE public.stars ALTER COLUMN star_sharpness DROP NOT NULL;

-- 3) purchase_star_item: image_url이 있으면 이미지 기반으로, 없으면 기존 프리셋으로 별 생성 ---
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

  IF v_product.image_url IS NOT NULL THEN
    INSERT INTO public.stars (
      user_id, surveyor_name, image_url, answers, in_sky
    )
    VALUES (
      v_user_id, '스토어 구매', v_product.image_url, '{}'::JSONB, false
    );
  ELSE
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
  END IF;

  RETURN jsonb_build_object('success', true, 'balance', v_balance - v_product.price_star_dust);
END;
$$;

-- 4) 상점 별 이미지용 스토리지 버킷 ------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('star-images', 'star-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read star-images" ON storage.objects;
CREATE POLICY "Public read star-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'star-images');

DROP POLICY IF EXISTS "Admin upload star-images" ON storage.objects;
CREATE POLICY "Admin upload star-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'star-images' AND (auth.jwt() ->> 'email') = 'admin@admin.com');

DROP POLICY IF EXISTS "Admin update star-images" ON storage.objects;
CREATE POLICY "Admin update star-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'star-images' AND (auth.jwt() ->> 'email') = 'admin@admin.com');

DROP POLICY IF EXISTS "Admin delete star-images" ON storage.objects;
CREATE POLICY "Admin delete star-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'star-images' AND (auth.jwt() ->> 'email') = 'admin@admin.com');
