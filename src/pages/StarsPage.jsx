import { useAuth } from '../contexts/AuthContext';
import NavBar from '../components/NavBar';

function StarsPage() {
  const { nickname } = useAuth();

  // 임시 카드 데이터 (11개 + 1개는 추가 버튼)
  const cards = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
  }));

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
            {nickname && <span className="text-white font-bold text-2xl">{nickname} 님의 별 보관소</span>}
          </div>
        </nav>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 px-6 pt-3 pb-8">
          {/* 별 개수 표시 */}
          <div className="text-center mb-6">
            <span className="text-white text-lg">13 / 20 개의 별을 선물 받았어요!</span>
          </div>

          {/* 카드 그리드 */}
          <div className="grid grid-cols-3 gap-3 max-w-[340px] mx-auto mb-6">
            {cards.map((card) => (
              <div
                key={card.id}
                className="aspect-[4/5] bg-white/5 border-2 border-white rounded-2xl p-2 hover:border-white/70 transition cursor-pointer"
              >
                <div className="text-white text-xs font-medium">
                  no.{card.id}
                </div>
              </div>
            ))}

            {/* 추가 버튼 카드 */}
            <div className="aspect-[4/5] bg-white/5 border-2 border-white rounded-2xl flex flex-col items-center justify-center transition cursor-pointer">
              <div className="text-white text-4xl mb-1">+</div>
              <div className="text-white text-xs text-center px-2">
                링크 공유하고
              </div>
              <div className="text-white text-xs text-center px-2">
                별 선물받기
              </div>
            </div>
          </div>

          {/* 로그인 안내 박스 */}
          <div className="mb-6 max-w-[340px] mx-auto">
            <div className="flex flex-col items-center gap-2 text-center bg-white/5 border-2 border-dashed border-white/50 rounded-xl p-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div className="text-white">
                <div className="text-sm">광고 보고</div>
                <div className="text-sm">별 보관함 확장하기 (+3)</div>
              </div>
            </div>
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

export default StarsPage;
