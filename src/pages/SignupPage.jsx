import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const SignupPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1); // 1~5 단계
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    nickname: '',
    birthYear: '2000',
    birthMonth: '01',
    birthDay: '01',
    phone: '',
    verificationCode: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [emailError, setEmailError] = useState('');

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

  // 스크롤 refs
  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const dayRef = useRef(null);

  // 년/월/일 옵션 생성
  const years = Array.from({ length: 100 }, (_, i) => String(2025 - i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

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
    if (name === 'email') {
      setEmailError('');
    }
  };

  // 이메일 중복 체크
  const checkEmailDuplicate = async () => {
    if (!formData.email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return;

    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();

      if (checkError) {
        console.error('이메일 확인 오류:', checkError);
        return;
      }
      if (existingUser) {
        setEmailError('이미 가입된 이메일입니다.');
      } else {
        setEmailError('');
      }
    } catch (err) {
      console.error('이메일 중복 체크 오류:', err);
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
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', formData.phone)
        .maybeSingle();

      if (checkError) throw new Error('전화번호 확인 중 오류가 발생했습니다.');
      if (existingUser) throw new Error('이미 가입된 전화번호입니다.');

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

  // Step 1 → Step 2 (환영합니다)
  const handleStep1Next = () => {
    setError('');

    if (emailError) {
      setError('이미 가입된 이메일입니다.');
      return;
    }
    if (!smsVerification.verified) {
      setError('휴대전화 인증을 완료해주세요.');
      return;
    }
    if (!agreePrivacy) {
      setError('개인정보 수집 및 활용에 동의해주세요.');
      return;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setCurrentStep(2);
  };

  // 최종 회원가입 처리
  const handleFinalSignup = async () => {
    setLoading(true);
    setError('');

    try {
      const birthdate = `${formData.birthYear}-${formData.birthMonth}-${formData.birthDay}`;

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nickname: formData.nickname,
            birthdate: birthdate,
            phone: formData.phone,
            phone_verified: true,
            verification_token: smsVerification.verificationToken
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        setCurrentStep(5); // 가입완료 화면
      }
    } catch (error) {
      setError(error.message || '회원가입에 실패했습니다.');
      setCurrentStep(1); // 에러 시 처음으로
    } finally {
      setLoading(false);
    }
  };

  // Step 4에서 다음 버튼 클릭 시 회원가입 처리
  const handleStep4Next = () => {
    handleFinalSignup();
  };

  // 스크롤 선택 핸들러
  const handleScrollSelect = (type, value) => {
    setFormData(prev => ({
      ...prev,
      [`birth${type}`]: value
    }));
  };

  // ==================== 렌더링 ====================

  // Step 1: 기본 정보 입력 (기존 디자인)
  const renderStep1 = () => (
    <div className="relative min-h-screen overflow-hidden">
      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/BackGround.jpg)' }}
      ></div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 광고 배너 영역 + 테스트용 네비게이션 */}
        <div className="h-16 bg-[#949494] mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            className="px-3 py-1 bg-white/30 text-white text-xs rounded hover:bg-white/50"
          >
            ← 이전
          </button>
          <span className="text-white text-sm font-medium">Step {currentStep}/5</span>
          <button
            onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
            className="px-3 py-1 bg-white/30 text-white text-xs rounded hover:bg-white/50"
          >
            다음 →
          </button>
        </div>

        {/* 중앙 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center px-4 py-8 relative">
          {/* 언어 선택 버튼 */}
          <button className="absolute top-6 left-6 flex items-center space-x-0.5 text-white/80 hover:text-white transition-all duration-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="1.4" />
              <path strokeLinecap="round" strokeWidth="1.4" d="M4 8h16" />
              <path strokeLinecap="round" strokeWidth="1.4" d="M2 12h20" />
              <path strokeLinecap="round" strokeWidth="1.4" d="M4 16h16" />
              <path strokeLinecap="round" strokeWidth="1.4" d="M12 2a15.3 15.3 0 0 1 0 20a15.3 15.3 0 0 1 0-20z" />
            </svg>
            <span className="text-sm font-light -translate-y-[0.1rem]">English</span>
          </button>

          {/* STARRY 로고 이미지 */}
          <img
            src="/Logo.png"
            alt="STARRY"
            className="w-32 md:w-40 mb-8 drop-shadow-2xl -translate-y-[8px]"
          />

          {/* 회원가입 폼 */}
          <div className="w-full max-w-[280px] space-y-4">
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

            {/* 이메일 */}
            <div>
              <label className="block text-white text-sm mb-2">아이디</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={checkEmailDuplicate}
                placeholder="user@example.com"
                required
                className={`w-full px-4 py-[4px] text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 ${
                  emailError ? 'border-red-500 focus:ring-red-500' : 'border-purple-500 focus:ring-purple-600'
                }`}
              />
              {emailError && (
                <p className="text-red-500 text-xs mt-1">{emailError}</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-white text-sm mb-2">비밀번호</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-[4px] text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-white text-sm mb-2">비밀번호 확인</label>
              <input
                type="password"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                required
                className="w-full px-4 py-[4px] text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* 휴대전화 */}
            <div>
              <label className="block text-white text-sm mb-2">휴대전화</label>
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
                    disabled={smsVerification.verified}
                    className="flex-1 px-2 py-[4px] text-center text-sm rounded-lg text-gray-800 placeholder-gray-400 border-2 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 disabled:bg-gray-200 disabled:cursor-not-allowed bg-white border-purple-500 focus:ring-purple-600"
                  />
                  <button
                    type="button"
                    onClick={handleSendSMS}
                    disabled={smsVerification.loading || smsVerification.timerActive || smsVerification.verified}
                    className={`px-4 py-[4px] text-[13px] rounded-lg text-white font-medium transition-colors whitespace-nowrap ${
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
                          : '인증하기'
                    }
                  </button>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="verificationCode"
                    value={formData.verificationCode}
                    onChange={handleChange}
                    placeholder="인증번호 6자리"
                    maxLength="6"
                    disabled={!smsVerification.sent || smsVerification.verified}
                    className={`flex-1 px-4 py-[6px] text-center text-xs rounded-lg text-gray-800 placeholder-gray-400 border-2 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 disabled:cursor-not-allowed ${
                      smsVerification.verified
                        ? 'bg-green-100 border-green-500'
                        : 'bg-white border-purple-500 focus:ring-purple-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleVerifySMS}
                    disabled={!smsVerification.sent || smsVerification.verified || smsVerification.loading || !formData.verificationCode}
                    className="px-4 py-[4px] text-[13px] rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {smsVerification.verified ? '완료' : smsVerification.loading ? '확인 중...' : '확인'}
                  </button>
                </div>
                {smsVerification.verified && (
                  <p className="text-green-400 text-xs text-center">✓ 인증이 완료되었습니다.</p>
                )}
              </div>
            </div>

            {/* 개인정보 수집 및 활용 동의 */}
            <div className="!mt-4">
              <div
                className="flex items-center justify-between text-white/80 text-xs cursor-pointer mb-2"
                onClick={() => setShowPrivacyPolicy(!showPrivacyPolicy)}
              >
                <span>개인정보 수집 및 활용 동의(필수)</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showPrivacyPolicy ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* 약관 내용 */}
              {showPrivacyPolicy && (
                <div className="bg-white rounded-lg p-4 mb-3 text-[#727272]/70 text-[10px] leading-relaxed max-h-40 overflow-y-auto">
                  <p className="font-semibold mb-3">[개인정보처리방침]<br />
                    본 개인정보처리방침은 회원가입 및 로그인 기능을 제공하는 개인 웹사이트(이하 "사이트")가 이용자의 개인정보를 어떻게 수집·이용·보관·파기하는지에 대해 설명합니다.
                  </p>
                  <p className="font-semibold mb-3">
                    1. 수집하는 개인정보 항목<br />
                    사이트는 다음과 같은 개인정보를 수집할 수 있습니다.<br />
                    ① 회원가입 및 로그인 시(아이디/비밀번호 (암호화 저장)/휴대폰 번호/이메일 주소 (선택))<br />
                    ② 서비스 이용 과정에서 자동 수집(IP 주소/쿠키(Cookie)/방문 기록/기기 정보 (브라우저, OS 등))<br />
                    ③ 문의 시(이름/이메일 주소)
                  </p>
                  <p className="font-semibold mb-3">... (약관 내용 생략) ...</p>
                </div>
              )}

              {/* 동의 체크박스 */}
              <label className="flex items-center justify-end space-x-2 text-white/80 text-xs cursor-pointer">
                <span>동의합니다</span>
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="w-4 h-4 rounded border-purple-500 text-purple-600 focus:ring-purple-600"
                />
              </label>
            </div>

            {/* 다음 버튼 */}
            <button
              type="button"
              onClick={handleStep1Next}
              className="w-full py-2.5 text-sm rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors !mt-6"
            >
              다음
            </button>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="pb-8 px-6 text-center">
          <div className="flex items-center justify-center space-x-4 text-white/80 text-sm">
            <img src="/Logo.png" alt="STARRY" className="h-3 -translate-y-[11px]" />
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

  // Step 2: 환영합니다
  const renderStep2 = () => (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/BackGround.jpg)' }}
      ></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 광고 배너 영역 + 테스트용 네비게이션 */}
        <div className="h-16 bg-[#949494] mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            className="px-3 py-1 bg-white/30 text-white text-xs rounded hover:bg-white/50"
          >
            ← 이전
          </button>
          <span className="text-white text-sm font-medium">Step {currentStep}/5</span>
          <button
            onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
            className="px-3 py-1 bg-white/30 text-white text-xs rounded hover:bg-white/50"
          >
            다음 →
          </button>
        </div>

        {/* 상단 헤더 */}
        <nav className="px-6 py-5">
          <div className="flex items-center gap-1">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-white font-bold text-2xl">프로필 설정</span>
          </div>
        </nav>

        {/* 중앙 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="text-white/80 text-sm mb-2">나를 닮은 별자리,</p>
          <h1 className="text-white text-2xl font-bold mb-12">Starry에 오신걸 환영해요!</h1>

          {/* 캐릭터 이미지 */}
          <img
            src="/StarryCharacter.png"
            alt="Starry Character"
            className="w-60 h-60 object-contain mb-12"
          />

          {/* 다음 버튼 */}
          <button
            onClick={() => setCurrentStep(3)}
            className="w-full max-w-[280px] py-3 rounded-lg bg-[#9E4EFF] text-white font-medium hover:bg-[#8a3ee6] transition-colors"
          >
            다음
          </button>

          {/* 진행 단계 표시 */}
          <img src="/Step2.png" alt="Step 2" className="mt-2 w-72 translate-x-1" />
        </div>

        {/* 하단 정보 */}
        <div className="pb-8 px-6 text-center">
          <div className="flex items-center justify-center space-x-4 text-white/80 text-sm">
            <img src="/Logo.png" alt="STARRY" className="h-3 -translate-y-[11px]" />
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

  // Step 3: 닉네임 입력
  const renderStep3 = () => (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/BackGround.jpg)' }}
      ></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 광고 배너 영역 + 테스트용 네비게이션 */}
        <div className="h-16 bg-[#949494] mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            className="px-3 py-1 bg-white/30 text-white text-xs rounded hover:bg-white/50"
          >
            ← 이전
          </button>
          <span className="text-white text-sm font-medium">Step {currentStep}/5</span>
          <button
            onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
            className="px-3 py-1 bg-white/30 text-white text-xs rounded hover:bg-white/50"
          >
            다음 →
          </button>
        </div>

        {/* 상단 헤더 */}
        <nav className="px-6 py-5">
          <div className="flex items-center gap-1">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-white font-bold text-2xl">프로필 설정</span>
          </div>
        </nav>

        {/* 중앙 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 -translate-y-2">
          <h1 className="text-white text-xl font-bold mb-1">이름 또는 닉네임을</h1>
          <p className="text-white text-xl mb-8">입력해주세요!</p>

          {/* 캐릭터 머리 (위에서 내려다보는) */}
          <div className="relative w-full max-w-[280px] mb-4">
            <img
              src="/Starry-head.png"
              alt="Starry Head"
              className="w-72 h-auto mx-auto -mb-9 relative z-10"
            />

            {/* 입력창 + 손 */}
            <div className="relative">
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                placeholder="행복한별과"
                className="w-full px-6 py-4 text-center text-lg rounded-2xl bg-[#3D3A5C] text-white placeholder-white/50 border-2 border-[#6B5CFF] focus:outline-none focus:ring-2 focus:ring-[#6B5CFF]"
              />
              {/* 양쪽 손 이미지 */}
              <img
                src="/Starry-hand.png"
                alt="Left Hand"
                className="absolute -left-3 top-1/2 -translate-y w-10 h-10"
              />
              <img
                src="/Starry-hand.png"
                alt="Right Hand"
                className="absolute -right-3 top-1/2 -translate-y w-10 h-10 scale-x-[-1]"
              />
            </div>
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={() => {
              if (!formData.nickname.trim()) {
                setError('닉네임을 입력해주세요.');
                return;
              }
              setError('');
              setCurrentStep(4);
            }}
            disabled={!formData.nickname.trim()}
            className="w-full max-w-[280px] py-3 rounded-lg bg-[#9E4EFF] text-white font-medium hover:bg-[#8a3ee6] transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed mt-24"
          >
            다음
          </button>

          {/* 진행 단계 표시 */}
          <img src="/Step3.png" alt="Step 3" className="mt-2 w-72 translate-x-1" />

          {error && (
            <p className="text-red-400 text-sm mt-4">{error}</p>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="pb-8 px-6 text-center">
          <div className="flex items-center justify-center space-x-4 text-white/80 text-sm">
            <img src="/Logo.png" alt="STARRY" className="h-3 -translate-y-[11px]" />
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

  // Step 4: 생년월일 선택
  const renderStep4 = () => (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/BackGround.jpg)' }}
      ></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 광고 배너 영역 + 테스트용 네비게이션 */}
        <div className="h-16 bg-[#949494] mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            className="px-3 py-1 bg-white/30 text-white text-xs rounded hover:bg-white/50"
          >
            ← 이전
          </button>
          <span className="text-white text-sm font-medium">Step {currentStep}/5</span>
          <button
            onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
            className="px-3 py-1 bg-white/30 text-white text-xs rounded hover:bg-white/50"
          >
            다음 →
          </button>
        </div>

        {/* 상단 헤더 */}
        <nav className="px-6 py-5">
          <div className="flex items-center gap-1">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-white font-bold text-2xl">프로필 설정</span>
          </div>
        </nav>

        {/* 중앙 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 -translate-y-2">
          <h1 className="text-white text-xl font-bold mb-1">{formData.nickname}님의</h1>
          <p className="text-white text-xl mb-8">생일은 언제인가요?</p>

          {/* 캐릭터 머리 */}
          <div className="relative w-full max-w-[280px] mb-4">
            <img
              src="/Starry-head.png"
              alt="Starry Head"
              className="w-72 h-auto mx-auto -mb-9 relative z-10"
            />

            {/* 날짜 선택 UI */}
            <div className="relative bg-[#3D3A5C] rounded-2xl p-4 border-2 border-[#6B5CFF]">
              {/* 양쪽 손 */}
              <img
                src="/Starry-hand.png"
                alt="Left Hand"
                className="absolute -left-3 top-1/2 -translate-y w-10 h-10"
              />
              <img
                src="/Starry-hand.png"
                alt="Right Hand"
                className="absolute -right-3 top-1/2 -translate-y w-10 h-10 scale-x-[-1]"
              />

              {/* 년/월/일 선택 */}
              <div className="flex justify-center items-center space-x-2 py-4">
                {/* 년 */}
                <div className="flex flex-col items-center">
                  <select
                    value={formData.birthYear}
                    onChange={(e) => handleScrollSelect('Year', e.target.value)}
                    className="bg-transparent text-white text-2xl font-bold text-center appearance-none cursor-pointer focus:outline-none w-20"
                  >
                    {years.map(year => (
                      <option key={year} value={year} className="bg-[#3D3A5C]">{year}</option>
                    ))}
                  </select>
                </div>

                {/* 월 */}
                <div className="flex flex-col items-center">
                  <select
                    value={formData.birthMonth}
                    onChange={(e) => handleScrollSelect('Month', e.target.value)}
                    className="bg-transparent text-white text-2xl font-bold text-center appearance-none cursor-pointer focus:outline-none w-16"
                  >
                    {months.map(month => (
                      <option key={month} value={month} className="bg-[#3D3A5C]">{month}</option>
                    ))}
                  </select>
                </div>

                {/* 일 */}
                <div className="flex flex-col items-center">
                  <select
                    value={formData.birthDay}
                    onChange={(e) => handleScrollSelect('Day', e.target.value)}
                    className="bg-transparent text-white text-2xl font-bold text-center appearance-none cursor-pointer focus:outline-none w-16"
                  >
                    {days.map(day => (
                      <option key={day} value={day} className="bg-[#3D3A5C]">{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 년/월/일 라벨 */}
              <div className="flex justify-center items-center space-x-8 text-white/60 text-sm">
                <span>년</span>
                <span>월</span>
                <span>일</span>
              </div>
            </div>
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={handleStep4Next}
            disabled={loading}
            className="w-full max-w-[280px] py-3 rounded-lg bg-[#9E4EFF] text-white font-medium hover:bg-[#8a3ee6] transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed mt-24"
          >
            {loading ? '가입 중...' : '다음'}
          </button>

          {/* 진행 단계 표시 */}
          <img src="/Step4.png" alt="Step 4" className="mt-2 w-72 translate-x-1" />

          {error && (
            <p className="text-red-400 text-sm mt-4">{error}</p>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="pb-8 px-6 text-center">
          <div className="flex items-center justify-center space-x-4 text-white/80 text-sm">
            <img src="/Logo.png" alt="STARRY" className="h-3 -translate-y-[11px]" />
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

  // Step 5: 가입 완료
  const renderStep5 = () => (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/BackGround.jpg)' }}
      ></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 광고 배너 영역 + 테스트용 네비게이션 */}
        <div className="h-16 bg-[#949494] mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            className="px-3 py-1 bg-white/30 text-white text-xs rounded hover:bg-white/50"
          >
            ← 이전
          </button>
          <span className="text-white text-sm font-medium">Step {currentStep}/5</span>
          <button
            onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
            className="px-3 py-1 bg-white/30 text-white text-xs rounded hover:bg-white/50"
          >
            다음 →
          </button>
        </div>

        {/* 상단 헤더 */}
        <nav className="px-6 py-5">
          <div className="flex items-center gap-1">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-white font-bold text-2xl">프로필 설정</span>
          </div>
        </nav>

        {/* 중앙 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <h1 className="text-white text-2xl font-bold mb-12">가입이 완료되었어요!</h1>

          {/* 파티모자 캐릭터 */}
          <img
            src="/StarryCharacter2.png"
            alt="Starry Character Celebration"
            className="w-48 h-48 object-contain mb-12"
          />

          {/* SNS 연동하기 버튼 */}
          <button
            onClick={() => {
              // TODO: SNS 연동 기능
              alert('SNS 연동 기능은 추후 업데이트 예정입니다.');
            }}
            className="w-full max-w-[280px] py-3 rounded-lg bg-transparent border-2 border-white/50 text-white/80 font-medium hover:bg-white/10 transition-colors mb-4"
          >
            SNS 연동하기
          </button>

          {/* 밤하늘 만들러가기 버튼 */}
          <button
            onClick={() => navigate('/home')}
            className="w-full max-w-[280px] py-3 rounded-lg bg-[#9E4EFF] text-white font-medium hover:bg-[#8a3ee6] transition-colors"
          >
            밤하늘 만들러가기
          </button>

          {/* 진행 단계 표시 */}
          <img src="/Step5.png" alt="Step 5" className="mt-2 w-72 translate-x-1" />
        </div>

        {/* 하단 정보 */}
        <div className="pb-8 px-6 text-center">
          <div className="flex items-center justify-center space-x-4 text-white/80 text-sm">
            <img src="/Logo.png" alt="STARRY" className="h-3 -translate-y-[11px]" />
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

  // 현재 Step에 따라 렌더링
  switch (currentStep) {
    case 1:
      return renderStep1();
    case 2:
      return renderStep2();
    case 3:
      return renderStep3();
    case 4:
      return renderStep4();
    case 5:
      return renderStep5();
    default:
      return renderStep1();
  }
};

export default SignupPage;
