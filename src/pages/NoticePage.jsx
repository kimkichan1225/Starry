import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { supabase } from '../lib/supabase';

function NoticePage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchNotices();
  }, [currentPage]);

  const fetchNotices = async () => {
    setLoading(true);
    const { data, error, count } = await supabase
      .from('notices')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

    if (!error) {
      setNotices(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    }
    setLoading(false);
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
              <span className="text-white font-bold text-2xl">Starry의 이야기</span>
            </div>
          </div>
        </nav>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 px-6 pt-1 pb-8">
          {/* 공지사항 섹션 */}
          <div className="mb-8 -mx-6 px-6">
            <div className="flex items-center mb-6 -mx-6 px-7">
              <div className="flex items-center gap-1">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h2 className="text-white font-bold text-lg">공지사항</h2>
              </div>
            </div>

            {/* 공지사항 테이블 */}
            <div className="rounded-lg overflow-hidden">
              {/* 테이블 헤더 */}
              <div className="grid grid-cols-[60px_1fr_90px] gap-2 px-4 py-3 text-gray-400 text-xs">
                <div className="text-center">번호</div>
                <div className="text-center">제목</div>
                <div className="text-center">작성일</div>
              </div>
              {/* 구분선 */}
              <div className="flex justify-center mb-2">
                <div className="w-[85%] h-0.5 bg-[#FBFBFB]/50"></div>
              </div>

              {/* 테이블 바디 */}
              <div>
                {loading ? (
                  <div className="text-center text-white py-8">로딩 중...</div>
                ) : notices.length === 0 ? (
                  <div className="text-center text-white py-8">공지사항이 없습니다.</div>
                ) : (
                  notices.map((notice, index) => (
                    <div key={notice.id}>
                      <div
                        onClick={() => navigate(`/notice/${notice.id}`)}
                        className="grid grid-cols-[60px_1fr_90px] gap-2 px-4 py-3 text-white hover:bg-[#252547]/30 transition cursor-pointer"
                      >
                        <div className={`text-center text-white text-xs ${notice.category === '중요' ? 'font-bold' : ''}`}>{notice.category === '중요' ? '중요' : index + 1}</div>
                        <div className="text-center text-xs">{notice.title}</div>
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

            {/* 페이지네이션 */}
            {totalPages > 0 && (
              <div className="flex justify-center items-center gap-4 mt-8 text-white text-sm">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="hover:text-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &lt;&lt;
                </button>
                <span className="font-bold">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="hover:text-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &gt;&gt;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 네비게이션 바 */}
      <NavBar />
    </div>
  );
}

export default NoticePage;
