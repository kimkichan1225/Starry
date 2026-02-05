import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import NavBar from '../components/NavBar';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../locales/translations';

function UserPage() {
  const { user, nickname, setNickname } = useAuth();
  const { language, setLanguage } = useLanguage();
  const t = translations[language];

  // linkIdentity 후 리다이렉트로 돌아왔을 때 google_linked 플래그 설정
  useEffect(() => {
    const checkAndSetGoogleLinked = async () => {
      if (!user) return;

      const isGoogleSignup = user?.app_metadata?.provider === 'google';
      const googleIdentity = user?.identities?.find(i => i.provider === 'google');
      const googleLinked = user?.user_metadata?.google_linked;

      // 이메일 가입 사용자가 구글 identity가 있는데 google_linked가 설정 안 된 경우
      // URL에 hash가 있으면 (OAuth 리다이렉트 후) google_linked 설정
      if (!isGoogleSignup && googleIdentity && !googleLinked && window.location.hash) {
        try {
          await supabase.auth.updateUser({
            data: { google_linked: true }
          });
          // 페이지 새로고침하여 상태 업데이트
          window.location.hash = '';
          window.location.reload();
        } catch (error) {
          console.error('google_linked 설정 오류:', error);
        }
      }
    };

    checkAndSetGoogleLinked();
  }, [user]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 닉네임 변경 관련 상태
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [nicknameLoading, setNicknameLoading] = useState(false);

  // 소셜 연동 관련 상태
  const [socialLoading, setSocialLoading] = useState(false);

  // 구글 연동 상태 확인
  const isGoogleSignup = user?.app_metadata?.provider === 'google'; // 구글로 가입했는지
  const googleIdentity = user?.identities?.find(i => i.provider === 'google'); // 구글 identity 존재 여부
  const socialLinked = user?.user_metadata?.social_linked; // 프로필 설정 완료 여부
  const googleLinkedFromUserPage = user?.user_metadata?.google_linked; // UserPage에서 연동 완료 여부

  // 구글 연동 여부:
  // 1. 구글 가입: social_linked가 true여야 연동 완료
  // 2. 이메일 가입 → 구글 연동: social_linked 또는 google_linked가 true여야 연동 완료
  const isGoogleLinked = isGoogleSignup
    ? socialLinked === true
    : (!!googleIdentity && (socialLinked === true || googleLinkedFromUserPage === true));
  const googleEmail = googleIdentity?.identity_data?.email || null;

  // 구글 연동하기
  const handleLinkGoogle = async () => {
    setSocialLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/user`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setError(error.message || t.user.googleLinkFailed);
      setSocialLoading(false);
    }
  };

  // 구글 연동 해제
  const handleUnlinkGoogle = async () => {
    if (isGoogleSignup) {
      setError(t.user.googleCannotUnlink);
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!googleIdentity?.identity_id) {
      setError(t.user.linkInfoNotFound);
      return;
    }

    const confirmed = window.confirm(t.user.unlinkConfirm);
    if (!confirmed) return;

    setSocialLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
      if (error) throw error;
      setSuccessMessage(t.user.googleUnlinked);
      setTimeout(() => setSuccessMessage(''), 2000);
      // 페이지 새로고침하여 상태 업데이트
      window.location.reload();
    } catch (error) {
      setError(error.message || t.user.googleUnlinkFailed);
    } finally {
      setSocialLoading(false);
    }
  };

  // 구글 토글 클릭 핸들러
  const handleGoogleToggle = () => {
    if (socialLoading) return;

    if (isGoogleLinked) {
      handleUnlinkGoogle();
    } else {
      handleLinkGoogle();
    }
  };

  // 닉네임 변경 시작
  const handleEditNickname = () => {
    setNewNickname(nickname);
    setIsEditingNickname(true);
    setError('');
    setSuccessMessage('');
  };

  // 닉네임 변경 취소
  const handleCancelNickname = () => {
    setIsEditingNickname(false);
    setNewNickname('');
  };

  // 닉네임 저장
  const handleSaveNickname = async () => {
    if (!newNickname.trim()) {
      setError(t.user.enterNickname);
      return;
    }

    if (newNickname.trim().length < 2) {
      setError(t.user.nicknameTooShort);
      return;
    }

    if (newNickname.trim().length > 10) {
      setError(t.user.nicknameTooLong);
      return;
    }

    setNicknameLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: { nickname: newNickname.trim() }
      });

      if (error) throw error;

      setNickname(newNickname.trim());
      setIsEditingNickname(false);
      setSuccessMessage(t.user.nicknameChanged);
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      setError(error.message || t.user.nicknameChangeFailed);
    } finally {
      setNicknameLoading(false);
    }
  };

  // 비밀번호 변경
  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      setError(t.user.enterNewPassword);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.user.passwordMismatch);
      return;
    }

    if (newPassword.length < 6) {
      setError(t.user.passwordTooShort);
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

      setSuccessMessage(t.user.passwordChanged);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError(error.message || t.user.passwordChangeFailed);
    } finally {
      setLoading(false);
    }
  };

  // 설문 페이지 링크
  const surveyLink = `${window.location.origin}/survey/${user?.id}`;

  // QR코드 링크 복사
  const handleCopyLink = () => {
    navigator.clipboard.writeText(surveyLink);
    setSuccessMessage(t.common.linkCopied);
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
        <nav className="px-6 py-5">
          <div className="max-w-[370px] mx-auto flex justify-between items-center">
            <div className="flex items-center gap-1">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {nickname && <span className="text-white font-bold text-2xl">{nickname}{t.user.personalSettings}</span>}
            </div>
          </div>
        </nav>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 px-6 pt-3 pb-8">
          <div className="max-w-[340px] mx-auto">
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
            <div className="flex items-center mt-4">
              <label className="text-white text-base font-bold whitespace-nowrap ml-12">{t.user.userId}</label>
              <div className="flex-1 px-4 py-3 text-white text-base">
                {user?.email || 'User1'}
              </div>
            </div>

            {/* 닉네임 */}
            <div className="flex items-center">
              <label className="text-white text-base font-bold whitespace-nowrap ml-12">{t.user.nickname}</label>
              <div className="flex-1 flex items-center gap-2">
                {isEditingNickname ? (
                  <>
                    <input
                      type="text"
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value)}
                      maxLength={10}
                      className="flex-1 border-b-2 border-purple-500 ml-4 pr-2 pt-1 pb-1 text-white text-base max-w-[130px] bg-transparent focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveNickname}
                      disabled={nicknameLoading}
                      className="p-2 hover:opacity-70 transition text-green-400"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleCancelNickname}
                      className="p-2 hover:opacity-70 transition text-red-400"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 border-b border-white/30 ml-4 pr-2 pt-1 pb-1 text-white text-base max-w-[130px]">
                      {nickname || 'User1'}
                    </div>
                    <button
                      onClick={handleEditNickname}
                      className="p-2 hover:opacity-70 transition"
                    >
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 전화번호 */}
            <div className="flex items-center mt-2">
              <label className="text-white text-base font-bold whitespace-nowrap ml-12">{t.user.phone}</label>
              <div className="flex-1 ml-4 pr-2 pt-1 pb-1 text-white text-base max-w-[130px]">
                {user?.user_metadata?.phone || '010-xxxx-xxxx'}
              </div>
            </div>

            {/* 비밀번호 변경 */}
            <div className="mt-4">
              <label className="text-white text-base font-bold whitespace-nowrap ml-12 block mb-3">{t.user.password}</label>
              <div className="ml-12 space-y-2 max-w-[240px]">
                <input
                  type="password"
                  placeholder={t.user.currentPassword}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-[4px] text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <input
                  type="password"
                  placeholder={t.user.newPassword}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-[4px] text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <input
                  type="password"
                  placeholder={t.user.confirmPassword}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-[4px] text-center text-sm rounded-lg bg-white text-gray-800 placeholder-gray-400 border-2 border-purple-500 shadow-[inset_6px_6px_6px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handlePasswordChange}
                    disabled={loading}
                    className="px-6 py-2 text-sm rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? t.common.changing : t.common.change}
                  </button>
                </div>
              </div>
            </div>

            {/* 소셜 계정 연동 관리 */}
            <div className="mt-6">
              <label className="text-white text-base font-bold whitespace-nowrap ml-12 block mb-3">{t.user.socialAccount}</label>
              <div className="ml-12 space-y-3 max-w-[260px]">
                {/* 구글 */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                  </div>
                  <span className="flex-1 text-white text-sm truncate">
                    {isGoogleLinked ? (googleEmail || user?.email) : t.user.notLinked}
                  </span>
                  {!isGoogleSignup && (
                    <button
                      onClick={handleGoogleToggle}
                      disabled={socialLoading}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        isGoogleLinked ? 'bg-[#6155F5]' : 'bg-gray-500'
                      } ${socialLoading ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          isGoogleLinked ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* 카카오 (준비중) */}
                <div className="flex items-center gap-3 opacity-50">
                  <div className="w-10 h-10 rounded-lg bg-[#FEE500] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                      <path fill="#3C1E1E" d="M24,8C13.507,8,5,14.701,5,22.938c0,5.145,3.302,9.666,8.256,12.323l-2.116,7.728c-0.125,0.458,0.311,0.838,0.713,0.622l9.394-5.043C22.16,38.721,23.063,38.875,24,38.875c10.493,0,19-6.701,19-14.938S34.493,8,24,8z"/>
                    </svg>
                  </div>
                  <span className="flex-1 text-white text-sm">{t.user.preparing}</span>
                  <button
                    disabled
                    className="w-12 h-6 rounded-full bg-gray-500 relative cursor-not-allowed"
                  >
                    <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* 언어설정 */}
            <div className="mt-6">
              <label className="text-white text-base font-bold whitespace-nowrap ml-12 block mb-3">{t.user.languageSetting}</label>
              <div className="ml-12 max-w-[240px]">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#6155F5]"
                >
                  <option value="ko" className="bg-gray-800">{t.common.korean}</option>
                  <option value="en" className="bg-gray-800">{t.common.english}</option>
                </select>
              </div>
            </div>

            {/* 내 밤하늘 QR코드 */}
            <div className="mt-6">
              <label className="text-white text-base font-bold whitespace-nowrap ml-12 block mb-3">{t.user.myQRCode}</label>
              <div className="ml-12 max-w-[240px]">
                <div className="bg-white rounded-2xl p-6 flex flex-col items-center">
                  <div className="w-40 h-40 flex items-center justify-center mb-4">
                    {user?.id ? (
                      <QRCodeSVG
                        value={surveyLink}
                        size={160}
                        level="M"
                        includeMargin={false}
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">{t.user.loginRequired}</span>
                    )}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="w-full py-3 bg-[#6155F5] text-white font-medium rounded-full hover:bg-[#5044d4] transition"
                  >
                    {t.common.copyLink}
                  </button>
                </div>
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
