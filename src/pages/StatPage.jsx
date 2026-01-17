import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import NavBar from '../components/NavBar';

function StatPage() {
  const { user } = useAuth();
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
    <div className="relative min-h-screen overflow-hidden">
      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/BackGround.jpg)' }}
      ></div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex flex-col min-h-screen pb-20">
        {/* 상단 타이틀 */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center space-x-2 text-white">
            <span className="text-yellow-400 text-xl">★</span>
            <span className="text-lg font-bold">{nickname} 님의 대표별</span>
          </div>
        </div>

        {/* 중앙 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-[330px] text-center">
            {/* 질문 텍스트 */}
            <div className="mb-6">
              <h1 className="text-white text-2xl font-bold leading-relaxed">
                {nickname} 님은
              </h1>
              <h2 className="text-white text-2xl font-bold">
                어떤 별일까요?
              </h2>
            </div>

            {/* 별 이미지 */}
            <div className="flex justify-center mb-6">
              <img
                src="/StatExample.png"
                alt="별 통계"
                className="w-[250px] h-[250px] object-contain"
              />
            </div>

            {/* 참여자 수 */}
            <p className="text-white/80 text-sm mb-8">
              {starCount}명이 모여 {nickname}님의 별을<br />
              만들고있어요!
            </p>

            {/* 질문별 통계보기 버튼 */}
            <button
              className="w-[300px] py-3 text-sm rounded-full font-medium bg-[#9E4EFF] text-white hover:bg-[#8A3EE8] transition-colors"
            >
              질문별 통계보기
            </button>
          </div>
        </div>
      </div>

      <NavBar />
    </div>
  );
}

export default StatPage;
