import { useState } from 'react';

function MainPage() {
  const [selectedConstellation, setSelectedConstellation] = useState('ABCD만 EFG대서대');

  // 임시 카드 데이터 (11개 + 1개는 추가 버튼)
  const cards = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    day: i + 1
  }));

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
        <nav className="bg-[#2d3142] px-4 py-3 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-xl">⭐</span>
            <span className="text-white font-medium text-sm">User1 님의 밤하늘</span>
          </div>
          <button className="text-white text-2xl leading-none">
            ≡
          </button>
        </nav>

        {/* 별자리 표시 영역 */}
        <div className="relative min-h-[430px] flex items-center justify-center py-8">
          {/* 여기에 별자리 시각화가 들어갈 예정 */}
        </div>

        {/* 플로팅 버튼들 */}
        <div className="fixed right-4 top-[28rem] flex flex-col gap-3 z-20">
          {/* 이미지 캡쳐 버튼 */}
          <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition border-2 border-purple-400">
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              {/* 왼쪽 상단 모서리 */}
              <path strokeLinecap="round" d="M4 9V6a2 2 0 012-2h3" />
              {/* 오른쪽 상단 모서리 */}
              <path strokeLinecap="round" d="M15 4h3a2 2 0 012 2v3" />
              {/* 왼쪽 하단 모서리 */}
              <path strokeLinecap="round" d="M4 15v3a2 2 0 002 2h3" />
              {/* 오른쪽 하단 모서리 */}
              <path strokeLinecap="round" d="M15 20h3a2 2 0 002-2v-3" />
              {/* 중앙 카메라 렌즈 */}
              <circle cx="12" cy="12" r="3" strokeWidth="2" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
            </svg>
          </button>
          {/* 밤하늘 제작 버튼 */}
          <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 px-4 pb-8">
          {/* 별자리 선택 드롭다운 - Pill 형태 */}
          <div className="mb-4">
            <select
              value={selectedConstellation}
              onChange={(e) => setSelectedConstellation(e.target.value)}
              className="w-full px-5 py-3 bg-white rounded-full shadow-md border-none focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer text-sm font-medium"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234F46E5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1.25rem'
              }}
            >
              <option>ABCD만 EFG대서대</option>
              <option>다른 별자리 1</option>
              <option>다른 별자리 2</option>
            </select>
          </div>

          {/* 선물받은 별들 섹션 - 독립된 카드 */}
          <div className="bg-white rounded-3xl shadow-lg p-5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-medium">
                <span className="text-purple-600">User1님의 선물받은 별들</span>
              </h2>
              <span className="text-gray-500 text-sm">11 / 20</span>
            </div>

            {/* 카드 그리드 */}
            <div className="grid grid-cols-3 gap-3">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="aspect-square bg-white border-2 border-blue-400 rounded-2xl p-2 hover:border-blue-300 transition cursor-pointer"
                >
                  <div className="text-blue-400 text-xs font-medium">
                    DAY {card.day}
                  </div>
                </div>
              ))}

              {/* 추가 버튼 카드 */}
              <div className="aspect-square bg-white border-2 border-blue-400 border-dashed rounded-2xl flex flex-col items-center justify-center hover:border-blue-300 transition cursor-pointer">
                <div className="text-blue-400 text-4xl mb-1">+</div>
                <div className="text-blue-400 text-xs text-center px-2">
                  별을 받아보세요!
                </div>
              </div>
            </div>
          </div>

          {/* 로그인 안내 박스 - 독립된 카드 */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <div className="flex flex-col items-center gap-2 text-center border-2 border-dashed border-gray-300 rounded-xl p-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div className="text-gray-700">
                <div className="font-medium">로그인하시면</div>
                <div className="text-sm">본인의 밤하늘을 확인하실 수 있어요!</div>
              </div>
            </div>
          </div>

          {/* 푸터 - 독립된 카드 */}
          <footer className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg pb-6 pt-4 px-6 text-center">
            <div className="flex items-center justify-center space-x-4 text-gray-600 text-sm">
              <img
                src="/Logo(Black).png"
                alt="STARRY"
                className="h-3 -translate-y-[11px]"
              />
              <div className="h-6 w-px bg-gray-400 -translate-y-[11px]"></div>
              <div className="text-left space-y-1">
                <div className="text-[9px] leading-snug">
                  광고 문의: 123456789@gmail.com <br />
                  Copyright ©2025 123456789. All rights reserved.
                </div>
                {/* 개발자/디자이너 정보 */}
                <div className="text-gray-500 text-[9px] flex items-center space-x-1">
                  <span className="font-semibold text-gray-700">개발자</span>
                  <span>김기찬</span>
                  <span className="text-gray-400">·</span>
                  <span className="font-semibold text-gray-700">디자이너</span>
                  <span>김태희</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
