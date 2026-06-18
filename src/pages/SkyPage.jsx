import { useState, useRef, Suspense, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

// 별 머티리얼 캐시 (동일 외형 조합 재사용 → 반복 생성/GPU 텍스처 누수 방지)
// 외형 조합(색·채도·꼭지점·뾰족함·크기)이 제한적이라 캐시 크기는 자연히 bounded.
const starMaterialCache = new Map();
function getStarMaterial(hue, saturation, points, sharpness, starSize) {
  const key = `${hue}-${saturation}-${points}-${sharpness}-${starSize}`;
  let material = starMaterialCache.get(key);
  if (!material) {
    const texture = createStarTexture(hue, saturation, points, sharpness, starSize);
    material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
    });
    starMaterialCache.set(key, material);
  }
  return material;
}

// 개별 별 컴포넌트
function Star3D({ position, hue, saturation, points, sharpness, starSize, spriteScale = 1 }) {
  const material = useMemo(
    () => getStarMaterial(hue, saturation, points, sharpness, starSize),
    [hue, saturation, points, sharpness, starSize]
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

function ConstellationLines({ start, end }) {
  // start/end는 부모(starsData)에서 메모된 안정적 Vector3 → 매 렌더 geometry 재생성 방지
  const lineGeometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([start, end]),
    [start, end]
  );

  // geometry가 실제로 바뀔 때만 이전 것을 해제 (StrictMode 이중 실행에도 안전)
  const prevGeoRef = useRef(null);
  useEffect(() => {
    if (prevGeoRef.current && prevGeoRef.current !== lineGeometry) {
      prevGeoRef.current.dispose();
    }
    prevGeoRef.current = lineGeometry;
  }, [lineGeometry]);

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
function Constellation3D({ constellation, onSelect, isSelected, isPreview = false, isOwner = false, onEdit }) {
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
          start={starsData[from].position}
          end={starsData[to].position}
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
            {isOwner && onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(constellation); }}
                className="mt-3 inline-flex items-center gap-1 px-4 py-1.5 bg-[#6155F5]/90 hover:bg-[#6155F5] text-white rounded-full text-xs font-semibold transition-all active:scale-95 shadow-lg shadow-[#6155F5]/30"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                위치 수정
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
  focusTarget,
  currentUserId,
  onEditConstellation
}) {
  const { camera } = useThree();
  const controlsRef = useRef();

  // 카메라를 특정 별자리 방향으로 회전
  const lookAtTarget = useCallback((target) => {
    const targetPos = celestialToCartesian(target.ra, target.dec);
    // 카메라는 원점 근처(거리 0.1)에 있고 원점을 바라봄.
    // 별자리 방향(+d)을 바라보려면 카메라를 -d * 0.1 위치에 둠.
    const direction = targetPos.clone().normalize().multiplyScalar(-0.1);
    camera.position.copy(direction);
    camera.lookAt(0, 0, 0);
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  }, [camera]);

  // 검색 매칭 별자리로 카메라 회전
  useEffect(() => {
    if (!searchTarget) return;
    lookAtTarget(searchTarget);
  }, [searchTarget, lookAtTarget]);

  // 내 별자리 위치 보기 버튼으로 카메라 회전
  useEffect(() => {
    if (!focusTarget) return;
    lookAtTarget(focusTarget);
  }, [focusTarget, lookAtTarget]);

  return (
    <>
      <SkyDome />

      {constellations.map(constellation => {
        // 위치 수정 모드에서는 내 별자리를 숨기고 미리보기만 표시
        if (isRegistrationMode && currentUserId && constellation.userId === currentUserId) {
          return null;
        }
        return (
          <Constellation3D
            key={constellation.id}
            constellation={constellation}
            isSelected={selectedConstellation?.id === constellation.id}
            onSelect={setSelectedConstellation}
            isOwner={!!currentUserId && constellation.userId === currentUserId}
            onEdit={onEditConstellation}
          />
        );
      })}

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
// 밤하늘 리스트 아이템 (스와이프 → 나가기)
// ============================================
function SkyListItem({ sky, isActive, onSelect, onLeave }) {
  const REVEAL = 88;
  const [translateX, setTranslateX] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const startXRef = useRef(null);
  const baseRef = useRef(0);
  const draggingRef = useRef(false);

  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    baseRef.current = isOpen ? REVEAL : 0;
    draggingRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (startXRef.current === null) return;
    const delta = e.touches[0].clientX - startXRef.current;
    if (Math.abs(delta) > 4) draggingRef.current = true;
    const next = Math.max(0, Math.min(REVEAL, baseRef.current + delta));
    setTranslateX(next);
  };

  const handleTouchEnd = () => {
    if (startXRef.current === null) return;
    startXRef.current = null;
    const shouldOpen = translateX > REVEAL / 2;
    setIsOpen(shouldOpen);
    setTranslateX(shouldOpen ? REVEAL : 0);
    // 드래그가 발생한 경우 다음 click 이벤트 무시
    if (draggingRef.current) {
      setTimeout(() => { draggingRef.current = false; }, 50);
    }
  };

  const handleClick = () => {
    if (draggingRef.current) return;
    if (isOpen) {
      setIsOpen(false);
      setTranslateX(0);
      return;
    }
    onSelect(sky);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* 뒷쪽 나가기 버튼 */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onLeave(sky); setIsOpen(false); setTranslateX(0); }}
        className="absolute left-0 top-0 bottom-0 w-[88px] bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center"
      >
        나가기
      </button>
      {/* 앞쪽 메인 아이템 */}
      <button
        type="button"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: startXRef.current === null ? 'transform 0.2s ease-out' : 'none',
          touchAction: 'pan-y',
        }}
        className={`relative w-full py-3 px-4 rounded-xl text-left text-sm transition-colors truncate ${
          isActive
            ? 'bg-[#2f2c5c] text-white border border-[#6155F5]/50'
            : 'bg-[#2a2a2a] hover:bg-[#333] text-white/90 border border-white/10'
        }`}
      >
        {sky.name}
      </button>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export default function SkyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const skyIdFromUrl = searchParams.get('sky') || null;

  // 상태
  const [constellations, setConstellations] = useState([]);
  const [selectedConstellation, setSelectedConstellation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 위치 수정 모드 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [myConstellation, setMyConstellation] = useState(null); // 미리보기용 {name, creator, stars, connections}
  const [previewPosition, setPreviewPosition] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // 자이로스코프 상태
  const [isGyroEnabled, setIsGyroEnabled] = useState(false);
  const [isGyroAvailable, setIsGyroAvailable] = useState(false);

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState('');

  // 내 별자리 위치 보기 (카메라 포커스 대상)
  const [focusTarget, setFocusTarget] = useState(null);

  // 개인 밤하늘 상태
  const [activeSky, setActiveSky] = useState(null); // {id, name, invite_code, owner_id} | null (=전체)
  const [mySkies, setMySkies] = useState([]); // 가입된 밤하늘 목록
  const [skyMemberIds, setSkyMemberIds] = useState(null); // activeSky의 멤버 user_id 집합 (null=로딩중)
  const [isSkyListExpanded, setIsSkyListExpanded] = useState(false);

  // 팝업 상태: null | 'choice' | 'create' | 'enter-code' | 'invite-link'
  const [popupMode, setPopupMode] = useState(null);
  const [newSkyName, setNewSkyName] = useState('');
  const [enterCodeInput, setEnterCodeInput] = useState('');
  const [popupBusy, setPopupBusy] = useState(false);
  const [popupError, setPopupError] = useState('');
  const [copyToast, setCopyToast] = useState('');

  // 자이로스코프 사용 가능 여부 확인
  useEffect(() => {
    if (window.DeviceOrientationEvent) {
      setIsGyroAvailable(true);
    }
  }, []);

  // 내 가입 밤하늘 목록 로드
  const refreshMySkies = useCallback(async () => {
    if (!user) {
      setMySkies([]);
      return [];
    }
    const { data, error: err } = await supabase
      .from('sky_members')
      .select('skies(id, name, invite_code, owner_id)')
      .eq('user_id', user.id);
    if (err) {
      console.error('Error loading my skies:', err);
      return [];
    }
    const skies = (data || []).map(d => d.skies).filter(Boolean);
    setMySkies(skies);
    return skies;
  }, [user]);

  useEffect(() => {
    refreshMySkies();
  }, [refreshMySkies]);

  // URL ?sky= 동기화 (mySkies 로드 후 매칭)
  useEffect(() => {
    if (!skyIdFromUrl) {
      setActiveSky(null);
      return;
    }
    const found = mySkies.find(s => s.id === skyIdFromUrl);
    if (found) {
      setActiveSky(found);
    } else if (mySkies.length > 0) {
      // URL의 sky에 멤버가 아님 → 전체로 fallback
      setActiveSky(null);
      setSearchParams({}, { replace: true });
    }
  }, [skyIdFromUrl, mySkies, setSearchParams]);

  // activeSky 변경 시 그 sky의 멤버 user_id 목록 로드
  useEffect(() => {
    if (!activeSky) {
      setSkyMemberIds(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase
        .from('sky_members')
        .select('user_id')
        .eq('sky_id', activeSky.id);
      if (cancelled) return;
      if (err) {
        console.error('Error loading sky members:', err);
        setSkyMemberIds(new Set());
        return;
      }
      setSkyMemberIds(new Set((data || []).map(m => m.user_id)));
    })();
    return () => { cancelled = true; };
  }, [activeSky]);

  // 현재 보고 있는 sky에 따라 별자리 필터링
  const visibleConstellations = useMemo(() => {
    if (!activeSky) return constellations;
    if (!skyMemberIds) return [];
    return constellations.filter(c => skyMemberIds.has(c.userId));
  }, [constellations, activeSky, skyMemberIds]);

  // 검색어와 매칭되는 첫 번째 별자리 (카메라 이동 대상)
  const searchTarget = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return null;
    return visibleConstellations.find(c =>
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.creator && c.creator.toLowerCase().includes(query))
    ) || null;
  }, [visibleConstellations, searchQuery]);

  // 내 별자리 (현재 보고 있는 밤하늘 기준)
  const myEntry = useMemo(
    () => (user ? visibleConstellations.find(c => c.userId === user.id) || null : null),
    [visibleConstellations, user]
  );

  // 위치 유효성 검사 (전체 별자리 기준 / 내 별자리는 제외)
  const isValidPosition = useMemo(() => {
    if (!previewPosition) return false;

    for (const constellation of constellations) {
      if (user && constellation.userId === user.id) continue;
      const distance = angularDistance(
        previewPosition.ra, previewPosition.dec,
        constellation.ra, constellation.dec
      );
      if (distance < COLLISION_RADIUS) {
        return false;
      }
    }
    return true;
  }, [previewPosition, constellations, user]);

  // 빈 자리 찾기 (순수 함수: occupied 목록 중 충돌 없는 좌표 반환)
  const findEmptySpotPosition = useCallback((occupied) => {
    for (let i = 0; i < 100; i++) {
      const ra = Math.random() * 360;
      const dec = Math.random() * 180 - 90;
      let ok = true;
      for (const o of occupied) {
        if (angularDistance(ra, dec, o.ra, o.dec) < COLLISION_RADIUS) { ok = false; break; }
      }
      if (ok) return { ra, dec };
    }
    return null;
  }, []);

  // Supabase에서 별자리 목록 로드 (등록/동기화는 저장 시점에 처리됨)
  const fetchConstellations = useCallback(async (showLoading = true) => {
      try {
        if (showLoading) setIsLoading(true);

        // sky_constellations에서 모든 별자리 로드
        const { data, error } = await supabase
          .from('sky_constellations')
          .select('*')
          .order('registered_at', { ascending: true });

        if (error) throw error;

        const rows = data || [];

        if (rows.length === 0) {
          setConstellations([]);
          return;
        }

        // user_id 목록 추출
        const userIds = [...new Set(rows.map(item => item.user_id))];

        // profiles에서 닉네임 조회
        const { data: profilesData } = await supabase
          .from('public_profiles')
          .select('id, nickname')
          .in('id', userIds);

        // user_id -> nickname 맵 생성
        const nicknameMap = {};
        (profilesData || []).forEach(profile => {
          nicknameMap[profile.id] = profile.nickname;
        });

        // 데이터 변환
        const formattedData = rows.map(item => ({
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
      } catch (err) {
        console.error('Error fetching constellations:', err);
        setError('별자리를 불러오는데 실패했습니다.');
      } finally {
        if (showLoading) setIsLoading(false);
      }
  }, [user]);

  useEffect(() => {
    fetchConstellations();
  }, [fetchConstellations]);

  // 3D 밤하늘 실시간 반영: sky_constellations 변경(추가/수정/삭제)을 구독해 자동 갱신
  // (모양 수정, 이름 변경, 위치 이동 등 모든 변경이 떠 있는 화면에 즉시 반영됨)
  useEffect(() => {
    const channel = supabase
      .channel('sky_constellations_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sky_constellations' },
        () => { fetchConstellations(false); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchConstellations]);

  // 위치 수정 모드 진입 (팝업의 "위치 수정" 버튼)
  const enterEditMode = (constellation) => {
    setMyConstellation({
      name: constellation.name,
      creator: constellation.creator,
      stars: constellation.stars,
      connections: constellation.connections
    });
    setPreviewPosition({ ra: constellation.ra, dec: constellation.dec });
    setIsEditMode(true);
    setSelectedConstellation(null);
  };

  // 위치 수정 모드 종료
  const exitEditMode = () => {
    setIsEditMode(false);
    setPreviewPosition(null);
    setMyConstellation(null);
  };

  // 위치 선택 핸들러
  const handlePositionSelect = (position3D) => {
    const celestial = cartesianToCelestial(position3D);
    setPreviewPosition(celestial);
  };

  // 빈 자리 자동 찾기 (내 별자리는 제외)
  const findEmptySpot = () => {
    const occupied = constellations
      .filter(c => !myEntry || c.id !== myEntry.id)
      .map(c => ({ ra: c.ra, dec: c.dec }));
    const pos = findEmptySpotPosition(occupied);
    if (pos) {
      setPreviewPosition(pos);
    } else {
      alert('빈 자리를 찾지 못했습니다. 직접 선택해주세요.');
    }
  };

  // 밤하늘 나가기
  const handleLeaveSky = async (sky) => {
    if (!user) return;
    if (!window.confirm(`'${sky.name}' 밤하늘에서 나가시겠어요?`)) return;
    try {
      const { error: delErr } = await supabase
        .from('sky_members')
        .delete()
        .eq('sky_id', sky.id)
        .eq('user_id', user.id);
      if (delErr) throw delErr;

      if (activeSky?.id === sky.id) {
        setSearchParams({}, { replace: false });
      }
      await refreshMySkies();
      setCopyToast(`'${sky.name}' 밤하늘에서 나왔어요`);
      setTimeout(() => setCopyToast(''), 2000);
    } catch (err) {
      console.error('Error leaving sky:', err);
      alert('나가기에 실패했습니다.');
    }
  };

  // 밤하늘 전환
  const switchToSky = useCallback((sky) => {
    setSelectedConstellation(null);
    setFocusTarget(null);
    setIsSkyListExpanded(false);
    if (sky) {
      setSearchParams({ sky: sky.id }, { replace: false });
    } else {
      setSearchParams({}, { replace: false });
    }
  }, [setSearchParams]);

  // + 버튼 → 만들기/입장 선택 팝업
  const openChoicePopup = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    setPopupError('');
    setPopupMode('choice');
  };

  const closePopup = () => {
    setPopupMode(null);
    setNewSkyName('');
    setEnterCodeInput('');
    setPopupError('');
  };

  // skies INSERT를 SECURITY DEFINER RPC 로 호출 (RLS 우회, 인증 필수)
  const createSkyViaRpc = async (name) => {
    const { data, error: err } = await supabase.rpc('create_sky', { p_name: name });
    if (err) throw err;
    // RPC가 TABLE을 반환 → 배열로 옴
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error('create_sky returned no row');
    return row;
  };

  // 새 밤하늘 만들기 → 확인
  const handleCreateSky = async () => {
    const name = newSkyName.trim();
    if (!name) {
      setPopupError('밤하늘 이름을 입력해주세요.');
      return;
    }
    if (!user) return;
    try {
      setPopupBusy(true);
      setPopupError('');
      const sky = await createSkyViaRpc(name);
      await refreshMySkies();
      switchToSky(sky);
      closePopup();
    } catch (err) {
      console.error('Error creating sky:', err);
      setPopupError('밤하늘을 만들지 못했습니다.');
    } finally {
      setPopupBusy(false);
    }
  };

  // 새 밤하늘 만들기 → 초대 링크 (이름 입력 후 만들고 링크 복사)
  const handleCreateSkyAndCopyLink = async () => {
    const name = newSkyName.trim();
    if (!name) {
      setPopupError('밤하늘 이름을 입력해주세요.');
      return;
    }
    if (!user) return;
    try {
      setPopupBusy(true);
      setPopupError('');
      const sky = await createSkyViaRpc(name);
      await refreshMySkies();
      const link = `${window.location.origin}/sky?code=${sky.invite_code}`;
      try {
        await navigator.clipboard.writeText(link);
        setCopyToast('초대 링크를 복사했습니다');
      } catch {
        setCopyToast(`초대 코드: ${sky.invite_code}`);
      }
      setTimeout(() => setCopyToast(''), 2500);
      switchToSky(sky);
      closePopup();
    } catch (err) {
      console.error('Error creating sky:', err);
      setPopupError('밤하늘을 만들지 못했습니다.');
    } finally {
      setPopupBusy(false);
    }
  };

  // 코드로 입장하기 → 확인
  const handleJoinByCode = async () => {
    const code = enterCodeInput.trim().toUpperCase();
    if (!code) {
      setPopupError('코드를 입력해주세요.');
      return;
    }
    if (!user) return;
    try {
      setPopupBusy(true);
      setPopupError('');
      const { data: skyId, error: rpcErr } = await supabase.rpc('join_sky_by_code', { p_code: code });
      if (rpcErr) throw rpcErr;
      if (!skyId) {
        setPopupError('유효하지 않은 코드입니다.');
        return;
      }
      const skies = await refreshMySkies();
      const joined = skies.find(s => s.id === skyId);
      if (joined) {
        switchToSky(joined);
      }
      closePopup();
    } catch (err) {
      console.error('Error joining sky:', err);
      setPopupError('입장에 실패했습니다.');
    } finally {
      setPopupBusy(false);
    }
  };

  // URL ?code= 자동 입장 처리
  const codeFromUrl = searchParams.get('code');
  useEffect(() => {
    if (!codeFromUrl || !user) return;
    let cancelled = false;
    (async () => {
      const { data: skyId } = await supabase.rpc('join_sky_by_code', { p_code: codeFromUrl });
      if (cancelled) return;
      const skies = await refreshMySkies();
      if (skyId) {
        const joined = skies.find(s => s.id === skyId);
        if (joined) {
          setSearchParams({ sky: joined.id }, { replace: true });
          setCopyToast(`${joined.name} 밤하늘에 입장했습니다`);
          setTimeout(() => setCopyToast(''), 2500);
          return;
        }
      }
      setSearchParams({}, { replace: true });
    })();
    return () => { cancelled = true; };
  }, [codeFromUrl, user, refreshMySkies, setSearchParams]);

  // 위치 변경 저장
  const savePosition = async () => {
    if (!previewPosition || !isValidPosition || !user) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('sky_constellations')
        .update({
          right_ascension: previewPosition.ra,
          declination: previewPosition.dec
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setConstellations(prev => prev.map(c =>
        (myEntry && c.id === myEntry.id)
          ? { ...c, ra: previewPosition.ra, dec: previewPosition.dec }
          : c
      ));
      exitEditMode();
    } catch (err) {
      console.error('Error updating position:', err);
      alert('위치 수정에 실패했습니다: ' + err.message);
    } finally {
      setIsSaving(false);
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
            constellations={visibleConstellations}
            selectedConstellation={selectedConstellation}
            setSelectedConstellation={setSelectedConstellation}
            isRegistrationMode={isEditMode}
            previewConstellation={myConstellation}
            previewPosition={previewPosition}
            onPositionSelect={handlePositionSelect}
            isValidPosition={isValidPosition}
            isGyroEnabled={isGyroEnabled}
            searchTarget={searchTarget}
            focusTarget={focusTarget}
            currentUserId={user?.id}
            onEditConstellation={enterEditMode}
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
              <span className="text-white font-bold text-2xl">
                {activeSky ? activeSky.name : '별자리 모아보기'}
              </span>
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

        {/* 내 별자리 위치 보기 + 홈으로 나가기 버튼 + 하늘 코드 */}
        <div className="px-6 mt-4">
          <div className="max-w-[370px] mx-auto flex flex-col gap-4 items-start pl-2">
            {/* 내 별자리 위치 보기 버튼 + 하늘 코드 */}
            <div className="w-full flex items-center justify-between">
              {myEntry ? (
                <button
                  onClick={() => {
                    setSelectedConstellation(myEntry);
                    setFocusTarget({ ra: myEntry.ra, dec: myEntry.dec, nonce: Date.now() });
                  }}
                  className="w-7 h-7 flex items-center justify-center text-white hover:text-white/70 transition-colors"
                  aria-label="내 별자리 위치 보기"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="8" cy="12" r="6.5" strokeWidth={2} />
                    <circle cx="8" cy="12" r="1.5" fill="currentColor" stroke="none" />
                    <path strokeLinecap="round" strokeWidth={2} d="M8 2.5V4.5M8 19.5v2M16 12h-1.5M1.5 12H0" />
                  </svg>
                </button>
              ) : (
                <div className="w-7 h-7" />
              )}
              {activeSky?.invite_code && (
                <button
                  onClick={async () => {
                    const link = `${window.location.origin}/sky?code=${activeSky.invite_code}`;
                    try {
                      await navigator.clipboard.writeText(link);
                      setCopyToast('초대 링크를 복사했습니다');
                    } catch {
                      setCopyToast(`코드: ${activeSky.invite_code}`);
                    }
                    setTimeout(() => setCopyToast(''), 2000);
                  }}
                  className="text-white/80 text-sm hover:text-white transition-colors pr-2"
                  title="초대 링크 복사"
                >
                  하늘 코드 : {activeSky.invite_code}
                </button>
              )}
            </div>
            {/* 홈으로 나가기 버튼 */}
            <button
              onClick={() => navigate('/home')}
              className="w-7 h-7 flex items-center justify-center text-white hover:text-white/70 transition-colors"
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

      {/* 일반 모드 하단 UI - 전체 밤하늘 펼침 패널 */}
      {!isEditMode && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          {/* 펼침 패널 (목록 + 추가) */}
          {isSkyListExpanded && (
            <div className="px-6 pb-2">
              <div className="max-w-[370px] mx-auto bg-[#1a1a1a]/95 backdrop-blur-sm rounded-t-2xl px-4 pt-4 pb-2 max-h-[60vh] overflow-y-auto">
                {/* + 추가 버튼 */}
                <button
                  onClick={openChoicePopup}
                  className="w-full py-3 mb-3 bg-white/5 hover:bg-white/10 text-white/80 text-2xl font-light rounded-xl border border-white/10 transition-colors flex items-center justify-center"
                  aria-label="밤하늘 추가"
                >
                  +
                </button>

                {/* 내 밤하늘 목록 */}
                {mySkies.length === 0 ? (
                  <p className="text-white/40 text-xs text-center py-4">
                    아직 입장한 밤하늘이 없어요
                  </p>
                ) : (
                  <div className="space-y-2">
                    {mySkies.map(sky => (
                      <SkyListItem
                        key={sky.id}
                        sky={sky}
                        isActive={activeSky?.id === sky.id}
                        onSelect={switchToSky}
                        onLeave={handleLeaveSky}
                      />
                    ))}
                    <p className="text-white/30 text-[10px] text-center pt-1">
                      좌→우로 드래그하면 나가기 버튼이 보여요
                    </p>
                  </div>
                )}

                {/* 전체 밤하늘로 이동 */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <button
                    onClick={() => switchToSky(null)}
                    className={`w-full py-3 px-4 rounded-xl text-left text-sm transition-colors ${
                      !activeSky
                        ? 'bg-[#2f2c5c] text-white border border-[#6155F5]/50'
                        : 'bg-[#2a2a2a] hover:bg-[#333] text-white/90 border border-white/10'
                    }`}
                  >
                    전체 밤하늘
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 하단 트리거 바 */}
          <div className="px-6 pb-6">
            <div className="max-w-[370px] mx-auto">
              <button
                onClick={() => setIsSkyListExpanded(prev => !prev)}
                className={`w-full bg-[#2a2a2a]/95 backdrop-blur-sm text-white py-4 px-5 flex items-center justify-between transition-colors hover:bg-[#333]/95 ${
                  isSkyListExpanded ? 'rounded-b-2xl' : 'rounded-2xl'
                }`}
              >
                <span className="text-sm font-medium">
                  {activeSky ? activeSky.name : '전체 밤하늘'}
                </span>
                <svg
                  className={`w-5 h-5 text-white/70 transition-transform ${isSkyListExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 위치 수정 모드 UI */}
      {isEditMode && (
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
                onClick={savePosition}
                disabled={!previewPosition || !isValidPosition || isSaving}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  previewPosition && isValidPosition && !isSaving
                    ? 'bg-[#6155F5] hover:bg-[#5046d8] text-white'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                {isSaving ? '저장 중...' : '위치 변경'}
              </button>
            </div>

            <button
              onClick={exitEditMode}
              className="w-full mt-3 bg-white/10 hover:bg-white/20 text-white/70 py-2 rounded-xl text-sm transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {copyToast && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white px-4 py-2 rounded-full text-sm">
          {copyToast}
        </div>
      )}

      {/* 선택 팝업 (새 밤하늘 만들기 / 코드로 입장하기) */}
      {popupMode === 'choice' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closePopup}
          />
          <div className="relative bg-white rounded-2xl px-6 py-5 w-full max-w-[320px] shadow-2xl">
            <button
              onClick={closePopup}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl leading-none"
              aria-label="닫기"
            >
              ✕
            </button>
            <div className="flex items-stretch gap-4 mt-2">
              <button
                onClick={() => { setPopupError(''); setNewSkyName(''); setPopupMode('create'); }}
                className="flex-1 flex flex-col items-center gap-2 py-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <img src="/making-sky.svg" alt="새 밤하늘 만들기" className="w-20 h-20 object-contain" />
                <span className="text-sm font-medium text-gray-800 text-center leading-tight">
                  새 밤하늘<br />만들기
                </span>
              </button>
              <div className="w-px bg-gray-200" />
              <button
                onClick={() => { setPopupError(''); setEnterCodeInput(''); setPopupMode('enter-code'); }}
                className="flex-1 flex flex-col items-center gap-2 py-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <img src="/into-sky.svg" alt="코드로 입장하기" className="w-20 h-20 object-contain" />
                <span className="text-sm font-medium text-gray-800 text-center leading-tight">
                  코드로<br />입장하기
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 새 밤하늘 만들기 팝업 */}
      {popupMode === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={popupBusy ? undefined : closePopup}
          />
          <div className="relative bg-white rounded-2xl px-6 pt-6 pb-5 w-full max-w-[320px] shadow-2xl border-2 border-[#d8d3ff]">
            <button
              onClick={closePopup}
              disabled={popupBusy}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl leading-none disabled:opacity-40"
              aria-label="닫기"
            >
              ✕
            </button>
            <h2 className="text-center text-[#6155F5] font-bold text-lg mb-4">
              새 밤하늘 만들기
            </h2>
            <input
              type="text"
              value={newSkyName}
              onChange={(e) => setNewSkyName(e.target.value)}
              placeholder="밤하늘 이름 입력"
              maxLength={50}
              disabled={popupBusy}
              className="w-full bg-white border border-gray-300 rounded-full px-5 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#6155F5] mb-4"
            />
            {popupError && (
              <p className="text-red-500 text-xs text-center mb-2">{popupError}</p>
            )}
            <button
              onClick={handleCreateSky}
              disabled={popupBusy || !newSkyName.trim()}
              className="w-full bg-[#6155F5] hover:bg-[#5046d8] disabled:bg-gray-300 text-white font-semibold py-3 rounded-full transition-colors mb-2"
            >
              {popupBusy ? '만드는 중...' : '확인'}
            </button>
            <button
              onClick={handleCreateSkyAndCopyLink}
              disabled={popupBusy || !newSkyName.trim()}
              className="w-full bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 text-white font-semibold py-3 rounded-full transition-colors"
            >
              초대 링크
            </button>
          </div>
        </div>
      )}

      {/* 코드로 입장하기 팝업 */}
      {popupMode === 'enter-code' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={popupBusy ? undefined : closePopup}
          />
          <div className="relative bg-white rounded-2xl px-6 pt-6 pb-5 w-full max-w-[320px] shadow-2xl border-2 border-[#d8d3ff]">
            <button
              onClick={closePopup}
              disabled={popupBusy}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl leading-none disabled:opacity-40"
              aria-label="닫기"
            >
              ✕
            </button>
            <h2 className="text-center text-[#6155F5] font-bold text-lg mb-4">
              코드로 입장하기
            </h2>
            <input
              type="text"
              value={enterCodeInput}
              onChange={(e) => setEnterCodeInput(e.target.value.toUpperCase())}
              placeholder="코드 입력"
              maxLength={16}
              disabled={popupBusy}
              className="w-full bg-white border border-gray-300 rounded-full px-5 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#6155F5] mb-4 tracking-widest text-center font-mono"
            />
            {popupError && (
              <p className="text-red-500 text-xs text-center mb-2">{popupError}</p>
            )}
            <button
              onClick={handleJoinByCode}
              disabled={popupBusy || !enterCodeInput.trim()}
              className="w-full bg-[#6155F5] hover:bg-[#5046d8] disabled:bg-gray-300 text-white font-semibold py-3 rounded-full transition-colors mb-2"
            >
              {popupBusy ? '입장 중...' : '확인'}
            </button>
            <button
              onClick={closePopup}
              disabled={popupBusy}
              className="w-full bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 text-white font-semibold py-3 rounded-full transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
