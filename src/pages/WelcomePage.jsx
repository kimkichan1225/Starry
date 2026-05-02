import { useState } from 'react';
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
    birthYear: '',
    birthMonth: '',
    birthDay: '',
  });
  const [error, setError] = useState('');

  const handleNextFromStep1 = () => {
    if (!formData.name.trim()) {
      setError(t.welcome.pleaseEnterName);
      return;
    }
    setError('');
    setCurrentStep(2);
  };

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
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
            <div className="w-full max-w-[320px]">
              {/* 타이틀 */}
              <div className="text-center mb-12">
                <h1 className="text-white text-2xl font-bold">
                  {t.welcome.title}
                </h1>
              </div>

              {/* 입력 폼 */}
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
      </div>
    </div>
  );
}

export default WelcomePage;
