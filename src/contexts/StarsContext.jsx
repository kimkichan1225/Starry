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

  // 창고 기능을 위한 새 상태
  const [skyStars, setSkyStars] = useState([]);
  const [warehouseStars, setWarehouseStars] = useState([]);
  const [maxSkySlots, setMaxSkySlots] = useState(11);

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

      const allStars = data || [];
      setStars(allStars);

      // 밤하늘 별과 창고 별 분리
      const sky = allStars.filter(star => star.in_sky !== false);
      const warehouse = allStars.filter(star => star.in_sky === false);
      setSkyStars(sky);
      setWarehouseStars(warehouse);

      // 밤하늘 별의 위치만 계산
      setStarPositions(calculatePositions(sky));

      // 연결 데이터 가져오기
      const { data: connectionsData, error: connError } = await supabase
        .from('star_connections')
        .select('*')
        .eq('user_id', user.id);

      if (connError) throw connError;

      if (connectionsData && connectionsData.length > 0 && sky.length > 0) {
        const loadedConnections = connectionsData.map(conn => {
          const fromIndex = sky.findIndex(s => s.id === conn.from_star_id);
          const toIndex = sky.findIndex(s => s.id === conn.to_star_id);
          return { fromIndex, toIndex };
        }).filter(conn => conn.fromIndex !== -1 && conn.toIndex !== -1);

        setConnections(loadedConnections);
      } else {
        setConnections([]);
      }

      // max_sky_slots 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('max_sky_slots')
        .eq('id', user.id)
        .single();

      if (!profileError && profileData?.max_sky_slots) {
        setMaxSkySlots(profileData.max_sky_slots);
      }
    } catch (error) {
      console.error('Error fetching stars:', error);
    }
  }, [user, calculatePositions]);

  // 초기 로드 + 실시간 구독
  useEffect(() => {
    if (!user) {
      setStars([]);
      setSkyStars([]);
      setWarehouseStars([]);
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

          setStars(prev => [...prev, newStar]);

          if (newStar.in_sky !== false) {
            setSkyStars(prev => {
              const updated = [...prev, newStar];
              // 새 별의 위치도 추가
              const newPosition = newStar.position_x != null && newStar.position_y != null
                ? { x: newStar.position_x, y: newStar.position_y }
                : getPositionFromId(newStar.id, prev.length, canvasWidth, canvasHeight, padding);
              setStarPositions(positions => [...positions, newPosition]);
              return updated;
            });
          } else {
            setWarehouseStars(prev => [...prev, newStar]);
          }
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
          const deletedId = payload.old.id;

          setStars(prev => prev.filter(star => star.id !== deletedId));

          setSkyStars(prev => {
            const deleteIndex = prev.findIndex(star => star.id === deletedId);
            if (deleteIndex !== -1) {
              setStarPositions(positions => positions.filter((_, i) => i !== deleteIndex));
              setConnections(conns => conns.filter(
                conn => conn.fromIndex !== deleteIndex && conn.toIndex !== deleteIndex
              ).map(conn => ({
                fromIndex: conn.fromIndex > deleteIndex ? conn.fromIndex - 1 : conn.fromIndex,
                toIndex: conn.toIndex > deleteIndex ? conn.toIndex - 1 : conn.toIndex
              })));
              return prev.filter(star => star.id !== deletedId);
            }
            return prev;
          });

          setWarehouseStars(prev => prev.filter(star => star.id !== deletedId));
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
          const updatedStar = payload.new;

          setStars(prev => prev.map(star =>
            star.id === updatedStar.id ? updatedStar : star
          ));

          // in_sky 상태 변경 처리
          if (updatedStar.in_sky === false) {
            // 밤하늘 -> 창고
            setSkyStars(prev => {
              const index = prev.findIndex(s => s.id === updatedStar.id);
              if (index !== -1) {
                setStarPositions(positions => positions.filter((_, i) => i !== index));
                setConnections(conns => conns.filter(
                  conn => conn.fromIndex !== index && conn.toIndex !== index
                ).map(conn => ({
                  fromIndex: conn.fromIndex > index ? conn.fromIndex - 1 : conn.fromIndex,
                  toIndex: conn.toIndex > index ? conn.toIndex - 1 : conn.toIndex
                })));
                return prev.filter(s => s.id !== updatedStar.id);
              }
              return prev;
            });
            setWarehouseStars(prev => {
              if (!prev.find(s => s.id === updatedStar.id)) {
                return [...prev, updatedStar];
              }
              return prev.map(s => s.id === updatedStar.id ? updatedStar : s);
            });
          } else {
            // 창고 -> 밤하늘 또는 밤하늘 내 업데이트
            setWarehouseStars(prev => prev.filter(s => s.id !== updatedStar.id));
            setSkyStars(prev => {
              const existingIndex = prev.findIndex(s => s.id === updatedStar.id);
              if (existingIndex !== -1) {
                // 기존 밤하늘 별 업데이트
                if (updatedStar.position_x != null && updatedStar.position_y != null) {
                  setStarPositions(positions => {
                    const updated = [...positions];
                    updated[existingIndex] = { x: updatedStar.position_x, y: updatedStar.position_y };
                    return updated;
                  });
                }
                return prev.map(s => s.id === updatedStar.id ? updatedStar : s);
              } else {
                // 새로 밤하늘에 추가
                const newPosition = updatedStar.position_x != null && updatedStar.position_y != null
                  ? { x: updatedStar.position_x, y: updatedStar.position_y }
                  : getPositionFromId(updatedStar.id, prev.length, canvasWidth, canvasHeight, padding);
                setStarPositions(positions => [...positions, newPosition]);
                return [...prev, updatedStar];
              }
            });
          }
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

  // 별 삭제 함수 (낙관적 업데이트)
  const deleteStar = useCallback(async (starId) => {
    if (!user) return false;

    try {
      // 먼저 로컬에서 즉시 제거 (빠른 UI 반응)
      const deleteIndexSky = skyStars.findIndex(star => star.id === starId);
      const deleteIndexWarehouse = warehouseStars.findIndex(star => star.id === starId);

      if (deleteIndexSky !== -1) {
        setSkyStars(prev => prev.filter(star => star.id !== starId));
        setStarPositions(prev => prev.filter((_, i) => i !== deleteIndexSky));
        setConnections(prev => prev.filter(
          conn => conn.fromIndex !== deleteIndexSky && conn.toIndex !== deleteIndexSky
        ).map(conn => ({
          fromIndex: conn.fromIndex > deleteIndexSky ? conn.fromIndex - 1 : conn.fromIndex,
          toIndex: conn.toIndex > deleteIndexSky ? conn.toIndex - 1 : conn.toIndex
        })));
      }

      if (deleteIndexWarehouse !== -1) {
        setWarehouseStars(prev => prev.filter(star => star.id !== starId));
      }

      setStars(prev => prev.filter(star => star.id !== starId));

      // 서버에서 삭제
      const { error } = await supabase
        .from('stars')
        .delete()
        .eq('id', starId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting star:', error);
      // 실패 시 데이터 다시 로드
      await refreshStars();
      return false;
    }
  }, [user, skyStars, warehouseStars, refreshStars]);

  // 밤하늘 -> 창고 이동
  const moveToWarehouse = useCallback(async (starId) => {
    if (!user) return false;

    try {
      // 해당 별과 연결된 모든 선 삭제
      const starIndex = skyStars.findIndex(s => s.id === starId);
      if (starIndex === -1) return false;

      // 연결 데이터에서 해당 별 관련 연결 찾기
      const starConnections = connections.filter(
        conn => conn.fromIndex === starIndex || conn.toIndex === starIndex
      );

      // DB에서 연결 삭제
      if (starConnections.length > 0) {
        const { error: connDeleteError } = await supabase
          .from('star_connections')
          .delete()
          .eq('user_id', user.id)
          .or(`from_star_id.eq.${starId},to_star_id.eq.${starId}`);

        if (connDeleteError) {
          console.error('연결 삭제 실패:', connDeleteError);
        }
      }

      // 별을 창고로 이동
      const { error } = await supabase
        .from('stars')
        .update({ in_sky: false })
        .eq('id', starId)
        .eq('user_id', user.id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error moving star to warehouse:', error);
      await refreshStars();
      return false;
    }
  }, [user, skyStars, connections, refreshStars]);

  // 창고 -> 밤하늘 이동
  const moveToSky = useCallback(async (starId) => {
    if (!user) return false;

    // 슬롯 확인
    if (skyStars.length >= maxSkySlots) {
      console.log('밤하늘 슬롯이 가득 찼습니다.');
      return false;
    }

    try {
      const { error } = await supabase
        .from('stars')
        .update({ in_sky: true })
        .eq('id', starId)
        .eq('user_id', user.id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error moving star to sky:', error);
      await refreshStars();
      return false;
    }
  }, [user, skyStars.length, maxSkySlots, refreshStars]);

  // 별 교체 (창고 별 <-> 밤하늘 별)
  const swapStars = useCallback(async (warehouseStarId, skyStarId) => {
    if (!user) return false;

    try {
      // 밤하늘 별을 창고로 이동 (연결선 삭제 포함)
      await moveToWarehouse(skyStarId);

      // 창고 별을 밤하늘로 이동
      const { error } = await supabase
        .from('stars')
        .update({ in_sky: true })
        .eq('id', warehouseStarId)
        .eq('user_id', user.id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error swapping stars:', error);
      await refreshStars();
      return false;
    }
  }, [user, moveToWarehouse, refreshStars]);

  // 슬롯 확장 (향후 결제/광고용)
  const expandSkySlots = useCallback(async (count) => {
    if (!user) return false;

    try {
      const newMaxSlots = maxSkySlots + count;

      const { error } = await supabase
        .from('profiles')
        .update({ max_sky_slots: newMaxSlots })
        .eq('id', user.id);

      if (error) throw error;

      setMaxSkySlots(newMaxSlots);
      return true;
    } catch (error) {
      console.error('Error expanding sky slots:', error);
      return false;
    }
  }, [user, maxSkySlots]);

  const value = {
    stars,
    setStars,
    skyStars,
    warehouseStars,
    maxSkySlots,
    starPositions,
    setStarPositions: updateStarPositions,
    connections,
    setConnections: updateConnections,
    loading,
    initialized,
    refreshStars,
    deleteStar,
    moveToWarehouse,
    moveToSky,
    swapStars,
    expandSkySlots,
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
