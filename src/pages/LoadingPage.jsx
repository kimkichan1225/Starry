const LoadingPage = () => {
  // 필요시 자동 페이지 이동 구현
  // const navigate = useNavigate();
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     navigate('/login');
  //   }, 3000);
  //   return () => clearTimeout(timer);
  // }, [navigate]);

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
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {/* STARRY 로고 이미지 */}
          <img
            src="/Logo.png"
            alt="STARRY"
            className="w-64 md:w-96 mb-2 drop-shadow-2xl"
          />

          {/* 서브타이틀 */}
          <p className="text-white text-lg md:text-xl font-normal tracking-wide">
            당신을 닮은, 단 하나의 별자리
          </p>
        </div>

        {/* 하단 정보 */}
        <div className="pb-8 px-6 text-center">
          {/* 로고와 연락처 */}
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
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
