import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const FindPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'sent'
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 비밀번호 재설정 이메일 발송
  const handleSendResetEmail = async () => {
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 이메일로 사용자 존재 여부 확인
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (userError) {
        throw new Error('이메일 확인 중 오류가 발생했습니다.');
      }

      if (!userData) {
        setError('가입정보가 없는 이메일입니다.');
        setLoading(false);
        return;
      }

      // 비밀번호 재설정 이메일 발송
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        throw new Error(resetError.message);
      }

      setStep('sent');
    } catch (err) {
      setError(err.message || '이메일 발송에 실패했습니다.');
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
              <span className="text-white font-bold text-2xl">비밀번호 찾기</span>
            </div>
          </div>
        </nav>

        {/* 중앙 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
          {step === 'email' && (
            // 이메일 입력 화면
            <div className="w-full max-w-[300px]">
              <p className="text-white text-left mb-2">이메일을 입력해 주세요</p>

              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-sm text-center rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_4px_4px_4px_rgba(0,0,0,0.1)] focus:outline-none focus:ring-2 focus:ring-purple-600 mb-8"
              />

              <button
                onClick={handleSendResetEmail}
                disabled={loading || !email}
                className="w-full py-3 text-sm rounded-lg bg-[#9E4EFF] text-white font-medium hover:bg-[#8A3EE6] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '발송 중...' : '비밀번호 재설정 링크 받기'}
              </button>

              {error && (
                <p className="text-red-500 text-xs text-center mt-4 whitespace-pre-line">
                  {error}
                </p>
              )}
            </div>
          )}

          {step === 'sent' && (
            // 이메일 발송 완료 화면
            <div className="w-full max-w-[300px] text-center">
              <div className="mb-6">
                {/* 이메일 아이콘 */}
                <svg className="w-16 h-16 text-purple-400 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <p className="text-white text-lg font-medium mb-2">
                  비밀번호 재설정 링크가<br />이메일로 발송되었습니다.
                </p>
                <p className="text-white/70 text-sm">
                  이메일을 확인해주세요.
                </p>
              </div>

              <div className="bg-white/10 border border-purple-500 rounded-lg px-4 py-3 mb-6">
                <p className="text-white text-sm">{email}</p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => navigate('/find-email')}
                  className="flex-1 py-2 text-base rounded-lg bg-[#686868] text-white font-medium hover:bg-[#555555] transition-all"
                >
                  아이디 찾기
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 py-2 text-base rounded-lg bg-[#9E4EFF] text-white font-medium hover:bg-[#8A3EE6] transition-all"
                >
                  로그인하기
                </button>
              </div>
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

export default FindPasswordPage;
