-- 기존 가입자 호환 백필
-- 과거 흐름에서는 phone_verified가 user_metadata(클라이언트 수정 가능)에만 기록되었다.
-- 신규 흐름은 confirm-phone Edge Function이 app_metadata(서버 전용)에 확정한다.
-- 이미 가입한 사용자가 로그인 게이트에서 막히지 않도록 app_metadata로 1회 백필한다.
-- 단, user_metadata.phone_verified는 클라이언트가 조작 가능했던 값이므로 그대로 신뢰하지 않고,
-- 해당 전화번호에 대해 서버가 실제로 인증한 기록(phone_verifications.verified=true)이 있는
-- 사용자만 승격한다. (서버 신뢰 근거가 있는 경우에만 백필)
UPDATE auth.users u
SET raw_app_meta_data =
      COALESCE(u.raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('phone_verified', true)
      || jsonb_build_object('phone', u.raw_user_meta_data->>'phone')
WHERE (u.raw_user_meta_data->>'phone_verified') = 'true'
  AND COALESCE((u.raw_app_meta_data->>'phone_verified'), 'false') <> 'true'
  AND u.raw_user_meta_data ? 'phone'
  AND EXISTS (
    SELECT 1
    FROM public.phone_verifications pv
    WHERE pv.phone_number = u.raw_user_meta_data->>'phone'
      AND pv.verified = true
  );
