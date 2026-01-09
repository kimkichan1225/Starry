import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import NavBar from '../components/NavBar';

function UserPage() {
  const { user, nickname } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 비밀번호 변경
  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      setError('새로운 비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('새로운 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccessMessage('비밀번호가 성공적으로 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError(error.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // QR코드 링크 복사
  const handleCopyLink = () => {
    const link = `${window.location.origin}/u/${user?.id}`;
    navigator.clipboard.writeText(link);
    setSuccessMessage('링크가 복사되었습니다.');
    setTimeout(() => setSuccessMessage(''), 2000);
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
        <nav className="pl-6 pr-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {nickname && <span className="text-white font-bold text-2xl">{nickname} 님의 개인설정</span>}
          </div>
        </nav>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 px-6 pt-3 pb-8">
          <div className="max-w-[340px] mx-auto space-y-6">
            {/* 에러/성공 메시지 */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-2 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="bg-green-500/20 border border-green-500 text-green-100 px-4 py-2 rounded-lg text-sm text-center">
                {successMessage}
              </div>
            )}

            {/* 아이디 */}
            <div className="flex items-center gap-4">
              <label className="text-white text-sm whitespace-nowrap w-20">아이디</label>
              <div className="flex-1 bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white text-sm">
                {user?.email || 'User1'}
              </div>
            </div>

            {/* 닉네임 */}
            <div className="flex items-center gap-4">
              <label className="text-white text-sm whitespace-nowrap w-20">닉네임</label>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white text-sm">
                  {nickname || 'User1'}
                </div>
                <button className="p-3 bg-white/10 border border-white/30 rounded-lg hover:bg-white/20 transition">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 전화번호 */}
            <div>
              <label className="text-white text-sm mb-2 block">전화번호</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white text-sm">
                  {user?.user_metadata?.phone || '010-xxxx-xxxx'}
                </div>
                <button className="px-4 py-3 bg-[#6155F5] text-white text-sm rounded-lg hover:bg-[#5044d4] transition whitespace-nowrap">
                  인증하기
                </button>
              </div>
            </div>

            {/* 비밀번호 변경 */}
            <div>
              <label className="text-white text-sm mb-2 block">비밀번호</label>
              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="현재 비밀번호"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white text-sm placeholder-white/50 focus:outline-none focus:border-[#6155F5]"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="새로운 비밀번호"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white text-sm placeholder-white/50 focus:outline-none focus:border-[#6155F5]"
                  />
                  <button
                    onClick={handlePasswordChange}
                    disabled={loading}
                    className="px-4 py-3 bg-[#6155F5] text-white text-sm rounded-lg hover:bg-[#5044d4] transition whitespace-nowrap disabled:bg-gray-500"
                  >
                    {loading ? '변경중...' : '변경하기'}
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="새로운 비밀번호 확인"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white text-sm placeholder-white/50 focus:outline-none focus:border-[#6155F5]"
                />
              </div>
            </div>

            {/* 소셜 계정 연동 관리 */}
            <div>
              <label className="text-white text-sm mb-3 block">소셜 계정 연동 관리</label>
              <div className="flex gap-3">
                {/* 구글 */}
                <button className="flex-1 aspect-square bg-white/10 border border-white/30 rounded-xl flex items-center justify-center hover:bg-white/20 transition">
                  <svg className="w-8 h-8" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                  </svg>
                </button>
                {/* 카카오 */}
                <button className="flex-1 aspect-square bg-white/10 border border-white/30 rounded-xl flex items-center justify-center hover:bg-white/20 transition">
                  <svg className="w-8 h-8" viewBox="0 0 48 48">
                    <path fill="#FEE500" d="M24,8C13.507,8,5,14.701,5,22.938c0,5.145,3.302,9.666,8.256,12.323l-2.116,7.728c-0.125,0.458,0.311,0.838,0.713,0.622l9.394-5.043C22.16,38.721,23.063,38.875,24,38.875c10.493,0,19-6.701,19-14.938S34.493,8,24,8z"/>
                    <path fill="#3C1E1E" d="M24,10c9.389,0,17,5.701,17,12.938S33.389,35.875,24,35.875c-0.844,0-1.675-0.051-2.487-0.15l-8.644,4.637l1.947-7.106C10.302,30.604,7,27.012,7,22.938C7,15.701,14.611,10,24,10z"/>
                  </svg>
                </button>
                {/* 네이버 */}
                <button className="flex-1 aspect-square bg-white/10 border border-white/30 rounded-xl flex items-center justify-center hover:bg-white/20 transition">
                  <svg className="w-8 h-8" viewBox="0 0 48 48">
                    <path fill="#03C75A" d="M4 4h40v40H4z"/>
                    <path fill="white" d="M26.5 24.5L18 12h-4v24h7.5v-12.5L30 36h4V12h-7.5z"/>
                  </svg>
                </button>
                {/* 페이스북 */}
                <button className="flex-1 aspect-square bg-white/10 border border-white/30 rounded-xl flex items-center justify-center hover:bg-white/20 transition">
                  <svg className="w-8 h-8" viewBox="0 0 48 48">
                    <path fill="#1877F2" d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4z"/>
                    <path fill="white" d="M26.707 29.301V24h2.854l.427-3.316h-3.281V18.77c0-.958.266-1.611 1.639-1.611h1.755v-2.967c-.304-.041-1.347-.131-2.561-.131-2.534 0-4.269 1.547-4.269 4.388v2.445h-2.866V24h2.866v5.301h3.436z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* 언어설정 */}
            <div>
              <label className="text-white text-sm mb-3 block">언어설정</label>
              <select className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#6155F5]">
                <option value="ko" className="bg-gray-800">한국어</option>
                <option value="en" className="bg-gray-800">English</option>
              </select>
            </div>

            {/* 내 밤하늘 QR코드 */}
            <div>
              <label className="text-white text-sm mb-3 block">내 밤하늘 QR코드</label>
              <div className="bg-white rounded-2xl p-6 flex flex-col items-center">
                <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-gray-500 text-sm">QR 코드</span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="w-full py-3 bg-[#6155F5] text-white font-medium rounded-full hover:bg-[#5044d4] transition"
                >
                  링크 복사하기
                </button>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <footer className="pt-8 text-center">
            <div className="flex items-center justify-center space-x-4 text-white/80 text-sm">
              <img
                src="/Logo.png"
                alt="STARRY"
                className="h-3 -translate-y-[18px]"
              />
              <div className="h-6 w-px bg-white/40 -translate-y-[18px]"></div>
              <div className="text-left space-y-1">
                <div className="text-[9px] leading-snug">
                  광고 문의: 123456789@gmail.com <br />
                  기타 문의: 987654321@gmail.com <br />
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

export default UserPage;
