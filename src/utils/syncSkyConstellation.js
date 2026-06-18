import { supabase } from '../lib/supabase';

// 충돌 반경 (도) - SkyPage와 동일하게 유지
const COLLISION_RADIUS = 15;

// 두 천구 좌표 간의 각도 거리 계산
function angularDistance(ra1, dec1, ra2, dec2) {
  const ra1Rad = (ra1 * Math.PI) / 180;
  const dec1Rad = (dec1 * Math.PI) / 180;
  const ra2Rad = (ra2 * Math.PI) / 180;
  const dec2Rad = (dec2 * Math.PI) / 180;

  const cosD =
    Math.sin(dec1Rad) * Math.sin(dec2Rad) +
    Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.cos(ra1Rad - ra2Rad);

  return Math.acos(Math.min(1, Math.max(-1, cosD))) * (180 / Math.PI);
}

// 다른 별자리와 겹치지 않는 빈 자리 찾기
function findEmptySpot(occupied) {
  for (let i = 0; i < 100; i++) {
    const ra = Math.random() * 360;
    const dec = Math.random() * 180 - 90;
    let ok = true;
    for (const o of occupied) {
      if (angularDistance(ra, dec, o.ra, o.dec) < COLLISION_RADIUS) {
        ok = false;
        break;
      }
    }
    if (ok) return { ra, dec };
  }
  return null;
}

/**
 * 사용자의 별/연결 데이터를 3D 밤하늘(sky_constellations)에 자동 등록/동기화한다.
 * - 별자리가 없으면 아무 것도 하지 않는다.
 * - 이미 등록되어 있으면 위치는 유지한 채 별/연결/이름만 갱신한다.
 * - 아직 없으면 빈 자리를 찾아 새로 등록한다.
 *
 * @param {string} userId  - auth user id
 * @param {string} [nickname] - 별자리 소유자 닉네임 (by 표시 / 기본 이름 fallback용)
 * @param {string} [constellationName] - 사용자가 지은 별자리 이름 (3D에 표시될 이름)
 */
export async function syncSkyConstellation(userId, nickname, constellationName) {
  if (!userId) return;

  // 별 데이터
  const { data: starsData, error: starsError } = await supabase
    .from('stars')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (starsError || !starsData || starsData.length === 0) return;

  // 연결 데이터
  const { data: connectionsData } = await supabase
    .from('star_connections')
    .select('*')
    .eq('user_id', userId);

  // SkyPage가 기대하는 형식으로 변환 (중심 기준 상대 좌표 + 별 속성)
  const stars = starsData.map((star) => ({
    x: (star.position_x ?? 175) - 175,
    y: (star.position_y ?? 250) - 250,
    star_color: star.star_color,
    star_points: star.star_points,
    star_size: star.star_size,
    star_saturation: star.star_saturation,
    star_sharpness: star.star_sharpness,
  }));

  const connections = (connectionsData || [])
    .map((conn) => {
      const from = starsData.findIndex((s) => s.id === conn.from_star_id);
      const to = starsData.findIndex((s) => s.id === conn.to_star_id);
      return [from, to];
    })
    .filter(([from, to]) => from !== -1 && to !== -1);

  // 사용자가 지은 별자리 이름을 우선 사용하고, 없으면 닉네임 기반 기본 이름을 쓴다.
  const name = constellationName?.trim()
    ? constellationName.trim()
    : (nickname ? `${nickname}의 별자리` : '나의 별자리');

  // 이미 하늘에 등록되어 있는지 확인
  const { data: existing } = await supabase
    .from('sky_constellations')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // 위치 유지, 내용만 갱신
    await supabase
      .from('sky_constellations')
      .update({
        stars_data: stars,
        connections_data: connections,
        constellation_name: name,
      })
      .eq('user_id', userId);
  } else {
    // 빈 자리를 찾아 자동 등록
    const { data: others } = await supabase
      .from('sky_constellations')
      .select('right_ascension, declination');

    const occupied = (others || []).map((o) => ({
      ra: o.right_ascension,
      dec: o.declination,
    }));
    const pos =
      findEmptySpot(occupied) || {
        ra: Math.random() * 360,
        dec: Math.random() * 180 - 90,
      };

    await supabase.from('sky_constellations').insert({
      user_id: userId,
      constellation_name: name,
      stars_data: stars,
      connections_data: connections,
      right_ascension: pos.ra,
      declination: pos.dec,
    });
  }
}
