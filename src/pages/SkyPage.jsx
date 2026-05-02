import { useState, useRef, Suspense, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ============================================
// 유틸리티 함수들
// ============================================

// 적경/적위를 3D 좌표로 변환 (천구 좌표 → 직교 좌표)
function celestialToCartesian(ra, dec, radius = 50) {
  const raRad = (ra * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  const x = radius * Math.cos(decRad) * Math.cos(raRad);
  const y = radius * Math.sin(decRad);
  const z = -radius * Math.cos(decRad) * Math.sin(raRad);
  return new THREE.Vector3(x, y, z);
}

// 3D 좌표를 적경/적위로 변환
function cartesianToCelestial(position) {
  const x = position.x;
  const y = position.y;
  const z = position.z;
  const radius = Math.sqrt(x * x + y * y + z * z);

  const dec = Math.asin(y / radius) * (180 / Math.PI);
  let ra = Math.atan2(-z, x) * (180 / Math.PI);
  if (ra < 0) ra += 360;

  return { ra, dec };
}

// 두 천구 좌표 간의 각도 거리 계산
function angularDistance(ra1, dec1, ra2, dec2) {
  const ra1Rad = ra1 * Math.PI / 180;
  const dec1Rad = dec1 * Math.PI / 180;
  const ra2Rad = ra2 * Math.PI / 180;
  const dec2Rad = dec2 * Math.PI / 180;

  const cosD = Math.sin(dec1Rad) * Math.sin(dec2Rad) +
               Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.cos(ra1Rad - ra2Rad);

  return Math.acos(Math.min(1, Math.max(-1, cosD))) * (180 / Math.PI);
}

// 충돌 반경 (도)
const COLLISION_RADIUS = 15;

// 색상 팔레트 (HomePage와 동일)
const colorPalette = [
  { name: '빨강', h: 0 },
  { name: '초록', h: 120 },
  { name: '파랑', h: 220 },
  { name: '노랑', h: 50 },
];

// 랜덤용 확장 색상 팔레트
const extendedColorPalette = [
  { name: '빨강', h: 0 },
  { name: '초록', h: 120 },
  { name: '파랑', h: 220 },
  { name: '노랑', h: 50 },
  { name: '분홍', h: 330 },
  { name: '하늘', h: 190 },
  { name: '주황', h: 30 },
  { name: '보라', h: 280 },
];

// 포인트 맵 (HomePage와 동일: star_points 1~4 → [8, 5, 4, 6])
const pointsMap = [8, 5, 4, 6];

// HSL을 RGB로 변환
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(255 * f(0)),
    g: Math.round(255 * f(8)),
    b: Math.round(255 * f(4))
  };
}

// 별 텍스처 생성 함수
function createStarTexture(hue, saturation, points, sharpness, starSize) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const cx = size / 2;
  const cy = size / 2;
  const sizeMultiplier = [0.35, 0.28, 0.22, 0.18][starSize - 1] || 0.28;
  const outerR = size * sizeMultiplier;
  const innerRatio = 0.5 - (sharpness - 1) * 0.1;
  const innerR = outerR * innerRatio;

  const sat = 80 - (saturation - 1) * 20;
  const rgb = hslToRgb(hue, sat, 55);
  const hslColor = `hsl(${hue}, ${sat}%, 55%)`;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glowGradient = ctx.createRadialGradient(cx, cy, outerR * 0.2, cx, cy, outerR * 2);
  glowGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`);
  glowGradient.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`);
  glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const step = Math.PI / points;
  ctx.beginPath();
  for (let i = 0; i < 2 * points; i++) {
    let r;
    if (i % 2 === 0) {
      if (points === 8) {
        const pointIdx = i / 2;
        r = (pointIdx % 2 === 1) ? outerR * 0.8 : outerR;
      } else {
        r = outerR;
      }
    } else {
      r = innerR;
    }
    const angle = i * step - Math.PI / 2;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.fillStyle = hslColor;
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 시드 기반 랜덤 함수
function seededRandom(seed) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// ============================================
// 3D 컴포넌트들
// ============================================

// 개별 별 컴포넌트
function Star3D({ position, hue, saturation, points, sharpness, starSize, spriteScale = 1 }) {
  const texture = useMemo(() =>
    createStarTexture(hue, saturation, points, sharpness, starSize),
    [hue, saturation, points, sharpness, starSize]
  );

  const material = useMemo(() =>
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
    }),
    [texture]
  );

  return (
    <sprite
      position={position}
      material={material}
      scale={[spriteScale * 3, spriteScale * 3, 1]}
    />
  );
}

// 별자리 연결선 컴포넌트
const LINE_COLOR = new THREE.Color('rgb(255, 255, 227)');

function ConstellationLines({ points }) {
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);

  return (
    <line geometry={lineGeometry} renderOrder={1}>
      <lineBasicMaterial
        color={LINE_COLOR}
        opacity={0.5}
        transparent
        linewidth={1}
        depthTest={false}
        depthWrite={false}
      />
    </line>
  );
}

// 별자리 그룹 컴포넌트
function Constellation3D({ constellation, onSelect, isSelected, isPreview = false, isOwner = false, onDelete }) {
  const groupRef = useRef();

  const centerPosition = useMemo(() =>
    celestialToCartesian(constellation.ra, constellation.dec),
    [constellation.ra, constellation.dec]
  );

  const starsData = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const forward = centerPosition.clone().normalize();
    const right = new THREE.Vector3().crossVectors(up, forward).normalize();
    const localUp = new THREE.Vector3().crossVectors(forward, right).normalize();

    const pointsOptions = [4, 5, 6, 8];

    return constellation.stars.map((star, index) => {
      const scale = 0.04; // 0.15 → 0.04로 축소 (별자리 크기 줄이기)
      // x를 반전시켜 좌우 반전 문제 해결 (구 내부에서 보는 시점)
      // y를 반전시켜 2D 캔버스와 3D 좌표계 방향 일치
      const offset = new THREE.Vector3()
        .addScaledVector(right, -star.x * scale)  // x 반전
        .addScaledVector(localUp, -star.y * scale); // y 반전

      const position = centerPosition.clone().add(offset);

      // 별 속성이 있으면 사용 (HomePage와 동일하게), 없으면 랜덤
      let hue, saturation, points, sharpness, starSize;

      if (star.star_color !== undefined) {
        // HomePage와 동일한 방식으로 별 속성 사용
        const colorIdx = (star.star_color || 1) - 1;
        hue = colorPalette[colorIdx]?.h ?? colorPalette[0].h;
        saturation = star.star_saturation || 1;
        points = pointsMap[(star.star_points || 1) - 1] || 5;
        sharpness = star.star_sharpness || 1;
        starSize = star.star_size || 2;
      } else {
        // 등록된 별자리는 시드 기반 랜덤 (일관성 유지)
        const seed = (constellation.id?.length || constellation.name?.length || 1) * 100 + index;
        hue = extendedColorPalette[Math.floor(seededRandom(seed) * extendedColorPalette.length)].h;
        saturation = 1 + Math.floor(seededRandom(seed + 1) * 4);
        points = pointsOptions[Math.floor(seededRandom(seed + 2) * pointsOptions.length)];
        sharpness = 1 + Math.floor(seededRandom(seed + 3) * 4);
        starSize = 1 + Math.floor(seededRandom(seed + 4) * 4);
      }

      return { position, hue, saturation, points, sharpness, starSize };
    });
  }, [constellation.stars, centerPosition, constellation.id]);

  return (
    <group ref={groupRef}>
      {starsData.map((star, index) => (
        <Star3D
          key={index}
          position={star.position}
          hue={star.hue}
          saturation={star.saturation}
          points={star.points}
          sharpness={star.sharpness}
          starSize={star.starSize}
          spriteScale={isSelected ? 1.3 : (isPreview ? 0.8 : 1)}
        />
      ))}

      {constellation.connections.map(([from, to], index) => (
        <ConstellationLines
          key={index}
          points={[starsData[from].position, starsData[to].position]}
        />
      ))}

      {!isPreview && (
        <mesh position={centerPosition} onClick={(e) => { e.stopPropagation(); onSelect(constellation); }}>
          <sphereGeometry args={[5, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      {isSelected && !isPreview && (
        <Html position={centerPosition} center>
          <div
            className="bg-black/85 backdrop-blur-md text-white px-5 py-4 rounded-2xl text-center border border-white/10 animate-popup"
            style={{
              wordBreak: 'keep-all',
              minWidth: 180,
              maxWidth: 240,
              boxShadow: '0 0 32px rgba(97, 85, 245, 0.35), 0 8px 24px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="font-bold text-base text-white pointer-events-none leading-tight tracking-tight">
              {constellation.name}
            </div>
            <div className="text-white/50 text-xs mt-1 pointer-events-none">
              by {constellation.creator}
            </div>
            {isOwner && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(constellation); }}
                className="mt-3 inline-flex items-center gap-1 px-4 py-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full text-xs font-semibold transition-all active:scale-95 shadow-lg shadow-red-500/30"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                </svg>
                삭제
              </button>
            )}
          </div>
        </Html>
      )}

      {isPreview && (
        <Html position={centerPosition} center>
          <div
            className="bg-[#6155F5]/85 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-semibold pointer-events-none animate-pulse border border-white/20 inline-flex items-center gap-1.5 whitespace-nowrap"
            style={{
              wordBreak: 'keep-all',
              boxShadow: '0 0 24px rgba(97, 85, 245, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4)'
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            미리보기
          </div>
        </Html>
      )}
    </group>
  );
}

// 위치 선택 인디케이터
function PositionIndicator({ position, isValid }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[2, 16, 16]} />
      <meshBasicMaterial
        color={isValid ? '#00ff00' : '#ff0000'}
        transparent
        opacity={0.5}
      />
    </mesh>
  );
}

// 원형 별 텍스처 생성
function createCircleTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // 원형 그라데이션 (중심이 밝고 가장자리가 투명)
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 커스텀 배경 별 컴포넌트 (depth 문제 해결)
function BackgroundStars({ count = 5000, radius = 100 }) {
  const [geometry, texture] = useMemo(() => {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // 구 표면에 랜덤 분포
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const tex = createCircleTexture();

    return [geo, tex];
  }, [count, radius]);

  return (
    <points geometry={geometry} renderOrder={0}>
      <pointsMaterial
        map={texture}
        color="#ffffff"
        size={0.8}
        sizeAttenuation={true}
        transparent
        opacity={0.9}
        depthTest={false}
        depthWrite={false}
      />
    </points>
  );
}

// 천구 배경
function SkyDome() {
  return (
    <>
      <BackgroundStars count={5000} radius={100} />
      <ambientLight intensity={0.1} />
    </>
  );
}

// 자이로스코프 컨트롤 컴포넌트 (AR 카메라 스타일)
function GyroscopeControls({ enabled }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!enabled) return;

    const zee = new THREE.Vector3(0, 0, 1);
    const euler = new THREE.Euler();
    const q0 = new THREE.Quaternion();
    const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // 화면 방향 보정

    const handleOrientation = (event) => {
      const { alpha, beta, gamma } = event;
      if (alpha === null) return;

      // 도를 라디안으로 변환
      const alphaRad = THREE.MathUtils.degToRad(alpha);
      const betaRad = THREE.MathUtils.degToRad(beta);
      const gammaRad = THREE.MathUtils.degToRad(gamma);

      // 오일러 각도 설정 (ZXY 순서 - 디바이스 방향 표준)
      euler.set(betaRad, alphaRad, -gammaRad, 'YXZ');

      camera.quaternion.setFromEuler(euler);
      camera.quaternion.multiply(q1); // 카메라가 화면 바깥쪽을 보도록 보정

      // 화면 방향에 따른 보정 (세로 모드 기준)
      const orient = window.orientation || 0;
      q0.setFromAxisAngle(zee, -THREE.MathUtils.degToRad(orient));
      camera.quaternion.multiply(q0);
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [enabled, camera]);

  return null;
}

// 클릭 감지 구체 (등록 모드: 위치 선택, 일반 모드: 배경 클릭 시 선택 해제)
function ClickableSphere({ onPositionSelect, onBackgroundClick, isRegistrationMode }) {
  const { camera, raycaster, pointer } = useThree();

  const handleClick = useCallback((event) => {
    if (isRegistrationMode) {
      raycaster.setFromCamera(pointer, camera);
      const direction = raycaster.ray.direction.clone().normalize();
      const position = direction.multiplyScalar(50);
      onPositionSelect(position);
    } else if (onBackgroundClick) {
      onBackgroundClick();
    }
  }, [isRegistrationMode, camera, raycaster, pointer, onPositionSelect, onBackgroundClick]);

  return (
    <mesh onClick={handleClick}>
      <sphereGeometry args={[49, 64, 64]} />
      <meshBasicMaterial transparent opacity={0} side={THREE.BackSide} />
    </mesh>
  );
}

// 메인 3D 씬
function Scene({
  constellations,
  selectedConstellation,
  setSelectedConstellation,
  isRegistrationMode,
  previewConstellation,
  previewPosition,
  onPositionSelect,
  isValidPosition,
  isGyroEnabled,
  searchTarget,
  currentUserId,
  onDeleteConstellation
}) {
  const { camera } = useThree();
  const controlsRef = useRef();

  // 검색 매칭 별자리로 카메라 회전
  useEffect(() => {
    if (!searchTarget) return;
    const targetPos = celestialToCartesian(searchTarget.ra, searchTarget.dec);
    // 카메라는 원점 근처(거리 0.1)에 있고 원점을 바라봄.
    // 별자리 방향(+d)을 바라보려면 카메라를 -d * 0.1 위치에 둠.
    const direction = targetPos.clone().normalize().multiplyScalar(-0.1);
    camera.position.copy(direction);
    camera.lookAt(0, 0, 0);
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  }, [searchTarget, camera]);

  return (
    <>
      <SkyDome />

      {constellations.map(constellation => (
        <Constellation3D
          key={constellation.id}
          constellation={constellation}
          isSelected={selectedConstellation?.id === constellation.id}
          onSelect={setSelectedConstellation}
          isOwner={!!currentUserId && constellation.userId === currentUserId}
          onDelete={onDeleteConstellation}
        />
      ))}

      {isRegistrationMode && previewConstellation && previewPosition && (
        <>
          <Constellation3D
            constellation={{
              ...previewConstellation,
              ra: previewPosition.ra,
              dec: previewPosition.dec
            }}
            isSelected={false}
            onSelect={() => {}}
            isPreview={true}
          />
          <PositionIndicator
            position={celestialToCartesian(previewPosition.ra, previewPosition.dec)}
            isValid={isValidPosition}
          />
        </>
      )}

      <ClickableSphere
        onPositionSelect={onPositionSelect}
        onBackgroundClick={() => setSelectedConstellation(null)}
        isRegistrationMode={isRegistrationMode}
      />

      {/* 자이로스코프 활성화 시 OrbitControls 비활성화 */}
      {isGyroEnabled ? (
        <GyroscopeControls enabled={true} />
      ) : (
        <OrbitControls
          ref={controlsRef}
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.5}
          minDistance={0.1}
          maxDistance={0.1}
        />
      )}
    </>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export default function SkyPage() {
  const navigate = useNavigate();
  const { user, nickname } = useAuth();

  // 상태
  const [constellations, setConstellations] = useState([]);
  const [selectedConstellation, setSelectedConstellation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 등록 모드 상태
  const [isRegistrationMode, setIsRegistrationMode] = useState(false);
  const [myConstellation, setMyConstellation] = useState(null);
  const [previewPosition, setPreviewPosition] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);

  // 자이로스코프 상태
  const [isGyroEnabled, setIsGyroEnabled] = useState(false);
  const [isGyroAvailable, setIsGyroAvailable] = useState(false);

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState('');

  // 자이로스코프 사용 가능 여부 확인
  useEffect(() => {
    if (window.DeviceOrientationEvent) {
      setIsGyroAvailable(true);
    }
  }, []);

  // 검색어와 매칭되는 첫 번째 별자리 (카메라 이동 대상)
  const searchTarget = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return null;
    return constellations.find(c =>
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.creator && c.creator.toLowerCase().includes(query))
    ) || null;
  }, [constellations, searchQuery]);

  // 위치 유효성 검사
  const isValidPosition = useMemo(() => {
    if (!previewPosition) return false;

    for (const constellation of constellations) {
      const distance = angularDistance(
        previewPosition.ra, previewPosition.dec,
        constellation.ra, constellation.dec
      );
      if (distance < COLLISION_RADIUS) {
        return false;
      }
    }
    return true;
  }, [previewPosition, constellations]);

  // Supabase에서 별자리 목록 로드
  useEffect(() => {
    const fetchConstellations = async () => {
      try {
        setIsLoading(true);

        // sky_constellations에서 모든 별자리 로드
        const { data, error } = await supabase
          .from('sky_constellations')
          .select('*')
          .order('registered_at', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          setConstellations([]);
          setIsLoading(false);
          return;
        }

        // user_id 목록 추출
        const userIds = [...new Set(data.map(item => item.user_id))];

        // profiles에서 닉네임 조회
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, nickname')
          .in('id', userIds);

        // user_id -> nickname 맵 생성
        const nicknameMap = {};
        (profilesData || []).forEach(profile => {
          nicknameMap[profile.id] = profile.nickname;
        });

        // 데이터 변환
        const formattedData = data.map(item => ({
          id: item.id,
          name: item.constellation_name || '이름 없는 별자리',
          creator: nicknameMap[item.user_id] || '익명',
          ra: item.right_ascension,
          dec: item.declination,
          stars: item.stars_data || [],
          connections: item.connections_data || [],
          userId: item.user_id
        }));

        setConstellations(formattedData);

        // 내가 이미 등록했는지 확인
        if (user) {
          const myRegistered = formattedData.find(c => c.userId === user.id);
          if (myRegistered) {
            setHasRegistered(true);
          }
        }

      } catch (err) {
        console.error('Error fetching constellations:', err);
        setError('별자리를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConstellations();
  }, [user]);

  // 내 별자리 데이터 로드 (등록 모드 진입 시)
  const loadMyConstellation = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return false;
    }

    try {
      // 별 데이터 가져오기
      const { data: starsData, error: starsError } = await supabase
        .from('stars')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (starsError) throw starsError;

      if (!starsData || starsData.length === 0) {
        alert('먼저 홈에서 별자리를 만들어주세요!');
        return false;
      }

      // 연결 데이터 가져오기
      const { data: connectionsData, error: connError } = await supabase
        .from('star_connections')
        .select('*')
        .eq('user_id', user.id);

      if (connError) throw connError;

      // 별 위치 데이터 생성 (2D -> 상대 좌표) + 별 속성 포함
      const stars = starsData.map(star => ({
        x: (star.position_x || 175) - 175, // 중심 기준 상대 좌표
        y: (star.position_y || 250) - 250,
        // 별 속성 (HomePage와 동일하게 표시하기 위해)
        star_color: star.star_color,
        star_points: star.star_points,
        star_size: star.star_size,
        star_saturation: star.star_saturation,
        star_sharpness: star.star_sharpness
      }));

      // 연결 데이터 변환
      const connections = (connectionsData || []).map(conn => {
        const fromIndex = starsData.findIndex(s => s.id === conn.from_star_id);
        const toIndex = starsData.findIndex(s => s.id === conn.to_star_id);
        return [fromIndex, toIndex];
      }).filter(([from, to]) => from !== -1 && to !== -1);

      setMyConstellation({
        name: nickname ? `${nickname}의 별자리` : '나의 별자리',
        creator: nickname || '나',
        stars,
        connections
      });

      return true;
    } catch (err) {
      console.error('Error loading my constellation:', err);
      alert('별자리를 불러오는데 실패했습니다.');
      return false;
    }
  };

  // 등록 모드 진입
  const enterRegistrationMode = async () => {
    if (hasRegistered) {
      alert('이미 별자리를 등록했습니다. 한 사람당 하나의 별자리만 등록할 수 있습니다.');
      return;
    }

    const loaded = await loadMyConstellation();
    if (loaded) {
      setIsRegistrationMode(true);
      setSelectedConstellation(null);
    }
  };

  // 등록 모드 종료
  const exitRegistrationMode = () => {
    setIsRegistrationMode(false);
    setPreviewPosition(null);
    setMyConstellation(null);
  };

  // 위치 선택 핸들러
  const handlePositionSelect = (position3D) => {
    const celestial = cartesianToCelestial(position3D);
    setPreviewPosition(celestial);
  };

  // 빈 자리 자동 찾기
  const findEmptySpot = () => {
    const maxAttempts = 100;

    for (let i = 0; i < maxAttempts; i++) {
      const ra = Math.random() * 360;
      const dec = (Math.random() * 180) - 90;

      let isValid = true;
      for (const constellation of constellations) {
        const distance = angularDistance(ra, dec, constellation.ra, constellation.dec);
        if (distance < COLLISION_RADIUS) {
          isValid = false;
          break;
        }
      }

      if (isValid) {
        setPreviewPosition({ ra, dec });
        return;
      }
    }

    alert('빈 자리를 찾지 못했습니다. 직접 선택해주세요.');
  };

  // 내 별자리 삭제
  const handleDeleteConstellation = async (constellation) => {
    if (!user || constellation.userId !== user.id) return;
    if (!window.confirm('이 별자리를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('sky_constellations')
        .delete()
        .eq('id', constellation.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setConstellations(prev => prev.filter(c => c.id !== constellation.id));
      setSelectedConstellation(null);
      setHasRegistered(false);
    } catch (err) {
      console.error('Error deleting constellation:', err);
      alert('삭제에 실패했습니다: ' + err.message);
    }
  };

  // 별자리 등록
  const registerConstellation = async () => {
    if (!previewPosition || !isValidPosition || !myConstellation) return;

    try {
      setIsRegistering(true);

      const { error } = await supabase
        .from('sky_constellations')
        .insert({
          user_id: user.id,
          constellation_name: myConstellation.name,
          stars_data: myConstellation.stars,
          connections_data: myConstellation.connections,
          right_ascension: previewPosition.ra,
          declination: previewPosition.dec
        });

      if (error) throw error;

      // 성공 - 목록에 추가
      const newConstellation = {
        id: Date.now().toString(),
        name: myConstellation.name,
        creator: nickname || '나',
        ra: previewPosition.ra,
        dec: previewPosition.dec,
        stars: myConstellation.stars,
        connections: myConstellation.connections,
        userId: user.id
      };

      setConstellations(prev => [...prev, newConstellation]);
      setHasRegistered(true);
      exitRegistrationMode();
      alert('별자리가 등록되었습니다!');

    } catch (err) {
      console.error('Error registering constellation:', err);
      alert('등록에 실패했습니다: ' + err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* 3D 캔버스 */}
      <Canvas
        camera={{
          position: [0, 0, 0.1],
          fov: 75,
          near: 0.1,
          far: 1000
        }}
      >
        <Suspense fallback={null}>
          <Scene
            constellations={constellations}
            selectedConstellation={selectedConstellation}
            setSelectedConstellation={setSelectedConstellation}
            isRegistrationMode={isRegistrationMode}
            previewConstellation={myConstellation}
            previewPosition={previewPosition}
            onPositionSelect={handlePositionSelect}
            isValidPosition={isValidPosition}
            isGyroEnabled={isGyroEnabled}
            searchTarget={searchTarget}
            currentUserId={user?.id}
            onDeleteConstellation={handleDeleteConstellation}
          />
        </Suspense>
      </Canvas>

      {/* 상단 UI - 광고 배너 + 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-20">
        {/* 광고 배너 영역 */}
        <div className="h-16 bg-[#949494] flex items-center justify-center">
        </div>

        {/* 상단 네비게이션 */}
        <nav className="px-6 py-5">
          <div className="max-w-[370px] mx-auto flex items-center">
            <div className="flex items-center gap-1">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white font-bold text-2xl">별자리 모아보기</span>
            </div>
          </div>
        </nav>

        {/* 검색바 */}
        <div className="px-6">
          <div className="max-w-[370px] mx-auto relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="닉네임 또는 아이디로 별자리 찾기"
              className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/50 px-4 py-3 pr-12 rounded-xl border border-white/20 focus:outline-none focus:border-white/40 text-sm"
            />
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 홈으로 나가기 버튼 */}
        <div className="px-6 mt-4">
          <div className="max-w-[370px] mx-auto">
            <button
              onClick={() => navigate('/home')}
              className="text-white hover:text-white/70 transition-colors"
              aria-label="홈으로 나가기"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white">로딩 중...</div>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="absolute top-20 left-4 right-4 bg-red-500/80 text-white p-3 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* 일반 모드 하단 UI */}
      {!isRegistrationMode && (
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-white/80 text-sm text-center">
              화면을 드래그해서 하늘을 둘러보세요
            </p>
            <p className="text-white/60 text-xs text-center mt-1">
              별자리를 터치하면 정보가 표시됩니다
            </p>

            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-white/70 text-sm">
                {constellations.length}개의 별자리
              </span>
            </div>

            {user && !hasRegistered && (
              <button
                onClick={enterRegistrationMode}
                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-colors"
              >
                내 별자리 등록하기
              </button>
            )}

            {hasRegistered && (
              <p className="text-center text-green-400 text-sm mt-4">
                이미 별자리를 등록했습니다
              </p>
            )}

            {!user && (
              <p className="text-center text-white/50 text-sm mt-4">
                로그인하면 별자리를 등록할 수 있습니다
              </p>
            )}
          </div>
        </div>
      )}

      {/* 등록 모드 UI */}
      {isRegistrationMode && (
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-white/80 text-sm text-center mb-3">
              {previewPosition
                ? `적경: ${previewPosition.ra.toFixed(1)}° / 적위: ${previewPosition.dec.toFixed(1)}°`
                : '원하는 위치를 터치하세요'
              }
            </p>

            {previewPosition && !isValidPosition && (
              <p className="text-red-400 text-sm text-center mb-3">
                이 위치는 다른 별자리와 너무 가깝습니다
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={findEmptySpot}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 rounded-xl font-medium transition-colors"
              >
                빈 자리 자동 찾기
              </button>

              <button
                onClick={registerConstellation}
                disabled={!previewPosition || !isValidPosition || isRegistering}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  previewPosition && isValidPosition && !isRegistering
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                {isRegistering ? '등록 중...' : '여기에 등록'}
              </button>
            </div>

            <button
              onClick={exitRegistrationMode}
              className="w-full mt-3 bg-white/10 hover:bg-white/20 text-white/70 py-2 rounded-xl text-sm transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
