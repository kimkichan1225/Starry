import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const questions = [
  {
    id: 1,
    question: (nickname) => `${nickname} 님이 가장 중요하게 생각하는 것은?`,
    options: [
      { id: 'a', emoji: '🔥', label: '도전!', description: '용감하게 밀고 나간다' },
      { id: 'b', emoji: '📐', label: '실력!', description: '확실하게 해낸다' },
      { id: 'c', emoji: '📚', label: '지식!', description: '새로운 것을 알아낸다' },
      { id: 'd', emoji: '💖', label: '마음!', description: '사람들과 함께 해낸다' },
    ],
  },
  // 추후 질문 2~5 추가 예정
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
      setSelectedOption(answers[questions[currentQuestion + 1]?.id] || null);
    } else {
      // 설문 완료 (나중에 결과 페이지로 이동)
      console.log('설문 완료:', newAnswers);
      alert('설문이 완료되었습니다!');
      // navigate(`/survey/${userId}/result`, { state: { answers: newAnswers, surveyorName } });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
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
        <nav className="px-6 py-5 flex justify-between items-center relative">
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
        </nav>

        {/* 중앙 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 pt-16">
          {/* 질문 영역 */}
          <div className="w-full max-w-[330px] text-center">
            {/* 질문 텍스트 */}
            <div className="mb-6">
              <h1 className="text-white text-2xl font-bold leading-relaxed">
                {targetUserNickname} 님이
              </h1>
              <h2 className="text-white text-2xl font-bold">
                가장 중요하게 생각하는 것은?
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
                  className={`w-[300px] py-3 px-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                    selectedOption === option.id
                      ? 'border-[#9E4EFF] bg-[#9E4EFF]/20 text-black'
                      : 'border-[#9E4EFF] bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{option.emoji}</span>
                  <span className="font-semibold">{option.label}</span>
                  <span className="text-black/70">{option.description}</span>
                </button>
              ))}
            </div>

            {/* 다음 버튼 */}
            <button
              onClick={handleNext}
              disabled={!selectedOption}
              className={`w-full py-3 text-sm rounded-lg font-medium transition-colors ${
                selectedOption
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-purple-600/50 text-white/50 cursor-not-allowed'
              }`}
            >
              다음
            </button>

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
