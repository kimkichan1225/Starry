import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../locales/translations';

function StarryPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const { data } = await supabase
      .from('notices')
      .select('id, title, category, created_at')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(3);

    setNotices(data || []);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = String(date.getFullYear()).slice(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

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
        <nav className="px-6 py-5">
          <div className="max-w-[370px] mx-auto flex justify-between items-center">
            <div className="flex items-center gap-1">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white font-bold text-2xl">{t.starry.title}</span>
            </div>
          </div>
        </nav>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 px-6 pt-3 pb-8">
          <div className="max-w-[340px] mx-auto">
            {/* 소개 텍스트 섹션 */}
            <div className="mb-8 text-white">
              <h2 className="text-sm font-bold mb-3">{t.starry.section1Title}</h2>
              <p className="text-sm leading-relaxed mb-6">
                {t.starry.section1Text}
              </p>

              <h2 className="text-sm font-bold mb-3">{t.starry.section2Title}</h2>
              <p className="text-sm leading-relaxed">
                {t.starry.section2Text}
              </p>
            </div>

            {/* 명함 섹션 */}
            <div className="my-12">
              <div className="rounded-3xl mb-4 shadow-lg transform rotate-6 w-72 h-40 -translate-x-10 overflow-hidden">
                <img src="/BC_Kichan-1.png" alt="제작자 명함" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-3xl shadow-lg transform -rotate-6 w-72 h-40 ml-auto translate-x-10 overflow-hidden">
                <img src="/BC_Taehui.png" alt="디자이너 명함" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* 서비스 개발 히스토리 버튼 */}
            <button className="w-full py-4 bg-[#6155F5] text-white font-bold rounded-full mb-8 hover:bg-[#5044d4] transition">
              {t.starry.devHistory}
            </button>

            {/* 공지사항 섹션 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <h2 className="text-white font-bold text-lg">{t.starry.notice}</h2>
                </div>
                <button
                  onClick={() => navigate('/notice')}
                  className="text-gray-400 text-xs hover:text-white transition"
                >
                  {t.starry.viewAll}
                </button>
              </div>

              {/* 공지사항 테이블 */}
              <div className="rounded-lg overflow-hidden">
                {/* 테이블 헤더 */}
                <div className="grid grid-cols-[50px_1fr_70px] gap-2 px-4 py-2 text-gray-400 text-xs">
                  <div className="text-center">{t.starry.tableNo}</div>
                  <div className="text-center">{t.starry.tableTitle}</div>
                  <div className="text-center">{t.starry.tableDate}</div>
                </div>
                {/* 구분선 */}
                <div className="flex justify-center mb-2">
                  <div className="w-[85%] h-0.5 bg-[#FBFBFB]/50"></div>
                </div>

                {/* 테이블 바디 */}
                <div>
                  {notices.length === 0 ? (
                    <div className="text-center text-white/50 py-4 text-xs">{t.starry.noNotice}</div>
                  ) : (
                    notices.map((notice, index) => (
                      <div key={notice.id}>
                        <div
                          onClick={() => navigate(`/notice/${notice.id}`)}
                          className="grid grid-cols-[50px_1fr_70px] gap-2 px-4 py-2 text-white hover:bg-[#252547] transition cursor-pointer"
                        >
                          <div className={`text-center text-white text-xs ${notice.category === '중요' ? 'font-bold' : ''}`}>{notice.category === '중요' ? t.starry.important : index + 1}</div>
                          <div className="truncate text-center text-xs">{notice.title}</div>
                          <div className="text-gray-400 text-xs text-center">{formatDate(notice.created_at)}</div>
                        </div>
                        {index === 0 && (
                          <div className="flex justify-center">
                            <div className="w-[85%] h-px bg-[#FBFBFB]/50"></div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
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
                    {t.footer.adInquiry}: 123456789@gmail.com <br />
                    {t.footer.otherInquiry}: 987654321@gmail.com <br />
                    {t.footer.copyright}
                  </div>
                  {/* 개발자/디자이너 정보 */}
                  <div className="text-white/70 text-[9px] flex items-center space-x-1">
                    <span className="font-semibold text-white">{t.footer.developer}</span>
                    <span>김기찬</span>
                    <span className="text-white/40">·</span>
                    <span className="font-semibold text-white">{t.footer.designer}</span>
                    <span>김태희</span>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>

      {/* 네비게이션 바 */}
      <NavBar />
    </div>
  );
}

export default StarryPage;
