import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const StarsContext = createContext({});

// 별 ID 기반으로 고정된 위치 생성 (해시 함수)
const getPositionFromId = (id, index, canvasWidth, canvasHeight, padding) => {
  let hash = 0;
  const str = id + index.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const pseudoRandomX = Math.abs(Math.sin(hash));
  const pseudoRandomY = Math.abs(Math.cos(hash * 2));

  return {
    x: padding + pseudoRandomX * (canvasWidth - padding * 2),
    y: padding + pseudoRandomY * (canvasHeight - padding * 2),
  };
};

export function StarsProvider({ children }) {
  const { user } = useAuth();
  const [stars, setStars] = useState([]);
  const [starPositions, setStarPositions] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const canvasWidth = 350;
  const canvasHeight = 500;
  const padding = 40;

  // 위치 계산 함수
  const calculatePositions = useCallback((starsData) => {
    return starsData.map((star, index) => {
      if (star.position_x != null && star.position_y != null) {
        return { x: star.position_x, y: star.position_y };
      }
      return getPositionFromId(star.id, index, canvasWidth, canvasHeight, padding);
    });
  }, []);

  // 별 데이터 새로고침
  const refreshStars = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('stars')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setStars(data || []);
      setStarPositions(calculatePositions(data || []));

      // 연결 데이터 가져오기
      const { data: connectionsData, error: connError } = await supabase
        .from('star_connections')
        .select('*')
        .eq('user_id', user.id);

      if (connError) throw connError;

      if (connectionsData && connectionsData.length > 0 && data) {
        const loadedConnections = connectionsData.map(conn => {
          const fromIndex = data.findIndex(s => s.id === conn.from_star_id);
          const toIndex = data.findIndex(s => s.id === conn.to_star_id);
          return { fromIndex, toIndex };
        }).filter(conn => conn.fromIndex !== -1 && conn.toIndex !== -1);

        setConnections(loadedConnections);
      } else {
        setConnections([]);
      }
    } catch (error) {
      console.error('Error fetching stars:', error);
    }
  }, [user, calculatePositions]);

  // 초기 로드 + 실시간 구독
  useEffect(() => {
    if (!user) {
      setStars([]);
      setStarPositions([]);
      setConnections([]);
      setLoading(false);
      setInitialized(false);
      return;
    }

    // 초기 데이터 로드
    const initializeData = async () => {
      setLoading(true);
      await refreshStars();
      setLoading(false);
      setInitialized(true);
    };

    initializeData();

    // 실시간 구독 설정
    const channel = supabase
      .channel('stars-realtime-global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stars',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('새 별 추가됨:', payload.new);
          const newStar = payload.new;

          setStars(prev => {
            const updated = [...prev, newStar];
            // 새 별의 위치도 추가
            const newPosition = newStar.position_x != null && newStar.position_y != null
              ? { x: newStar.position_x, y: newStar.position_y }
              : getPositionFromId(newStar.id, prev.length, canvasWidth, canvasHeight, padding);
            setStarPositions(positions => [...positions, newPosition]);
            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'stars',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('별 삭제됨:', payload.old);
          setStars(prev => {
            const deleteIndex = prev.findIndex(star => star.id === payload.old.id);
            if (deleteIndex !== -1) {
              setStarPositions(positions => positions.filter((_, i) => i !== deleteIndex));
              // 연결도 업데이트
              setConnections(conns => conns.filter(
                conn => conn.fromIndex !== deleteIndex && conn.toIndex !== deleteIndex
              ).map(conn => ({
                fromIndex: conn.fromIndex > deleteIndex ? conn.fromIndex - 1 : conn.fromIndex,
                toIndex: conn.toIndex > deleteIndex ? conn.toIndex - 1 : conn.toIndex
              })));
            }
            return prev.filter(star => star.id !== payload.old.id);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stars',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('별 업데이트됨:', payload.new);
          setStars(prev => prev.map(star =>
            star.id === payload.new.id ? payload.new : star
          ));
          // 위치 업데이트
          setStarPositions(prev => {
            const index = stars.findIndex(s => s.id === payload.new.id);
            if (index !== -1 && payload.new.position_x != null && payload.new.position_y != null) {
              const updated = [...prev];
              updated[index] = { x: payload.new.position_x, y: payload.new.position_y };
              return updated;
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshStars]);

  // 연결 업데이트 함수
  const updateConnections = useCallback((newConnections) => {
    setConnections(newConnections);
  }, []);

  // 위치 업데이트 함수
  const updateStarPositions = useCallback((newPositions) => {
    setStarPositions(newPositions);
  }, []);

  // 별 삭제 함수
  const deleteStar = useCallback(async (starId) => {
    try {
      const { error } = await supabase
        .from('stars')
        .delete()
        .eq('id', starId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting star:', error);
      return false;
    }
  }, []);

  const value = {
    stars,
    setStars,
    starPositions,
    setStarPositions: updateStarPositions,
    connections,
    setConnections: updateConnections,
    loading,
    initialized,
    refreshStars,
    deleteStar,
    getPositionFromId: (id, index) => getPositionFromId(id, index, canvasWidth, canvasHeight, padding)
  };

  return (
    <StarsContext.Provider value={value}>
      {children}
    </StarsContext.Provider>
  );
}

export function useStars() {
  const context = useContext(StarsContext);
  if (!context) {
    throw new Error('useStars must be used within a StarsProvider');
  }
  return context;
}
