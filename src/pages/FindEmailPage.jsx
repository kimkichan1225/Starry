import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const FindEmailPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [foundEmail, setFoundEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 이메일 마스킹 (앞 2자리 + *** + @도메인)
  const maskEmail = (email) => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart}***@${domain}`;
    }
    return `${localPart.slice(0, 2)}***@${domain}`;
  };

  // 전화번호 포맷팅 (010-1234-5678)
  const formatPhone = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  // 인증번호 발송
  const handleSendCode = async () => {
    if (phone.replace(/-/g, '').length < 10) {
      setError('올바른 전화번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 전화번호로 가입된 사용자 확인
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('phone', phone)
        .maybeSingle();

      if (checkError) {
        throw new Error('전화번호 확인 중 오류가 발생했습니다.');
      }

      if (!existingUser) {
        setError('가입정보가 없는 번호입니다.');
        setLoading(false);
        return;
      }

      // SMS 인증번호 발송
      const response = await fetch(
        `https://aifioxdvjtxwxzxgdugs.supabase.co/functions/v1/send-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ phone })
        }
      );

      const data = await response.json();

      if (data.success) {
        setIsCodeSent(true);
        alert('인증번호가 발송되었습니다.');
      } else {
        throw new Error(data.message || 'SMS 발송에 실패했습니다.');
      }
    } catch (err) {
      setError(err.message || '인증번호 발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 이메일 확인하기
  const handleFindEmail = async () => {
    if (!verificationCode) {
      setError('인증번호를 입력해주세요.');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('인증번호 6자리를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // SMS 인증번호 확인
      const response = await fetch(
        `https://aifioxdvjtxwxzxgdugs.supabase.co/functions/v1/verify-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            phone,
            code: verificationCode
          })
        }
      );

      const verifyData = await response.json();

      if (!verifyData.success || !verifyData.verified) {
        setError('인증번호가 일치하지 않습니다.');
        setLoading(false);
        return;
      }

      // 인증 성공 시 이메일 조회
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('phone', phone)
        .single();

      if (userError || !userData) {
        setError('가입정보가 없는 번호입니다.');
        setLoading(false);
        return;
      }

      // 이메일 마스킹 후 표시
      setFoundEmail(maskEmail(userData.email));
      setIsVerified(true);
    } catch (err) {
      setError('알수 없는 오류가 있습니다.\n1:1 문의사항에 문의 바랍니다.');
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
              <span className="text-white font-bold text-2xl">이메일 찾기</span>
            </div>
          </div>
        </nav>

        {/* 중앙 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
          {/* 결과 표시 */}
          {isVerified && foundEmail ? (
           <div className="w-full max-w-[300px]">
              <p className="text-white text-left mb-4 pl-1">회원님의 이메일은,</p>
              <div className="bg-white/10 border border-purple-500 rounded-lg px-4 py-4 mb-10">
                <p className="text-white text-xl font-medium">{foundEmail}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate('/find-password')}
                  className="flex-1 py-2 text-base rounded-lg bg-[#686868] text-white font-medium hover:bg-[#555555] transition-all"
                >
                  비밀번호 찾기
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 py-2 text-base rounded-lg bg-[#9E4EFF] text-white font-medium hover:bg-[#8A3EE6] transition-all"
                >
                  로그인하기
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[300px]">
              <p className="text-white text-left mb-2">전화번호를 입력해 주세요</p>

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-2 rounded-lg text-xs text-center mb-4">
                  {error}
                </div>
              )}

              {/* 전화번호 입력 + 인증 버튼 */}
              <div className="flex space-x-2 mb-3">
                <input
                  type="tel"
                  placeholder="010-1234-5678"
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={13}
                  className="flex-1 px-4 py-3 text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_4px_4px_4px_rgba(0,0,0,0.1)] focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <button
                  onClick={handleSendCode}
                  disabled={loading || phone.replace(/-/g, '').length < 10}
                  className="px-4 py-3 text-sm rounded-lg bg-[#9E4EFF] text-white font-medium hover:bg-[#8A3EE6] transition-colors disabled:bg-[#9E4EFF]/50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  인증
                </button>
              </div>

              {/* 인증번호 입력 */}
              <input
                type="text"
                placeholder="인증번호 입력"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^\d]/g, ''))}
                maxLength={6}
                disabled={!isCodeSent}
                className="w-full px-4 py-3 text-sm text-center rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_4px_4px_4px_rgba(0,0,0,0.1)] focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-gray-200 disabled:cursor-not-allowed mb-6"
              />

              {/* 이메일 확인하기 버튼 */}
              <button
                onClick={handleFindEmail}
                disabled={loading || !isCodeSent || !verificationCode}
                className="w-full py-3 text-sm rounded-lg bg-[#9E4EFF] text-white font-medium hover:bg-[#8A3EE6] transition-all disabled:bg-[#9E4EFF]/50 disabled:cursor-not-allowed"
              >
                {loading ? '확인 중...' : '이메일 확인하기'}
              </button>
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

export default FindEmailPage;
