import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../locales/translations';

function WelcomePage() {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const t = translations[language];

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    birthYear: '2000',
    birthMonth: '01',
    birthDay: '01',
  });
  const [error, setError] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null); // 'year' | 'month' | 'day' | null

  // 드래그 휠 피커 (인라인) - SignupPage와 동일
  const WheelPicker = ({ items, selectedValue, onSelect }) => {
    const containerRef = useRef(null);
    const isDragging = useRef(false);
    const isSettling = useRef(false);
    const startY = useRef(0);
    const scrollStart = useRef(0);
    const lastSelectedRef = useRef(selectedValue);
    const ITEM_HEIGHT = 40;
    const VISIBLE_ITEMS = 5;

    const selectedIndex = items.indexOf(selectedValue);

    useEffect(() => {
      if (containerRef.current) {
        isSettling.current = true;
        containerRef.current.scrollTop = selectedIndex * ITEM_HEIGHT;
        requestAnimationFrame(() => {
          isSettling.current = false;
        });
      }
    }, []);

    const snapTo = (index) => {
      if (!containerRef.current) return;
      isSettling.current = true;
      containerRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
      setTimeout(() => {
        isSettling.current = false;
      }, 300);
    };

    const handleScrollEnd = () => {
      if (!containerRef.current || isSettling.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const index = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
      const newValue = items[clampedIndex];

      snapTo(clampedIndex);

      if (newValue !== lastSelectedRef.current) {
        lastSelectedRef.current = newValue;
        onSelect(newValue);
      }
    };

    const scrollTimeout = useRef(null);
    const handleScroll = () => {
      if (isSettling.current) return;
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(handleScrollEnd, 120);
    };

    const handleTouchStart = (e) => {
      isDragging.current = true;
      isSettling.current = false;
      clearTimeout(scrollTimeout.current);
      startY.current = e.touches[0].clientY;
      scrollStart.current = containerRef.current.scrollTop;
    };

    const handleTouchMove = (e) => {
      if (!isDragging.current) return;
      const diff = startY.current - e.touches[0].clientY;
      containerRef.current.scrollTop = scrollStart.current + diff;
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
      handleScrollEnd();
    };

    const handleMouseDown = (e) => {
      isDragging.current = true;
      isSettling.current = false;
      clearTimeout(scrollTimeout.current);
      startY.current = e.clientY;
      scrollStart.current = containerRef.current.scrollTop;
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const diff = startY.current - e.clientY;
      containerRef.current.scrollTop = scrollStart.current + diff;
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      handleScrollEnd();
    };

    useEffect(() => {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, []);

    return (
      <div
        className="bg-[#2D2A4C] rounded-2xl border-2 border-[#6B5CFF] shadow-lg shadow-black/40"
        style={{ width: 80, height: ITEM_HEIGHT * VISIBLE_ITEMS, overflow: 'hidden', position: 'relative' }}
      >
        <div
          className="absolute left-1 right-1 pointer-events-none z-10 bg-[#6B5CFF]/30 rounded-lg"
          style={{ top: ITEM_HEIGHT * 2, height: ITEM_HEIGHT }}
        />
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none z-20"
          style={{ height: ITEM_HEIGHT * 2, background: 'linear-gradient(to bottom, #2D2A4Cee, #2D2A4C00)' }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
          style={{ height: ITEM_HEIGHT * 2, background: 'linear-gradient(to top, #2D2A4Cee, #2D2A4C00)' }}
        />
        <div
          ref={containerRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          className="h-full overflow-y-scroll scrollbar-hide cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <div style={{ height: ITEM_HEIGHT * 2 }} />
          {items.map((item) => (
            <div
              key={item}
              className={`flex items-center justify-center select-none ${
                item === selectedValue ? 'text-white text-lg font-bold' : 'text-white/40 text-base'
              }`}
              style={{ height: ITEM_HEIGHT }}
            >
              {item}
            </div>
          ))}
          <div style={{ height: ITEM_HEIGHT * 2 }} />
        </div>
      </div>
    );
  };

  const years = Array.from({ length: 100 }, (_, i) => String(2025 - i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  // 운세 결과 (daily-fortune Edge Function 응답)
  const [fortune, setFortune] = useState(null);

  const FALLBACK_FORTUNE = {
    message: language === 'ko' ? '오늘은 평온한 하루에요!' : 'A peaceful day awaits!',
    emotionImage: '/emotions/emotion-calm,zen,mindful.png',
    luckyItem: language === 'ko' ? '따뜻한 차 한 잔' : 'a warm cup of tea',
  };

  const fetchFortune = async () => {
    const birthdate = `${formData.birthYear}-${formData.birthMonth}-${formData.birthDay}`;
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `welcome_fortune_${birthdate}_${today}`;

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setFortune(JSON.parse(cached));
      return;
    }

    try {
      const response = await fetch(
        'https://aifioxdvjtxwxzxgdugs.supabase.co/functions/v1/daily-fortune',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ birthdate }),
        }
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setFortune(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err) {
      console.error('운세 로드 실패:', err);
      setFortune(FALLBACK_FORTUNE);
    }
  };

  // 같은 생일 인구 추산: 전세계 연간 출생 ~140M / 365 ≈ 383,000명/일
  // 생일 시드로 약간 변동을 줘서 각자 다른 숫자가 나오도록
  const getSameBirthdayCount = () => {
    const base = Math.floor(140_000_000 / 365);
    const seed =
      parseInt(formData.birthYear || '2000', 10) * 10000 +
      parseInt(formData.birthMonth || '1', 10) * 100 +
      parseInt(formData.birthDay || '1', 10);
    const variation = (seed % 50000) - 25000;
    return base + variation;
  };

  const formatNumber = (n) => n.toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US');

  const handleScrollSelect = (type, value) => {
    setFormData((prev) => ({
      ...prev,
      [`birth${type}`]: value,
    }));
  };

  const handleNextFromStep1 = () => {
    if (!formData.name.trim()) {
      setError(t.welcome.pleaseEnterName);
      return;
    }
    setError('');
    setCurrentStep(2);
  };

  const handleNextFromStep2 = () => {
    setFortune(null);
    setCurrentStep(3);
  };

  // Step 3: 운세 fetch + 최소 2.5초 로딩 후 Step 4로 이동
  useEffect(() => {
    if (currentStep !== 3) return;

    let cancelled = false;
    const startTime = Date.now();
    const MIN_LOADING_MS = 2500;

    fetchFortune().finally(() => {
      if (cancelled) return;
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      setTimeout(() => {
        if (!cancelled) setCurrentStep(4);
      }, remaining);
    });

    return () => {
      cancelled = true;
    };
  }, [currentStep]);

  // step 4 본문 템플릿
  const fortuneBody = fortune
    ? language === 'ko'
      ? `오늘 ${formData.birthYear}년 ${formData.birthMonth}월 ${formData.birthDay}일생은 ${fortune.message}\n행운 아이템 '${fortune.luckyItem}'을(를) 가까이 두면 행운 지수가 올라갈 거예요!`
      : `Born on ${formData.birthYear}-${formData.birthMonth}-${formData.birthDay}: ${fortune.message}\nKeep your lucky item '${fortune.luckyItem}' close to boost your luck today!`
    : '';

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
        <div className="h-16 bg-[#949494] flex items-center justify-center">
        </div>

        {/* 상단 네비게이션 */}
        <nav className="px-6 py-5">
          <div className="max-w-[370px] mx-auto flex justify-between items-center relative">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 text-white/80 hover:text-white transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="1.4" />
                <path strokeLinecap="round" strokeWidth="1.4" d="M4 8h16" />
                <path strokeLinecap="round" strokeWidth="1.4" d="M2 12h20" />
                <path strokeLinecap="round" strokeWidth="1.4" d="M4 16h16" />
                <path strokeLinecap="round" strokeWidth="1.4" d="M12 2a15.3 15.3 0 0 1 0 20a15.3 15.3 0 0 1 0-20z" />
              </svg>
              <span className="text-sm font-light">{language === 'ko' ? 'English' : '한국어'}</span>
            </button>

            <img
              src="/Logo.png"
              alt="STARRY"
              className="h-5 absolute left-1/2 transform -translate-x-1/2"
            />

            <button className="text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>

        {/* Step 1: 이름 입력 */}
        {currentStep === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
            <div className="w-full max-w-[320px]">
              <div className="text-center mb-12">
                <h1 className="text-white text-2xl font-bold">
                  {t.welcome.title}
                </h1>
              </div>

              <div className="w-full max-w-[280px] mx-auto space-y-4">
                {error && (
                  <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-2 rounded-lg text-sm text-center">
                    {error}
                  </div>
                )}

                <input
                  type="text"
                  placeholder={t.welcome.enterName}
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setError('');
                  }}
                  className="w-full px-4 py-3 text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-transparent shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:border-purple-500"
                />

                <button
                  onClick={handleNextFromStep1}
                  className="w-full py-3 text-sm rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
                >
                  {t.common.next}
                </button>

                <p className="text-white/70 text-xs text-center leading-relaxed mt-8">
                  {t.welcome.nameHint}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: 생일 입력 */}
        {currentStep === 2 && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 -translate-y-2">
            <h1 className="text-white text-xl font-bold mb-1">
              {formData.name}{language === 'ko' ? '님의' : "'s"}
            </h1>
            <p className="text-white text-xl mb-8">{t.signup.birthdayQuestion}</p>

            {/* 캐릭터 머리 + 날짜 선택 */}
            <div className="relative w-full max-w-[280px] mb-4">
              <img
                src="/Starry-head.png"
                alt="Starry Head"
                className="w-72 h-auto mx-auto -mb-9 relative z-10"
              />

              <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center">
                  {/* 왼쪽 손 (absolute로 레이아웃 공간 차지 안 함) */}
                  <img
                    src="/Starry-hand.png"
                    alt="Left Hand"
                    className="absolute left-0 top-1/2 w-10 h-10 -translate-x-3 translate-y-2 z-10 pointer-events-none"
                  />

                  {/* 흰색 테두리 외부 박스 */}
                  <div className="rounded-3xl px-3 py-3 border-2 border-white flex items-center gap-2">
                    {/* 년 */}
                    <div className="relative">
                      <div
                        onClick={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')}
                        className="bg-[#3D3A5C] rounded-2xl px-3 py-3 border-2 border-[#6B5CFF] cursor-pointer"
                      >
                        <span className="text-white text-2xl font-bold w-16 block text-center">
                          {formData.birthYear}
                        </span>
                      </div>
                      {openDropdown === 'year' && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                          <WheelPicker
                            items={years}
                            selectedValue={formData.birthYear}
                            onSelect={(val) => handleScrollSelect('Year', val)}
                          />
                        </div>
                      )}
                    </div>

                    {/* 월 */}
                    <div className="relative">
                      <div
                        onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}
                        className="bg-[#3D3A5C] rounded-2xl px-3 py-3 border-2 border-[#6B5CFF] cursor-pointer"
                      >
                        <span className="text-white text-2xl font-bold w-10 block text-center">
                          {formData.birthMonth}
                        </span>
                      </div>
                      {openDropdown === 'month' && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                          <WheelPicker
                            items={months}
                            selectedValue={formData.birthMonth}
                            onSelect={(val) => handleScrollSelect('Month', val)}
                          />
                        </div>
                      )}
                    </div>

                    {/* 일 */}
                    <div className="relative">
                      <div
                        onClick={() => setOpenDropdown(openDropdown === 'day' ? null : 'day')}
                        className="bg-[#3D3A5C] rounded-2xl px-3 py-3 border-2 border-[#6B5CFF] cursor-pointer"
                      >
                        <span className="text-white text-2xl font-bold w-10 block text-center">
                          {formData.birthDay}
                        </span>
                      </div>
                      {openDropdown === 'day' && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                          <WheelPicker
                            items={days}
                            selectedValue={formData.birthDay}
                            onSelect={(val) => handleScrollSelect('Day', val)}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 바깥 클릭 시 닫기 */}
                  {openDropdown && (
                    <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  )}

                  {/* 오른쪽 손 (absolute로 레이아웃 공간 차지 안 함) */}
                  <img
                    src="/Starry-hand.png"
                    alt="Right Hand"
                    className="absolute right-0 top-1/2 w-10 h-10 scale-x-[-1] translate-x-3 translate-y-3 z-10 pointer-events-none"
                  />
                </div>

                {/* 년/월/일 라벨 */}
                <div className="flex justify-center items-center mt-2 -translate-x-1">
                  <span className="text-white/60 text-sm w-24 text-center">{t.signup.year}</span>
                  <span className="text-white/60 text-sm w-24 text-center">{t.signup.month}</span>
                  <span className="text-white/60 text-sm w-16 text-center">{t.signup.day}</span>
                </div>
              </div>
            </div>

            {/* 이전/다음 버튼 */}
            <div className="flex gap-3 mt-20">
              <button
                onClick={() => setCurrentStep(1)}
                className="w-24 py-3 rounded-lg bg-[#9F9F9F] text-white font-medium hover:bg-[#8a8a8a] transition-colors"
              >
                {t.common.prev}
              </button>
              <button
                onClick={handleNextFromStep2}
                className="w-44 py-3 rounded-lg bg-[#9E4EFF] text-white font-medium hover:bg-[#8a3ee6] transition-colors"
              >
                {t.common.next}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 운세 로딩 */}
        {currentStep === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="text-center mb-6">
              <h1 className="text-white text-xl font-bold mb-1">
                {formData.name}{language === 'ko' ? '님의' : "'s"}
              </h1>
              <p className="text-white text-2xl font-bold">
                {t.welcome.fortuneLoading}
              </p>
            </div>

            <div className="relative w-96 h-96 mx-auto">
              <img
                src="/welcome.svg"
                alt="Loading"
                className="absolute inset-0 w-full h-full object-contain"
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 w-32 h-32"
                style={{ top: '55%' }}
              >
                <img
                  src="/welcome-circle.svg"
                  alt=""
                  className="w-full h-full animate-spin"
                  style={{ animationDuration: '3s' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: 운세 결과 1 */}
        {currentStep === 4 && fortune && (
          <div className="flex-1 flex flex-col px-8 pt-2 pb-6">
            <h1 className="text-white text-3xl font-bold leading-tight mb-3">
              {fortune.message}
            </h1>
            <div className="h-px bg-white/40 mb-6" />
            <p className="text-white text-sm leading-relaxed whitespace-pre-line">
              {fortuneBody}
            </p>

            <div className="flex-1 flex items-center justify-center my-4">
              <img
                src={fortune.emotionImage}
                alt="Starry"
                className="w-48 h-auto"
              />
            </div>

            <button
              onClick={() => setCurrentStep(5)}
              className="w-full py-3 rounded-lg bg-[#9E4EFF] text-white font-medium hover:bg-[#8a3ee6] transition-colors"
            >
              {t.welcome.nextLabel}
            </button>
          </div>
        )}

        {/* Step 5: 운세 결과 2 (CTA) */}
        {currentStep === 5 && (
          <div className="flex-1 flex flex-col px-8 pt-4 pb-6">
            <h1 className="text-white text-3xl font-bold leading-tight mb-4">
              {formatNumber(getSameBirthdayCount())}{t.welcome.sameFortuneSuffix}<br />
              {t.welcome.sameFortuneTitle2}
            </h1>
            <div className="h-px bg-white/60 mb-7" />
            <div className="text-white text-[15px] leading-relaxed space-y-6">
              <p>{t.welcome.result2Body1(formData.name)}</p>
              <p>{t.welcome.result2Body2}</p>
              <p>{t.welcome.result2Body3}</p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full py-3 mt-auto rounded-lg bg-[#9E4EFF] text-white font-medium hover:bg-[#8a3ee6] transition-colors"
            >
              {t.welcome.findRealFortune}
            </button>
          </div>
        )}

        {/* 하단 정보 */}
        <div className="pb-8 px-6 text-center">
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
}

export default WelcomePage;
