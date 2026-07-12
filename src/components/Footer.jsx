import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../locales/translations';

function Footer() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <footer className="pt-6 w-fit mx-auto text-left">
      <div className="flex items-center gap-3 mb-3">
        <img src="/Logo.png" alt="STARRY" className="h-3" />
        <div className="h-3 w-px bg-white/40"></div>
        <div className="flex items-center gap-3 text-[10px] text-white/70">
          <Link to="/terms" className="hover:text-white transition">{t.footer.terms}</Link>
          <Link to="/privacy" className="hover:text-white transition">{t.footer.privacy}</Link>
          <Link to="/notice" className="hover:text-white transition">{t.footer.notice}</Link>
        </div>
      </div>
      <div className="text-white/70 text-[9px] leading-snug">
        {t.footer.adInquiry}: design.studio.vec@gmail.com <br />
        {t.footer.instagram} @starry_zodiac_s <br />
        {t.footer.copyright}
      </div>
    </footer>
  );
}

export default Footer;
