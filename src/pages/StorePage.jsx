import NavBar from '../components/NavBar';

function StorePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030025]">
      {/* 배경 이미지 */}
      <div
        className="absolute top-0 left-0 right-0 bottom-0 bg-cover bg-center bg-no-repeat opacity-100"
        style={{ backgroundImage: 'url(/BackGround.jpg)' }}
      ></div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex flex-col min-h-screen pb-20">
        {/* 상단 네비게이션 */}
        <nav className="px-6 py-5">
          <div className="max-w-[370px] mx-auto flex items-center gap-1">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-white font-bold text-2xl">별가루 스토어</span>
          </div>
        </nav>

        {/* 준비중 안내 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="text-white text-lg font-bold text-center">상점 기능은 추후 업데이트 예정입니다.</p>
          <p className="text-white/60 text-sm text-center mt-2">조금만 기다려주세요!</p>
        </div>
      </div>

      {/* 네비게이션 바 */}
      <NavBar />
    </div>
  );
}

export default StorePage;
