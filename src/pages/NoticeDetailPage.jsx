import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { supabase } from '../lib/supabase';

function NoticeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [notice, setNotice] = useState(null);
  const [prevNotice, setPrevNotice] = useState(null);
  const [nextNotice, setNextNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchNoticeDetail();
    }
  }, [id]);

  const fetchNoticeDetail = async () => {
    setLoading(true);

    // 현재 공지사항 가져오기
    const { data: current, error } = await supabase
      .from('notices')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !current) {
      setLoading(false);
      return;
    }

    setNotice(current);

    const currentOrder = current.sort_order ?? 999;

    // 이전 공지사항 (sort_order가 현재보다 작은 것 중 가장 큰 것 = 목록에서 위에 있는 것)
    const { data: prev } = await supabase
      .from('notices')
      .select('id, title, created_at')
      .lt('sort_order', currentOrder)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    setPrevNotice(prev || null);

    // 다음 공지사항 (sort_order가 현재보다 큰 것 중 가장 작은 것 = 목록에서 아래에 있는 것)
    const { data: next } = await supabase
      .from('notices')
      .select('id, title, created_at')
      .gt('sort_order', currentOrder)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    setNextNotice(next || null);
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
          <div className="mb-8 -mx-5 px-6">
            <div className="flex items-center mb-6 -mx-6 px-7">
              <div className="flex items-center gap-1">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h2 className="text-white font-bold text-lg">공지사항</h2>
              </div>
            </div>

            {/* 공지사항 상세 카드 */}
            {loading ? (
              <div className="text-center text-white py-8">로딩 중...</div>
            ) : !notice ? (
              <div className="text-center text-white py-8">공지사항을 찾을 수 없습니다.</div>
            ) : (
              <div className="bg-white/90 p-6 mb-6">
                {/* 헤더 */}
                <div className="grid grid-cols-[40px_1fr_70px] gap-2 mb-2 text-xs">
                  <div className="text-center font-bold text-black">{notice.category || '-'}</div>
                  <div className="text-center font-bold text-black">{notice.title}</div>
                  <div className="text-center text-black">{formatDate(notice.created_at)}</div>
                </div>

                {/* 구분선 */}
                <div className="flex justify-center mb-4">
                  <div className="w-full h-px bg-black"></div>
                </div>

                {/* 내용 */}
                <div className="text-[#727272] text-xs leading-relaxed whitespace-pre-line">
                  {notice.content}
                </div>
              </div>
            )}

            {/* 구분선 */}
            <div className="flex justify-center my-2">
              <div className="w-full h-px bg-white/50"></div>
            </div>

            {/* 이전글/다음글 네비게이션 */}
            <div className="text-xs mb-2">
              {prevNotice ? (
                <div
                  onClick={() => navigate(`/notice/${prevNotice.id}`)}
                  className="grid grid-cols-[40px_1fr_70px] gap-2 py-2 text-white hover:bg-[#252547]/30 transition cursor-pointer"
                >
                  <div className="text-center">이전</div>
                  <div className="text-center">{prevNotice.title}</div>
                  <div className="text-center">{formatDate(prevNotice.created_at)}</div>
                </div>
              ) : (
                <div className="grid grid-cols-[40px_1fr_70px] gap-2 py-2 text-white/50">
                  <div className="text-center">이전</div>
                  <div className="text-center">이전 글이 없습니다</div>
                  <div className="text-center">-</div>
                </div>
              )}
              {nextNotice ? (
                <div
                  onClick={() => navigate(`/notice/${nextNotice.id}`)}
                  className="grid grid-cols-[40px_1fr_70px] gap-2 py-2 text-white hover:bg-[#252547]/30 transition cursor-pointer"
                >
                  <div className="text-center">다음</div>
                  <div className="text-center">{nextNotice.title}</div>
                  <div className="text-center">{formatDate(nextNotice.created_at)}</div>
                </div>
              ) : (
                <div className="grid grid-cols-[40px_1fr_70px] gap-2 py-2 text-white/50">
                  <div className="text-center">다음</div>
                  <div className="text-center">다음 글이 없습니다</div>
                  <div className="text-center">-</div>
                </div>
              )}
            </div>

            {/* 구분선 */}
            <div className="flex justify-center mb-4">
              <div className="w-full h-px bg-white/50"></div>
            </div>

            {/* 목록보기 버튼 */}
            <button
              onClick={() => navigate('/notice')}
              className="w-full py-3 text-white font-bold text-sm transition"
            >
              목록보기
            </button>
          </div>

          {/* 푸터 */}
          <footer className="text-center">
            <div className="flex items-center justify-center space-x-4 text-white/80 text-sm">
              <img
                src="/Logo.png"
                alt="STARRY"
                className="h-3 -translate-y-[12px]"
              />
              <div className="h-6 w-px bg-white/40 -translate-y-[12px]"></div>
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
          </footer>
        </div>
      </div>

      {/* 네비게이션 바 */}
      <NavBar />
    </div>
  );
}

export default NoticeDetailPage;
