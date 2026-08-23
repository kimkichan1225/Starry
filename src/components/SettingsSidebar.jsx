import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';

const INSTAGRAM_URL = 'https://www.instagram.com/starry_zodiac_s?igsh=MWNza3E4Y3c2bmJnZQ==';

function ChevronRight({ rotated }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${rotated ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function SectionLabel({ children }) {
  return <div className="px-6 pt-4 pb-2 text-lg font-bold text-black">{children}</div>;
}

function SidebarRow({ label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center px-6 py-2.5 text-left">
      <span className="flex-1 text-black text-[15px]">{label}</span>
      <ChevronRight />
    </button>
  );
}

function SettingsSidebar({ isOpen, onClose, user, nickname, onCaptureImage }) {
  const navigate = useNavigate();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  const surveyLink = user?.id ? `${window.location.origin}/survey/${user.id}` : '';

  const handleGoTo = (path) => {
    onClose();
    navigate(path);
  };

  const handleCopyLink = () => {
    if (!surveyLink) return;
    navigator.clipboard.writeText(surveyLink);
    setCopyMessage('링크가 복사되었습니다.');
    setTimeout(() => setCopyMessage(''), 2000);
  };

  const handleCaptureImage = () => {
    onClose();
    onCaptureImage?.();
  };

  const handleLogout = async () => {
    onClose();
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  return (
    <>
      {/* 오버레이 */}
      <div
        className={`fixed inset-0 bg-black/50 z-[90] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* 사이드바 패널 */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[78%] max-w-[300px] bg-[#FAFAF7] z-[100] shadow-2xl transition-transform duration-300 ease-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 로고 */}
        <div className="px-6 pt-8 pb-5">
          <h2 className="text-xl font-extrabold tracking-widest text-black">STARRY</h2>
        </div>
        <div className="border-t border-gray-300" />

        {/* 프로필 */}
        <button onClick={() => handleGoTo('/user')} className="w-full flex items-center gap-3 px-6 py-4">
          <span className="w-7 h-7 rounded-full bg-black flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.4h19.6v-2.4c0-3.3-6.5-4.9-9.8-4.9z" />
            </svg>
          </span>
          <span className="flex-1 text-left text-black font-bold underline underline-offset-2">
            {nickname || 'User1'}
          </span>
          <ChevronRight />
        </button>

        <div className="border-t border-gray-300" />

        {/* 내 이용 정보 */}
        <SectionLabel>내 이용 정보</SectionLabel>
        <div className="border-t border-gray-200" />

        <SidebarRow label="내 밤하늘 이미지 저장" onClick={handleCaptureImage} />

        <button onClick={() => setIsQrOpen((v) => !v)} className="w-full flex items-center px-6 py-4">
          <span className="flex-1 text-left text-black text-[15px]">내 밤하늘 링크(QR)</span>
          <ChevronRight rotated={isQrOpen} />
        </button>

        {isQrOpen && (
          <div className="px-6 pb-4 flex flex-col items-center">
            {surveyLink ? (
              <button onClick={handleCopyLink} className="bg-white p-3 rounded-lg border border-gray-200">
                <QRCodeSVG value={surveyLink} size={120} level="M" />
              </button>
            ) : (
              <span className="text-gray-400 text-sm">로그인이 필요합니다.</span>
            )}
            {copyMessage && <span className="mt-2 text-xs text-[#6155F5]">{copyMessage}</span>}
          </div>
        )}

        <div className="h-2" />

        {/* 공지 및 문의 */}
        <SectionLabel>공지 및 문의</SectionLabel>

        <SidebarRow label="공지사항" onClick={() => handleGoTo('/notice')} />
        <SidebarRow label="이벤트" onClick={() => handleGoTo('/notice')} />
        <SidebarRow label="인스타그램" onClick={() => window.open(INSTAGRAM_URL, '_blank', 'noopener,noreferrer')} />
        <SidebarRow label="바로가기(즐겨찾기)" onClick={() => {}} />

        <button onClick={handleLogout} className="w-full text-left px-6 py-4 mt-4 text-black text-lg">
          로그아웃
        </button>
      </div>
    </>
  );
}

export default SettingsSidebar;
