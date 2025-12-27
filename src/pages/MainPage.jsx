import { useState } from 'react';

function MainPage() {
  const [selectedConstellation, setSelectedConstellation] = useState('ABCD만 EFG대서대');
  const [isConstellationExpanded, setIsConstellationExpanded] = useState(false);

  // 임시 카드 데이터 (11개 + 1개는 추가 버튼)
  const cards = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    day: i + 1
  }));

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FAF5FF]">
      {/* 배경 이미지 - 상단 영역 */}
      <div
        className="absolute top-0 left-0 right-0 h-[1200px] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/BackGround.jpg)' }}
      ></div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 광고 배너 영역 */}
        <div className="h-16 bg-[#949494] mt-8 flex items-center justify-center">
        </div>

        {/* 상단 네비게이션 */}
        <nav className="pl-8 pr-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-white font-bold text-xl">User1 님의 밤하늘</span>
          </div>
          <button className="text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>

        {/* 별자리 표시 영역 */}
        <div className="relative min-h-[430px] flex items-center justify-center py-8">
          {/* 여기에 별자리 시각화가 들어갈 예정 */}
        </div>

        {/* 플로팅 버튼들 */}
        <div className="absolute right-4 top-[25rem] flex flex-col gap-3 z-20">
          {/* 공유 버튼 */}
          <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition">
            <svg className="w-7 h-7 text-[#6155F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          {/* 이미지 캡쳐 버튼 */}
          <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition">
            <svg className="w-6 h-6 text-[#6155F5]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              {/* 왼쪽 상단 모서리 */}
              <path strokeLinecap="round" d="M2 9V4a1 1 0 011-1h4" />
              {/* 오른쪽 상단 모서리 */}
              <path strokeLinecap="round" d="M17 3h4a1 1 0 011 1v5" />
              {/* 왼쪽 하단 모서리 */}
              <path strokeLinecap="round" d="M2 16v5a1 1 0 001 1h4" />
              {/* 오른쪽 하단 모서리 */}
              <path strokeLinecap="round" d="M17 22h4a1 1 0 001-1v-5" />
              {/* 중앙 카메라 렌즈 */}
              <circle cx="12" cy="12" r="3" strokeWidth="2" />
            </svg>
          </button>
          {/* 밤하늘 제작 버튼 */}
          <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition">
            <svg className="w-6 h-6 text-[#6155F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 px-4 pb-8">
          {/* 별자리 선택 드롭다운 - 커스텀 확장형 */}
          <div className="mb-4 bg-white rounded-3xl shadow-lg overflow-hidden">
            {/* 헤더 (클릭 가능) */}
            <button
              onClick={() => setIsConstellationExpanded(!isConstellationExpanded)}
              className="w-full px-5 py-3 flex justify-between items-center text-left shadow-[inset_-4px_-4px_8px_rgba(97,85,245,0.3)]"
            >
              <span className="text-black font-medium">
                {isConstellationExpanded ? 'User1 님은' : 'ABCD한 EFGE자리'}
              </span>
              <svg
                className={`w-6 h-6 text-[#6155F5] transition-transform ${isConstellationExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 확장된 내용 */}
            {isConstellationExpanded && (
              <div className="px-5 pb-5">
                {/* 중앙 원형 이미지 영역 */}
                <div className="flex justify-center mb-4">
                  <div className="w-40 h-40 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">결과 이미지</span>
                  </div>
                </div>

                {/* 별자리 이름 */}
                <h3 className="text-[#6155F5] text-xl font-bold text-center mb-4">
                  ABCD한 EFGE 자리
                </h3>

                {/* 카드 2개 */}
                <div className="grid grid-cols-2 gap-3 mb-4 max-w-[330px] mx-auto">
                  <div className="aspect-[4/5] bg-white rounded-2xl p-4 flex items-start justify-center shadow-[0_4px_12px_rgba(0,89,255,0.3)]">
                    <span className="text-[#6155F5] text-sm text-center">잘 어울리는 별자리</span>
                  </div>
                  <div className="aspect-[4/5] bg-white rounded-2xl p-4 flex items-start justify-center shadow-[0_4px_12px_rgba(0,89,255,0.3)]">
                    <span className="text-[#6155F5] text-sm text-center">조금 어려운 별자리</span>
                  </div>
                </div>

                {/* 전체 통계 보기 버튼 */}
                <button className="w-full py-3 bg-[#6155F5] text-white font-medium rounded-full hover:bg-[#5044d4] transition">
                  전체 답변 통계 보기
                </button>
              </div>
            )}
          </div>

          {/* 하단 영역 - FAF5FF 배경 */}
          <div className="bg-[#FAF5FF] -mx-4 px-4 pb-8 rounded-t-[40px]">
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-5">
              <div className="w-20 h-1 bg-[#6155F5]/50 rounded-full"></div>
            </div>

            {/* 선물받은 별들 섹션 */}
            <div className="mb-6">
            <div className="max-w-[340px] mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">
                  <span className="text-[#6155F5]">User1님의 <span className="font-bold">선물받은 별들</span></span>
                </h2>
                <span className="text-[#9C9C9C] text-sm">11 / 20</span>
              </div>
            </div>

            {/* 카드 그리드 */}
            <div className="grid grid-cols-3 gap-3 max-w-[340px] mx-auto">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="aspect-[4/5] bg-white border-2 border-[#6155F5] rounded-2xl p-2 hover:border-[#6155F5]/70 transition cursor-pointer shadow-[inset_4px_4px_8px_rgba(97,85,245,0.3)]"
                >
                  <div className="text-[#6155F5] text-xs font-medium">
                    no.{card.id}
                  </div>
                </div>
              ))}

              {/* 추가 버튼 카드 */}
              <div className="aspect-[4/5] bg-white rounded-2xl flex flex-col items-center justify-center transition cursor-pointer shadow-[inset_4px_4px_8px_rgba(97,85,245,0.3)]">
                <div className="text-[#6155F5] text-4xl mb-1">+</div>
                <div className="text-[#6155F5] text-xs text-center px-2">
                  링크 공유하고
                </div>
                <div className="text-[#6155F5] text-xs text-center px-2">
                  별 선물받기
                </div>
              </div>
            </div>
          </div>

          {/* 광고 안내 박스 */}
          <div className="mb-6 max-w-[340px] mx-auto">
            <div className="flex flex-col items-center gap-2 text-center bg-white border-2 border-dashed border-[#727272] rounded-xl p-6 shadow-[inset_6px_6px_12px_rgba(114,114,114,0.3)]">
              <svg className="w-8 h-8 text-[#727272]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div className="text-[#727272]">
                <div className="font-sm">광고 보고</div>
                <div className="text-sm">별 보관함 확장하기 (+3)</div>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <footer className="pb-6 pt-4 text-center">
            <div className="flex items-center justify-center space-x-4 text-[#222222] text-sm">
              <img
                src="/Logo(Black).png"
                alt="STARRY"
                className="h-3 -translate-y-[11px]"
              />
              <div className="h-6 w-px bg-[#222222] -translate-y-[11px]"></div>
              <div className="text-left space-y-1">
                <div className="text-[10px] leading-snug">
                  광고 문의: 123456789@gmail.com <br />
                  Copyright ©2025 123456789. All rights reserved.
                </div>
                {/* 개발자/디자이너 정보 */}
                <div className="text-[#222222] text-[10px] flex items-center space-x-1">
                  <span className="font-semibold">개발자</span>
                  <span>김기찬</span>
                  <span>·</span>
                  <span className="font-semibold">디자이너</span>
                  <span>김태희</span>
                </div>
              </div>
            </div>
          </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
