import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';

function NoticeDetailPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030025]">
      {/* 배경 이미지 */}
      <div
        className="absolute top-0 left-0 right-0 bottom-0 bg-cover bg-center bg-no-repeat opacity-100"
        style={{ backgroundImage: 'url(/BackGround.jpg)' }}
      ></div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex flex-col min-h-screen pb-20">
        {/* 광고 배너 영역 */}
        <div className="h-16 bg-[#949494] mt-8 flex items-center justify-center">
        </div>

        {/* 상단 네비게이션 */}
        <nav className="pl-6 pr-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-white font-bold text-2xl">Starry의 이야기</span>
          </div>
        </nav>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 px-6 pt-1 pb-8">
          {/* 공지사항 섹션 */}
          <div className="mb-8 -mx-5 px-6">
            <div className="flex items-center mb-6 -mx-6 px-7">
              <div className="flex items-center gap-1">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h2 className="text-white font-bold text-lg">공지사항</h2>
              </div>
            </div>

            {/* 공지사항 상세 카드 */}
            <div className="bg-white/90 p-6 mb-6">
              {/* 헤더 */}
              <div className="grid grid-cols-[40px_1fr_70px] gap-2 mb-2 text-sm">
                <div className="text-center font-bold text-black">중요</div>
                <div className="text-center font-bold text-black">개인정보 수집 및 이용 안내</div>
                <div className="text-center text-black">25.12.25</div>
              </div>

              {/* 구분선 */}
              <div className="flex justify-center mb-4">
                <div className="w-full h-px bg-black"></div>
              </div>

              {/* 내용 */}
              <div className="text-[#727272] text-xs leading-relaxed whitespace-pre-line">
{`[개인정보처리방침]
본 개인정보처리방침은 회원가입 및 로그인 기능을 제공하는 개인 웹사이트(이하 "사이트")가 이용자의 개인정보를 어떻게 수집·이용·보관·파기하는지에 대해 설명합니다.

1. 수집하는 개인정보 항목
사이트는 다음과 같은 개인정보를 수집할 수 있습니다.
① 회원가입 및 로그인 시(아이디/비밀번호 (암호화 저장)/휴대폰 번호/이메일 주소 (선택))
② 서비스 이용 과정에서 자동 수집(IP 주소/쿠키(Cookie)/방문 기록/기기 정보 (브라우저, OS 등))
③ 문의 시(이름/이메일 주소)

2. 개인정보 수집 방법
* 회원가입 및 로그인 과정에서 이용자가 직접 입력
* 웹사이트 이용 과정에서 자동 수집
* 문의 양식 제출 시
* Google AdSense 등 제3자 광고 서비스에 의한 쿠키 수집

3. 개인정보 이용 목적
수집한 개인정보는 다음 목적에 한해 사용됩니다.
* 회원 관리 및 본인 식별
* 서비스 제공 및 운영
* 이용 기록 분석 및 서비스 개선
* 고객 문의 응대
* 광고 제공 및 광고 성과 측정

4. 비밀번호 처리 방침
* 비밀번호는 일방향 암호화 방식으로 저장되며, 운영자를 포함한 누구도 원문을 확인할 수 없습니다.
* 이용자의 과실로 인한 비밀번호 유출에 대해 사이트는 책임을 지지 않습니다.

5. 쿠키(Cookie)의 사용
사이트는 사용자 경험 향상 및 광고 제공을 위해 쿠키를 사용할 수 있습니다.
* 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.
* 쿠키 저장을 거부할 경우 일부 서비스 이용에 제한이 있을 수 있습니다.

Google AdSense
* Google은 광고 쿠키를 사용하여 사용자의 이전 방문 기록을 기반으로 맞춤형 광고를 제공할 수 있습니다.
* 사용자는 Google 광고 설정을 통해 맞춤 광고를 거부할 수 있습니다.

6. 개인정보 보유 및 이용 기간
* 회원 탈퇴 시 개인정보는 지체 없이 파기합니다.
* 단, 관련 법령에 따라 보관이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.

7. 개인정보의 제3자 제공
사이트는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
다만, 다음의 경우에는 예외로 합니다.(법령에 따른 요구가 있는 경우/Google 등 광고 서비스 제공에 필요한 최소한의 정보 제공)

8. 개인정보 보호를 위한 조치
사이트는 개인정보 보호를 위해 다음과 같은 조치를 시행합니다.
* 비밀번호 암호화 저장
* 접근 권한 최소화
* 보안 취약점 점검

9. 이용자의 권리
이용자는 언제든지 다음 권리를 행사할 수 있습니다.
* 개인정보 열람, 수정 요청
* 회원 탈퇴 및 개인정보 삭제 요청

10. 개인정보처리방침 변경
본 방침은 관련 법령 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 사이트를 통해 공지합니다.

11. 문의처
* 운영자: [이름 또는 사이트명]
* 이메일: [이메일 주소]
* 시행일자: 2026년 1월 1일`}
              </div>
            </div>

            {/* 목록으로 버튼 */}
            <button
              onClick={() => navigate('/notice')}
              className="w-full py-3 bg-[#6155F5] text-white font-bold rounded-full hover:bg-[#5044d4] transition"
            >
              목록으로
            </button>
          </div>

          {/* 푸터 */}
          <footer className="pt-6 text-center">
            <div className="flex items-center justify-center space-x-4 text-white/80 text-sm">
              <img
                src="/Logo.png"
                alt="STARRY"
                className="h-3 -translate-y-[18px]"
              />
              <div className="h-6 w-px bg-white/40 -translate-y-[18px]"></div>
              <div className="text-left space-y-1">
                <div className="text-[9px] leading-snug">
                  광고 문의: 123456789@gmail.com <br />
                  기타 문의: 987654321@gmail.com <br />
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
          </footer>
        </div>
      </div>

      {/* 네비게이션 바 */}
      <NavBar />
    </div>
  );
}

export default NoticeDetailPage;
