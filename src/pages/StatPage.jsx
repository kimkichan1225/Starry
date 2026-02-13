import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import NavBar from '../components/NavBar';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../locales/translations';

function StatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const [nickname, setNickname] = useState('User1');
  const [starCount, setStarCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 사용자 정보 및 별 개수 가져오기
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 닉네임 가져오기
        const { data: profileData } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', user.id)
          .single();

        if (profileData?.nickname) {
          setNickname(profileData.nickname);
        }

        // 별 개수 가져오기
        const { count } = await supabase
          .from('stars')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setStarCount(count || 0);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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
              <span className="text-white font-bold text-2xl">{nickname}{t.stat.title}</span>
            </div>
          </div>
        </nav>

        {/* 중앙 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-start pt-10 px-6">
          <div className="w-full max-w-[330px] text-center">
            {/* 질문 텍스트 */}
            <div className="mb-6">
              <h1 className="text-white text-2xl font-bold leading-relaxed">
                {nickname}{language === 'ko' ? ' 님은' : ''}
              </h1>
              <h2 className="text-white text-2xl font-bold">
                {t.stat.whatStar}
              </h2>
            </div>

            {/* 별 캐릭터 + 원자 모델 스타일 궤도 */}
            <div className="flex justify-center mb-6 relative" style={{ width: '280px', height: '280px', margin: '0 auto' }}>

              {/* 궤도 뒷부분 (캐릭터 뒤에 보임) - 전체 궤도 */}
              <svg
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                width="280"
                height="280"
                viewBox="0 0 280 280"
                style={{ zIndex: 1 }}
              >
                {/* 궤도 1 - \ 방향 */}
                <ellipse
                  cx="140"
                  cy="140"
                  rx="130"
                  ry="35"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.7)"
                  strokeWidth="3"
                  transform="rotate(30 140 140)"
                />
                {/* 궤도 2 - 가로 방향 */}
                <ellipse
                  cx="140"
                  cy="140"
                  rx="130"
                  ry="35"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.7)"
                  strokeWidth="3"
                />
              </svg>

              {/* 메인 캐릭터 이미지 */}
              <img
                src="/StatCharacter.png"
                alt="별 캐릭터"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[170px] h-[170px] object-contain"
                style={{ zIndex: 10 }}
              />

              {/* 궤도 앞부분 (캐릭터 앞에 보임) - 클리핑으로 일부만 표시 */}
              <svg
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                width="280"
                height="280"
                viewBox="0 0 280 280"
                style={{ zIndex: 20 }}
              >
                <defs>
                  {/* 왼쪽 아래 부분만 보이게 하는 클립 */}
                  <clipPath id="clipLeft">
                    <rect x="0" y="140" width="140" height="140" />
                  </clipPath>
                  {/* 오른쪽 아래 부분만 보이게 하는 클립 */}
                  <clipPath id="clipRight">
                    <rect x="140" y="140" width="140" height="140" />
                  </clipPath>
                  {/* 아래쪽 전체 보이게 하는 클립 */}
                  <clipPath id="clipBottom">
                    <rect x="0" y="140" width="280" height="140" />
                  </clipPath>
                </defs>
                {/* 궤도 1 앞부분 - \ 방향, 아래쪽 */}
                <ellipse
                  cx="140"
                  cy="140"
                  rx="130"
                  ry="35"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.7)"
                  strokeWidth="3"
                  transform="rotate(30 140 140)"
                  clipPath="url(#clipBottom)"
                />
                {/* 궤도 2 앞부분 - 가로, 아래쪽만 표시 */}
                <ellipse
                  cx="140"
                  cy="140"
                  rx="130"
                  ry="35"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.7)"
                  strokeWidth="3"
                  transform="rotate(0 140 140)"
                  clipPath="url(#clipBottom)"
                />
              </svg>

              {/* 공전하는 원들 - 캐릭터 뒤 */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px]" style={{ zIndex: 5 }}>
                {/* \ 궤도 원들 (30도 회전된 컨테이너) */}
                <div className="absolute inset-0" style={{ transform: 'rotate(30deg)' }}>
                  <img src="/StatCircle.png" alt="" className="orbit-path orbit-1" />
                  <img src="/StatCircle.png" alt="" className="orbit-path orbit-3" />
                </div>
                {/* 가로 궤도 원 */}
                <img src="/StatCircle.png" alt="" className="orbit-path orbit-2" />
              </div>

              {/* 공전하는 원들 - 캐릭터 앞: \ 궤도 (30도 회전된 클리핑) */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px]"
                style={{ zIndex: 30, clipPath: 'polygon(0% 35%, 100% 65%, 100% 100%, 0% 100%)' }}
              >
                <div className="absolute inset-0" style={{ transform: 'rotate(30deg)' }}>
                  <img src="/StatCircle.png" alt="" className="orbit-path orbit-1" />
                  <img src="/StatCircle.png" alt="" className="orbit-path orbit-3" />
                </div>
              </div>

              {/* 공전하는 원들 - 캐릭터 앞: 가로 궤도 */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px]"
                style={{ zIndex: 30, clipPath: 'inset(50% 0 0 0)' }}
              >
                <img src="/StatCircle.png" alt="" className="orbit-path orbit-2" />
              </div>

              {/* CSS offset-path 애니메이션 */}
              <style>{`
                .orbit-path {
                  position: absolute;
                  offset-rotate: 0deg;
                  offset-path: path('M 10,140 a 130,35 0 1,0 260,0 a 130,35 0 1,0 -260,0');
                }
                .orbit-1 {
                  width: 16px;
                  height: 16px;
                  animation: movePath 12s linear infinite;
                  animation-delay: -4s;
                }
                .orbit-3 {
                  width: 10px;
                  height: 10px;
                  animation: movePath 9s linear infinite;
                  animation-delay: -6s;
                }
                .orbit-2 {
                  width: 16px;
                  height: 16px;
                  animation: movePath 16s linear infinite;
                  animation-delay: -8s;
                }
                @keyframes movePath {
                  0% { offset-distance: 0%; }
                  100% { offset-distance: 100%; }
                }
              `}</style>
            </div>

            {/* 참여자 수 */}
            <p className="text-white/80 text-sm mb-8">
              {starCount}{t.stat.participants}<br />
              {nickname}{t.stat.makingStar}{t.stat.makingStar2}
            </p>

            {/* 질문별 통계보기 버튼 */}
            <button
              onClick={() => navigate('/stat/detail')}
              className="w-[300px] py-3 text-base rounded-full font-semibold bg-[#6155F5] text-white hover:bg-[#5044d4] transition-colors"
            >
              {t.stat.viewStats}
            </button>
          </div>
        </div>
      </div>

      <NavBar />
    </div>
  );
}

export default StatPage;
