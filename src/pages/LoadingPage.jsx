import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const LoadingPage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 이메일/비밀번호 로그인
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        navigate('/main');
      }
    } catch (error) {
      setError(error.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 구글 로그인
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/main`,
        },
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message || '구글 로그인에 실패했습니다.');
    }
  };

  // 카카오 로그인
  const handleKakaoLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/main`,
        },
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message || '카카오 로그인에 실패했습니다.');
    }
  };

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
        <div className="h-16 bg-[#949494] mt-8 flex items-center justify-center">
          <button
            onClick={() => navigate('/main')}
            className="px-4 py-2 text-sm rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-800 transition-colors"
          >
            개발자 로그인
          </button>
        </div>

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
          <form onSubmit={handleLogin} className={`w-full max-w-[280px] space-y-4 transition-all duration-1000 ease-out overflow-hidden ${
            isLoaded ? 'max-h-[700px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-20'
          }`}>
              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-2 rounded-lg text-xs text-center">
                  {error}
                </div>
              )}

              {/* 이메일 입력 */}
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
              />

              {/* 비밀번호 입력 */}
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
              />

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>

              {/* 간편 로그인 */}
              <div className="text-center !mt-10">
                <div className="flex items-center mb-3 text-white/70 text-xs">
                  <div className="flex-1 h-px bg-white"></div>
                  <span className="px-2">간편 로그인</span>
                  <div className="flex-1 h-px bg-white"></div>
                </div>
                <div className="flex justify-center space-x-3">
                  {/* 구글 로그인 */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-12 h-12 rounded-xl bg-white hover:bg-gray-100 transition-colors flex items-center justify-center"
                    title="구글 로그인"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                  </button>

                  {/* 카카오 로그인 */}
                  <button
                    type="button"
                    onClick={handleKakaoLogin}
                    className="w-12 h-12 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] transition-colors flex items-center justify-center"
                    title="카카오 로그인"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 48 48">
                      <path fill="#3C1E1E" d="M24,8C13.507,8,5,14.701,5,22.938c0,5.145,3.302,9.666,8.256,12.323l-2.116,7.728c-0.125,0.458,0.311,0.838,0.713,0.622l9.394-5.043C22.16,38.721,23.063,38.875,24,38.875c10.493,0,19-6.701,19-14.938S34.493,8,24,8z"/>
                    </svg>
                  </button>
                </div>

                {/* 회원가입 / 이메일/비밀번호 찾기 */}
                <div className="flex items-center justify-center space-x-2 mt-4 text-white/80 text-[10px]">
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="hover:text-white transition-colors"
                  >
                    회원가입
                  </button>
                  <span className="text-white/40"></span>
                  <button type="button" className="hover:text-white transition-colors">이메일/비밀번호 찾기</button>
                </div>
              </div>
          </form>
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
