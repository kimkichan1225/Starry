import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import NavBar from '../components/NavBar';

// 별 생성을 위한 설정 (StarsPage와 동일)
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

// 개별 별 그리기 함수
const drawStarOnCanvas = (ctx, star, x, y, scale = 1) => {
  const colorIdx = star.star_color - 1;
  const pointsIdx = star.star_points - 1;
  const sizeIdx = star.star_size - 1;
  const satIdx = star.star_saturation;
  const sharpIdx = star.star_sharpness;

  const starPoints = pointsMap[pointsIdx];
  const baseSize = 30 * scale;
  const starOuter = baseSize * sizeMap[sizeIdx] * 2;
  const innerRatio = mapRange(sharpIdx, 1, 4, 0.5, 0.2);
  const starInner = starOuter * innerRatio;
  const colorData = palette[colorIdx];
  const saturation = mapRange(satIdx, 1, 4, 80, 20);
  const lightness = 50;
  const starFill = `hsl(${colorData.h}, ${saturation}%, ${lightness}%)`;

  // 별 그리기
  drawStar(ctx, x, y, starOuter, starInner, starPoints, starFill);

  // 별 글로우 효과
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glowScale = 1.5;
  const glowColor = `hsla(${colorData.h}, ${saturation}%, ${lightness}%,`;
  const g2 = ctx.createRadialGradient(x, y, starOuter * 0.2, x, y, starOuter * glowScale);
  g2.addColorStop(0, glowColor + '0.4)');
  g2.addColorStop(0.5, glowColor + '0.15)');
  g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.arc(x, y, starOuter * glowScale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

function HomePage() {
  const { user, nickname } = useAuth();
  const [selectedConstellation, setSelectedConstellation] = useState('ABCD만 EFG대서대');
  const [isConstellationExpanded, setIsConstellationExpanded] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [stars, setStars] = useState([]);
  const [starPositions, setStarPositions] = useState([]);
  const canvasRef = useRef(null);

  // 밤하늘 제작 모드 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);

  // 별 연결 상태
  const [connections, setConnections] = useState([]); // [{fromIndex, toIndex}, ...]
  const [isDraggingLine, setIsDraggingLine] = useState(false);
  const [dragStartStarIndex, setDragStartStarIndex] = useState(null);
  const [dragCurrentPos, setDragCurrentPos] = useState(null);

  // 별 이동 상태
  const [isMovingStar, setIsMovingStar] = useState(false);
  const [movingStarIndex, setMovingStarIndex] = useState(null);
  const longPressTimerRef = useRef(null);
  const LONG_PRESS_DURATION = 500; // 0.5초

  // 선 삭제 상태
  const [isDeletingLine, setIsDeletingLine] = useState(false);
  const [deleteStartPos, setDeleteStartPos] = useState(null);

  // 밤하늘 제작 모드 진입
  const handleEnterEditMode = () => {
    setIsEditMode(true);
    setShowTutorial(true);
  };

  // 밤하늘 제작 모드 종료
  const handleExitEditMode = () => {
    setIsEditMode(false);
    setShowTutorial(false);
  };

  // 새로고침 (별 연결 초기화)
  const handleRefresh = () => {
    setConnections([]);
  };

  // 저장
  const handleSave = async () => {
    if (!user) return;

    try {
      // 1. 각 별의 위치 업데이트
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const position = starPositions[i];
        if (position) {
          const { error: updateError } = await supabase
            .from('stars')
            .update({
              position_x: position.x,
              position_y: position.y
            })
            .eq('id', star.id);

          if (updateError) {
            console.error('별 위치 업데이트 실패:', star.id, updateError);
          }
        }
      }

      // 2. 기존 연결 삭제 후 새 연결 저장
      const { error: deleteError } = await supabase
        .from('star_connections')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('연결 삭제 실패:', deleteError);
      }

      if (connections.length > 0) {
        const connectionData = connections.map(conn => ({
          user_id: user.id,
          from_star_id: stars[conn.fromIndex].id,
          to_star_id: stars[conn.toIndex].id
        }));

        const { error: insertError } = await supabase
          .from('star_connections')
          .insert(connectionData);

        if (insertError) {
          console.error('연결 저장 실패:', insertError);
        }
      }
    } catch (error) {
      console.error('저장 실패:', error);
    }

    setIsEditMode(false);
  };

  // 캔버스 좌표 계산
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // 좌표에서 별 찾기
  const findStarAtPosition = (x, y) => {
    const hitRadius = 25; // 터치/클릭 감지 반경
    for (let i = 0; i < starPositions.length; i++) {
      const pos = starPositions[i];
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance <= hitRadius) {
        return i;
      }
    }
    return null;
  };

  // 두 선분이 교차하는지 확인
  const doLinesIntersect = (p1, p2, p3, p4) => {
    const ccw = (A, B, C) => {
      return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    };
    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
  };

  // 드래그 경로와 교차하는 연결선 찾기 및 삭제
  const checkAndDeleteIntersectingLines = (startPos, endPos) => {
    const linesToDelete = [];

    connections.forEach((conn, index) => {
      const fromPos = starPositions[conn.fromIndex];
      const toPos = starPositions[conn.toIndex];

      if (fromPos && toPos) {
        if (doLinesIntersect(startPos, endPos, fromPos, toPos)) {
          linesToDelete.push(index);
        }
      }
    });

    if (linesToDelete.length > 0) {
      setConnections(prev => prev.filter((_, index) => !linesToDelete.includes(index)));
    }
  };

  // 터치/마우스 시작
  const handlePointerDown = (e) => {
    if (!isEditMode) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    const starIndex = findStarAtPosition(coords.x, coords.y);

    if (starIndex !== null) {
      // 롱프레스 타이머 시작 (별 이동 모드)
      longPressTimerRef.current = setTimeout(() => {
        setIsMovingStar(true);
        setMovingStarIndex(starIndex);
      }, LONG_PRESS_DURATION);

      // 일단 라인 드래그 시작 준비
      setDragStartStarIndex(starIndex);
      setDragCurrentPos(coords);
    } else {
      // 별이 아닌 곳에서 시작하면 선 삭제 모드
      setIsDeletingLine(true);
      setDeleteStartPos(coords);
    }
  };

  // 터치/마우스 이동
  const handlePointerMove = (e) => {
    if (!isEditMode) return;
    if (dragStartStarIndex === null && movingStarIndex === null && !isDeletingLine) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    // 움직이면 롱프레스 취소 (이동 모드가 아닌 경우에만)
    if (!isMovingStar && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      setIsDraggingLine(true);
    }

    if (isMovingStar && movingStarIndex !== null) {
      // 별 이동 (경계 내로 제한)
      const padding = 15; // 별이 테두리에서 약간 떨어지도록
      const clampedX = Math.max(padding, Math.min(350 - padding, coords.x));
      const clampedY = Math.max(padding, Math.min(500 - padding, coords.y));

      setStarPositions(prev => {
        const newPositions = [...prev];
        newPositions[movingStarIndex] = { x: clampedX, y: clampedY };
        return newPositions;
      });
    } else if (isDeletingLine && deleteStartPos) {
      // 선 삭제 모드 - 드래그 경로와 교차하는 선 삭제
      checkAndDeleteIntersectingLines(deleteStartPos, coords);
      setDeleteStartPos(coords); // 시작점을 현재 위치로 업데이트 (연속 감지)
    } else if (isDraggingLine || dragStartStarIndex !== null) {
      // 라인 드래그 중
      setIsDraggingLine(true);
      setDragCurrentPos(coords);
    }
  };

  // 터치/마우스 종료
  const handlePointerUp = (e) => {
    if (!isEditMode) return;

    // 롱프레스 타이머 취소
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDraggingLine && dragStartStarIndex !== null && dragCurrentPos) {
      // 드래그 종료 위치에서 별 찾기
      const endStarIndex = findStarAtPosition(dragCurrentPos.x, dragCurrentPos.y);

      if (endStarIndex !== null && endStarIndex !== dragStartStarIndex) {
        // 이미 연결이 있는지 확인
        const connectionExists = connections.some(
          conn =>
            (conn.fromIndex === dragStartStarIndex && conn.toIndex === endStarIndex) ||
            (conn.fromIndex === endStarIndex && conn.toIndex === dragStartStarIndex)
        );

        if (!connectionExists) {
          // 새 연결 추가
          setConnections(prev => [...prev, { fromIndex: dragStartStarIndex, toIndex: endStarIndex }]);
        }
      }
    }

    // 상태 초기화
    setIsDraggingLine(false);
    setDragStartStarIndex(null);
    setDragCurrentPos(null);
    setIsMovingStar(false);
    setMovingStarIndex(null);
    setIsDeletingLine(false);
    setDeleteStartPos(null);
  };

  // 공유 링크 복사
  const handleShare = () => {
    if (!user?.id) {
      setShareMessage('로그인이 필요합니다.');
      setTimeout(() => setShareMessage(''), 2000);
      return;
    }

    const surveyLink = `${window.location.origin}/survey/${user.id}`;
    navigator.clipboard.writeText(surveyLink);
    setShareMessage('링크가 복사되었습니다!');
    setTimeout(() => setShareMessage(''), 2000);
  };

  // 이미지 캡쳐 및 저장
  const handleCaptureImage = async () => {
    if (!canvasRef.current) return;

    try {
      // 새 캔버스 생성 (배경 포함)
      const exportCanvas = document.createElement('canvas');
      const exportCtx = exportCanvas.getContext('2d');
      const width = 350;
      const height = 500;
      exportCanvas.width = width;
      exportCanvas.height = height;

      // 배경 이미지 로드 및 그리기
      const bgImage = new Image();
      bgImage.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        bgImage.onload = resolve;
        bgImage.onerror = reject;
        bgImage.src = '/BackGround.jpg';
      });

      // 배경 그리기
      exportCtx.drawImage(bgImage, 0, 0, width, height);

      // 연결선 그리기
      exportCtx.strokeStyle = 'rgba(255, 255, 227, 0.5)';
      exportCtx.lineWidth = 2;
      exportCtx.lineCap = 'round';
      connections.forEach(conn => {
        const fromPos = starPositions[conn.fromIndex];
        const toPos = starPositions[conn.toIndex];
        if (fromPos && toPos) {
          exportCtx.beginPath();
          exportCtx.moveTo(fromPos.x, fromPos.y);
          exportCtx.lineTo(toPos.x, toPos.y);
          exportCtx.stroke();
        }
      });

      // 별 그리기
      stars.forEach((star, index) => {
        if (starPositions[index]) {
          const { x, y } = starPositions[index];
          drawStarOnCanvas(exportCtx, star, x, y, 0.5);
        }
      });

      // 이미지로 변환 및 다운로드
      const dataUrl = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `my-night-sky-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      setShareMessage('이미지가 저장되었습니다!');
      setTimeout(() => setShareMessage(''), 2000);
    } catch (error) {
      console.error('이미지 캡쳐 실패:', error);
      setShareMessage('이미지 저장에 실패했습니다.');
      setTimeout(() => setShareMessage(''), 2000);
    }
  };

  // 임시 카드 데이터 (11개 + 1개는 추가 버튼)
  const cards = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    day: i + 1
  }));

  // 별 ID 기반으로 고정된 위치 생성 (해시 함수)
  const getPositionFromId = (id, index, canvasWidth, canvasHeight, padding) => {
    // ID 문자열을 숫자로 변환하여 시드로 사용
    let hash = 0;
    const str = id + index.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    // 해시값을 0-1 범위로 변환
    const pseudoRandomX = Math.abs(Math.sin(hash)) ;
    const pseudoRandomY = Math.abs(Math.cos(hash * 2));

    return {
      x: padding + pseudoRandomX * (canvasWidth - padding * 2),
      y: padding + pseudoRandomY * (canvasHeight - padding * 2),
    };
  };

  // 별 데이터 가져오기
  useEffect(() => {
    const fetchStars = async () => {
      if (!user) return;

      try {
        // 별 데이터 가져오기
        const { data, error } = await supabase
          .from('stars')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setStars(data || []);

        // 각 별에 ID 기반 고정 위치 생성 (저장된 위치가 있으면 사용)
        const canvasWidth = 350;
        const canvasHeight = 500;
        const padding = 40;

        const positions = (data || []).map((star, index) => {
          // 저장된 위치가 있으면 사용, 없으면 해시 기반 위치 생성
          if (star.position_x != null && star.position_y != null) {
            return { x: star.position_x, y: star.position_y };
          }
          return getPositionFromId(star.id, index, canvasWidth, canvasHeight, padding);
        });
        setStarPositions(positions);

        // 연결 데이터 가져오기
        const { data: connectionsData, error: connError } = await supabase
          .from('star_connections')
          .select('*')
          .eq('user_id', user.id);

        if (connError) throw connError;

        // 연결 데이터를 인덱스 기반으로 변환
        if (connectionsData && connectionsData.length > 0 && data) {
          const loadedConnections = connectionsData.map(conn => {
            const fromIndex = data.findIndex(s => s.id === conn.from_star_id);
            const toIndex = data.findIndex(s => s.id === conn.to_star_id);
            return { fromIndex, toIndex };
          }).filter(conn => conn.fromIndex !== -1 && conn.toIndex !== -1);

          setConnections(loadedConnections);
        }
      } catch (error) {
        console.error('Error fetching stars:', error);
      }
    };

    fetchStars();
  }, [user]);

  // 별자리 캔버스에 별 그리기
  useEffect(() => {
    if (!canvasRef.current || stars.length === 0 || starPositions.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 연결선 그리기
    ctx.strokeStyle = 'rgba(255, 255, 227, 0.5)'; // #FFFFE3/50
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    connections.forEach(conn => {
      const fromPos = starPositions[conn.fromIndex];
      const toPos = starPositions[conn.toIndex];
      if (fromPos && toPos) {
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();
      }
    });

    // 드래그 중인 선 그리기 (프리뷰)
    if (isDraggingLine && dragStartStarIndex !== null && dragCurrentPos) {
      const startPos = starPositions[dragStartStarIndex];
      if (startPos) {
        ctx.strokeStyle = 'rgba(255, 255, 227, 0.5)'; // #FFFFE3/50
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // 점선으로 프리뷰
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(dragCurrentPos.x, dragCurrentPos.y);
        ctx.stroke();
        ctx.setLineDash([]); // 점선 해제
      }
    }

    // 각 별 그리기
    stars.forEach((star, index) => {
      if (starPositions[index]) {
        const { x, y } = starPositions[index];
        drawStarOnCanvas(ctx, star, x, y, 0.5);
      }
    });

    // 이동 중인 별 하이라이트
    if (isMovingStar && movingStarIndex !== null) {
      const pos = starPositions[movingStarIndex];
      if (pos) {
        ctx.strokeStyle = '#FFFFE3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [stars, starPositions, connections, isDraggingLine, dragStartStarIndex, dragCurrentPos, isMovingStar, movingStarIndex]);

  // 터치 이벤트 passive: false로 등록 (preventDefault 사용을 위해)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefaultHandler = (e) => {
      if (isEditMode) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchstart', preventDefaultHandler, { passive: false });
    canvas.addEventListener('touchmove', preventDefaultHandler, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventDefaultHandler);
      canvas.removeEventListener('touchmove', preventDefaultHandler);
    };
  }, [isEditMode]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FAF5FF]">
      {/* 배경 이미지 - 상단 영역 */}
      <div
        className="absolute top-0 left-0 right-0 h-[1200px] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/BackGround.jpg)' }}
      ></div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex flex-col min-h-screen pb-20">
        {/* 광고 배너 영역 */}
        <div className="h-16 bg-[#949494] mt-8 flex items-center justify-center">
        </div>

        {/* 상단 네비게이션 */}
        <nav className="px-6 py-5">
          <div className="max-w-[370px] mx-auto flex items-center">
            <div className="flex items-center gap-1">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {nickname && <span className="text-white font-bold text-2xl">{nickname} 님의 밤하늘</span>}
            </div>
          </div>
        </nav>

        {/* 별자리 표시 영역 */}
        <div className="relative min-h-[540px] flex items-center justify-center py-8 mx-4">
          {/* 편집 모드에서 점선 테두리 표시 */}
          {/* {isEditMode && (
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-white/50 rounded-2xl pointer-events-none"
              style={{ width: 350, height: 500 }}
            />
          )} */}
          <canvas
            ref={canvasRef}
            width={350}
            height={500}
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isEditMode ? 'cursor-pointer' : ''}`}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            style={{ touchAction: isEditMode ? 'none' : 'auto' }}
          />
        </div>

        {/* 공유 성공 메시지 */}
        {shareMessage && (
          <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white/80 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 whitespace-nowrap">
            {/* 링크 아이콘 */}
            <svg className="w-6 h-6 text-[#6155F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {/* 메시지 텍스트 */}
            <span className="text-[#6155F5] text-base font-bold">{shareMessage}</span>
          </div>
        )}

        {/* 플로팅 버튼들 */}
        <div className={`fixed right-4 bottom-44 flex flex-col gap-3 z-40 transition-opacity duration-300 ${isConstellationExpanded || isEditMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* 공유 버튼 */}
          <button
            onClick={handleShare}
            className="w-12 h-12 bg-[#6155F5] rounded-full flex items-center justify-center shadow-lg hover:bg-[#5044d4] transition"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          {/* 이미지 캡쳐 버튼 */}
          <button
            onClick={handleCaptureImage}
            className="w-12 h-12 bg-[#6155F5] rounded-full flex items-center justify-center shadow-lg hover:bg-[#5044d4] transition"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              {/* 왼쪽 상단 모서리 */}
              <path strokeLinecap="round" d="M2 9V4a1 1 0 011-1h4" />
              {/* 오른쪽 상단 모서리 */}
              <path strokeLinecap="round" d="M17 3h4a1 1 0 011 1v5" />
              {/* 왼쪽 하단 모서리 */}
              <path strokeLinecap="round" d="M2 16v5a1 1 0 001 1h4" />
              {/* 오른쪽 하단 모서리 */}
              <path strokeLinecap="round" d="M17 22h4a1 1 0 001-1v-5" />
              {/* 중앙 카메라 렌즈 */}
              <circle cx="12" cy="12" r="3" strokeWidth="2" />
            </svg>
          </button>
          {/* 밤하늘 제작 버튼 */}
          <button
            onClick={handleEnterEditMode}
            className="w-12 h-12 bg-[#6155F5] rounded-full flex items-center justify-center shadow-lg hover:bg-[#5044d4] transition"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

      </div>

      {/* 바텀시트 - 별자리 정보 */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-[340px] top-44 bottom-32 bg-white shadow-lg transition-all duration-500 ease-out z-30 ${
          isConstellationExpanded ? 'translate-y-0 rounded-3xl' : 'translate-y-[calc(100%-2rem)] rounded-t-3xl'
        } ${isEditMode ? 'opacity-0 pointer-events-none' : ''}`}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-20 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* 헤더 (클릭 가능) */}
        <div className="relative">
          <button
            onClick={() => setIsConstellationExpanded(!isConstellationExpanded)}
            className="w-full px-5 pt-2 pb-4 flex justify-center items-center"
          >
            <span className={`text-2xl ${isConstellationExpanded ? 'text-[#6155F5] font-bold' : 'text-black font-medium'}`}>
              ABCD한 EFGE자리
            </span>
          </button>
          {isConstellationExpanded && (
            <button
              onClick={() => setIsConstellationExpanded(false)}
              className="absolute right-5 top-1/2 transform -translate-y-1/2"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 확장된 내용 */}
        {isConstellationExpanded && (
          <div className="px-5 pb-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 24rem)' }}>
            {/* 중앙 원형 이미지 영역 */}
            <div className="flex justify-center mb-4">
              <div className="w-48 h-48 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold whitespace-nowrap" style={{ color: 'rgba(0, 0, 0, 0.52)' }}>별자리 커스텀 이미지</span>
              </div>
            </div>

            {/* 카드 2개 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="aspect-[4/5] bg-white border border-gray-200 rounded-2xl p-4 flex items-start justify-center">
                <span className="text-[#6155F5] text-sm text-center"><span className="font-bold">궁합 좋은</span> 별자리</span>
              </div>
              <div className="aspect-[4/5] bg-white border border-gray-200 rounded-2xl p-4 flex items-start justify-center">
                <span className="text-[#6155F5] text-sm text-center"><span className="font-bold">궁합 안 좋은</span> 별자리</span>
              </div>
            </div>

            {/* AI 별자리 이름 바꾸기 버튼 */}
            <button className="w-full py-3 bg-[#A6A6A6] text-white font-semibold rounded-full hover:bg-[#959595] transition">
              AI 별자리 이름 바꾸기
            </button>
          </div>
        )}
      </div>

      {/* 밤하늘 제작 모드 UI */}
      {isEditMode && (
        <>
          {/* 상단 좌측 버튼들 (도움말, 새로고침) - 세로 배치 */}
          <div className="fixed top-40 left-7 flex flex-col z-50">
            {/* 도움말 버튼 */}
            <button
              onClick={() => setShowTutorial(true)}
              className="w-10 h-10 flex items-center justify-center hover:opacity-70 transition"
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {/* 새로고침 버튼 */}
            <button
              onClick={handleRefresh}
              className="w-10 h-10 flex items-center justify-center hover:opacity-70 transition"
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* 하단 저장 버튼 */}
          <div className="fixed bottom-12 left-0 right-0 flex justify-center z-50 px-6">
            <button
              onClick={handleSave}
              className="w-full max-w-[320px] py-2 bg-[#6155F5] text-white font-bold text-lg rounded-full shadow-lg hover:bg-[#5044d4] transition"
            >
              저장
            </button>
          </div>
        </>
      )}

      {/* 튜토리얼 팝업 */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-6">
          <div className="bg-white/90 rounded-3xl w-full max-w-[260px] p-2">
            {/* 닫기 버튼 */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowTutorial(false);
                  setTutorialStep(1);
                }}
                className="w-8 h-8 flex items-center justify-center"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step 1: 별 잇기 */}
            {tutorialStep === 1 && (
              <>
                {/* 튜토리얼 내용 - 중앙 정렬 */}
                <div className="text-center max-w-[150px] mx-auto">
                  <p className="text-[#727272] font-bold text-sm">Step 1</p>
                  <h3 className="text-[#6155F5] font-bold text-lg mt-3">별 잇기</h3>
                  <p className="text-black text-base mt-3">별과 별을 드래그해 선을 이으세요.</p>
                </div>

                {/* 시뮬레이션 영역 */}
                <div className="mt-4 h-40 rounded-xl flex items-center justify-center relative overflow-hidden">
                  {/* 그라데이션 연결선 (애니메이션) - 대각선 */}
                  <div
                    className="absolute"
                    style={{
                      left: '62px',
                      top: '58%',
                      height: '8px',
                      marginTop: '6px',
                      background: 'linear-gradient(to right, #D9D9D9, #6155F5, #FAFAFA)',
                      transformOrigin: 'left center',
                      transform: 'rotate(-12deg)',
                      animation: 'drawLine1 2s ease-in-out infinite',
                      borderRadius: '3px',
                      zIndex: 1
                    }}
                  />
                  {/* 왼쪽 별 */}
                  <img
                    src="/StepStar.png"
                    alt="star"
                    className="absolute w-16 h-16"
                    style={{ left: '30px', top: '58%', transform: 'translateY(-50%)', zIndex: 2 }}
                  />
                  {/* 오른쪽 별 */}
                  <img
                    src="/StepStar.png"
                    alt="star"
                    className="absolute w-16 h-16"
                    style={{ right: '30px', top: '42%', transform: 'translateY(-50%)', zIndex: 2 }}
                  />
                  {/* 흰색 연결선 (애니메이션) - 대각선 */}
                  <div
                    className="absolute bg-[#FFFFE3]/50"
                    style={{
                      left: '62px',
                      top: '58%',
                      height: '3px',
                      transformOrigin: 'left center',
                      transform: 'rotate(-12deg)',
                      animation: 'drawLine1 2s ease-in-out infinite'
                    }}
                  />
                  {/* 포인터 (애니메이션) */}
                  <img
                    src="/StepPointer.png"
                    alt="pointer"
                    className="absolute w-16 h-16"
                    style={{
                      animation: 'movePointer1 2s ease-in-out infinite',
                      zIndex: 3
                    }}
                  />
                  {/* CSS 애니메이션 정의 */}
                  <style>{`
                    @keyframes movePointer1 {
                      0% {
                        left: 45px;
                        top: 58%;
                      }
                      80% {
                        left: calc(100% - 95px);
                        top: 42%;
                      }
                      100% {
                        left: calc(100% - 95px);
                        top: 42%;
                      }
                    }
                    @keyframes drawLine1 {
                      0% {
                        width: 0px;
                      }
                      80% {
                        width: calc(100% - 120px);
                      }
                      100% {
                        width: calc(100% - 120px);
                      }
                    }
                  `}</style>
                </div>

              </>
            )}

            {/* Step 2: 선 삭제하기 */}
            {tutorialStep === 2 && (
              <>
                {/* 튜토리얼 내용 - 중앙 정렬 */}
                <div className="text-center max-w-[170px] mx-auto">
                  <p className="text-[#727272] font-bold text-sm">Step 2</p>
                  <h3 className="text-[#6155F5] font-bold text-lg mt-3">선 삭제하기</h3>
                  <p className="text-black text-base mt-3">선을 가로질러 드래그해 선을 삭제하세요.</p>
                </div>

                {/* 시뮬레이션 영역 */}
                <div className="mt-4 h-40 rounded-xl flex items-center justify-center relative overflow-hidden">
                  {/* 왼쪽 별 */}
                  <img
                    src="/StepStar.png"
                    alt="star"
                    className="absolute w-16 h-16"
                    style={{ left: '30px', top: '58%', transform: 'translateY(-50%)', zIndex: 2 }}
                  />
                  {/* 오른쪽 별 */}
                  <img
                    src="/StepStar.png"
                    alt="star"
                    className="absolute w-16 h-16"
                    style={{ right: '30px', top: '42%', transform: 'translateY(-50%)', zIndex: 2 }}
                  />
                  {/* 흰색 연결선 (삭제 애니메이션) */}
                  <div
                    className="absolute bg-[#FFFFE3]/50"
                    style={{
                      left: '62px',
                      top: '58%',
                      height: '3px',
                      width: 'calc(100% - 120px)',
                      transformOrigin: 'left center',
                      transform: 'rotate(-12deg)',
                      animation: 'deleteLine 2.5s ease-in-out infinite'
                    }}
                  />
                  {/* 그라데이션 선 (포인터 이동 경로 - 대각선) */}
                  <div
                    className="absolute"
                    style={{
                      left: 'calc(27% + 32px)',
                      top: 'calc(10% + 14px)',
                      width: '8px',
                      height: '0px',
                      background: 'linear-gradient(to bottom, #D9D9D9, #6155F5, #FAFAFA)',
                      borderRadius: '3px',
                      zIndex: 1,
                      transformOrigin: 'top center',
                      transform: 'rotate(-30deg)',
                      animation: 'drawDeleteLine 2.5s ease-in-out infinite'
                    }}
                  />
                  {/* 포인터 (왼쪽 위에서 오른쪽 아래로 대각선 애니메이션) */}
                  <img
                    src="/StepPointer.png"
                    alt="pointer"
                    className="absolute w-16 h-16"
                    style={{
                      animation: 'movePointer2 2.5s ease-in-out infinite',
                      zIndex: 3
                    }}
                  />
                  {/* CSS 애니메이션 정의 */}
                  <style>{`
                    @keyframes movePointer2 {
                      0% {
                        left: 30%;
                        top: 10%;
                      }
                      40% {
                        left: 55%;
                        top: 70%;
                      }
                      100% {
                        left: 55%;
                        top: 70%;
                      }
                    }
                    @keyframes deleteLine {
                      0% {
                        opacity: 1;
                      }
                      39% {
                        opacity: 1;
                      }
                      40% {
                        opacity: 0;
                      }
                      100% {
                        opacity: 0;
                      }
                    }
                    @keyframes drawDeleteLine {
                      0% {
                        height: 0px;
                      }
                      40% {
                        height: 100px;
                      }
                      100% {
                        height: 100px;
                      }
                    }
                  `}</style>
                </div>
              </>
            )}

            {/* Step 3: 별 이동하기 */}
            {tutorialStep === 3 && (
              <>
                {/* 튜토리얼 내용 - 중앙 정렬 */}
                <div className="text-center max-w-[170px] mx-auto">
                  <p className="text-[#727272] font-bold text-sm">Step 3</p>
                  <h3 className="text-[#6155F5] font-bold text-lg mt-3">별 이동하기</h3>
                  <p className="text-black text-base mt-3">별을 길게 눌러 위치를 이동하세요.</p>
                </div>

                {/* 시뮬레이션 영역 */}
                <div className="mt-4 h-40 rounded-xl flex items-center justify-center relative overflow-hidden">
                  {/* 별 (이동 애니메이션) */}
                  <img
                    src="/StepStar.png"
                    alt="star"
                    className="absolute w-16 h-16"
                    style={{
                      animation: 'moveStar3 3s ease-in-out infinite',
                      zIndex: 2
                    }}
                  />
                  {/* 길게 누르기 효과 - 그라데이션 링 (가운데 빈 원) */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      background: 'conic-gradient(from 0deg, white, #6155F5, #F3F3F3, #6155F5, #F3F3F3)',
                      WebkitMask: 'radial-gradient(transparent 60%, black 60%)',
                      mask: 'radial-gradient(transparent 60%, black 60%)',
                      animation: 'pressEffect3 3s ease-in-out infinite',
                      zIndex: 1
                    }}
                  />
                  {/* 이동 화살표 */}
                  <svg
                    className="absolute"
                    style={{
                      left: '38%',
                      top: '32%',
                      width: '70px',
                      height: '50px',
                      animation: 'showArrow3 3s ease-in-out infinite',
                      zIndex: 1
                    }}
                    viewBox="0 0 70 50"
                    fill="none"
                    stroke="#727272"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="4" y1="4" x2="60" y2="32" />
                    <polyline points="48 36 60 32 57 19" />
                  </svg>
                  {/* 포인터 (애니메이션) */}
                  <img
                    src="/StepPointer.png"
                    alt="pointer"
                    className="absolute w-16 h-16"
                    style={{
                      animation: 'movePointer3 3s ease-in-out infinite',
                      zIndex: 3
                    }}
                  />
                  {/* CSS 애니메이션 정의 */}
                  <style>{`
                    @keyframes movePointer3 {
                      0% {
                        left: 15%;
                        top: 25%;
                      }
                      25% {
                        left: 15%;
                        top: 25%;
                      }
                      70% {
                        left: 65%;
                        top: 60%;
                      }
                      100% {
                        left: 65%;
                        top: 60%;
                      }
                    }
                    @keyframes moveStar3 {
                      0% {
                        left: 25%;
                        top: 25%;
                        transform: translate(-50%, -50%);
                      }
                      25% {
                        left: 25%;
                        top: 25%;
                        transform: translate(-50%, -50%);
                      }
                      70% {
                        left: 75%;
                        top: 60%;
                        transform: translate(-50%, -50%);
                      }
                      100% {
                        left: 75%;
                        top: 60%;
                        transform: translate(-50%, -50%);
                      }
                    }
                    @keyframes pressEffect3 {
                      0% {
                        left: 25%;
                        top: 25%;
                        width: 0px;
                        height: 0px;
                        opacity: 0;
                        transform: translate(-50%, -50%);
                      }
                      15% {
                        left: 25%;
                        top: 25%;
                        width: 50px;
                        height: 50px;
                        opacity: 1;
                        transform: translate(-50%, -50%);
                      }
                      25% {
                        left: 25%;
                        top: 25%;
                        width: 50px;
                        height: 50px;
                        opacity: 1;
                        transform: translate(-50%, -50%);
                      }
                      70% {
                        left: 75%;
                        top: 60%;
                        width: 50px;
                        height: 50px;
                        opacity: 1;
                        transform: translate(-50%, -50%);
                      }
                      85% {
                        left: 75%;
                        top: 60%;
                        width: 50px;
                        height: 50px;
                        opacity: 0;
                        transform: translate(-50%, -50%);
                      }
                      100% {
                        left: 75%;
                        top: 60%;
                        width: 0px;
                        height: 0px;
                        opacity: 0;
                        transform: translate(-50%, -50%);
                      }
                    }
                    @keyframes showArrow3 {
                      0% {
                        opacity: 0;
                      }
                      25% {
                        opacity: 0;
                      }
                      30% {
                        opacity: 1;
                      }
                      70% {
                        opacity: 1;
                      }
                      75% {
                        opacity: 0;
                      }
                      100% {
                        opacity: 0;
                      }
                    }
                  `}</style>
                </div>
              </>
            )}

            {/* Step 4: 저장하기 */}
            {tutorialStep === 4 && (
              <>
                {/* 튜토리얼 내용 - 중앙 정렬 */}
                <div className="text-center">
                  <p className="text-[#727272] font-bold text-sm">Step 4</p>
                  <h3 className="text-[#6155F5] font-bold text-lg mt-3">저장하기</h3>
                </div>

                {/* 저장 옵션들 */}
                <div className="mt-6 space-y-4 px-4">
                  {/* 저장 버튼 */}
                  <div className="flex flex-col items-center">
                    <div className="px-6 py-2 bg-[#6155F5] text-white text-sm font-bold rounded-full">
                      저장
                    </div>
                    <p className="text-black text-sm mt-2">내 <span className="font-bold">밤하늘 꾸미기</span> 저장</p>
                  </div>

                  {/* 이미지 캡쳐 */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#6155F5]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" d="M2 9V4a1 1 0 011-1h4" />
                        <path strokeLinecap="round" d="M17 3h4a1 1 0 011 1v5" />
                        <path strokeLinecap="round" d="M2 16v5a1 1 0 001 1h4" />
                        <path strokeLinecap="round" d="M17 22h4a1 1 0 001-1v-5" />
                        <circle cx="12" cy="12" r="3" strokeWidth="2" />
                      </svg>
                    </div>
                    <p className="text-black text-sm mt-2">사진을 <span className="font-bold">갤러리에 저장</span></p>
                  </div>

                  {/* 링크 복사 */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#6155F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <p className="text-black text-sm mt-2">내 <span className="font-bold">밤하늘 링크</span> 복사</p>
                  </div>
                </div>
              </>
            )}

            {/* Pagination 인디케이터 */}
            <div className="flex justify-center items-center gap-3 py-3">
              <button
                onClick={() => setTutorialStep(1)}
                className={`rounded-full transition-all ${
                  tutorialStep === 1
                    ? 'w-3 h-3 bg-[#6155F5]'
                    : 'w-2 h-2 bg-white border border-gray-300'
                }`}
              />
              <button
                onClick={() => setTutorialStep(2)}
                className={`rounded-full transition-all ${
                  tutorialStep === 2
                    ? 'w-3 h-3 bg-[#6155F5]'
                    : 'w-2 h-2 bg-white border border-gray-300'
                }`}
              />
              <button
                onClick={() => setTutorialStep(3)}
                className={`rounded-full transition-all ${
                  tutorialStep === 3
                    ? 'w-3 h-3 bg-[#6155F5]'
                    : 'w-2 h-2 bg-white border border-gray-300'
                }`}
              />
              <button
                onClick={() => setTutorialStep(4)}
                className={`rounded-full transition-all ${
                  tutorialStep === 4
                    ? 'w-3 h-3 bg-[#6155F5]'
                    : 'w-2 h-2 bg-white border border-gray-300'
                }`}
              />
            </div>

          </div>
        </div>
      )}

      {/* 네비게이션 바 (편집 모드에서는 숨김) */}
      {!isEditMode && <NavBar />}
    </div>
  );
}

export default HomePage;
