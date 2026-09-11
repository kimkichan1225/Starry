import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { isAdminUser } from '../config/admin';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 프로필 완성 여부 체크 함수 (약관 동의 기록은 AuthProvider에서 별도로 합산)
// phone_verified는 서버(confirm-phone Edge Function)가 app_metadata에 확정한 값만 신뢰한다.
// (user_metadata는 클라이언트가 수정 가능하므로 인증 통과 판정에 사용하지 않는다.)
const checkProfileComplete = (userData) => {
  if (!userData) return false;
  const metadata = userData.user_metadata || {};
  const appMetadata = userData.app_metadata || {};
  return !!(metadata.nickname && metadata.birthdate && appMetadata.phone_verified);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  // 약관·개인정보 동의 기록 (어느 사용자의 조회 결과인지 함께 보관해 계정 전환 시 이전 값이 섞이지 않게 한다)
  const [consentState, setConsentState] = useState({ userId: null, agreed: false });

  useEffect(() => {
    // 초기 사용자 정보 가져오기
    const getInitialUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setIsAdmin(isAdminUser(user));
        if (user?.user_metadata?.nickname) {
          setNickname(user.user_metadata.nickname);
        } else {
          setNickname('User1');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setNickname('User1');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();

    // Auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(isAdminUser(currentUser));

      if (currentUser?.user_metadata?.nickname) {
        setNickname(currentUser.user_metadata.nickname);
      } else {
        setNickname('User1');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const userId = user?.id ?? null;

  // 동의 기록 조회 (profiles.terms_agreed_at — record_consent RPC로만 기록됨)
  const refreshConsent = useCallback(async () => {
    if (!userId) return false;
    const { data, error } = await supabase
      .from('profiles')
      .select('terms_agreed_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) console.error('동의 기록 조회 실패:', error);
    const agreed = !!data?.terms_agreed_at;
    setConsentState({ userId, agreed });
    return agreed;
  }, [userId]);

  useEffect(() => {
    if (userId) refreshConsent();
  }, [userId, refreshConsent]);

  const consentLoaded = !userId || consentState.userId === userId;
  const hasConsented = consentState.userId === userId && consentState.agreed;

  const value = {
    user,
    nickname,
    // 동의 기록 조회가 끝나기 전에는 라우트 가드가 판단하지 않도록 로딩으로 취급
    loading: loading || !consentLoaded,
    isProfileComplete: checkProfileComplete(user) && hasConsented,
    hasConsented,
    isAdmin,
    setUser,
    setNickname,
    refreshConsent
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
