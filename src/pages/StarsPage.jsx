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

// 별 그리기 헬퍼 함수 (캔버스에 그리기)
const drawStarOnCanvas = (canvas, star) => {
  if (!canvas || !star) return;

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
};

// 별 카드 컴포넌트
function StarCard({ star, index, onClick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && star) {
      drawStarOnCanvas(canvasRef.current, star);
    }
  }, [star]);

  return (
    <div
      onClick={() => star && onClick(star, index)}
      className="aspect-[4/5] bg-white/5 border-2 border-white rounded-2xl p-2 hover:border-white/70 transition cursor-pointer flex flex-col"
    >
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

// 별 상세 모달 컴포넌트
function StarDetailModal({ star, index, onClose, onDelete }) {
  const canvasRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (canvasRef.current && star) {
      drawStarOnCanvas(canvasRef.current, star);
    }
  }, [star]);

  if (!star) return null;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(star.id);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      ></div>

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-2xl p-5 w-full max-w-[240px]">
        {/* 상단 영역 */}
        <div className="flex justify-between items-start mb-2">
          {/* 왼쪽: 번호와 이름 */}
          <div>
            <div className="text-[#6155F5] text-sm font-bold mt-1">no.{index + 1}</div>
            <div className="text-[#6155F5] text-base mt-1"><span className="font-bold">{star.surveyor_name}</span>님이 보낸 별</div>
          </div>

          {/* 오른쪽: 닫기, 삭제 버튼 */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={handleDeleteClick}
              className="text-gray-500 hover:text-red-500 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* 별 이미지 영역 */}
        <div className="flex justify-center my-4">
          <div className="w-32 h-32 bg-[#0F223A] rounded-full flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={100}
              height={100}
            />
          </div>
        </div>

        {/* 전체 답변 보기 버튼 */}
        <button className="w-full py-2 bg-[#6155F5] text-white text-lg rounded-full hover:bg-[#5044d4] transition">
          전체 답변 보기
        </button>

        {/* 삭제 확인 오버레이 */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-white rounded-2xl flex flex-col p-5">
            {/* 상단 영역 */}
            <div className="flex justify-between items-start mb-4">
              {/* 왼쪽: 번호와 이름 */}
              <div>
                <div className="text-[#C5C5C5] text-sm font-bold mt-1">no.{index + 1}</div>
                <div className="text-[#C5C5C5] text-base mt-1"><span className="font-bold">{star.surveyor_name}</span>님이 보낸 별</div>
              </div>

              {/* 오른쪽: 닫기 버튼 */}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 확인 메시지 */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-[#6155F5] text-center font-bold mb-6">
                한 번 삭제한 별은<br />복구할 수 없습니다.
              </p>
              <p className="text-[#6155F5] text-center font-medium mb-6">
                정말 삭제하시겠습니까?
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={handleCancelDelete}
                className="flex-1 py-2 border-2 border-gray-300 bg-[#C5C5C5] text-[#727272] rounded-full hover:bg-gray-100 transition"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-[#6155F5] text-white rounded-full hover:bg-[#5044d4] transition"
              >
                삭제
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StarsPage() {
  const { user, nickname } = useAuth();
  const [stars, setStars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStar, setSelectedStar] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const maxStars = 20;

  // 별 카드 클릭 핸들러
  const handleStarClick = (star, index) => {
    setSelectedStar(star);
    setSelectedIndex(index);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setSelectedStar(null);
    setSelectedIndex(null);
  };

  // 별 삭제
  const handleDeleteStar = async (starId) => {
    try {
      const { data, error } = await supabase
        .from('stars')
        .delete()
        .eq('id', starId)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      console.log('Deleted:', data);

      // 로컬 상태에서 삭제
      setStars(stars.filter((s) => s.id !== starId));
      handleCloseModal();
    } catch (error) {
      console.error('Error deleting star:', error);
      alert('별 삭제에 실패했습니다.');
    }
  };

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
              <StarCard key={star.id} star={star} index={index} onClick={handleStarClick} />
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

      {/* 별 상세 모달 */}
      {selectedStar && (
        <StarDetailModal
          star={selectedStar}
          index={selectedIndex}
          onClose={handleCloseModal}
          onDelete={handleDeleteStar}
        />
      )}
    </div>
  );
}

export default StarsPage;
