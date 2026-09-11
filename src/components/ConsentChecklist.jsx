import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../locales/translations';

const checkboxClass = 'w-4 h-4 shrink-0 rounded border-purple-500 text-purple-600 focus:ring-purple-600';

// 회원가입·프로필 설정 공용 필수 동의 체크 목록
// consent: { terms, privacy, age } / onChange: 변경된 consent 객체를 전달
function ConsentChecklist({ consent, onChange }) {
  const { language } = useLanguage();
  const t = translations[language].consent;
  const [showPrivacySummary, setShowPrivacySummary] = useState(false);

  const allChecked = consent.terms && consent.privacy && consent.age;

  const items = [
    { key: 'terms', label: t.terms, link: '/terms' },
    { key: 'privacy', label: t.privacy, link: '/privacy' },
    { key: 'age', label: t.age },
  ];

  return (
    <div className="space-y-2 text-white/80 text-xs">
      <label className="flex items-center gap-2 cursor-pointer pb-2 border-b border-white/20 font-semibold text-white">
        <input
          type="checkbox"
          checked={allChecked}
          onChange={() => onChange({ terms: !allChecked, privacy: !allChecked, age: !allChecked })}
          className={checkboxClass}
        />
        <span>{t.agreeAll}</span>
      </label>

      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consent[item.key]}
              onChange={() => onChange({ ...consent, [item.key]: !consent[item.key] })}
              className={checkboxClass}
            />
            <span>{item.label}</span>
          </label>
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-white/60 underline hover:text-white"
            >
              {t.view}
            </a>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => setShowPrivacySummary((prev) => !prev)}
        className="text-white/60 underline hover:text-white"
      >
        {t.privacySummaryTitle}
      </button>

      {showPrivacySummary && (
        <div className="bg-white rounded-lg p-3 text-[#727272] text-[10px] leading-relaxed space-y-1">
          <p>{t.privacySummaryItems}</p>
          <p>{t.privacySummaryPurpose}</p>
          <p>{t.privacySummaryPeriod}</p>
          <p>{t.privacySummaryRefuse}</p>
        </div>
      )}
    </div>
  );
}

export default ConsentChecklist;
