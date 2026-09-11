import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { translations } from '../locales/translations';

// 개인정보 보호책임자 (사업자 정보와 동일하게 표시)
const PRIVACY_OFFICER_NAME = translations.ko.footer.ceoName;
const PRIVACY_EMAIL = 'design.studio.vec@gmail.com';

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
                「개인정보 보호법」 등 관련 법령을 준수합니다. 회사는 본 개인정보처리방침을 통해 이용자의 개인정보가
                어떠한 목적과 방식으로 수집·이용·보관·파기되는지 안내합니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">1. 수집하는 개인정보 항목 및 수집 방법</h2>
              <p>
                ① 회원가입 및 로그인 시<br />
                &nbsp;&nbsp;- 이메일 주소, 비밀번호(암호화 저장)<br />
                &nbsp;&nbsp;- 휴대폰 번호(SMS 본인 인증)<br />
                &nbsp;&nbsp;- 구글, 카카오 소셜 로그인 이용 시 해당 사업자로부터 제공받는 이메일, 계정 식별 정보<br />
                ② 프로필 설정 및 서비스 이용 시<br />
                &nbsp;&nbsp;- 이름 또는 닉네임, 생년월일, 이용약관·개인정보 수집 동의 일시<br />
                &nbsp;&nbsp;- 받은 별과 이를 기반으로 생성된 스타리·별자리 콘텐츠(별 배치, 연결, 별자리 이름)<br />
                &nbsp;&nbsp;- 3D 밤하늘 등록 정보, 비공개 밤하늘 참여 정보<br />
                &nbsp;&nbsp;- 오늘의 운세 결과<br />
                ③ 비회원이 친구의 설문 링크로 별을 보내는 경우<br />
                &nbsp;&nbsp;- 설문 참여자가 입력한 이름, 설문 응답<br />
                &nbsp;&nbsp;- 중복 전송 방지를 위한 기기 식별값(암호화된 형태로 저장)<br />
                ④ 유료 서비스 이용 시<br />
                &nbsp;&nbsp;- 주문번호, 상품명, 결제 금액, 결제 일시, 결제 상태, 별가루 충전·사용 내역<br />
                &nbsp;&nbsp;- 카드번호 등 결제수단 정보는 결제대행사가 처리하며 회사는 저장하지 않습니다.<br />
                ⑤ 서비스 이용 과정에서 자동으로 수집되는 항목<br />
                &nbsp;&nbsp;- IP 주소, 쿠키 및 브라우저 저장소 정보, 접속 로그, 방문 일시, 기기 정보(브라우저, OS 등),
                광고 식별 정보<br />
                ⑥ 문의 및 고객 응대 시<br />
                &nbsp;&nbsp;- 이름, 이메일 주소, 문의 내용<br />
                ⑦ 수집 방법: 회원가입·프로필 설정·설문 응답 등 서비스 이용 과정에서 이용자가 직접 입력하거나,
                소셜 로그인 연동 및 서비스 이용 과정에서 자동으로 생성되어 수집됩니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">2. 개인정보의 수집 및 이용 목적</h2>
              <p>
                ① 회원 가입 의사 확인, 본인 인증 및 연령(만 14세 이상) 확인, 회원제 서비스 제공에 따른 본인 식별<br />
                ② 설문 응답을 기반으로 한 개인 맞춤형 스타리(밤하늘·별자리) 콘텐츠 생성, 3D 밤하늘 및 비공개 밤하늘 제공<br />
                ③ 생년월일을 이용한 오늘의 운세 제공, 별자리 이미지를 이용한 AI 별자리 이름 추천<br />
                ④ 별가루 충전·상점 이용 등 유료 서비스 제공, 결제 확인 및 환불 처리<br />
                ⑤ 중복·부정 이용 방지, 비인가 사용 방지 등 안정적인 서비스 운영<br />
                ⑥ 서비스 내 광고 게재<br />
                ⑦ 문의 사항에 대한 응대 및 공지사항 전달
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">3. 개인정보의 보유 및 이용 기간</h2>
              <p>
                회사는 이용자의 개인정보를 원칙적으로 회원 탈퇴 시 지체 없이 파기합니다. 다만 아래의 경우에는 명시한
                기간 동안 보관합니다.<br />
                ① 서비스 운영에 따른 보관<br />
                &nbsp;&nbsp;- 비회원 설문 참여자의 이름·설문 응답: 별을 받은 회원의 콘텐츠로 보관되며, 해당 회원이 별을
                삭제하거나 탈퇴할 때 파기<br />
                &nbsp;&nbsp;- 중복 전송 방지용 기기 식별값: 전송 제한 목적으로만 이용하며 목적 달성 후 파기<br />
                &nbsp;&nbsp;- 휴대폰 인증 기록: 인증번호 만료일로부터 30일 경과 후 파기<br />
                ② 관련 법령에 따른 보관<br />
                &nbsp;&nbsp;- 계약 또는 청약철회 등에 관한 기록: 5년(전자상거래 등에서의 소비자보호에 관한 법률)<br />
                &nbsp;&nbsp;- 대금결제 및 재화 등의 공급에 관한 기록: 5년(전자상거래 등에서의 소비자보호에 관한 법률)<br />
                &nbsp;&nbsp;- 소비자의 불만 또는 분쟁처리에 관한 기록: 3년(전자상거래 등에서의 소비자보호에 관한 법률)<br />
                &nbsp;&nbsp;- 접속에 관한 기록(로그 기록): 3개월(통신비밀보호법)
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">4. 개인정보의 제3자 제공 및 공개 범위</h2>
              <p>
                회사는 이용자의 개인정보를 제2조에서 명시한 목적 범위 내에서만 처리하며, 이용자의 사전 동의 없이
                외부에 제공하지 않습니다. 다만 서비스 특성상 이용자가 기능을 이용하는 범위에서 아래 정보가 다른
                이용자에게 표시됩니다.<br />
                &nbsp;&nbsp;- 설문 링크를 공유하면, 링크를 받은 사람에게 회원의 닉네임과 밤하늘의 별 모양·배치가 표시됩니다.<br />
                &nbsp;&nbsp;- 비회원 설문 참여자가 입력한 이름과 설문 응답은 별을 받은 회원에게 표시됩니다.<br />
                &nbsp;&nbsp;- 3D 밤하늘에 등록된 별자리와 닉네임은 서비스를 이용하는 회원에게 표시됩니다.<br />
                &nbsp;&nbsp;- 비공개 밤하늘에 참여하면 같은 밤하늘 멤버에게 닉네임과 별자리가 표시됩니다.<br />
                또한 법령에 특별한 규정이 있거나 수사기관이 법령에 따른 절차에 따라 요청하는 경우에는 예외로 합니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">5. 개인정보 처리의 위탁</h2>
              <p>
                회사는 안정적인 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있습니다.<br />
                &nbsp;&nbsp;- Supabase Inc.: 데이터베이스·회원 인증·서버 기능 운영<br />
                &nbsp;&nbsp;- Vercel Inc.: 웹사이트 호스팅<br />
                &nbsp;&nbsp;- 솔라피(SOLAPI): 휴대폰 본인 인증번호(SMS) 발송<br />
                &nbsp;&nbsp;- OpenAI: 오늘의 운세 및 AI 별자리 이름 추천 생성<br />
                &nbsp;&nbsp;- 토스페이먼츠(주): 유료 서비스 결제 처리<br />
                &nbsp;&nbsp;- Google LLC, Kakao Corp.: 소셜 로그인 인증<br />
                회사는 위탁계약 체결 시 개인정보 보호법 등 관련 법령에 따라 수탁자가 개인정보를 안전하게
                처리하도록 관리·감독합니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">6. 개인정보의 국외 이전</h2>
              <p>
                회사는 서비스 제공을 위해 아래와 같이 개인정보를 국외로 이전하여 처리합니다. 이전은 서비스 이용 시점에
                암호화된 네트워크(HTTPS)를 통해 이루어집니다.<br />
                ① Supabase Inc.<br />
                &nbsp;&nbsp;- 이전 국가: 호주(데이터 저장 지역: 시드니)<br />
                &nbsp;&nbsp;- 이전 항목: 제1조의 회원 정보, 서비스 이용 정보, 비회원 설문 참여 정보, 결제 정보<br />
                &nbsp;&nbsp;- 이용 목적: 데이터베이스·회원 인증·서버 기능 운영<br />
                &nbsp;&nbsp;- 보유 기간: 회원 탈퇴 또는 위탁계약 종료 시까지<br />
                &nbsp;&nbsp;- 연락처: https://supabase.com/privacy<br />
                ② Vercel Inc.<br />
                &nbsp;&nbsp;- 이전 국가: 미국<br />
                &nbsp;&nbsp;- 이전 항목: 접속 로그(IP 주소, 브라우저 정보, 접속 일시)<br />
                &nbsp;&nbsp;- 이용 목적: 웹사이트 호스팅 및 보안<br />
                &nbsp;&nbsp;- 보유 기간: 위탁계약 종료 시까지(수탁자의 로그 보관 정책에 따름)<br />
                &nbsp;&nbsp;- 연락처: https://vercel.com/legal/privacy-policy<br />
                ③ OpenAI<br />
                &nbsp;&nbsp;- 이전 국가: 미국<br />
                &nbsp;&nbsp;- 이전 항목: 생년월일(오늘의 운세), 별자리 이미지(AI 별자리 이름 추천)<br />
                &nbsp;&nbsp;- 이용 목적: 운세 및 별자리 이름 추천 콘텐츠 생성<br />
                &nbsp;&nbsp;- 보유 기간: 생성 처리 후 수탁자의 API 데이터 보관 정책에 따라 삭제<br />
                &nbsp;&nbsp;- 연락처: https://openai.com/policies/privacy-policy<br />
                ④ Google LLC (Google AdSense)<br />
                &nbsp;&nbsp;- 이전 국가: 미국<br />
                &nbsp;&nbsp;- 이전 항목: 쿠키, 광고 식별자, 접속 정보<br />
                &nbsp;&nbsp;- 이용 목적: 광고 게재<br />
                &nbsp;&nbsp;- 보유 기간: 수탁자의 개인정보 보관 정책에 따름<br />
                &nbsp;&nbsp;- 연락처: https://policies.google.com/privacy<br />
                ⑤ 거부 방법 및 불이익: 이용자는 해당 기능의 이용을 중단하거나 회원 탈퇴를 통해 국외 이전을 거부할 수
                있습니다. 다만 ①·②는 서비스 제공에 필수적이므로 거부 시 서비스 이용이 어려우며, ③은 오늘의 운세·AI
                별자리 이름 추천 기능을 이용하지 않으면 이전되지 않고, ④는 제11조의 방법으로 광고 쿠키를 거부할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">7. 이용자의 권리와 행사 방법</h2>
              <p>
                ① 이용자는 언제든지 마이페이지를 통해 본인의 개인정보를 조회·수정할 수 있습니다.<br />
                ② 이용자는 마이페이지의 [회원 탈퇴]를 통해 개인정보 이용 동의를 철회할 수 있으며, 탈퇴 시 계정과
                관련 데이터는 즉시 삭제됩니다(제3조에 따라 법령상 보관이 필요한 정보 제외).<br />
                ③ 개인정보 열람, 정정, 삭제, 처리정지를 요청하고자 하는 경우 아래 이메일로 연락 주시면 지체 없이
                조치하겠습니다. 법정대리인이나 위임을 받은 자를 통해서도 요청할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">8. 만 14세 미만 아동의 개인정보</h2>
              <p>
                회사는 만 14세 미만 아동의 회원가입을 받지 않으며, 회원가입 시 생년월일을 확인하여 만 14세 미만의
                가입을 제한합니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">9. 개인정보의 파기 절차 및 방법</h2>
              <p>
                ① 회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체
                없이 해당 개인정보를 파기합니다.<br />
                ② 전자적 파일 형태의 정보는 복구 및 재생이 불가능한 기술적 방법을 사용하여 삭제하며, 종이 문서에
                기록·저장된 개인정보는 분쇄하거나 소각하여 파기합니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">10. 개인정보의 안전성 확보 조치</h2>
              <p>
                회사는 비밀번호 암호화 저장, 인증번호 암호화(해시) 저장, 전송 구간 암호화(HTTPS), 데이터 접근 권한
                통제, 접근 기록 관리 등 개인정보가 분실·도난·유출·변조 또는 훼손되지 않도록 기술적·관리적 조치를
                취하고 있습니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">11. 쿠키 및 행태정보의 수집·이용·거부</h2>
              <p>
                ① 회사는 로그인 상태 유지, 언어 설정, 중복 전송 방지 등을 위해 쿠키 및 브라우저 저장소를 사용합니다.<br />
                ② 서비스에는 Google AdSense 광고가 게재되며, Google LLC가 쿠키를 이용해 방문 기록 등 행태정보를
                수집하여 맞춤형 광고를 제공할 수 있습니다. 이용자는 Google 광고 설정(https://adssettings.google.com)에서
                맞춤 광고를 해제할 수 있습니다.<br />
                ③ 이용자는 웹 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으며, 이 경우 로그인 등 서비스 이용에
                일부 제약이 있을 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">12. 개인정보 보호책임자</h2>
              <p>
                회사는 개인정보 처리에 관한 업무를 총괄하여 책임지고, 개인정보 처리와 관련한 이용자의 문의 및
                불만 처리를 위해 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.<br />
                &nbsp;&nbsp;- 성명: {PRIVACY_OFFICER_NAME}<br />
                &nbsp;&nbsp;- 직책: 대표<br />
                &nbsp;&nbsp;- 이메일: {PRIVACY_EMAIL}
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">13. 권익침해 구제 방법</h2>
              <p>
                개인정보 침해에 대한 신고나 상담이 필요한 경우 아래 기관에 문의할 수 있습니다.<br />
                &nbsp;&nbsp;- 개인정보분쟁조정위원회: (국번없이) 1833-6972 (www.kopico.go.kr)<br />
                &nbsp;&nbsp;- 개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)<br />
                &nbsp;&nbsp;- 대검찰청: (국번없이) 1301 (www.spo.go.kr)<br />
                &nbsp;&nbsp;- 경찰청: (국번없이) 182 (ecrm.police.go.kr)
              </p>
            </section>

            <section>
              <h2 className="font-bold text-sm mb-1">부칙</h2>
              <p>
                이 개인정보처리방침은 2026년 9월 11일부터 시행합니다.<br />
                이전 개인정보처리방침: 2026년 7월 12일 시행
              </p>
            </section>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;
