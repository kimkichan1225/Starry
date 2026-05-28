-- 개인/그룹 밤하늘 (private sky) 및 멤버 테이블
-- /sky 페이지에서 사용자가 친구들과 함께 별자리를 모으는 공간

-- 6~8자리 랜덤 코드 생성 함수 (영문 대문자 + 숫자, 헷갈리는 글자 제외)
CREATE OR REPLACE FUNCTION generate_sky_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 밤하늘 테이블
CREATE TABLE IF NOT EXISTS skies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code VARCHAR(16) NOT NULL UNIQUE DEFAULT generate_sky_invite_code(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skies_owner ON skies (owner_id);
CREATE INDEX idx_skies_invite_code ON skies (invite_code);

-- 밤하늘 멤버 테이블 (owner 포함)
CREATE TABLE IF NOT EXISTS sky_members (
  sky_id UUID NOT NULL REFERENCES skies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (sky_id, user_id)
);

CREATE INDEX idx_sky_members_user ON sky_members (user_id);

-- skies 생성 시 owner를 자동으로 멤버에 추가
CREATE OR REPLACE FUNCTION add_sky_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO sky_members (sky_id, user_id)
  VALUES (NEW.id, NEW.owner_id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_add_sky_owner_as_member ON skies;
CREATE TRIGGER trg_add_sky_owner_as_member
  AFTER INSERT ON skies
  FOR EACH ROW
  EXECUTE FUNCTION add_sky_owner_as_member();

-- 초대 코드로 입장 (sky_id 반환). 잘못된 코드면 NULL 반환
CREATE OR REPLACE FUNCTION join_sky_by_code(p_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_sky_id UUID;
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_sky_id
  FROM skies
  WHERE invite_code = upper(trim(p_code));

  IF v_sky_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO sky_members (sky_id, user_id)
  VALUES (v_sky_id, v_uid)
  ON CONFLICT DO NOTHING;

  RETURN v_sky_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE skies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sky_members ENABLE ROW LEVEL SECURITY;

-- 멤버인 sky만 조회 가능 (초대 코드로 들어가기 전엔 보이지 않음 → join_sky_by_code RPC 사용)
CREATE POLICY "Members can view their skies"
  ON skies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sky_members
      WHERE sky_members.sky_id = skies.id
        AND sky_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create skies"
  ON skies FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can update sky"
  ON skies FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner can delete sky"
  ON skies FOR DELETE
  USING (auth.uid() = owner_id);

-- sky_members: 본인이 속한 sky의 멤버 목록만 조회 가능
CREATE POLICY "Members can view sky members"
  ON sky_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sky_members AS m
      WHERE m.sky_id = sky_members.sky_id
        AND m.user_id = auth.uid()
    )
  );

-- 본인 본인을 멤버로 추가 가능 (보통은 RPC를 통해 처리)
CREATE POLICY "Users can join skies as themselves"
  ON sky_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인은 자기 멤버십을 삭제 가능 (나가기)
CREATE POLICY "Users can leave skies"
  ON sky_members FOR DELETE
  USING (auth.uid() = user_id);
