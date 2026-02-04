import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStars } from '../contexts/StarsContext';
import { supabase } from '../lib/supabase';
import NavBar from '../components/NavBar';

// 별 생성을 위한 설정
const palette = [
  { name: '빨강', h: 0 },
  { name: '초록', h: 120 },
  { name: '파랑', h: 220 },
  { name: '노랑', h: 50 }
];
const pointsMap = [8, 5, 4, 6];
const sizeMap = [0.35, 0.25, 0.30, 0.40];

const mapRange = (v, inMin, inMax, outMin, outMax) => {
  return outMin + (outMax - outMin) * ((v - inMin) / (inMax - inMin));
};

// 별 그리기 함수
const drawStar = (ctx, x, y, outerR, innerR, points, fillStyle) => {
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
    const a = i * step - Math.PI / 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.lineJoin = 'round';
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
};

// 별 그리기 헬퍼 함수 (캔버스에 그리기)
const drawStarOnCanvas = (canvas, star) => {
  if (!canvas || !star) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;

  const colorIdx = star.star_color - 1;
  const pointsIdx = star.star_points - 1;
  const sizeIdx = star.star_size - 1;
  const satIdx = star.star_saturation;
  const sharpIdx = star.star_sharpness;

  const starPoints = pointsMap[pointsIdx];
  const starOuter = Math.min(W, H) * sizeMap[sizeIdx];
  const innerRatio = mapRange(sharpIdx, 1, 4, 0.5, 0.2);
  const starInner = starOuter * innerRatio;
  const colorData = palette[colorIdx];
  const saturation = mapRange(satIdx, 1, 4, 80, 20);
  const lightness = 50;
  const starFill = `hsl(${colorData.h}, ${saturation}%, ${lightness}%)`;

  ctx.clearRect(0, 0, W, H);
  drawStar(ctx, cx, cy, starOuter, starInner, starPoints, starFill);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glowScale = 1.3;
  const glowColor = `hsla(${colorData.h}, ${saturation}%, ${lightness}%,`;
  const g2 = ctx.createRadialGradient(cx, cy, starOuter * 0.2, cx, cy, starOuter * glowScale);
  g2.addColorStop(0, glowColor + '0.4)');
  g2.addColorStop(0.5, glowColor + '0.15)');
  g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.arc(cx, cy, starOuter * glowScale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

// 상단 밤하늘 슬롯 (작은 원형)
function SkySlot({ star, onClick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && star) {
      drawStarOnCanvas(canvasRef.current, star);
    }
  }, [star]);

  if (!star) {
    return (
      <div className="w-14 h-14 rounded-full border-2 border-white/30 border-dashed" />
    );
  }

  return (
    <div
      onClick={() => onClick && onClick(star)}
      className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center cursor-pointer hover:opacity-80 transition"
    >
      <canvas ref={canvasRef} width={40} height={40} />
    </div>
  );
}

// 하단 별 카드 컴포넌트
function StarCard({ star, index, isSelected, onClick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && star) {
      drawStarOnCanvas(canvasRef.current, star);
    }
  }, [star]);

  return (
    <div
      onClick={() => onClick(star)}
      className={`aspect-[4/5] bg-white/5 rounded-2xl p-2 transition cursor-pointer flex flex-col ${
        isSelected ? 'border-2 border-white' : 'border-2 border-transparent'
      }`}
    >
      <div className="text-white text-xs font-medium mb-1">
        no.{index + 1}
      </div>
      <div className="flex-1 flex items-center justify-center">
        <canvas ref={canvasRef} width={70} height={70} />
      </div>
      <div className="text-white/60 text-[10px] text-center truncate">
        from. {star.surveyor_name}
      </div>
    </div>
  );
}

function WarehousePage() {
  const navigate = useNavigate();
  const { user, nickname } = useAuth();
  const { stars, skyStars, warehouseStars, maxSkySlots, refreshStars } = useStars();

  // 선택된 별들 (밤하늘에 추가할 별들의 id)
  const [selectedStarIds, setSelectedStarIds] = useState(new Set());
  // 로컬 상태로 현재 밤하늘 별 관리
  const [localSkyStars, setLocalSkyStars] = useState([]);
  const [saving, setSaving] = useState(false);

  // 초기화: 현재 밤하늘 별로 설정
  useEffect(() => {
    setLocalSkyStars(skyStars);
    setSelectedStarIds(new Set(skyStars.map(s => s.id)));
  }, [skyStars]);

  // 별 카드 클릭 핸들러
  const handleStarClick = (star) => {
    const newSelected = new Set(selectedStarIds);

    if (newSelected.has(star.id)) {
      // 이미 선택됨 → 선택 해제 (밤하늘에서 제거)
      newSelected.delete(star.id);
      setLocalSkyStars(prev => prev.filter(s => s.id !== star.id));
    } else {
      // 선택되지 않음 → 선택 (밤하늘에 추가)
      if (localSkyStars.length >= maxSkySlots) {
        alert(`밤하늘에는 최대 ${maxSkySlots}개의 별만 등록할 수 있습니다.`);
        return;
      }
      newSelected.add(star.id);
      // 모든 별에서 해당 별 찾기
      const starToAdd = stars.find(s => s.id === star.id);
      if (starToAdd) {
        setLocalSkyStars(prev => [...prev, starToAdd]);
      }
    }

    setSelectedStarIds(newSelected);
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // 밤하늘로 이동할 별들과 창고로 이동할 별들 분리
      const starsToSky = [];
      const starsToWarehouse = [];

      for (const star of stars) {
        const shouldBeInSky = selectedStarIds.has(star.id);
        const currentlyInSky = skyStars.some(s => s.id === star.id);

        if (shouldBeInSky && !currentlyInSky) {
          starsToSky.push(star.id);
        } else if (!shouldBeInSky && currentlyInSky) {
          starsToWarehouse.push(star.id);
        }
      }

      // 창고로 이동할 별들의 연결선 삭제
      for (const starId of starsToWarehouse) {
        await supabase
          .from('star_connections')
          .delete()
          .eq('user_id', user.id)
          .or(`from_star_id.eq.${starId},to_star_id.eq.${starId}`);
      }

      // 창고로 이동 (in_sky = false)
      if (starsToWarehouse.length > 0) {
        await supabase
          .from('stars')
          .update({ in_sky: false })
          .eq('user_id', user.id)
          .in('id', starsToWarehouse);
      }

      // 밤하늘로 이동 (in_sky = true)
      if (starsToSky.length > 0) {
        await supabase
          .from('stars')
          .update({ in_sky: true })
          .eq('user_id', user.id)
          .in('id', starsToSky);
      }

      await refreshStars();
      navigate('/home', { state: { editMode: true } });
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 모든 별 (created_at 순서 유지)

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030025]">
      {/* 배경 이미지 */}
      <div
        className="absolute top-0 left-0 right-0 bottom-0 bg-cover bg-center bg-no-repeat opacity-100"
        style={{ backgroundImage: 'url(/BackGround.jpg)' }}
      ></div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex flex-col min-h-screen pb-20">
        {/* 광고 배너 영역 */}
        <div className="h-16 bg-[#949494] mt-8 flex items-center justify-center">
        </div>

        {/* 상단 네비게이션 */}
        <nav className="px-6 py-5">
          <div className="max-w-[370px] mx-auto flex justify-between items-center">
            <div className="flex items-center gap-1">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {nickname && <span className="text-white font-bold text-xl">{nickname} 님의 밤하늘</span>}
            </div>
          </div>
        </nav>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 px-6 pb-8">
          {/* 상단: 밤하늘 슬롯들 */}
          <div className="max-w-[340px] mx-auto mb-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {/* 현재 선택된 별들 */}
              {localSkyStars.map((star) => (
                <SkySlot key={star.id} star={star} />
              ))}
              {/* 빈 슬롯들 */}
              {Array.from({ length: Math.max(0, maxSkySlots - localSkyStars.length) }, (_, i) => (
                <SkySlot key={`empty-${i}`} star={null} />
              ))}
            </div>
          </div>

          {/* 하단: 모든 별 카드들 */}
          <div className="grid grid-cols-3 gap-3 max-w-[340px] mx-auto mb-6">
            {stars.map((star, index) => (
              <StarCard
                key={star.id}
                star={star}
                index={index}
                isSelected={selectedStarIds.has(star.id)}
                onClick={handleStarClick}
              />
            ))}

            {/* 링크 공유하고 별 선물받기 카드 */}
            <div className="aspect-[4/5] bg-white/5 border-2 border-white rounded-2xl flex flex-col items-center justify-center transition cursor-pointer hover:bg-white/10">
              <div className="text-white text-4xl mb-1">+</div>
              <div className="text-white text-xs text-center px-2">
                링크 공유하고
              </div>
              <div className="text-white text-xs text-center px-2">
                별 선물받기
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="max-w-[340px] mx-auto">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full py-3 rounded-full font-bold text-lg transition ${
                saving
                  ? 'bg-[#6155F5]/50 text-white/50 cursor-not-allowed'
                  : 'bg-[#6155F5] text-white hover:bg-[#5044d4]'
              }`}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>

      {/* 네비게이션 바 */}
      <NavBar />
    </div>
  );
}

export default WarehousePage;
