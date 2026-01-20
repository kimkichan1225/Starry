import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // URL에서 토큰 확인 (Supabase가 자동으로 세션 처리)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        // 세션이 없으면 비밀번호 찾기 페이지로 리다이렉트
        setError('유효하지 않은 링크입니다. 다시 시도해주세요.');
      }
    };
    checkSession();
  }, []);

  // 비밀번호 변경
  const handleResetPassword = async () => {
    if (!password) {
      setError('새 비밀번호를 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setIsComplete(true);
    } catch (err) {
      setError(err.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
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
        </div>

        {/* 상단 네비게이션 */}
        <nav className="px-6 py-5">
          <div className="max-w-[370px] mx-auto flex justify-between items-center">
            <div className="flex items-center gap-1">
              {/* 자물쇠 아이콘 */}
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
                <path d="M8 11V7a4 4 0 1 1 8 0v4" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>
              <span className="text-white font-bold text-2xl">비밀번호 재설정</span>
            </div>
          </div>
        </nav>

        {/* 중앙 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
          {isComplete ? (
            // 변경 완료 화면
            <div className="w-full max-w-[300px] text-center">
              <div className="mb-6">
                {/* 체크 아이콘 */}
                <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-white text-lg font-medium mb-2">
                  비밀번호가 변경되었습니다.
                </p>
                <p className="text-white/70 text-sm">
                  새 비밀번호로 로그인해주세요.
                </p>
              </div>

              <button
                onClick={() => navigate('/')}
                className="w-full py-3 text-base rounded-lg bg-[#9E4EFF] text-white font-medium hover:bg-[#8A3EE6] transition-all"
              >
                로그인하기
              </button>
            </div>
          ) : (
            // 비밀번호 입력 화면
            <div className="w-full max-w-[300px]">
              <p className="text-white text-left mb-2">새 비밀번호를 입력해 주세요</p>

              {/* 새 비밀번호 입력 */}
              <input
                type="password"
                placeholder="새 비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!isValidSession}
                className="w-full px-4 py-3 text-sm text-center rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_4px_4px_4px_rgba(0,0,0,0.1)] focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-gray-200 disabled:cursor-not-allowed mb-3"
              />

              {/* 비밀번호 확인 입력 */}
              <input
                type="password"
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!isValidSession}
                className="w-full px-4 py-3 text-sm text-center rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_4px_4px_4px_rgba(0,0,0,0.1)] focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-gray-200 disabled:cursor-not-allowed mb-8"
              />

              <button
                onClick={handleResetPassword}
                disabled={loading || !isValidSession || !password || !confirmPassword}
                className="w-full py-3 text-sm rounded-lg bg-[#9E4EFF] text-white font-medium hover:bg-[#8A3EE6] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '변경 중...' : '비밀번호 변경하기'}
              </button>

              {error && (
                <p className="text-red-500 text-xs text-center mt-4 whitespace-pre-line">
                  {error}
                </p>
              )}

              {!isValidSession && !error && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => navigate('/find-password')}
                    className="text-purple-400 text-sm underline"
                  >
                    비밀번호 찾기로 돌아가기
                  </button>
                </div>
              )}
            </div>
          )}
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
};

export default ResetPasswordPage;
