import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import NavBar from '../components/NavBar';

// 질문 데이터
const questions = [
  {
    id: 1,
    questionLine1: (nickname) => `${nickname} 님이`,
    questionLine2: '가장 중요하게 생각하는 것은?',
    options: [
      { id: 'a', emoji: '🔥', label: '도전!', shortLabel: '도전', description: '용감하게 밀고 나간다' },
      { id: 'b', emoji: '📐', label: '실력!', shortLabel: '실력', description: '확실하게 해낸다' },
      { id: 'c', emoji: '📚', label: '지식!', shortLabel: '지식', description: '새로운 것을 알아낸다' },
      { id: 'd', emoji: '💖', label: '마음!', shortLabel: '마음', description: '사람들과 함께 해낸다' },
    ],
  },
  {
    id: 2,
    questionLine1: (nickname) => `${nickname} 님의`,
    questionLine2: '새로운 상황에서 행동 스타일은?',
    options: [
      { id: 'a', emoji: '🧑‍🏫', label: '리더형!', shortLabel: '리더', description: '내가 이끌어간다' },
      { id: 'b', emoji: '🗺️', label: '유지형!', shortLabel: '유지', description: '방식을 끝까지 유지한다' },
      { id: 'c', emoji: '🧩', label: '유연형!', shortLabel: '유연', description: '상황에 따라 바뀐다' },
      { id: 'd', emoji: '💬', label: '중재형!', shortLabel: '중재', description: '모두의 의견을 들어본다' },
    ],
  },
  {
    id: 3,
    questionLine1: (nickname) => `${nickname} 님의`,
    questionLine2: '첫인상은?',
    options: [
      { id: 'a', emoji: '😀', label: '외향적!', shortLabel: '외향', description: '활발한 에너지' },
      { id: 'b', emoji: '😳', label: '내향적!', shortLabel: '내향', description: '차분하고 신중함' },
      { id: 'c', emoji: '😊', label: '균형적!', shortLabel: '균형', description: '친근하고 편함' },
      { id: 'd', emoji: '😝', label: '개성!', shortLabel: '개성', description: '어디로 튈지 모름' },
    ],
  },
  {
    id: 4,
    questionLine1: (nickname) => `${nickname} 님이`,
    questionLine2: '가장 행복한 상황은?',
    options: [
      { id: 'a', emoji: '🎮', label: '게임 레벨이', shortLabel: '게임', description: '올랐을 때' },
      { id: 'b', emoji: '🔒', label: '재미있는 비밀을', shortLabel: '비밀', description: '알았을 때' },
      { id: 'c', emoji: '🏆️', label: '노력한 일에', shortLabel: '노력', description: '칭찬을 받을 때' },
      { id: 'd', emoji: '☕', label: '친구들과', shortLabel: '카페', description: '카페에 갈 때' },
    ],
  },
  {
    id: 5,
    questionLine1: (nickname) => `${nickname} 님이`,
    questionLine2: '스트레스를 푸는 방법은?',
    options: [
      { id: 'a', emoji: '🍰', label: '맛있는걸 먹거나', shortLabel: '음식', description: '푹 잔다' },
      { id: 'b', emoji: '🗣', label: '친한 사람에게', shortLabel: '대화', description: '이야기한다' },
      { id: 'c', emoji: '🏃‍♂️', label: '운동이나', shortLabel: '활동', description: '노래를 한다' },
      { id: 'd', emoji: '🧮', label: '스트레스 받은', shortLabel: '해결', description: '이유를 따져본다' },
    ],
  },
];

function StatDetailPage() {
  const { user, nickname } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  // 통계 데이터 가져오기
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('stars')
          .select('answers')
          .eq('user_id', user.id);

        if (error) throw error;

        // 각 질문별 응답 통계 계산
        const questionStats = {};
        const totalResponses = data?.length || 0;

        questions.forEach((q) => {
          questionStats[q.id] = {
            a: 0,
            b: 0,
            c: 0,
            d: 0,
            total: totalResponses,
          };
        });

        data?.forEach((star) => {
          const answers = star.answers;
          Object.keys(answers).forEach((qId) => {
            const answer = answers[qId];
            if (questionStats[qId] && questionStats[qId][answer] !== undefined) {
              questionStats[qId][answer]++;
            }
          });
        });

        setStats(questionStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // 레이더 차트 그리기
  useEffect(() => {
    if (!canvasRef.current || !stats) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const maxRadius = Math.min(W, H) / 2 - 40;

    // 배경 클리어
    ctx.clearRect(0, 0, W, H);

    // 현재 질문의 4개 옵션 % 계산
    const q = questions[currentQuestion];
    const qStats = stats[q.id];
    const percentages = [
      50, // 위쪽 (Q 레이블) - 50% 고정
      qStats && qStats.total > 0 ? (qStats.d / qStats.total) * 100 : 0, // 오른쪽 위 (d 옵션 - 마음/중재/개성/카페/해결)
      qStats && qStats.total > 0 ? (qStats.c / qStats.total) * 100 : 0, // 오른쪽 아래 (c 옵션 - 지식/유연/균형/노력/활동)
      qStats && qStats.total > 0 ? (qStats.b / qStats.total) * 100 : 0, // 왼쪽 아래 (b 옵션 - 실력/유지/내향/비밀/대화)
      qStats && qStats.total > 0 ? (qStats.a / qStats.total) * 100 : 0, // 왼쪽 위 (a 옵션 - 도전/리더/외향/게임/음식)
    ];

    // 5개의 바깥 꼭짓점 각도 (위쪽부터 시계방향)
    const outerAngles = [
      -Math.PI / 2,           // 위
      -Math.PI / 2 + (2 * Math.PI / 5),     // 오른쪽 위
      -Math.PI / 2 + (4 * Math.PI / 5),     // 오른쪽 아래
      -Math.PI / 2 + (6 * Math.PI / 5),     // 왼쪽 아래
      -Math.PI / 2 + (8 * Math.PI / 5),     // 왼쪽 위
    ];

    // 5개의 안쪽 꼭짓점 각도 (바깥 꼭짓점 사이)
    const innerAngles = [
      -Math.PI / 2 + (Math.PI / 5),         // 위-오른쪽 사이
      -Math.PI / 2 + (3 * Math.PI / 5),     // 오른쪽 위-아래 사이
      -Math.PI / 2 + (5 * Math.PI / 5),     // 오른쪽 아래-왼쪽 아래 사이
      -Math.PI / 2 + (7 * Math.PI / 5),     // 왼쪽 아래-위 사이
      -Math.PI / 2 + (9 * Math.PI / 5),     // 왼쪽 위-위 사이
    ];

    const innerRatio = 0.4; // 안쪽 꼭짓점의 비율 (0.4 = 40%)

    // 배경 원 가이드 라인 그리기 (25, 50, 75, 100, 125 단위 = 5개)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (maxRadius / 5) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 축 선 그리기
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    outerAngles.forEach((angle) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * maxRadius, cy + Math.sin(angle) * maxRadius);
      ctx.stroke();
    });

    // 데이터 영역 그리기 (별 모양)
    ctx.beginPath();
    const points = [];
    for (let i = 0; i < 5; i++) {
      // 바깥 꼭짓점 (데이터 기반, 최소 25 보장: 0%→25, 100%→125)
      const outerRadius = ((percentages[i] + 25) / 125) * maxRadius;
      const outerX = cx + Math.cos(outerAngles[i]) * outerRadius;
      const outerY = cy + Math.sin(outerAngles[i]) * outerRadius;

      // 안쪽 꼭짓점 (바깥의 일정 비율)
      const innerRadius = outerRadius * innerRatio;
      const innerX = cx + Math.cos(innerAngles[i]) * innerRadius;
      const innerY = cy + Math.sin(innerAngles[i]) * innerRadius;

      if (i === 0) {
        ctx.moveTo(outerX, outerY);
      } else {
        ctx.lineTo(outerX, outerY);
      }
      ctx.lineTo(innerX, innerY);

      points.push({ x: outerX, y: outerY });
    }
    ctx.closePath();

    // 보라색 글로우 효과
    ctx.shadowColor = '#7C3AED';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 흰색 채우기
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();

    // 글로우 효과 리셋
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

  }, [stats, currentQuestion]);

  // 현재 질문의 통계 계산
  const getCurrentQuestionStats = () => {
    if (!stats) return [];
    const q = questions[currentQuestion];
    const qStats = stats[q.id];
    if (!qStats) return [];

    return q.options.map((opt) => {
      const count = qStats[opt.id] || 0;
      const percent = qStats.total > 0 ? Math.round((count / qStats.total) * 100) : 0;
      return {
        ...opt,
        count,
        percent,
      };
    });
  };

  // 가장 많이 선택된 답변 찾기
  const getMostPopularAnswer = (questionId) => {
    if (!stats) return null;
    const qStats = stats[questionId];
    if (!qStats || qStats.total === 0) return null;

    const q = questions.find((q) => q.id === questionId);
    let maxCount = 0;
    let maxOption = null;

    q.options.forEach((opt) => {
      if (qStats[opt.id] > maxCount) {
        maxCount = qStats[opt.id];
        maxOption = opt;
      }
    });

    return maxOption;
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const question = questions[currentQuestion];
  const currentStats = getCurrentQuestionStats();

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
        <div className="h-16 bg-[#949494] flex items-center justify-center">
        </div>

        {/* 상단 네비게이션 */}
        <nav className="px-6 py-5">
          <div className="max-w-[370px] mx-auto flex justify-between items-center">
            <div className="flex items-center gap-1">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white font-bold text-2xl">{nickname || 'User1'} 님의 응답 통계</span>
            </div>
          </div>
        </nav>

        {/* 중앙 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-start pt-2 px-6">
          <div className="w-full max-w-[330px]">
            {/* 레이더 차트 영역 */}
            <div className="relative flex justify-center mb-4">
              <canvas
                ref={canvasRef}
                width={240}
                height={240}
              />
              {/* 레이블들 */}
              {stats && (
                <>
                  {/* 위쪽 레이블 - Q 번호 */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 text-white text-sm font-bold text-center">
                    <span>Q{question.id}</span>
                  </div>
                  {/* 오른쪽 위 레이블 - d 옵션 */}
                  <div className="absolute top-[75px] right-[60px] text-white text-xs text-center">
                    <div>{question.options[3].emoji}</div>
                    <div>{question.options[3].shortLabel}</div>
                  </div>
                  {/* 오른쪽 아래 레이블 - c 옵션 */}
                  <div className="absolute bottom-[25px] right-[95px] text-white text-xs text-center">
                    <div>{question.options[2].emoji}</div>
                    <div>{question.options[2].shortLabel}</div>
                  </div>
                  {/* 왼쪽 아래 레이블 - b 옵션 */}
                  <div className="absolute bottom-[25px] left-[95px] text-white text-xs text-center">
                    <div>{question.options[1].emoji}</div>
                    <div>{question.options[1].shortLabel}</div>
                  </div>
                  {/* 왼쪽 위 레이블 - a 옵션 */}
                  <div className="absolute top-[75px] left-[60px] text-white text-xs text-center">
                    <div>{question.options[0].emoji}</div>
                    <div>{question.options[0].shortLabel}</div>
                  </div>
                </>
              )}
            </div>

            {/* 질문 텍스트 */}
            <div className="text-center mb-4">
              <h1 className="text-white text-lg font-bold leading-relaxed">
                {question.questionLine1(nickname || 'User1')}
              </h1>
              <h2 className="text-white text-base font-bold">
                {question.questionLine2}
              </h2>
            </div>

            {/* 응답 통계 박스 */}
            <div className="border-2 border-dashed border-[#FAF5FF] rounded-xl p-4 mb-6 bg-[#6155F5]/30">
              {currentStats.map((opt, index) => (
                <div key={opt.id} className="flex items-center py-2 border-b border-white/20 last:border-b-0">
                  <span className="text-white font-bold w-6 text-sm">{index + 1}</span>
                  <span className="text-base mr-1">{opt.emoji}</span>
                  <span className="text-white flex-1 text-sm">{opt.label} {opt.description}</span>
                  <span className="text-white/70 text-xs">({opt.count}명 / {opt.percent}%)</span>
                </div>
              ))}
            </div>

            {/* 이전/다음 버튼 */}
            <div className="flex justify-center gap-3">
              <button
                onClick={handlePrev}
                disabled={currentQuestion === 0}
                className={`w-[144px] py-3 text-base rounded-full font-semibold transition-colors ${
                  currentQuestion === 0
                    ? 'bg-[#C5C5C5]/50 text-black/50 cursor-not-allowed'
                    : 'bg-[#C5C5C5] text-black hover:bg-[#B5B5B5]'
                }`}
              >
                이전
              </button>
              <button
                onClick={handleNext}
                disabled={currentQuestion === questions.length - 1}
                className={`w-[144px] py-3 text-base rounded-full font-semibold transition-colors ${
                  currentQuestion === questions.length - 1
                    ? 'bg-[#6155F5]/50 text-white/50 cursor-not-allowed'
                    : 'bg-[#6155F5] text-white hover:bg-[#5044d4]'
                }`}
              >
                다음
              </button>
            </div>
          </div>
        </div>
      </div>

      <NavBar />
    </div>
  );
}

export default StatDetailPage;
