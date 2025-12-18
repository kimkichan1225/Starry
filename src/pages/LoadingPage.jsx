import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoadingPage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/BackGround.jpg)' }}
      ></div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 광고 배너 영역 */}
        <div className="h-16 bg-[#949494] mt-8"></div>

        {/* 중앙 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center px-4 justify-center relative">
          {/* 언어 선택 버튼 */}
          <button className={`absolute top-6 left-6 flex items-center space-x-0.5 text-white/80 hover:text-white transition-all duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {/* 바깥 원 */}
              <circle cx="12" cy="12" r="10" strokeWidth="1.4" />
              {/* 가로선 (위) */}
              <path strokeLinecap="round" strokeWidth="1.4" d="M4 8h16" />
              {/* 가로선 (중앙) */}
              <path strokeLinecap="round" strokeWidth="1.4" d="M2 12h20" />
              {/* 가로선 (아래) */}
              <path strokeLinecap="round" strokeWidth="1.4" d="M4 16h16" />
              {/* 세로 곡선 */}
              <path strokeLinecap="round" strokeWidth="1.4" d="M12 2a15.3 15.3 0 0 1 0 20a15.3 15.3 0 0 1 0-20z" />
            </svg>
            <span className="text-sm font-light -translate-y-[0.1rem]">English</span>
          </button>

          {/* STARRY 로고 이미지 */}
          <img
            src="/Logo.png"
            alt="STARRY"
            className={`mb-2 drop-shadow-2xl transition-all duration-1000 ease-out ${
              isLoaded ? 'w-32 md:w-40' : 'w-64 md:w-96'
            }`}
          />

          {/* 서브타이틀 */}
          <p className={`text-white font-normal tracking-wide transition-all duration-1000 ease-out ${
            isLoaded ? 'text-xs md:text-base mb-8' : 'text-lg md:text-xl'
          }`}>
            당신을 닮은, 단 하나의 별자리
          </p>

          {/* 로그인 폼 */}
          <div className={`w-full max-w-[280px] space-y-4 transition-all duration-1000 ease-out overflow-hidden ${
            isLoaded ? 'max-h-[700px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-20'
          }`}>
              {/* 이메일 입력 */}
              <input
                type="email"
                placeholder="이메일"
                className="w-full px-4 py-3 text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
              />

              {/* 비밀번호 입력 */}
              <input
                type="password"
                placeholder="비밀번호"
                className="w-full px-4 py-3 text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
              />

              {/* 로그인 버튼 */}
              <button className="w-full py-3 text-sm rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors">
                로그인
              </button>

              {/* 간편 로그인 */}
              <div className="text-center !mt-10">
                <div className="flex items-center mb-3 text-white/70 text-xs">
                  <div className="flex-1 h-px bg-white"></div>
                  <span className="px-2">간편 로그인</span>
                  <div className="flex-1 h-px bg-white"></div>
                </div>
                <div className="flex justify-center space-x-4">
                  <button className="w-14 h-14 rounded-2xl bg-gray-300 hover:bg-gray-400 transition-colors"></button>
                  <button className="w-14 h-14 rounded-2xl bg-gray-300 hover:bg-gray-400 transition-colors"></button>
                  <button className="w-14 h-14 rounded-2xl bg-gray-300 hover:bg-gray-400 transition-colors"></button>
                  <button className="w-14 h-14 rounded-2xl bg-gray-300 hover:bg-gray-400 transition-colors"></button>
                </div>

                {/* 회원가입 / 이메일/비밀번호 찾기 */}
                <div className="flex items-center justify-center space-x-2 mt-4 text-white/80 text-[10px]">
                  <button
                    onClick={() => navigate('/signup')}
                    className="hover:text-white transition-colors"
                  >
                    회원가입
                  </button>
                  <span className="text-white/40"></span>
                  <button className="hover:text-white transition-colors">이메일/비밀번호 찾기</button>
                </div>
              </div>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="pb-8 px-6 text-center">
          {/* 로고와 연락처 */}
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
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
