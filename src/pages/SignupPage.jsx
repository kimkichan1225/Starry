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
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="tel"
                    className="flex-1 px-2 py-[4px] text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <button className="px-4 py-[4px] text-[13px] rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors whitespace-nowrap">
                    인증하기
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="인증번호 입력"
                  className="w-full px-4 py-[6px] text-center text-xs rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
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

                  <p className="font-semibold mb-3">
                    2. 개인정보 수집 방법<br />
                    * 회원가입 및 로그인 과정에서 이용자가 직접 입력<br />
                    * 웹사이트 이용 과정에서 자동 수집<br />
                    * 문의 양식 제출 시<br />
                    * Google AdSense 등 제3자 광고 서비스에 의한 쿠키 수집
                  </p>

                  <p className="font-semibold mb-3">
                    3. 개인정보 이용 목적<br />
                    수집한 개인정보는 다음 목적에 한해 사용됩니다.<br />
                    * 회원 관리 및 본인 식별<br />
                    * 서비스 제공 및 운영<br />
                    * 이용 기록 분석 및 서비스 개선<br />
                    * 고객 문의 응대<br />
                    * 광고 제공 및 광고 성과 측정
                  </p>

                  <p className="font-semibold mb-3">
                    4. 비밀번호 처리 방침<br />
                    * 비밀번호는 일방향 암호화 방식으로 저장되며, 운영자를 포함한 누구도 원문을 확인할 수 없습니다.<br />
                    * 이용자의 과실로 인한 비밀번호 유출에 대해 사이트는 책임을 지지 않습니다.
                  </p>

                  <p className="font-semibold mb-3">
                    5. 쿠키(Cookie)의 사용<br />
                    사이트는 사용자 경험 향상 및 광고 제공을 위해 쿠키를 사용할 수 있습니다.<br />
                    * 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.<br />
                    * 쿠키 저장을 거부할 경우 일부 서비스 이용에 제한이 있을 수 있습니다.
                  </p>
                  <p className="mb-3">
                    Google AdSense<br />
                    * Google은 광고 쿠키를 사용하여 사용자의 이전 방문 기록을 기반으로 맞춤형 광고를 제공할 수 있습니다.<br />
                    * 사용자는 Google 광고 설정을 통해 맞춤 광고를 거부할 수 있습니다.
                  </p>

                  <p className="font-semibold mb-3">
                    6. 개인정보 보유 및 이용 기간<br />
                    * 회원 탈퇴 시 개인정보는 지체 없이 파기합니다.<br />
                    * 단, 관련 법령에 따라 보관이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.
                  </p>

                  <p className="font-semibold mb-3">
                    7. 개인정보의 제3자 제공<br />
                    사이트는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.<br />
                    다만, 다음의 경우에는 예외로 합니다.(법령에 따른 요구가 있는 경우/Google 등 광고 서비스 제공에 필요한 최소한의 정보 제공)
                  </p>

                  <p className="font-semibold mb-3">
                    8. 개인정보 보호를 위한 조치<br />
                    사이트는 개인정보 보호를 위해 다음과 같은 조치를 시행합니다.<br />
                    * 비밀번호 암호화 저장<br />
                    * 접근 권한 최소화<br />
                    * 보안 취약점 점검
                  </p>

                  <p className="font-semibold mb-3">
                    9. 이용자의 권리<br />
                    이용자는 언제든지 다음 권리를 행사할 수 있습니다.<br />
                    * 개인정보 열람, 수정 요청<br />
                    * 회원 탈퇴 및 개인정보 삭제 요청
                  </p>

                  <p className="font-semibold mb-3">
                    10. 개인정보처리방침 변경<br />
                    본 방침은 관련 법령 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 사이트를 통해 공지합니다.
                  </p>

                  <p className="font-semibold mb-3">
                    11. 문의처<br />
                    * 운영자: [이름 또는 사이트명]<br />
                    * 이메일: [이메일 주소]<br />
                    * 시행일자: 2026년 1월 1일
                  </p>
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

            {/* 가입하기 버튼 */}
            <button className="w-full py-2.5 text-sm rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors !mt-6">
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
