import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignupPage = () => {
  const navigate = useNavigate();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

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
            {/* 이메일 */}
            <div>
              <label className="block text-white text-sm mb-2">아이디</label>
              <input
                type="email"
                className="w-full px-4 py-[4px] text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-white text-sm mb-2">비밀번호</label>
              <input
                type="password"
                className="w-full px-4 py-[4px] text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-white text-sm mb-2">비밀번호 확인</label>
              <input
                type="password"
                className="w-full px-4 py-[4px] text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* 이름 또는 닉네임 */}
            <div>
              <label className="block text-white text-sm mb-2">이름 또는 닉네임</label>
              <input
                type="text"
                className="w-full px-4 py-[4px] text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* 생년월일 */}
            <div>
              <label className="block text-white text-sm mb-2">생년월일</label>
              <input
                type="date"
                className="w-full px-4 py-[4px] text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* 휴대전화 */}
            <div>
              <label className="block text-white text-sm mb-2">휴대전화</label>
              <div className="flex space-x-2">
                <input
                  type="tel"
                  className="flex-1 px-2 py-[4px] text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <button className="px-4 py-[4px] text-[13px] rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors whitespace-nowrap">
                  인증하기
                </button>
              </div>
            </div>

            {/* 인증번호 */}
            <div>
              <label className="block text-white text-sm mb-2">인증번호</label>
              <input
                type="text"
                className="w-full px-4 py-[4px] text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
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
                <div className="bg-white/10 rounded-lg p-4 mb-3 text-white/70 text-[10px] leading-relaxed max-h-40 overflow-y-auto">
                  <p className="mb-2">
                    본 개인정보처리방침은 회원가입 시 수집된 개인정보 이용에 대해서만 적용되며, 다음과 같은 내용을 담고 있습니다.
                  </p>
                  <p className="mb-2">
                    1. 수집하는 개인정보의 항목<br />
                    이메일, 비밀번호, 이름/닉네임, 생년월일, 휴대전화번호를 수집합니다. 수집된 개인정보는 서비스 제공 및 회원 관리를 위해 활용됩니다.
                  </p>
                  <p className="mb-2">
                    2. 개인정보의 이용 목적<br />
                    회원 가입 및 관리, 서비스 제공 및 개선, 본인 확인 및 인증, 공지사항 전달 등의 목적으로 개인정보를 이용합니다.
                  </p>
                  <p>
                    3. 개인정보의 보유 및 이용 기간<br />
                    회원 탈퇴 시까지 보유하며, 탈퇴 후에는 즉시 파기합니다. 단, 관계 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다.
                  </p>
                </div>
              )}

              {/* 동의 체크박스 */}
              <label className="flex items-center space-x-2 text-white/80 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="w-4 h-4 rounded border-purple-500 text-purple-600 focus:ring-purple-600"
                />
                <span>동의합니다</span>
              </label>
            </div>

            {/* 가입하기 버튼 */}
            <button className="w-full py-3 text-sm rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors !mt-6">
              가입하기
            </button>
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
};

export default SignupPage;
