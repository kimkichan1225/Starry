import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 사용자 정보 가져오기
    const getInitialUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user?.user_metadata?.nickname) {
          setNickname(user.user_metadata.nickname);
        } else {
          setNickname('User1');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setNickname('User1');
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();

    // Auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

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
    setUser,
    setNickname
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
