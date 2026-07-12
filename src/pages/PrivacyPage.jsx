import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030025]">
      {/* 배경 이미지 */}
      <div
        className="absolute top-0 left-0 right-0 bottom-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/BackGround.jpg)' }}
      ></div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 광고 배너 영역 */}
        <div className="h-16 bg-[#949494] flex items-center justify-center"></div>

        {/* 상단 네비게이션 */}
        <nav className="px-6 py-5">
          <div className="max-w-[370px] mx-auto flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-white font-bold text-xl">개인정보처리방침</span>
            <div className="w-9" />
          </div>
        </nav>

        {/* 본문 */}
        <div className="flex-1 px-6 pb-8">
          <div className="bg-white/90 rounded-2xl p-6 text-[#333333] text-xs leading-relaxed space-y-5 max-w-[370px] mx-auto">
            <section>
              <p>
                Studio.Vec(이하 "회사")는 STARRY 서비스(이하 "서비스")를 제공함에 있어 이용자의 개인정보를 중요시하며,
                「개인정보보호법」 등 관련 법령을 준수합니다. 회사는 본 개인정보처리방침을 통해 이용자가 제공하는
                개인정보가 어떠한 목적과 방식으로 수집·이용·보관·파기되는지 안내합니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">1. 수집하는 개인정보 항목 및 수집 방법</h2>
              <p>
                ① 회원가입 및 로그인 시<br />
                &nbsp;&nbsp;- 이메일 주소, 비밀번호(암호화 저장)<br />
                &nbsp;&nbsp;- 휴대폰 번호(SMS 본인 인증)<br />
                &nbsp;&nbsp;- 구글, 카카오 소셜 로그인 이용 시 해당 사업자로부터 제공받는 이메일, 프로필 식별 정보<br />
                ② 프로필 설정 및 서비스 이용 시<br />
                &nbsp;&nbsp;- 이름 또는 닉네임, 생년월일<br />
                &nbsp;&nbsp;- 설문(밤하늘 질문) 응답 내용 및 이를 기반으로 생성된 개인 맞춤형 스타리·별자리 콘텐츠<br />
                &nbsp;&nbsp;- 별 보관함 이용 기록(별 전송·수신 및 회원 간 연결 정보)<br />
                &nbsp;&nbsp;- 밤하늘(3D 스카이) 등록 및 표시 정보<br />
                ③ 서비스 이용 과정에서 자동으로 수집되는 항목<br />
                &nbsp;&nbsp;- IP 주소, 쿠키(Cookie), 접속 로그, 방문 일시, 기기 정보(브라우저, OS 등)<br />
                ④ 문의 및 고객 응대 시<br />
                &nbsp;&nbsp;- 이름, 이메일 주소, 문의 내용<br />
                ⑤ 수집 방법: 회원가입·프로필 설정·설문 응답 등 서비스 이용 과정에서 이용자가 직접 입력하거나,
                소셜 로그인 연동 및 서비스 이용 과정에서 자동으로 생성되어 수집됩니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">2. 개인정보의 수집 및 이용 목적</h2>
              <p>
                ① 회원 가입 의사 확인, 본인 인증, 회원제 서비스 제공에 따른 본인 식별<br />
                ② 설문 응답을 기반으로 한 개인 맞춤형 스타리(밤하늘·별자리) 콘텐츠 생성 및 3D 밤하늘 시각화 제공<br />
                ③ 별 보관함(별 전송·보관), 응답 통계, 마이페이지, 공지사항 등 부가 서비스 제공<br />
                ④ 부정 이용 방지, 비인가 사용 방지 등 서비스 운영 및 안정적인 서비스 제공<br />
                ⑤ 문의 사항에 대한 응대 및 공지사항 전달
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">3. 개인정보의 보유 및 이용 기간</h2>
              <p>
                회사는 이용자의 개인정보를 원칙적으로 회원 탈퇴 시 지체 없이 파기합니다. 다만 관련 법령에 따라
                보존할 필요가 있는 경우 아래와 같이 일정 기간 보관합니다.<br />
                &nbsp;&nbsp;- 계약 또는 청약철회 등에 관한 기록: 5년(전자상거래 등에서의 소비자보호에 관한 법률)<br />
                &nbsp;&nbsp;- 소비자의 불만 또는 분쟁처리에 관한 기록: 3년(전자상거래 등에서의 소비자보호에 관한 법률)<br />
                &nbsp;&nbsp;- 접속에 관한 기록(로그 기록): 3개월(통신비밀보호법)
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">4. 개인정보의 제3자 제공</h2>
              <p>
                회사는 이용자의 개인정보를 제1조에서 명시한 목적 범위 내에서만 처리하며, 이용자의 사전 동의 없이
                동 범위를 초과하여 이용하거나 원칙적으로 외부에 제공하지 않습니다. 다만 이용자가 별 보관함 등
                서비스 내 기능을 통해 다른 회원과 콘텐츠·정보를 주고받기로 선택한 경우, 그 범위 내에서
                상대 회원에게 관련 정보(닉네임 등)가 표시될 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">5. 개인정보 처리의 위탁</h2>
              <p>
                회사는 안정적인 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 외부 전문업체에 위탁하여
                운영하고 있습니다.<br />
                &nbsp;&nbsp;- 데이터베이스 및 인증 인프라 운영: Supabase Inc.<br />
                &nbsp;&nbsp;- 소셜 로그인 인증: Google LLC, Kakao Corp.<br />
                &nbsp;&nbsp;- 휴대폰 본인 인증(SMS 발송): SMS 인증 서비스 제공업체<br />
                회사는 위탁계약 체결 시 개인정보보호법 등 관련 법령에 따라 수탁자가 개인정보를 안전하게
                처리하도록 관리·감독합니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">6. 이용자의 권리와 행사 방법</h2>
              <p>
                이용자는 언제든지 마이페이지를 통해 본인의 개인정보를 조회·수정할 수 있으며, 회원 탈퇴를 통해
                개인정보 이용에 대한 동의를 철회할 수 있습니다. 개인정보 열람, 정정, 삭제, 처리정지를 요청하고자
                하는 경우 아래 이메일로 연락 주시면 지체 없이 조치하겠습니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">7. 개인정보의 파기 절차 및 방법</h2>
              <p>
                ① 회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체
                없이 해당 개인정보를 파기합니다.<br />
                ② 전자적 파일 형태의 정보는 복구 및 재생이 불가능한 기술적 방법을 사용하여 삭제하며, 종이 문서에
                기록·저장된 개인정보는 분쇄하거나 소각하여 파기합니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">8. 개인정보의 안전성 확보 조치</h2>
              <p>
                회사는 비밀번호 암호화 저장, 접근 권한 관리, 데이터 접근 기록 보관 등 개인정보가 분실·도난·유출·
                변조 또는 훼손되지 않도록 기술적·관리적 조치를 취하고 있습니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">9. 쿠키의 운영 및 거부</h2>
              <p>
                회사는 이용자에게 맞춤화된 서비스를 제공하기 위해 쿠키를 사용할 수 있습니다. 이용자는 웹 브라우저
                설정을 통해 쿠키 저장을 거부할 수 있으며, 이 경우 서비스 이용에 일부 제약이 있을 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">10. 개인정보 보호책임자</h2>
              <p>
                회사는 개인정보 처리에 관한 업무를 총괄하여 책임지고, 개인정보 처리와 관련한 이용자의 문의 및
                불만 처리를 위해 아래와 같이 담당 연락처를 운영합니다.<br />
                &nbsp;&nbsp;- 이메일: design.studio.vec@gmail.com
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">부칙</h2>
              <p>이 개인정보처리방침은 2026년 7월 12일부터 시행합니다.</p>
            </section>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;
