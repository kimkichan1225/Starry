import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isAdminEmail } from '../config/admin';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 프로필 완성 여부 체크 함수
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
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 초기 사용자 정보 가져오기
    const getInitialUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setIsProfileComplete(checkProfileComplete(user));
        setIsAdmin(user ? isAdminEmail(user.email) : false);
        if (user?.user_metadata?.nickname) {
          setNickname(user.user_metadata.nickname);
        } else {
          setNickname('User1');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setNickname('User1');
        setIsProfileComplete(false);
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
      setIsProfileComplete(checkProfileComplete(currentUser));
      setIsAdmin(currentUser ? isAdminEmail(currentUser.email) : false);

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

  const value = {
    user,
    nickname,
    loading,
    isProfileComplete,
    isAdmin,
    setUser,
    setNickname,
    setIsProfileComplete
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
