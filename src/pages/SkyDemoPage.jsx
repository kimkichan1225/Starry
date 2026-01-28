import { useState, useRef, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';

// 적경/적위를 3D 좌표로 변환 (천구 좌표 → 직교 좌표)
function celestialToCartesian(ra, dec, radius = 50) {
  const raRad = (ra * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;

  const x = radius * Math.cos(decRad) * Math.cos(raRad);
  const y = radius * Math.sin(decRad);
  const z = -radius * Math.cos(decRad) * Math.sin(raRad);

  return new THREE.Vector3(x, y, z);
}

// 색상 팔레트 (참고 코드 1.html 기반) - 빨강, 초록, 파랑, 노랑
const colorPalette = [
  { name: '빨강', h: 0 },
  { name: '초록', h: 120 },
  { name: '파랑', h: 220 },
  { name: '노랑', h: 50 },
  { name: '분홍', h: 330 },
  { name: '하늘', h: 190 },
  { name: '주황', h: 30 },
  { name: '보라', h: 280 },
];

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

// 별 텍스처 생성 함수 (참고 코드 1.html 기반) - HSL 사용
function createStarTexture(hue, saturation, points, sharpness, starSize) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const cx = size / 2;
  const cy = size / 2;
  // starSize: 1~4 -> outerR 조절
  const sizeMultiplier = [0.35, 0.28, 0.22, 0.18][starSize - 1] || 0.28;
  const outerR = size * sizeMultiplier;
  const innerRatio = 0.5 - (sharpness - 1) * 0.1;
  const innerR = outerR * innerRatio;

  // HSL -> RGB 변환 (채도: 1~4 -> 80%~20%)
  const sat = 80 - (saturation - 1) * 20; // 1->80, 2->60, 3->40, 4->20
  const rgb = hslToRgb(hue, sat, 55);
  const hslColor = `hsl(${hue}, ${sat}%, 55%)`;

  // 1) 글로우 효과 (radial gradient)
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

  // 2) 별 모양 그리기 (참고 코드의 drawStar 함수)
  const step = Math.PI / points;
  ctx.beginPath();
  for (let i = 0; i < 2 * points; i++) {
    let r;
    if (i % 2 === 0) {
      // 꼭짓점
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

// 샘플 별자리 데이터
const sampleConstellations = [
  {
    id: 1,
    name: '희망의 별자리',
    creator: '별지기',
    ra: 45,
    dec: 30,
    color: '#FFD700',
    stars: [
      { x: 0, y: 0 }, { x: 15, y: 10 }, { x: 30, y: 5 }, { x: 25, y: -10 }, { x: 10, y: -15 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]
  },
  {
    id: 2,
    name: '꿈꾸는 고래',
    creator: '바다사람',
    ra: 180,
    dec: -20,
    color: '#87CEEB',
    stars: [
      { x: 0, y: 0 }, { x: 20, y: 5 }, { x: 40, y: 0 }, { x: 50, y: -10 }, { x: 30, y: -5 }, { x: 10, y: -8 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]]
  },
  {
    id: 3,
    name: '빛나는 나무',
    creator: '숲의정령',
    ra: 270,
    dec: 50,
    color: '#90EE90',
    stars: [
      { x: 15, y: -20 }, { x: 15, y: 0 }, { x: 0, y: 15 }, { x: 15, y: 25 }, { x: 30, y: 15 },
    ],
    connections: [[0, 1], [1, 2], [1, 3], [1, 4]]
  },
  {
    id: 4,
    name: '달리는 토끼',
    creator: '달빛요정',
    ra: 90,
    dec: 60,
    color: '#FFC0CB',
    stars: [
      { x: 0, y: 0 }, { x: 10, y: 15 }, { x: 25, y: 20 }, { x: 35, y: 10 }, { x: 30, y: -5 }, { x: 15, y: -10 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 4]]
  },
  {
    id: 5,
    name: '잠자는 곰',
    creator: '별숲지기',
    ra: 315,
    dec: -40,
    color: '#DEB887',
    stars: [
      { x: 0, y: 10 }, { x: 20, y: 15 }, { x: 40, y: 10 }, { x: 50, y: 0 }, { x: 40, y: -10 }, { x: 20, y: -15 }, { x: 0, y: -10 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]]
  },
  {
    id: 6,
    name: '춤추는 불꽃',
    creator: '화염술사',
    ra: 135,
    dec: 15,
    color: '#FF6347',
    stars: [
      { x: 15, y: -20 }, { x: 10, y: 0 }, { x: 20, y: 10 }, { x: 15, y: 25 }, { x: 5, y: 15 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [1, 4], [4, 3]]
  },
  {
    id: 7,
    name: '고요한 호수',
    creator: '물의정령',
    ra: 225,
    dec: 0,
    color: '#4169E1',
    stars: [
      { x: 0, y: 0 }, { x: 15, y: -5 }, { x: 30, y: 0 }, { x: 45, y: -5 }, { x: 60, y: 0 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4]]
  },
  {
    id: 8,
    name: '날아오르는 독수리',
    creator: '하늘나그네',
    ra: 0,
    dec: 70,
    color: '#F5F5DC',
    stars: [
      { x: 25, y: 0 }, { x: 15, y: 10 }, { x: 0, y: 20 }, { x: 35, y: 10 }, { x: 50, y: 20 }, { x: 25, y: -15 },
    ],
    connections: [[0, 1], [1, 2], [0, 3], [3, 4], [0, 5]]
  },
  {
    id: 9,
    name: '반짝이는 왕관',
    creator: '별의여왕',
    ra: 160,
    dec: 45,
    color: '#E6E6FA',
    stars: [
      { x: 0, y: 0 }, { x: 10, y: 15 }, { x: 25, y: 20 }, { x: 40, y: 15 }, { x: 50, y: 0 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4]]
  },
  {
    id: 10,
    name: '속삭이는 바람',
    creator: '바람의노래',
    ra: 200,
    dec: -55,
    color: '#98FB98',
    stars: [
      { x: 0, y: 10 }, { x: 15, y: 5 }, { x: 30, y: 15 }, { x: 45, y: 5 }, { x: 60, y: 10 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4]]
  },
  {
    id: 11,
    name: '영원한 사랑',
    creator: '하트별',
    ra: 300,
    dec: 20,
    color: '#FF69B4',
    stars: [
      { x: 15, y: 20 }, { x: 0, y: 10 }, { x: 5, y: -5 }, { x: 15, y: -15 }, { x: 25, y: -5 }, { x: 30, y: 10 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]]
  },
  {
    id: 12,
    name: '빛의 검',
    creator: '별의기사',
    ra: 75,
    dec: -10,
    color: '#C0C0C0',
    stars: [
      { x: 15, y: -25 }, { x: 15, y: -10 }, { x: 15, y: 10 }, { x: 15, y: 25 }, { x: 5, y: -5 }, { x: 25, y: -5 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [4, 1], [1, 5]]
  },
  {
    id: 13,
    name: '피어나는 꽃',
    creator: '봄의요정',
    ra: 120,
    dec: -35,
    color: '#DA70D6',
    stars: [
      { x: 20, y: 0 }, { x: 10, y: 15 }, { x: 20, y: 25 }, { x: 30, y: 15 }, { x: 20, y: -15 },
    ],
    connections: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [2, 3]]
  },
  {
    id: 14,
    name: '우주선',
    creator: '스타파일럿',
    ra: 250,
    dec: -65,
    color: '#00CED1',
    stars: [
      { x: 25, y: 20 }, { x: 15, y: 10 }, { x: 25, y: 0 }, { x: 35, y: 10 }, { x: 25, y: -15 }, { x: 10, y: -10 }, { x: 40, y: -10 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [4, 6]]
  },
  {
    id: 15,
    name: '지혜의 부엉이',
    creator: '밤의현자',
    ra: 340,
    dec: 35,
    color: '#D2691E',
    stars: [
      { x: 10, y: 15 }, { x: 30, y: 15 }, { x: 5, y: 5 }, { x: 35, y: 5 }, { x: 20, y: 0 }, { x: 20, y: -15 },
    ],
    connections: [[0, 2], [1, 3], [2, 4], [3, 4], [4, 5], [0, 1]]
  },
  {
    id: 16,
    name: '무지개 다리',
    creator: '색채의마법사',
    ra: 30,
    dec: -5,
    color: '#FF7F50',
    stars: [
      { x: 0, y: 0 }, { x: 15, y: 15 }, { x: 35, y: 20 }, { x: 55, y: 15 }, { x: 70, y: 0 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4]]
  },
  {
    id: 17,
    name: '빛나는 눈송이',
    creator: '겨울왕국',
    ra: 190,
    dec: 75,
    color: '#B0E0E6',
    stars: [
      { x: 20, y: 0 }, { x: 20, y: 15 }, { x: 20, y: -15 }, { x: 5, y: 8 }, { x: 35, y: 8 }, { x: 5, y: -8 }, { x: 35, y: -8 },
    ],
    connections: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]]
  },
  {
    id: 18,
    name: '작은 배',
    creator: '항해사',
    ra: 100,
    dec: -70,
    color: '#F4A460',
    stars: [
      { x: 0, y: 0 }, { x: 20, y: 5 }, { x: 40, y: 0 }, { x: 20, y: 20 }, { x: 20, y: -10 },
    ],
    connections: [[0, 1], [1, 2], [0, 2], [1, 3], [0, 4], [2, 4]]
  }
];

// 개별 별 컴포넌트 (Sprite 사용 - 항상 카메라를 향함)
function Star3D({ position, hue, saturation, points, sharpness, starSize, spriteScale = 1 }) {
  // 별 텍스처 생성 (메모이제이션)
  const texture = useMemo(() =>
    createStarTexture(hue, saturation, points, sharpness, starSize),
    [hue, saturation, points, sharpness, starSize]
  );

  // 스프라이트 재질 (깜빡임 없음, 항상 보이게)
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

// 별자리 연결선 컴포넌트 - 항상 같은 색상 사용
const LINE_COLOR = new THREE.Color('rgb(255, 255, 227)');

function ConstellationLines({ points }) {
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);

  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial color={LINE_COLOR} opacity={0.5} transparent linewidth={1} />
    </line>
  );
}

// 시드 기반 랜덤 함수 (일관된 랜덤값 생성)
function seededRandom(seed) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// 별자리 그룹 컴포넌트
function Constellation3D({ constellation, onSelect, isSelected }) {
  const groupRef = useRef();

  // 별자리 중심 위치 (천구 좌표)
  const centerPosition = useMemo(() =>
    celestialToCartesian(constellation.ra, constellation.dec),
    [constellation.ra, constellation.dec]
  );

  // 별들의 3D 위치 및 속성 계산 (모든 속성 랜덤)
  const starsData = useMemo(() => {
    // 별자리 평면의 로컬 좌표계 설정
    const up = new THREE.Vector3(0, 1, 0);
    const forward = centerPosition.clone().normalize();
    const right = new THREE.Vector3().crossVectors(up, forward).normalize();
    const localUp = new THREE.Vector3().crossVectors(forward, right).normalize();

    const pointsOptions = [4, 5, 6, 8]; // 꼭짓점 개수 옵션

    return constellation.stars.map((star, index) => {
      // 스케일 조정 (2D 좌표를 3D 공간에 맞게)
      const scale = 0.15;
      const offset = new THREE.Vector3()
        .addScaledVector(right, star.x * scale)
        .addScaledVector(localUp, star.y * scale);

      const position = centerPosition.clone().add(offset);

      // 시드 기반으로 각 별의 속성 결정 (일관된 랜덤) - 모든 속성 랜덤!
      const seed = constellation.id * 100 + index;
      const hue = colorPalette[Math.floor(seededRandom(seed) * colorPalette.length)].h; // 랜덤 색상
      const saturation = 1 + Math.floor(seededRandom(seed + 1) * 4); // 1~4 채도
      const points = pointsOptions[Math.floor(seededRandom(seed + 2) * pointsOptions.length)]; // 꼭짓점
      const sharpness = 1 + Math.floor(seededRandom(seed + 3) * 4); // 1~4 뾰족함
      const starSize = 1 + Math.floor(seededRandom(seed + 4) * 4); // 1~4 크기

      return { position, hue, saturation, points, sharpness, starSize };
    });
  }, [constellation.stars, centerPosition, constellation.id]);

  return (
    <group ref={groupRef}>
      {/* 별들 */}
      {starsData.map((star, index) => (
        <Star3D
          key={index}
          position={star.position}
          hue={star.hue}
          saturation={star.saturation}
          points={star.points}
          sharpness={star.sharpness}
          starSize={star.starSize}
          spriteScale={isSelected ? 1.3 : 1}
        />
      ))}

      {/* 연결선 */}
      {constellation.connections.map(([from, to], index) => (
        <ConstellationLines
          key={index}
          points={[starsData[from].position, starsData[to].position]}
        />
      ))}

      {/* 클릭 영역 및 라벨 */}
      <mesh position={centerPosition} onClick={() => onSelect(constellation)}>
        <sphereGeometry args={[5, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* 선택 시 정보 표시 */}
      {isSelected && (
        <Html position={centerPosition} center>
          <div className="bg-black/80 text-white px-4 py-3 rounded-xl min-w-[150px] text-center pointer-events-none">
            <div className="font-bold text-lg">{constellation.name}</div>
            <div className="text-gray-300 text-sm mt-1">by {constellation.creator}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// 천구 (하늘 배경)
function SkyDome() {
  return (
    <>
      {/* 배경 별들 */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* 은하수 느낌의 빛 */}
      <ambientLight intensity={0.1} />
    </>
  );
}

// 메인 3D 씬
function Scene({ selectedConstellation, setSelectedConstellation }) {
  return (
    <>
      <SkyDome />

      {sampleConstellations.map(constellation => (
        <Constellation3D
          key={constellation.id}
          constellation={constellation}
          isSelected={selectedConstellation?.id === constellation.id}
          onSelect={setSelectedConstellation}
        />
      ))}

      {/* 컨트롤 */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.5}
        // 카메라가 구 안쪽에서 바깥을 바라보도록
        minDistance={0.1}
        maxDistance={0.1}
      />
    </>
  );
}

// 메인 컴포넌트
export default function SkyDemoPage() {
  const navigate = useNavigate();
  const [selectedConstellation, setSelectedConstellation] = useState(null);

  const handleBackgroundClick = () => {
    setSelectedConstellation(null);
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
        onClick={handleBackgroundClick}
      >
        <Suspense fallback={null}>
          <Scene
            selectedConstellation={selectedConstellation}
            setSelectedConstellation={setSelectedConstellation}
          />
        </Suspense>
      </Canvas>

      {/* 상단 UI */}
      <div className="absolute top-0 left-0 right-0 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h1 className="text-white font-bold text-lg">3D 밤하늘 데모</h1>

          <div className="w-10" />
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
          <p className="text-white/80 text-sm">
            화면을 드래그해서 하늘을 둘러보세요
          </p>
          <p className="text-white/60 text-xs mt-1">
            별자리를 터치하면 정보가 표시됩니다
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="flex -space-x-1">
              {sampleConstellations.slice(0, 6).map(c => (
                <div
                  key={c.id}
                  className="w-4 h-4 rounded-full border border-black/30"
                  style={{ backgroundColor: c.color }}
                />
              ))}
            </div>
            <span className="text-white/70 text-sm">
              {sampleConstellations.length}개의 별자리
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
