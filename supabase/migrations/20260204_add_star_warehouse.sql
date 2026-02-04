-- stars 테이블에 in_sky 필드 추가
ALTER TABLE public.stars ADD COLUMN IF NOT EXISTS in_sky BOOLEAN DEFAULT true;

-- 기존 별들: 각 사용자별 처음 11개만 밤하늘에
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
  FROM public.stars
)
UPDATE public.stars s SET in_sky = (SELECT rn <= 11 FROM ranked r WHERE r.id = s.id);

-- profiles 테이블에 max_sky_slots 필드 추가
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_sky_slots INTEGER DEFAULT 11;
