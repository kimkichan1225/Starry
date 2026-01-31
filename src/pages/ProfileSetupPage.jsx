import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // 폼 상태
  const [formData, setFormData] = useState({
    nickname: '',
    birthdate: '',
    phone: '',
    verificationCode: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [checkingProfile, setCheckingProfile] = useState(true);

  // 기존 회원 여부 상태
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [existingProfileId, setExistingProfileId] = useState(null);

  // SMS 인증 상태
  const [smsVerification, setSmsVerification] = useState({
    sent: false,
    verified: false,
    loading: false,
    timer: 180,
    timerActive: false,
    error: '',
    verificationToken: null
  });

  // 프로필 완성 여부 체크 및 기존 데이터 불러오기
  useEffect(() => {
    const checkProfile = async () => {
      if (authLoading) return;

      if (!user) {
        navigate('/');
        return;
      }

      const metadata = user.user_metadata || {};

      // 간편 로그인 연동이 이미 완료된 경우 바로 /starry로 이동
      if (metadata.social_linked) {
        navigate('/starry');
        return;
      }

      // 프로필이 이미 완성된 경우 (일반 가입 사용자) 바로 /starry로 이동
      if (metadata.nickname && metadata.birthdate && metadata.phone_verified) {
        navigate('/starry');
        return;
      }

      // 이메일로 기존 회원 조회 (profiles 테이블)
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, nickname, phone, email, birthdate')
        .eq('email', user.email)
        .maybeSingle();

      if (existingProfile && !profileError) {
        // 기존 회원 발견 - 정보 자동 채우기 (수정 불가)
        setIsExistingUser(true);
        setExistingProfileId(existingProfile.id);
        setFormData(prev => ({
          ...prev,
          nickname: existingProfile.nickname || '',
          birthdate: existingProfile.birthdate || '',
          phone: existingProfile.phone || ''
        }));
      } else {
        // 신규 사용자 - 필드 비워두기
        setFormData(prev => ({
          ...prev,
          nickname: '',
          birthdate: '',
          phone: ''
        }));
      }

      // 이미 전화번호 인증이 완료된 경우
      if (metadata.phone_verified && metadata.phone) {
        setSmsVerification(prev => ({
          ...prev,
          verified: true
        }));
      }

      setCheckingProfile(false);
    };

    checkProfile();
  }, [user, authLoading, navigate]);

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '');

    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // 타이머 useEffect
  useEffect(() => {
    let interval;

    if (smsVerification.timerActive && smsVerification.timer > 0) {
      interval = setInterval(() => {
        setSmsVerification(prev => ({
          ...prev,
          timer: prev.timer - 1
        }));
      }, 1000);
    } else if (smsVerification.timer === 0) {
      setSmsVerification(prev => ({
        ...prev,
        timerActive: false,
        sent: false
      }));
      setError('인증번호가 만료되었습니다. 다시 요청해주세요.');
    }

    return () => clearInterval(interval);
  }, [smsVerification.timerActive, smsVerification.timer]);

  // 입력 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      setFormData(prev => ({
        ...prev,
        [name]: formatPhoneNumber(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // SMS 발송 핸들러
  const handleSendSMS = async () => {
    if (!formData.phone || formData.phone.length !== 13) {
      setError('올바른 전화번호를 입력해주세요.');
      return;
    }

    setSmsVerification(prev => ({ ...prev, loading: true, error: '' }));
    setError('');

    try {
      // 신규 소셜 로그인 사용자일 경우 전화번호 중복 체크
      if (!isExistingUser) {
        const { data: existingPhone, error: phoneError } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', formData.phone)
          .maybeSingle();

        if (phoneError) {
          throw new Error('전화번호 확인 중 오류가 발생했습니다.');
        }

        if (existingPhone) {
          throw new Error('이미 가입된 전화번호입니다.');
        }
      }

      const response = await fetch(
        `https://aifioxdvjtxwxzxgdugs.supabase.co/functions/v1/send-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ phone: formData.phone })
        }
      );

      const data = await response.json();

      if (data.success) {
        setSmsVerification(prev => ({
          ...prev,
          sent: true,
          loading: false,
          timer: 180,
          timerActive: true,
          error: ''
        }));
        setSuccessMessage('인증번호가 발송되었습니다.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(data.message || 'SMS 발송에 실패했습니다.');
      }
    } catch (error) {
      setSmsVerification(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      setError(error.message);
    }
  };

  // SMS 검증 핸들러
  const handleVerifySMS = async () => {
    if (!formData.verificationCode || formData.verificationCode.length !== 6) {
      setError('인증번호 6자리를 입력해주세요.');
      return;
    }

    setSmsVerification(prev => ({ ...prev, loading: true, error: '' }));
    setError('');

    try {
      const response = await fetch(
        `https://aifioxdvjtxwxzxgdugs.supabase.co/functions/v1/verify-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            phone: formData.phone,
            code: formData.verificationCode
          })
        }
      );

      const data = await response.json();

      if (data.success && data.verified) {
        setSmsVerification(prev => ({
          ...prev,
          verified: true,
          loading: false,
          timerActive: false,
          verificationToken: data.verificationToken
        }));
        setSuccessMessage('휴대전화 인증이 완료되었습니다.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(data.message || '인증번호가 일치하지 않습니다.');
      }
    } catch (error) {
      setSmsVerification(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      setError(error.message);
    }
  };

  // 프로필 설정 완료 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // 유효성 검사
    if (!formData.nickname.trim()) {
      setError('이름 또는 닉네임을 입력해주세요.');
      return;
    }

    if (!formData.birthdate) {
      setError('생년월일을 입력해주세요.');
      return;
    }

    if (!smsVerification.verified) {
      setError('휴대전화 인증을 완료해주세요.');
      return;
    }

    setLoading(true);

    try {
      // Supabase user_metadata 업데이트
      const { error } = await supabase.auth.updateUser({
        data: {
          nickname: formData.nickname,
          birthdate: formData.birthdate,
          phone: formData.phone,
          phone_verified: true,
          verification_token: smsVerification.verificationToken,
          profile_completed: true,
          social_linked: true  // 간편 로그인 연동 완료 표시
        }
      });

      if (error) throw error;

      // 기존 회원인 경우 profiles 테이블에 social_linked 업데이트
      if (isExistingUser && existingProfileId) {
        await supabase
          .from('profiles')
          .update({ social_linked: true })
          .eq('id', existingProfileId);
      }

      setSuccessMessage('프로필 설정이 완료되었습니다!');
      setTimeout(() => {
        navigate('/starry');
      }, 1500);
    } catch (error) {
      setError(error.message || '프로필 설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 로딩 중
  if (authLoading || checkingProfile) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/BackGround.jpg)' }}
        ></div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-white text-lg">로딩 중...</div>
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
        {/* 광고 배너 영역 */}
        <div className="h-16 bg-[#949494] mt-8 flex items-center justify-center">
        </div>

        {/* 상단 네비게이션 */}
        <nav className="px-6 py-5">
          <div className="max-w-[370px] mx-auto flex justify-between items-center">
            <div className="flex items-center gap-1">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white font-bold text-2xl">프로필 설정</span>
            </div>
          </div>
        </nav>

        {/* 중앙 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center px-4 py-4 relative">

          {/* 프로필 설정 폼 */}
          <form onSubmit={handleSubmit} className="w-full max-w-[280px] space-y-6">
            {/* 에러/성공 메시지 */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-2 rounded-lg text-xs text-center">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="bg-green-500/20 border border-green-500 text-green-100 px-4 py-2 rounded-lg text-xs text-center">
                {successMessage}
              </div>
            )}

            {/* 기존 회원 안내 메시지 */}
            {isExistingUser && (
              <div className="bg-blue-500/20 border border-blue-400 text-blue-100 px-4 py-2 rounded-lg text-xs text-center">
                기존 회원 정보가 확인되었습니다.<br />
                전화번호 인증을 완료해주세요.
              </div>
            )}

            {/* 이름 또는 닉네임 */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">이름 또는 닉네임</label>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                required
                disabled={isExistingUser}
                className={`w-full px-4 py-3 text-sm rounded-lg text-gray-800 placeholder-gray-400 border-2 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 ${
                  isExistingUser
                    ? 'bg-gray-200 border-gray-400 cursor-not-allowed'
                    : 'bg-white border-purple-500 focus:ring-purple-600'
                }`}
              />
            </div>

            {/* 생년월일 */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">생년월일</label>
              <input
                type="date"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleChange}
                required
                disabled={isExistingUser && formData.birthdate}
                className={`w-full px-4 py-3 text-sm rounded-lg text-gray-800 placeholder-gray-400 border-2 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 ${
                  isExistingUser && formData.birthdate
                    ? 'bg-gray-200 border-gray-400 cursor-not-allowed'
                    : 'bg-white border-purple-500 focus:ring-purple-600'
                }`}
              />
            </div>

            {/* 전화번호 인증 */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">전화번호 인증</label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="010-1234-5678"
                    required
                    maxLength="13"
                    disabled={smsVerification.verified || isExistingUser}
                    className={`flex-1 px-4 py-3 text-sm rounded-lg text-gray-800 placeholder-gray-400 border-2 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 ${
                      smsVerification.verified || isExistingUser
                        ? 'bg-gray-200 border-gray-400 cursor-not-allowed'
                        : 'bg-white border-purple-500 focus:ring-purple-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleSendSMS}
                    disabled={smsVerification.loading || smsVerification.timerActive || smsVerification.verified}
                    className={`px-4 py-3 text-sm rounded-lg text-white font-medium transition-colors whitespace-nowrap ${
                      smsVerification.verified
                        ? 'bg-green-500 cursor-not-allowed'
                        : smsVerification.timerActive
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {smsVerification.verified
                      ? '완료'
                      : smsVerification.timerActive
                        ? `${Math.floor(smsVerification.timer / 60)}:${String(smsVerification.timer % 60).padStart(2, '0')}`
                        : smsVerification.loading
                          ? '발송 중...'
                          : '인증'
                    }
                  </button>
                </div>

                {/* 인증번호 입력 */}
                <input
                  type="text"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleChange}
                  placeholder="인증번호 입력"
                  maxLength="6"
                  disabled={!smsVerification.sent || smsVerification.verified}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && smsVerification.sent && !smsVerification.verified) {
                      e.preventDefault();
                      handleVerifySMS();
                    }
                  }}
                  className={`w-full px-4 py-3 text-sm rounded-lg text-gray-800 placeholder-gray-400 border-2 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 disabled:cursor-not-allowed ${
                    smsVerification.verified
                      ? 'bg-green-100 border-green-500'
                      : !smsVerification.sent
                        ? 'bg-gray-100 border-gray-300'
                        : 'bg-white border-purple-500 focus:ring-purple-600'
                  }`}
                />

                {/* 인증번호 확인 버튼 (SMS 발송 후 표시) */}
                {smsVerification.sent && !smsVerification.verified && (
                  <button
                    type="button"
                    onClick={handleVerifySMS}
                    disabled={smsVerification.loading || !formData.verificationCode}
                    className="w-full py-2 text-sm rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {smsVerification.loading ? '확인 중...' : '인증번호 확인'}
                  </button>
                )}

                {smsVerification.verified && (
                  <p className="text-green-400 text-xs text-center">✓ 인증이 완료되었습니다.</p>
                )}
              </div>
            </div>

            {/* 완료 버튼 */}
            <button
              type="submit"
              disabled={loading || !smsVerification.verified}
              className="w-full py-2.5 text-sm rounded-lg bg-[#9E4EFF] text-white font-medium hover:bg-[#8A3EE6] transition-colors !mt-20 disabled:bg-[#9E4EFF] disabled:cursor-not-allowed"
            >
              {loading ? '처리 중...' : '완료'}
            </button>
          </form>
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

export default ProfileSetupPage;
