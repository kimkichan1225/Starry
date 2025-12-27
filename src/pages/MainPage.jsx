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

        {/* 플로팅 버튼들 */}
        <div className="fixed right-4 top-24 flex flex-col gap-3 z-20">
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>

        {/* 흰색 컨텐츠 카드 */}
        <div className="flex-1 bg-white rounded-t-[24px] mt-6 px-4 py-6 pb-8">
          {/* 별자리 선택 드롭다운 */}
          <div className="mb-6">
            <select
              value={selectedConstellation}
              onChange={(e) => setSelectedConstellation(e.target.value)}
              className="w-full px-4 py-3 bg-white rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none appearance-none cursor-pointer text-sm"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.5rem'
              }}
            >
              <option>ABCD만 EFG대서대</option>
              <option>다른 별자리 1</option>
              <option>다른 별자리 2</option>
            </select>
          </div>

          {/* 선물받은 별들 섹션 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-medium">
                <span className="text-purple-600">User1님의 선물받은 별들</span>
              </h2>
              <span className="text-gray-500 text-sm">01 / 02</span>
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

          {/* 로그인 안내 박스 */}
          <div className="border-2 border-dashed border-gray-400 rounded-xl p-6 mb-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div className="text-gray-700">
                <div className="font-medium">로그인하시면</div>
                <div className="text-sm">본인의 밤하늘을 확인하실 수 있어요!</div>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <footer className="text-center text-gray-600 text-xs space-y-1">
            <div className="font-bold text-gray-800 text-base mb-2">STAR=SY</div>
            <div className="text-[10px]">문의 이메일 | starsy.official@gmail.com</div>
            <div className="text-[10px]">사이트 문의 | https://www.instagram.com</div>
            <div className="pt-2 text-gray-500 text-[10px]">
              Copyright ⓒ STAR=SY. All rights reserved.
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
