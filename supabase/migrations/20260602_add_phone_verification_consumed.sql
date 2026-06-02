-- 휴대전화 인증 기록 재사용(replay) 방지용 소비 시각 컬럼
-- confirm-phone Edge Function이 인증을 app_metadata에 확정한 뒤 해당 기록을 소비 처리한다.
ALTER TABLE phone_verifications
  ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ;

-- confirm-phone의 조회 패턴(phone_number + verified + consumed_at IS NULL + updated_at)에 맞춘 인덱스
CREATE INDEX IF NOT EXISTS idx_phone_verifications_confirm
  ON phone_verifications (phone_number, verified, updated_at DESC)
  WHERE consumed_at IS NULL;
