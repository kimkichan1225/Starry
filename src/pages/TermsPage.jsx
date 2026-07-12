import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

function TermsPage() {
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
            <span className="text-white font-bold text-xl">서비스 약관</span>
            <div className="w-9" />
          </div>
        </nav>

        {/* 본문 */}
        <div className="flex-1 px-6 pb-8">
          <div className="bg-white/90 rounded-2xl p-6 text-[#333333] text-xs leading-relaxed space-y-5 max-w-[370px] mx-auto">
            <section>
              <h2 className="font-bold text-sm mb-1">제1조 (목적)</h2>
              <p>
                이 약관은 Studio.Vec(이하 "회사")가 제공하는 STARRY 서비스(이하 "서비스")의 이용과 관련하여
                회사와 회원 간의 권리, 의무 및 책임사항, 이용 조건 및 절차 등 기본적인 사항을 정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">제2조 (정의)</h2>
              <p>
                ① "서비스"란 회원이 응답한 설문을 바탕으로 회원 개인에게 맞춰진 밤하늘/별자리 콘텐츠를 생성하고,
                3D 밤하늘 시각화, 별 보관함, 응답 통계, 마이페이지, 공지사항 등을 제공하는 STARRY의 모든 기능을 의미합니다.<br />
                ② "회원"이란 이 약관에 동의하고 회사와 이용계약을 체결하여 서비스를 이용하는 자를 말합니다.<br />
                ③ "스타리"란 회원이 설문에 응답한 내용을 바탕으로 생성되는 회원 개인의 맞춤형 밤하늘·별자리 콘텐츠를 말합니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">제3조 (약관의 효력 및 변경)</h2>
              <p>
                ① 이 약관은 서비스를 이용하고자 하는 모든 회원에게 그 효력이 발생합니다.<br />
                ② 회사는 관련 법령을 위반하지 않는 범위에서 이 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정사유를
                명시하여 서비스 내 공지사항을 통해 사전 공지합니다.<br />
                ③ 회원이 개정 약관의 적용에 동의하지 않는 경우 이용계약을 해지(회원 탈퇴)할 수 있으며, 공지 후에도
                서비스를 계속 이용하는 경우 개정 약관에 동의한 것으로 봅니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">제4조 (회원가입)</h2>
              <p>
                ① 회원가입은 이용자가 이메일과 비밀번호를 직접 입력하거나 구글, 카카오 등 소셜 계정으로 회사가 정한
                가입 절차에 따라 신청하고, 회사가 이를 승낙함으로써 체결됩니다.<br />
                ② 회사는 서비스 부정 이용 방지 등을 위해 휴대폰 번호 본인 인증(SMS 인증)을 요구할 수 있습니다.<br />
                ③ 회원가입 후 설문(밤하늘 응답)에 참여하고 프로필을 설정함으로써 회원 개인의 맞춤형 스타리 콘텐츠가
                생성됩니다.<br />
                ④ 만 14세 미만인 자는 회원가입을 신청할 수 없습니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">제5조 (회원 탈퇴 및 자격 상실)</h2>
              <p>
                ① 회원은 마이페이지를 통해 언제든지 탈퇴를 요청할 수 있으며, 회사는 관련 법령이 정하는 바에 따라
                이를 즉시 처리합니다.<br />
                ② 회원이 타인의 정보를 도용하거나, 서비스 운영을 고의로 방해하는 등 이 약관을 위반한 경우 회사는
                사전 통지 후 이용계약을 해지하거나 서비스 이용을 제한할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">제6조 (서비스의 제공 및 변경)</h2>
              <p>
                ① 회사는 다음과 같은 서비스를 제공합니다.<br />
                &nbsp;&nbsp;1. 설문 기반 맞춤형 스타리(밤하늘·별자리) 콘텐츠 생성 및 3D 밤하늘 시각화<br />
                &nbsp;&nbsp;2. 별 보관함을 통한 별의 전송, 보관 및 실시간 반영<br />
                &nbsp;&nbsp;3. 응답 통계 조회, 마이페이지, 공지사항 등 부가 기능<br />
                &nbsp;&nbsp;4. 그 밖에 회사가 추가로 개발하거나 제휴를 통해 제공하는 서비스<br />
                ② 회사는 서비스의 내용, 운영상·기술상 필요에 따라 제공하는 서비스의 전부 또는 일부를 변경할 수 있으며,
                변경 사항은 공지사항을 통해 안내합니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">제7조 (서비스의 중단)</h2>
              <p>
                회사는 시스템 점검, 교체, 고장, 통신 두절 또는 천재지변 등 불가항력적인 사유가 발생한 경우 서비스 제공을
                일시적으로 중단할 수 있으며, 이 경우 사전 또는 사후에 공지사항을 통해 안내합니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">제8조 (회원의 의무)</h2>
              <p>
                ① 회원은 회원가입 시 및 서비스 이용 중 사실에 근거한 정보를 제공해야 하며, 계정 정보를 최신 상태로
                유지해야 합니다.<br />
                ② 회원은 본인의 계정 정보(비밀번호, 인증 정보 등)를 제3자에게 양도, 대여하거나 공유해서는 안 되며,
                이로 인해 발생하는 불이익에 대한 책임은 회원 본인에게 있습니다.<br />
                ③ 회원은 서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 복제, 유통, 조장하거나 영리 목적으로
                이용할 수 없습니다.<br />
                ④ 회원은 관련 법령, 이 약관, 이용안내 및 서비스와 관련하여 공지한 주의사항을 준수해야 합니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">제9조 (저작권의 귀속 및 이용 제한)</h2>
              <p>
                ① 서비스 내에서 회사가 제작한 콘텐츠(스타리 콘텐츠 생성 로직, 밤하늘 시각화 등)에 대한 저작권 및
                지적재산권은 회사에 귀속됩니다.<br />
                ② 회원이 설문 응답 등을 통해 직접 생성한 개인화된 콘텐츠에 대한 이용 권한은 해당 회원에게 있으며,
                회사는 서비스 제공 목적 범위 내에서 이를 이용할 수 있습니다.<br />
                ③ 회원은 서비스를 이용함으로써 얻은 정보를 회사의 사전 동의 없이 복제, 전송, 출판, 배포, 방송
                등의 방법으로 이용하거나 제3자에게 이용하게 해서는 안 됩니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">제10조 (개인정보보호)</h2>
              <p>
                회사는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력하며, 개인정보의 수집, 이용,
                보관, 파기 등에 관한 자세한 사항은 별도의 개인정보처리방침에서 정합니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">제11조 (면책조항)</h2>
              <p>
                ① 회사는 천재지변, 불가항력적 사유로 서비스를 제공할 수 없는 경우 서비스 제공에 대한 책임이
                면제됩니다.<br />
                ② 회사는 회원의 귀책사유로 인한 서비스 이용 장애, 회원이 서비스를 통해 게재한 정보의 신뢰도·정확성
                등에 대해서는 책임을 지지 않습니다.<br />
                ③ 회사는 회원 간 또는 회원과 제3자 상호간에 서비스를 매개로 발생한 분쟁에 대해 개입할 의무가 없으며,
                이로 인한 손해를 배상할 책임도 없습니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">제12조 (준거법 및 관할법원)</h2>
              <p>
                이 약관과 관련하여 회사와 회원 간에 분쟁이 발생한 경우 대한민국 법을 준거법으로 하며, 분쟁에 관한
                소송은 민사소송법상의 관할 법원에 제기합니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">부칙</h2>
              <p>이 약관은 2026년 7월 12일부터 시행합니다.</p>
            </section>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
