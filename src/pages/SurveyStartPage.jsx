import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function SurveyStartPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [surveyorName, setSurveyorName] = useState('');
  const [targetUserNickname, setTargetUserNickname] = useState('User1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        // 에러가 있어도 기본값으로 진행
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

  const handleNext = () => {
    if (!surveyorName.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    // 설문 페이지로 이동 (나중에 구현)
    // navigate(`/survey/${userId}/questions`, { state: { surveyorName } });
    alert(`${surveyorName}님, 설문을 시작합니다!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030025] flex items-center justify-center">
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
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          {/* 타이틀 */}
          <div className="text-center mb-12">
            <h1 className="text-white text-3xl font-bold mb-2">
              {targetUserNickname} 님의
            </h1>
            <h2 className="text-white text-2xl">
              밤하늘에 별을 선물하세요!
            </h2>
          </div>

          {/* 입력 폼 */}
          <div className="w-full max-w-[280px] space-y-4">
            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-2 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {/* 이름 입력 */}
            <input
              type="text"
              placeholder="이름을 입력해주세요."
              value={surveyorName}
              onChange={(e) => {
                setSurveyorName(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-transparent shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:border-purple-500"
            />

            {/* 다음 버튼 */}
            <button
              onClick={handleNext}
              className="w-full py-3 text-sm rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
            >
              다음
            </button>

            {/* 안내 문구 */}
            <p className="text-white/70 text-xs text-center leading-relaxed mt-8">
              * 한 번 입력한 이름은 바꿀 수 없어요.<br />
             * 신중하게 입력하고 '다음'으로 넘어가주세요.
            </p>
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

export default SurveyStartPage;
