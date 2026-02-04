import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// 별 생성을 위한 설정
const palette = [
  { name: '빨강', h: 0 },    // 1: 빨강
  { name: '초록', h: 120 },  // 2: 초록
  { name: '파랑', h: 220 },  // 3: 파랑
  { name: '노랑', h: 50 }    // 4: 노랑
];
const pointsMap = [8, 5, 4, 6]; // 꼭짓점 개수 매핑
const sizeMap = [0.35, 0.25, 0.30, 0.40]; // 크기 매핑

// 옵션 id를 숫자로 변환
const optionToNumber = (id) => {
  const map = { 'a': 1, 'b': 2, 'c': 3, 'd': 4 };
  return map[id] || 1;
};

// 범위 매핑 함수
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

const questions = [
  {
    id: 1,
    questionLine1: (nickname) => `${nickname} 님이`,
    questionLine2: '가장 중요하게 생각하는 것은?',
    options: [
      { id: 'a', emoji: '🔥', label: '도전!', description: '용감하게 밀고 나간다' },
      { id: 'b', emoji: '📐', label: '실력!', description: '확실하게 해낸다' },
      { id: 'c', emoji: '📚', label: '지식!', description: '새로운 것을 알아낸다' },
      { id: 'd', emoji: '💖', label: '마음!', description: '사람들과 함께 해낸다' },
    ],
  },
  {
    id: 2,
    questionLine1: (nickname) => `${nickname} 님의`,
    questionLine2: '새로운 상황에서 행동 스타일은?',
    options: [
      { id: 'a', emoji: '🧑‍🏫', label: '리더형!', description: '내가 이끌어간다' },
      { id: 'b', emoji: '🗺️', label: '유지형!', description: '방식을 끝까지 유지한다' },
      { id: 'c', emoji: '🧩', label: '유연형!', description: '상황에 따라 바뀐다' },
      { id: 'd', emoji: '💬', label: '중재형!', description: '모두의 의견을 들어본다' },
    ],
  },
  {
    id: 3,
    questionLine1: (nickname) => `${nickname} 님의`,
    questionLine2: '첫인상은?',
    options: [
      { id: 'a', emoji: '😀', label: '외향적!', description: '활발한 에너지' },
      { id: 'b', emoji: '😳', label: '내향적!', description: '차분하고 신중함' },
      { id: 'c', emoji: '😊', label: '균형적!', description: '친근하고 편함' },
      { id: 'd', emoji: '😝', label: '개성!', description: '어디로 튈지 모름' },
    ],
  },
  {
    id: 4,
    questionLine1: (nickname) => `${nickname} 님이`,
    questionLine2: '가장 행복한 상황은?',
    options: [
      { id: 'a', emoji: '🎮', label: '게임 레벨이', description: '올랐을 때' },
      { id: 'b', emoji: '🔒', label: '재미있는 비밀을', description: '알았을 때' },
      { id: 'c', emoji: '🏆️', label: '노력한 일에', description: '칭찬을 받을 때' },
      { id: 'd', emoji: '☕', label: '친구들과', description: '카페에 갈 때' },
    ],
  },
  {
    id: 5,
    questionLine1: (nickname) => `${nickname} 님이`,
    questionLine2: '스트레스를 푸는 방법은?',
    options: [
      { id: 'a', emoji: '🍰', label: '맛있는걸 먹거나', description: '푹 잔다' },
      { id: 'b', emoji: '🗣', label: '친한 사람에게', description: '이야기한다' },
      { id: 'c', emoji: '🏃‍♂️', label: '운동이나', description: '노래를 한다' },
      { id: 'd', emoji: '🧮', label: '스트레스 받은', description: '이유를 따져본다' },
    ],
  },
];

function SurveyQuestionPage() {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const surveyorName = location.state?.surveyorName || '익명';

  const [targetUserNickname, setTargetUserNickname] = useState('User1');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [showSent, setShowSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [finalAnswers, setFinalAnswers] = useState(null);
  const [showNightSky, setShowNightSky] = useState(false);
  const [nightSkyStars, setNightSkyStars] = useState([]);
  const [nightSkyPositions, setNightSkyPositions] = useState([]);
  const [nightSkyConnections, setNightSkyConnections] = useState([]);
  const canvasRef = useRef(null);
  const sentCanvasRef = useRef(null);
  const nightSkyCanvasRef = useRef(null);

  // 대상 사용자 닉네임 가져오기
  useEffect(() => {
    const fetchTargetUser = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', userId)
          .single();

        if (error) throw error;

        if (data?.nickname) {
          setTargetUserNickname(data.nickname);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchTargetUser();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const question = questions[currentQuestion];
  const totalQuestions = 5; // 총 5문제

  const handleOptionSelect = (optionId) => {
    setSelectedOption(optionId);
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      // 현재 답변 저장
      const newAnswers = {
        ...answers,
        [question.id]: selectedOption,
      };
      setAnswers(newAnswers);

      // 이전 질문으로
      const prevQuestion = currentQuestion - 1;
      setCurrentQuestion(prevQuestion);
      setSelectedOption(newAnswers[questions[prevQuestion]?.id] || null);
    }
  };

  const handleNext = () => {
    if (!selectedOption) return;

    // 현재 답변 저장
    const newAnswers = {
      ...answers,
      [question.id]: selectedOption,
    };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      // 다음 질문으로
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(newAnswers[questions[currentQuestion + 1]?.id] || null);
    } else {
      // 설문 완료 - 결과 화면으로 전환
      console.log('설문 완료:', newAnswers);
      setFinalAnswers(newAnswers);
      setShowResult(true);
    }
  };

  // 별 전송 함수
  const handleSend = async () => {
    if (!finalAnswers || sending) return;

    setSending(true);
    try {
      // 사용자의 현재 밤하늘 별 개수와 max_sky_slots 확인
      const { data: profileData } = await supabase
        .from('profiles')
        .select('max_sky_slots')
        .eq('id', userId)
        .single();

      const maxSkySlots = profileData?.max_sky_slots || 11;

      const { count: skyStarsCount } = await supabase
        .from('stars')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('in_sky', true);

      // 밤하늘 슬롯이 가득 찼으면 창고로, 아니면 밤하늘로
      const inSky = (skyStarsCount || 0) < maxSkySlots;

      const starData = {
        user_id: userId,
        surveyor_name: surveyorName,
        star_color: optionToNumber(finalAnswers[1]),
        star_points: optionToNumber(finalAnswers[2]),
        star_size: optionToNumber(finalAnswers[3]),
        star_saturation: optionToNumber(finalAnswers[4]),
        star_sharpness: optionToNumber(finalAnswers[5]),
        answers: finalAnswers,
        in_sky: inSky,
      };

      const { error } = await supabase
        .from('stars')
        .insert([starData]);

      if (error) throw error;

      // 전송 완료 화면으로 전환
      setShowSent(true);
    } catch (error) {
      console.error('Error sending star:', error);
      alert('별 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSending(false);
    }
  };

  // 별 그리기 함수 (캔버스에 그리기)
  const drawStarOnCanvas = (canvas) => {
    if (!canvas || !finalAnswers) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    // 답변에서 별 속성 추출
    const colorIdx = optionToNumber(finalAnswers[1]) - 1;
    const pointsIdx = optionToNumber(finalAnswers[2]) - 1;
    const sizeIdx = optionToNumber(finalAnswers[3]) - 1;
    const satIdx = optionToNumber(finalAnswers[4]);
    const sharpIdx = optionToNumber(finalAnswers[5]);

    // 별 속성 계산
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

    // 중심 발광 효과
    const glowIntensity = 0.28;
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.min(W, H) * 0.6);
    g.addColorStop(0, `rgba(255, 220, 150, ${0.9 * glowIntensity})`);
    g.addColorStop(0.5, `rgba(20,30,40, ${0.12 * glowIntensity})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 별 그리기
    drawStar(ctx, cx, cy, starOuter, starInner, starPoints, starFill);

    // 별 글로우 효과
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowScale = 1.5;
    const glowColor = `hsla(${colorData.h}, ${saturation}%, ${lightness}%,`;
    const g2 = ctx.createRadialGradient(cx, cy, starOuter * 0.2, cx, cy, starOuter * glowScale);
    g2.addColorStop(0, glowColor + '0.5)');
    g2.addColorStop(0.5, glowColor + '0.2)');
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(cx, cy, starOuter * glowScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // 별 그리기 useEffect (결과 화면)
  useEffect(() => {
    if (showResult && canvasRef.current && finalAnswers) {
      drawStarOnCanvas(canvasRef.current);
    }
  }, [showResult, finalAnswers]);

  // 별 그리기 useEffect (전송 완료 화면)
  useEffect(() => {
    if (showSent && sentCanvasRef.current && finalAnswers) {
      drawStarOnCanvas(sentCanvasRef.current);
    }
  }, [showSent, finalAnswers]);

  // 별 ID 기반으로 고정된 위치 생성 (해시 함수)
  const getPositionFromId = (id, index, canvasWidth, canvasHeight, padding) => {
    let hash = 0;
    const str = id + index.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const pseudoRandomX = Math.abs(Math.sin(hash));
    const pseudoRandomY = Math.abs(Math.cos(hash * 2));
    return {
      x: padding + pseudoRandomX * (canvasWidth - padding * 2),
      y: padding + pseudoRandomY * (canvasHeight - padding * 2),
    };
  };

  // 개별 별 그리기 함수 (밤하늘용)
  const drawStarOnNightSky = (ctx, star, x, y, scale = 1) => {
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

  // 밤하늘 데이터 가져오기
  const fetchNightSkyData = async () => {
    try {
      // 별 데이터 가져오기 (밤하늘에 있는 별만)
      const { data: starsData, error: starsError } = await supabase
        .from('stars')
        .select('*')
        .eq('user_id', userId)
        .eq('in_sky', true)
        .order('created_at', { ascending: true });

      if (starsError) throw starsError;

      setNightSkyStars(starsData || []);

      // 별 위치 계산
      const canvasWidth = 350;
      const canvasHeight = 500;
      const padding = 40;

      const positions = (starsData || []).map((star, index) => {
        if (star.position_x != null && star.position_y != null) {
          return { x: star.position_x, y: star.position_y };
        }
        return getPositionFromId(star.id, index, canvasWidth, canvasHeight, padding);
      });
      setNightSkyPositions(positions);

      // 연결 데이터 가져오기
      const { data: connectionsData, error: connError } = await supabase
        .from('star_connections')
        .select('*')
        .eq('user_id', userId);

      if (connError) throw connError;

      // 연결 데이터를 인덱스 기반으로 변환
      if (connectionsData && connectionsData.length > 0 && starsData) {
        const loadedConnections = connectionsData.map(conn => {
          const fromIndex = starsData.findIndex(s => s.id === conn.from_star_id);
          const toIndex = starsData.findIndex(s => s.id === conn.to_star_id);
          return { fromIndex, toIndex };
        }).filter(conn => conn.fromIndex !== -1 && conn.toIndex !== -1);

        setNightSkyConnections(loadedConnections);
      }

      setShowNightSky(true);
    } catch (error) {
      console.error('밤하늘 데이터 가져오기 실패:', error);
    }
  };

  // 밤하늘 캔버스 그리기
  useEffect(() => {
    if (!showNightSky || !nightSkyCanvasRef.current || nightSkyStars.length === 0) return;

    const canvas = nightSkyCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 연결선 그리기
    ctx.strokeStyle = 'rgba(255, 255, 227, 0.5)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    nightSkyConnections.forEach(conn => {
      const fromPos = nightSkyPositions[conn.fromIndex];
      const toPos = nightSkyPositions[conn.toIndex];
      if (fromPos && toPos) {
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();
      }
    });

    // 각 별 그리기
    nightSkyStars.forEach((star, index) => {
      if (nightSkyPositions[index]) {
        const { x, y } = nightSkyPositions[index];
        drawStarOnNightSky(ctx, star, x, y, 0.5);
      }
    });
  }, [showNightSky, nightSkyStars, nightSkyPositions, nightSkyConnections]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

  // 밤하늘 보기 화면
  if (showNightSky) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* 배경 이미지 */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/BackGround.jpg)' }}
        ></div>

        {/* 메인 콘텐츠 */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* 상단 네비게이션 */}
          <nav className="px-6 py-5">
            <div className="max-w-[370px] mx-auto flex justify-between items-center relative">
              <button className="flex items-center space-x-1 text-white/80 hover:text-white transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="1.4" />
                  <path strokeLinecap="round" strokeWidth="1.4" d="M4 8h16" />
                  <path strokeLinecap="round" strokeWidth="1.4" d="M2 12h20" />
                  <path strokeLinecap="round" strokeWidth="1.4" d="M4 16h16" />
                  <path strokeLinecap="round" strokeWidth="1.4" d="M12 2a15.3 15.3 0 0 1 0 20a15.3 15.3 0 0 1 0-20z" />
                </svg>
                <span className="text-sm font-light">English</span>
              </button>

              <img
                src="/Logo.png"
                alt="STARRY"
                className="h-5 absolute left-1/2 transform -translate-x-1/2"
              />

              <button className="text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </nav>

          {/* 중앙 콘텐츠 */}
          <div className="flex-1 flex flex-col items-center px-6 pb-8">
            {/* 타이틀 */}
            <h1 className="text-white text-2xl font-bold mt-4 mb-6">
              {targetUserNickname} 님의 밤하늘
            </h1>

            {/* 별자리 캔버스 */}
            <div className="relative flex-1 w-full flex items-center justify-center">
              <canvas
                ref={nightSkyCanvasRef}
                width={350}
                height={500}
                className="max-w-full"
              />
            </div>

            {/* 내 밤하늘 만들기 버튼 */}
            <button
              onClick={() => window.location.href = '/'}
              className="w-full max-w-[300px] py-3 text-sm rounded-lg font-medium bg-[#9E4EFF] text-white hover:bg-[#8A3EE8] transition-colors mt-6"
            >
              내 밤하늘 만들기
            </button>
          </div>

          {/* 하단 정보 */}
          <div className="pb-8 px-6 text-center">
            <div className="flex items-center justify-center space-x-4 text-white/80 text-sm">
              <img
                src="/Logo.png"
                alt="STARRY"
                className="h-3 -translate-y-[11px]"
              />
              <div className="h-6 w-px bg-white/40 -translate-y-[11px]"></div>
              <div className="text-left space-y-1">
                <div className="text-[9px] leading-snug">
                  광고 문의: 123456789@gmail.com <br />
                  Copyright ©2025 123456789. All rights reserved.
                </div>
                <div className="text-white/70 text-[9px] flex items-center space-x-1">
                  <span className="font-semibold text-white">개발자</span>
                  <span>김기찬</span>
                  <span className="text-white/40">·</span>
                  <span className="font-semibold text-white">디자이너</span>
                  <span>김태희</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 전송 완료 화면
  if (showSent) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* 배경 이미지 */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/BackGround.jpg)' }}
        ></div>

        {/* 메인 콘텐츠 */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* 상단 네비게이션 */}
          <nav className="px-6 py-5">
            <div className="max-w-[370px] mx-auto flex justify-between items-center relative">
              <button className="flex items-center space-x-1 text-white/80 hover:text-white transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="1.4" />
                  <path strokeLinecap="round" strokeWidth="1.4" d="M4 8h16" />
                  <path strokeLinecap="round" strokeWidth="1.4" d="M2 12h20" />
                  <path strokeLinecap="round" strokeWidth="1.4" d="M4 16h16" />
                  <path strokeLinecap="round" strokeWidth="1.4" d="M12 2a15.3 15.3 0 0 1 0 20a15.3 15.3 0 0 1 0-20z" />
                </svg>
                <span className="text-sm font-light">English</span>
              </button>

              <img
                src="/Logo.png"
                alt="STARRY"
                className="h-5 absolute left-1/2 transform -translate-x-1/2"
              />

              <button className="text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </nav>

          {/* 중앙 콘텐츠 */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 pt-8">
            <div className="w-full max-w-[330px] text-center">
              {/* 완료 텍스트 */}
              <div className="mb-6">
                <h1 className="text-white text-2xl font-bold leading-relaxed">
                  {targetUserNickname} 님이 {surveyorName} 님이
                </h1>
                <h2 className="text-white text-2xl font-bold">
                  선물한 별을 받았어요!
                </h2>
              </div>

              {/* 별 이미지 + 원형 프레임 */}
              <div className="flex justify-center mb-8 relative">
                <img
                  src="/surveyexample.png"
                  alt="frame"
                  className="w-[220px] h-[220px] z-10"
                />
                <canvas
                  ref={sentCanvasRef}
                  width={50}
                  height={50}
                  className="absolute z-20 top-1/2 left-1/2 translate-x-[5%] -translate-y-[50%]"
                />
              </div>

              {/* 버튼들 */}
              <div className="space-y-3 flex flex-col items-center">
                <button
                  onClick={fetchNightSkyData}
                  className="w-[300px] py-3 text-sm rounded-lg font-medium bg-[#C5C5C5] text-white hover:bg-[#B5B5B5] transition-colors"
                >
                  {targetUserNickname}님의 밤하늘 보기
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-[300px] py-3 text-sm rounded-lg font-medium bg-[#9E4EFF] text-white hover:bg-[#8A3EE8] transition-colors"
                >
                  내 밤하늘 만들기
                </button>
              </div>
            </div>
          </div>

          {/* 하단 정보 */}
          <div className="pb-8 px-6 text-center">
            <div className="flex items-center justify-center space-x-4 text-white/80 text-sm">
              <img
                src="/Logo.png"
                alt="STARRY"
                className="h-3 -translate-y-[11px]"
              />
              <div className="h-6 w-px bg-white/40 -translate-y-[11px]"></div>
              <div className="text-left space-y-1">
                <div className="text-[9px] leading-snug">
                  광고 문의: 123456789@gmail.com <br />
                  Copyright ©2025 123456789. All rights reserved.
                </div>
                <div className="text-white/70 text-[9px] flex items-center space-x-1">
                  <span className="font-semibold text-white">개발자</span>
                  <span>김기찬</span>
                  <span className="text-white/40">·</span>
                  <span className="font-semibold text-white">디자이너</span>
                  <span>김태희</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 결과 화면 (전송 전)
  if (showResult) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* 배경 이미지 */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/BackGround.jpg)' }}
        ></div>

        {/* 메인 콘텐츠 */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* 상단 네비게이션 */}
          <nav className="px-6 py-5">
            <div className="max-w-[370px] mx-auto flex justify-between items-center relative">
              <button className="flex items-center space-x-1 text-white/80 hover:text-white transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="1.4" />
                  <path strokeLinecap="round" strokeWidth="1.4" d="M4 8h16" />
                  <path strokeLinecap="round" strokeWidth="1.4" d="M2 12h20" />
                  <path strokeLinecap="round" strokeWidth="1.4" d="M4 16h16" />
                  <path strokeLinecap="round" strokeWidth="1.4" d="M12 2a15.3 15.3 0 0 1 0 20a15.3 15.3 0 0 1 0-20z" />
                </svg>
                <span className="text-sm font-light">English</span>
              </button>

              <img
                src="/Logo.png"
                alt="STARRY"
                className="h-5 absolute left-1/2 transform -translate-x-1/2"
              />

              <button className="text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </nav>

          {/* 중앙 콘텐츠 */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 pt-16">
            <div className="w-full max-w-[330px] text-center">
              {/* 완료 텍스트 */}
              <div className="mb-6">
                <h1 className="text-white text-2xl font-bold leading-relaxed">
                  {targetUserNickname} 님께 보낼
                </h1>
                <h2 className="text-white text-2xl font-bold">
                  별이 완성되었어요!
                </h2>
              </div>

              {/* 별 캔버스 */}
              <div className="flex justify-center mb-8">
                <canvas
                  ref={canvasRef}
                  width={250}
                  height={250}
                  className="rounded-lg"
                />
              </div>

              {/* 전송 버튼 */}
              <button
                onClick={handleSend}
                disabled={sending}
                className={`w-[300px] py-3 text-sm rounded-lg font-medium transition-colors ${
                  sending
                    ? 'bg-[#9E4EFF]/50 text-white/50 cursor-not-allowed'
                    : 'bg-[#9E4EFF] text-white hover:bg-[#8A3EE8]'
                }`}
              >
                {sending ? '전송 중...' : '전송'}
              </button>
            </div>
          </div>

          {/* 하단 정보 */}
          <div className="pb-8 px-6 text-center">
            <div className="flex items-center justify-center space-x-4 text-white/80 text-sm">
              <img
                src="/Logo.png"
                alt="STARRY"
                className="h-3 -translate-y-[11px]"
              />
              <div className="h-6 w-px bg-white/40 -translate-y-[11px]"></div>
              <div className="text-left space-y-1">
                <div className="text-[9px] leading-snug">
                  광고 문의: 123456789@gmail.com <br />
                  Copyright ©2025 123456789. All rights reserved.
                </div>
                <div className="text-white/70 text-[9px] flex items-center space-x-1">
                  <span className="font-semibold text-white">개발자</span>
                  <span>김기찬</span>
                  <span className="text-white/40">·</span>
                  <span className="font-semibold text-white">디자이너</span>
                  <span>김태희</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/BackGround.jpg)' }}
      ></div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 상단 네비게이션 */}
        <nav className="px-6 py-5">
          <div className="max-w-[370px] mx-auto flex justify-between items-center relative">
            <button className="flex items-center space-x-1 text-white/80 hover:text-white transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="1.4" />
                <path strokeLinecap="round" strokeWidth="1.4" d="M4 8h16" />
                <path strokeLinecap="round" strokeWidth="1.4" d="M2 12h20" />
                <path strokeLinecap="round" strokeWidth="1.4" d="M4 16h16" />
                <path strokeLinecap="round" strokeWidth="1.4" d="M12 2a15.3 15.3 0 0 1 0 20a15.3 15.3 0 0 1 0-20z" />
              </svg>
              <span className="text-sm font-light">English</span>
            </button>

            <img
              src="/Logo.png"
              alt="STARRY"
              className="h-5 absolute left-1/2 transform -translate-x-1/2"
            />

            <button className="text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>

        {/* 중앙 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 pt-16">
          {/* 질문 영역 */}
          <div className="w-full max-w-[330px] text-center">
            {/* 질문 텍스트 */}
            <div className="mb-6">
              <h1 className="text-white text-2xl font-bold leading-relaxed">
                {question.questionLine1(targetUserNickname)}
              </h1>
              <h2 className="text-white text-2xl font-bold">
                {question.questionLine2}
              </h2>
            </div>

            {/* 물음표 아이콘 */}
            <div className="text-9xl mb-8 text-white font-bold">?</div>

            {/* 선택지들 */}
            <div className="space-y-3 mb-8 flex flex-col items-center">
              {question.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  className={`w-[300px] py-3 px-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                    selectedOption === option.id
                      ? 'border-[#9E4EFF] bg-[#9E4EFF] text-white shadow-lg scale-[1.02]'
                      : 'border-[#9E4EFF] bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg -translate-y-[3px]">{option.emoji}</span>
                  <span className="font-semibold">{option.label}</span>
                  <span className={`ml-2 ${selectedOption === option.id ? 'text-white' : 'text-black'}`}>{option.description}</span>
                </button>
              ))}
            </div>

            {/* 이전/다음 버튼 */}
            {currentQuestion === 0 ? (
              <button
                onClick={handleNext}
                disabled={!selectedOption}
                className={`w-[300px] py-3 text-sm rounded-lg font-medium transition-colors ${
                  selectedOption
                    ? 'bg-[#9E4EFF] text-white hover:bg-[#8A3EE8]'
                    : 'bg-[#9E4EFF]/50 text-white/50 cursor-not-allowed'
                }`}
              >
                다음
              </button>
            ) : (
              <div className="flex justify-center gap-3">
                <button
                  onClick={handlePrev}
                  className="w-[144px] py-3 text-sm rounded-lg font-medium bg-[#C5C5C5] text-black hover:bg-[#B5B5B5] transition-colors"
                >
                  이전
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedOption}
                  className={`w-[144px] py-3 text-sm rounded-lg font-medium transition-colors ${
                    selectedOption
                      ? 'bg-[#9E4EFF] text-white hover:bg-[#8A3EE8]'
                      : 'bg-[#9E4EFF]/50 text-white/50 cursor-not-allowed'
                  }`}
                >
                  다음
                </button>
              </div>
            )}

            {/* 페이지 인디케이터 */}
            <div className="mt-6 text-white/60 text-sm">
              {currentQuestion + 1}/{totalQuestions}
            </div>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="pb-8 px-6 text-center">
          <div className="flex items-center justify-center space-x-4 text-white/80 text-sm">
            <img
              src="/Logo.png"
              alt="STARRY"
              className="h-3 -translate-y-[11px]"
            />
            <div className="h-6 w-px bg-white/40 -translate-y-[11px]"></div>
            <div className="text-left space-y-1">
              <div className="text-[9px] leading-snug">
                광고 문의: 123456789@gmail.com <br />
                Copyright ©2025 123456789. All rights reserved.
              </div>
              <div className="text-white/70 text-[9px] flex items-center space-x-1">
                <span className="font-semibold text-white">개발자</span>
                <span>김기찬</span>
                <span className="text-white/40">·</span>
                <span className="font-semibold text-white">디자이너</span>
                <span>김태희</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SurveyQuestionPage;
