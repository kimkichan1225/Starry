-- sky_members RLS 무한 재귀 수정
-- 기존 정책의 USING 절이 sky_members를 다시 참조하면 RLS가 또 평가되어
-- infinite recursion (42P17)이 발생한다.
-- → SECURITY DEFINER 함수로 RLS를 우회해서 멤버십을 체크하도록 변경한다.

-- 멤버십 확인용 헬퍼 함수 (RLS 우회)
CREATE OR REPLACE FUNCTION is_sky_member(p_sky_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM sky_members
    WHERE sky_id = p_sky_id AND user_id = p_user_id
  );
$$;

-- 기존 재귀 정책 제거
DROP POLICY IF EXISTS "Members can view sky members" ON sky_members;
DROP POLICY IF EXISTS "Members can view their skies" ON skies;

-- sky_members: 헬퍼 함수로 재귀 회피
CREATE POLICY "Members can view sky members"
  ON sky_members FOR SELECT
  USING (is_sky_member(sky_id, auth.uid()));

-- skies: 동일하게 헬퍼 함수 사용
CREATE POLICY "Members can view their skies"
  ON skies FOR SELECT
  USING (is_sky_member(id, auth.uid()));
