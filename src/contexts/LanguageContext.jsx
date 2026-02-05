import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext({});

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // localStorage에서 언어 설정 불러오기
    const saved = localStorage.getItem('language');
    return saved || 'ko';
  });

  useEffect(() => {
    // 언어 설정이 변경되면 localStorage에 저장
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ko' ? 'en' : 'ko');
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    isKorean: language === 'ko',
    isEnglish: language === 'en',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
