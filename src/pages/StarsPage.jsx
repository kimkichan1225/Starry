import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
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

// 별 카드 컴포넌트
function StarCard({ star, index }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && star) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;

      // 별 속성 계산
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

      // 배경 클리어
      ctx.clearRect(0, 0, W, H);

      // 별 그리기
      drawStar(ctx, cx, cy, starOuter, starInner, starPoints, starFill);

      // 별 글로우 효과
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
    }
  }, [star]);

  return (
    <div className="aspect-[4/5] bg-white/5 border-2 border-white rounded-2xl p-2 hover:border-white/70 transition cursor-pointer flex flex-col">
      <div className="text-white text-xs font-medium mb-1">
        no.{index + 1}
      </div>
      {star ? (
        <div className="flex-1 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={70}
            height={70}
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}
      {star && (
        <div className="text-white/60 text-[10px] text-center truncate">
          from. {star.surveyor_name}
        </div>
      )}
    </div>
  );
}

function StarsPage() {
  const { user, nickname } = useAuth();
  const [stars, setStars] = useState([]);
  const [loading, setLoading] = useState(true);
  const maxStars = 20;

  // 별 데이터 가져오기
  useEffect(() => {
    const fetchStars = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('stars')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setStars(data || []);
      } catch (error) {
        console.error('Error fetching stars:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStars();
  }, [user]);

  // 빈 카드 슬롯 생성 (받은 별 + 빈 슬롯 = 11개, 마지막은 추가 버튼)
  const totalSlots = 11;
  const emptySlots = Math.max(0, totalSlots - stars.length);

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
        <nav className="pl-6 pr-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {nickname && <span className="text-white font-bold text-2xl">{nickname} 님의 별 보관소</span>}
          </div>
        </nav>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 px-6 pt-3 pb-8">
          {/* 별 개수 표시 */}
          <div className="text-center mb-6">
            <span className="text-white text-lg">{stars.length} / {maxStars} 개의 별을 선물 받았어요!</span>
          </div>

          {/* 카드 그리드 */}
          <div className="grid grid-cols-3 gap-3 max-w-[340px] mx-auto mb-6">
            {/* 받은 별 카드들 */}
            {stars.map((star, index) => (
              <StarCard key={star.id} star={star} index={index} />
            ))}

            {/* 빈 슬롯들 */}
            {Array.from({ length: emptySlots }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-[4/5] bg-white/5 border-2 border-white/30 border-dashed rounded-2xl p-2"
              >
                <div className="text-white/30 text-xs font-medium">
                  no.{stars.length + i + 1}
                </div>
              </div>
            ))}

            {/* 추가 버튼 카드 */}
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

          {/* 로그인 안내 박스 */}
          <div className="mb-6 max-w-[340px] mx-auto">
            <div className="flex flex-col items-center gap-2 text-center bg-white/5 border-2 border-dashed border-white/50 rounded-xl p-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div className="text-white">
                <div className="text-sm">광고 보고</div>
                <div className="text-sm">별 보관함 확장하기 (+3)</div>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <footer className="pt-6 text-center">
            <div className="flex items-center justify-center space-x-4 text-white/80 text-sm">
              <img
                src="/Logo.png"
                alt="STARRY"
                className="h-3 -translate-y-[18px]"
              />
              <div className="h-6 w-px bg-white/40 -translate-y-[18px]"></div>
              <div className="text-left space-y-1">
                <div className="text-[9px] leading-snug">
                  광고 문의: 123456789@gmail.com <br />
                  기타 문의: 987654321@gmail.com <br />
                  Copyright ©2025 123456789. All rights reserved.
                </div>
                {/* 개발자/디자이너 정보 */}
                <div className="text-white/70 text-[9px] flex items-center space-x-1">
                  <span className="font-semibold text-white">개발자</span>
                  <span>김기찬</span>
                  <span className="text-white/40">·</span>
                  <span className="font-semibold text-white">디자이너</span>
                  <span>김태희</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* 네비게이션 바 */}
      <NavBar />
    </div>
  );
}

export default StarsPage;
