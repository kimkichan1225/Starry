-- 3D 밤하늘에 등록된 별자리 테이블
CREATE TABLE IF NOT EXISTS sky_constellations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 별자리 데이터 (기존 형식 재사용)
  constellation_name VARCHAR(100),
  stars_data JSONB NOT NULL,
  connections_data JSONB,

  -- 3D 하늘 위치 (천구 좌표)
  right_ascension FLOAT NOT NULL,     -- 적경 (0-360도)
  declination FLOAT NOT NULL,         -- 적위 (-90 ~ +90도)

  registered_at TIMESTAMPTZ DEFAULT NOW(),

  -- 한 사람당 하나의 별자리만
  UNIQUE(user_id)
);

-- RLS 정책 활성화
ALTER TABLE sky_constellations ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 모든 별자리 조회 가능
CREATE POLICY "Anyone can view sky constellations"
  ON sky_constellations FOR SELECT
  USING (true);

-- 인증된 사용자만 자신의 별자리 등록 가능
CREATE POLICY "Users can insert their own constellation"
  ON sky_constellations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 별자리만 수정 가능
CREATE POLICY "Users can update their own constellation"
  ON sky_constellations FOR UPDATE
  USING (auth.uid() = user_id);

-- 사용자는 자신의 별자리만 삭제 가능
CREATE POLICY "Users can delete their own constellation"
  ON sky_constellations FOR DELETE
  USING (auth.uid() = user_id);

-- 인덱스 생성 (위치 검색 최적화)
CREATE INDEX idx_sky_constellations_position
  ON sky_constellations (right_ascension, declination);

CREATE INDEX idx_sky_constellations_user
  ON sky_constellations (user_id);
