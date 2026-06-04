-- 전화번호 중복 가입 방지 (DB 차원 보장)
-- 앱의 phone_exists 사전 확인은 "조회→삽입" 사이의 동시 가입 race를 막지 못한다.
-- profiles.phone에 UNIQUE 인덱스를 추가해 DB가 물리적으로 중복을 거부하게 한다.
-- (NULL/빈 값은 제외 — 미입력 상태 다수 허용)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique
  ON public.profiles (phone)
  WHERE phone IS NOT NULL AND phone <> '';
