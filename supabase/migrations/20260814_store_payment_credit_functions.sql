-- 토스 결제 승인 후 별가루 지급 / 보관소 확장을 원자적으로 처리하는 함수
-- confirm-store-payment Edge Function이 service_role로만 호출한다.
-- (authenticated에게는 절대 EXECUTE 권한을 주지 않는다 - 클라이언트가 직접 호출하면
--  결제 없이 잔액/슬롯을 조작할 수 있게 되므로 위험하다)

CREATE OR REPLACE FUNCTION public.credit_star_dust(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_product_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET star_dust_balance = star_dust_balance + p_amount
  WHERE id = p_user_id;

  INSERT INTO public.star_dust_transactions (user_id, type, amount, description, product_id)
  VALUES (p_user_id, 'charge', p_amount, p_description, p_product_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.credit_star_dust(UUID, INTEGER, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credit_star_dust(UUID, INTEGER, TEXT, UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.expand_storage(
  p_user_id UUID,
  p_slot_count INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET max_sky_slots = max_sky_slots + p_slot_count
  WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.expand_storage(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expand_storage(UUID, INTEGER) TO service_role;
