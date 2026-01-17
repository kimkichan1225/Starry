import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NavBar from '../components/NavBar';

function HomePage() {
  const { user, nickname } = useAuth();
  const [selectedConstellation, setSelectedConstellation] = useState('ABCD만 EFG대서대');
  const [isConstellationExpanded, setIsConstellationExpanded] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  // 공유 링크 복사
  const handleShare = () => {
    if (!user?.id) {
      setShareMessage('로그인이 필요합니다.');
      setTimeout(() => setShareMessage(''), 2000);
      return;
    }

    const surveyLink = `${window.location.origin}/survey/${user.id}`;
    navigator.clipboard.writeText(surveyLink);
    setShareMessage('링크가 복사되었습니다!');
    setTimeout(() => setShareMessage(''), 2000);
  };

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
      <div className="relative z-10 flex flex-col min-h-screen pb-20">
        {/* 광고 배너 영역 */}
        <div className="h-16 bg-[#949494] mt-8 flex items-center justify-center">
        </div>

        {/* 상단 네비게이션 */}
        <nav className="pl-8 pr-6 py-5 flex items-center">
          <div className="flex items-center gap-1">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
{nickname && <span className="text-white font-bold text-xl">{nickname} 님의 밤하늘</span>}
          </div>
        </nav>

        {/* 별자리 표시 영역 */}
        <div className="relative min-h-[430px] flex items-center justify-center py-8">
          {/* 여기에 별자리 시각화가 들어갈 예정 */}
        </div>

        {/* 공유 성공 메시지 */}
        {shareMessage && (
          <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white/80 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 whitespace-nowrap">
            {/* 링크 아이콘 */}
            <svg className="w-6 h-6 text-[#6155F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {/* 메시지 텍스트 */}
            <span className="text-[#6155F5] text-base font-bold">{shareMessage}</span>
          </div>
        )}

        {/* 플로팅 버튼들 */}
        <div className={`fixed right-4 bottom-44 flex flex-col gap-3 z-40 transition-opacity duration-300 ${isConstellationExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* 공유 버튼 */}
          <button
            onClick={handleShare}
            className="w-12 h-12 bg-[#6155F5] rounded-full flex items-center justify-center shadow-lg hover:bg-[#5044d4] transition"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          {/* 이미지 캡쳐 버튼 */}
          <button className="w-12 h-12 bg-[#6155F5] rounded-full flex items-center justify-center shadow-lg hover:bg-[#5044d4] transition">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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
          <button className="w-12 h-12 bg-[#6155F5] rounded-full flex items-center justify-center shadow-lg hover:bg-[#5044d4] transition">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

      </div>

      {/* 바텀시트 - 별자리 정보 */}
      <div
        className={`fixed left-5 right-5 top-44 bottom-32 bg-white shadow-lg transition-all duration-500 ease-out z-30 ${
          isConstellationExpanded ? 'translate-y-0 rounded-3xl' : 'translate-y-[calc(100%-2rem)] rounded-t-3xl'
        }`}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-20 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* 헤더 (클릭 가능) */}
        <div className="relative">
          <button
            onClick={() => setIsConstellationExpanded(!isConstellationExpanded)}
            className="w-full px-5 pt-2 pb-4 flex justify-center items-center"
          >
            <span className={`text-2xl ${isConstellationExpanded ? 'text-[#6155F5] font-bold' : 'text-black font-medium'}`}>
              ABCD한 EFGE자리
            </span>
          </button>
          {isConstellationExpanded && (
            <button
              onClick={() => setIsConstellationExpanded(false)}
              className="absolute right-5 top-1/2 transform -translate-y-1/2"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 확장된 내용 */}
        {isConstellationExpanded && (
          <div className="px-5 pb-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 24rem)' }}>
            {/* 중앙 원형 이미지 영역 */}
            <div className="flex justify-center mb-4">
              <div className="w-48 h-48 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold whitespace-nowrap" style={{ color: 'rgba(0, 0, 0, 0.52)' }}>별자리 커스텀 이미지</span>
              </div>
            </div>

            {/* 카드 2개 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="aspect-[4/5] bg-white border border-gray-200 rounded-2xl p-4 flex items-start justify-center">
                <span className="text-[#6155F5] text-sm text-center"><span className="font-bold">궁합 좋은</span> 별자리</span>
              </div>
              <div className="aspect-[4/5] bg-white border border-gray-200 rounded-2xl p-4 flex items-start justify-center">
                <span className="text-[#6155F5] text-sm text-center"><span className="font-bold">궁합 안 좋은</span> 별자리</span>
              </div>
            </div>

            {/* AI 별자리 이름 바꾸기 버튼 */}
            <button className="w-full py-3 bg-[#A6A6A6] text-white font-semibold rounded-full hover:bg-[#959595] transition">
              AI 별자리 이름 바꾸기
            </button>
          </div>
        )}
      </div>

      {/* 네비게이션 바 */}
      <NavBar />
    </div>
  );
}

export default HomePage;
