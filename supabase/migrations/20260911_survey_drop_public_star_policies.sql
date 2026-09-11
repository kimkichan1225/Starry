-- 설문용 공개 정책 제거
-- 적용 조건: submit_survey_star / get_survey_night_sky를 사용하는 프론트가 운영에 배포된 뒤
--   (먼저 적용하면 구버전 설문 페이지의 별 전송/밤하늘 보기가 실패한다)
-- 적용 후: stars/star_connections는 본인·관리자만 조회 가능하고, Realtime도 본인 데이터만 수신한다.

BEGIN;

DROP POLICY IF EXISTS "Anyone can insert stars" ON public.stars;
DROP POLICY IF EXISTS "Anyone can view stars" ON public.stars;
DROP POLICY IF EXISTS "Anyone can view star_connections" ON public.star_connections;

-- 클라이언트는 더 이상 stars에 직접 INSERT하지 않는다
-- (설문은 submit_survey_star, 상점 구매는 purchase_star_item — 둘 다 SECURITY DEFINER)
REVOKE INSERT ON public.stars FROM anon, authenticated;

COMMIT;
