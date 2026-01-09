-- 휴대전화 인증번호 저장 테이블
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(13) NOT NULL,           -- 010-1234-5678 형식
  verification_code_hash VARCHAR(255) NOT NULL, -- bcrypt 해시
  expires_at TIMESTAMPTZ NOT NULL,             -- 인증번호 만료 시간 (3분)
  verified BOOLEAN DEFAULT FALSE,               -- 인증 완료 여부
  attempts INTEGER DEFAULT 0,                   -- 검증 시도 횟수
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스: 전화번호로 빠른 조회
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone
ON phone_verifications(phone_number);

-- 인덱스: 만료되지 않은 인증번호 조회
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires
ON phone_verifications(expires_at);

-- SMS Rate Limiting 테이블
CREATE TABLE IF NOT EXISTS sms_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(13) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phone_number, window_start)
);

-- 인덱스: 전화번호 + 시간 기준 조회
CREATE INDEX IF NOT EXISTS idx_sms_rate_limits_phone_window
ON sms_rate_limits(phone_number, window_start);

-- 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- phone_verifications 테이블에 트리거 적용
CREATE TRIGGER update_phone_verifications_updated_at
  BEFORE UPDATE ON phone_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS(Row Level Security) 활성화
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS 정책: Edge Functions에서만 접근 가능
CREATE POLICY "Allow Edge Functions to manage phone_verifications"
ON phone_verifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow Edge Functions to manage sms_rate_limits"
ON sms_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
