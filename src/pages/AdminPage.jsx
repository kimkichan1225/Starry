import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAILS } from '../config/admin';

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // 통계 데이터
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStars: 0,
    totalConnections: 0,
    todayUsers: 0,
    surveyVisits: 0
  });

  // 회원 관리
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // 공지사항 관리
  const [notices, setNotices] = useState([]);
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', category: '일반' });
  const [editingNotice, setEditingNotice] = useState(null);
  const [noticesLoading, setNoticesLoading] = useState(false);

  // 설정
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowSignup: true
  });

  // 관리자 권한 체크
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/');
      return;
    }

    if (!ADMIN_EMAILS.includes(user.email)) {
      navigate('/starry');
      return;
    }

    setLoading(false);
    fetchStats();
    fetchSettings();
  }, [user, authLoading, navigate]);

  // 설정 불러오기
  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['maintenanceMode', 'allowSignup']);

      if (!error && data) {
        const settingsObj = { maintenanceMode: false, allowSignup: true };
        data.forEach(item => {
          settingsObj[item.key] = item.value;
        });
        setSettings(settingsObj);
      }
    } catch (error) {
      console.error('설정 불러오기 실패:', error);
    }
  };

  // 설정 저장하기
  const saveSettings = async () => {
    try {
      // maintenanceMode 저장
      await supabase
        .from('settings')
        .upsert({
          key: 'maintenanceMode',
          value: settings.maintenanceMode,
          updated_at: new Date().toISOString()
        });

      // allowSignup 저장
      await supabase
        .from('settings')
        .upsert({
          key: 'allowSignup',
          value: settings.allowSignup,
          updated_at: new Date().toISOString()
        });

      alert('설정이 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
    }
  };

  // 통계 데이터 가져오기
  const fetchStats = async () => {
    try {
      // 총 회원 수
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 총 별 수
      const { count: starCount } = await supabase
        .from('stars')
        .select('*', { count: 'exact', head: true });

      // 총 연결 수
      const { count: connectionCount } = await supabase
        .from('star_connections')
        .select('*', { count: 'exact', head: true });

      // 오늘 가입한 회원 수
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // 설문 참여자 수 (별을 준 고유 설문자 수)
      const { data: surveyData } = await supabase
        .from('stars')
        .select('surveyor_name');

      let uniqueSurveyors = 0;
      if (surveyData && surveyData.length > 0) {
        const names = surveyData.map(s => s.surveyor_name).filter(name => name);
        uniqueSurveyors = new Set(names).size;
      }

      setStats({
        totalUsers: userCount || 0,
        totalStars: starCount || 0,
        totalConnections: connectionCount || 0,
        todayUsers: todayCount || 0,
        surveyVisits: uniqueSurveyors
      });
    } catch (error) {
      console.error('통계 조회 실패:', error);
    }
  };

  // 회원 목록 가져오기
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (userSearch) {
        query = query.or(`nickname.ilike.%${userSearch}%,email.ilike.%${userSearch}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;

      // 각 사용자의 받은 별 수 조회
      if (data && data.length > 0) {
        const userIds = data.map(u => u.id);
        const { data: starsData } = await supabase
          .from('stars')
          .select('user_id')
          .in('user_id', userIds);

        // 별 수 카운트
        const starCounts = {};
        if (starsData) {
          starsData.forEach(star => {
            starCounts[star.user_id] = (starCounts[star.user_id] || 0) + 1;
          });
        }

        // 사용자 데이터에 별 수 추가
        const usersWithStars = data.map(u => ({
          ...u,
          star_count: starCounts[u.id] || 0
        }));

        setUsers(usersWithStars);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('회원 조회 실패:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  // 회원 삭제
  const handleDeleteUser = async (userId, userEmail) => {
    if (!confirm(`정말 "${userEmail}" 회원을 삭제하시겠습니까?\n관련된 모든 데이터가 삭제됩니다.`)) {
      return;
    }

    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: userId
      });

      if (error) throw error;

      alert('회원이 삭제되었습니다.');
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('회원 삭제 실패:', error);
      alert('회원 삭제에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    }
  };

  // 공지사항 목록 가져오기
  const fetchNotices = async () => {
    setNoticesLoading(true);
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
      setNotices([]);
    } finally {
      setNoticesLoading(false);
    }
  };

  // 공지사항 저장
  const handleSaveNotice = async (e) => {
    e.preventDefault();
    if (!noticeForm.title || !noticeForm.content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      if (editingNotice) {
        // 수정
        const { error } = await supabase
          .from('notices')
          .update({
            title: noticeForm.title,
            content: noticeForm.content,
            category: noticeForm.category,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingNotice.id);

        if (error) throw error;
        alert('공지사항이 수정되었습니다.');
      } else {
        // 새로 작성 - 가장 낮은 sort_order 찾기 (맨 위에 추가)
        const minOrder = notices.length > 0
          ? Math.min(...notices.map(n => n.sort_order ?? 999)) - 1
          : 0;

        const { error } = await supabase
          .from('notices')
          .insert({
            title: noticeForm.title,
            content: noticeForm.content,
            category: noticeForm.category,
            author_id: user.id,
            sort_order: minOrder
          });

        if (error) throw error;
        alert('공지사항이 등록되었습니다.');
      }

      setNoticeForm({ title: '', content: '', category: '일반' });
      setEditingNotice(null);
      fetchNotices();
    } catch (error) {
      console.error('공지사항 저장 실패:', error);
      alert('공지사항 저장에 실패했습니다.\n(notices 테이블이 없을 수 있습니다)');
    }
  };

  // 공지사항 삭제
  const handleDeleteNotice = async (noticeId) => {
    if (!confirm('이 공지사항을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', noticeId);

      if (error) throw error;
      alert('공지사항이 삭제되었습니다.');
      fetchNotices();
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
      alert('공지사항 삭제에 실패했습니다.');
    }
  };

  // 공지사항 수정 모드
  const handleEditNotice = (notice) => {
    setEditingNotice(notice);
    setNoticeForm({
      title: notice.title,
      content: notice.content,
      category: notice.category || '일반'
    });
  };

  // 공지사항 순서 변경
  const handleMoveNotice = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === notices.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentNotice = notices[index];
    const targetNotice = notices[targetIndex];

    try {
      // 두 공지사항의 sort_order를 서로 교환
      const currentOrder = currentNotice.sort_order ?? index;
      const targetOrder = targetNotice.sort_order ?? targetIndex;

      await supabase
        .from('notices')
        .update({ sort_order: targetOrder })
        .eq('id', currentNotice.id);

      await supabase
        .from('notices')
        .update({ sort_order: currentOrder })
        .eq('id', targetNotice.id);

      fetchNotices();
    } catch (error) {
      console.error('순서 변경 실패:', error);
      alert('순서 변경에 실패했습니다.');
    }
  };

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'notices') {
      fetchNotices();
    }
  }, [activeTab]);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/BackGround.jpg)' }}
        ></div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-white text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a1a]">
      {/* 배경 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#0a0a1a]"></div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 상단 헤더 */}
        <header className="bg-[#1a1a2e]/80 backdrop-blur-sm px-6 py-4 flex justify-between items-center border-b border-white/10">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-white font-bold text-xl">STARRY 관리자</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
          >
            로그아웃
          </button>
        </header>

        {/* 탭 네비게이션 */}
        <div className="bg-[#1a1a2e]/50 px-6 py-2 flex gap-1 border-b border-white/10 overflow-x-auto">
          {[
            { id: 'dashboard', label: '대시보드', icon: '📊' },
            { id: 'users', label: '회원관리', icon: '👥' },
            { id: 'notices', label: '공지사항', icon: '📢' },
            { id: 'settings', label: '설정', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-white/70 hover:bg-white/10'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          {/* 대시보드 탭 */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-white text-xl font-bold">대시보드</h2>
                <button
                  onClick={fetchStats}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="통계 새로고침"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {/* 통계 카드들 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
                  <div className="text-blue-400 text-sm mb-1">총 회원 수</div>
                  <div className="text-white text-3xl font-bold">{stats.totalUsers}</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
                  <div className="text-yellow-400 text-sm mb-1">총 별 수</div>
                  <div className="text-white text-3xl font-bold">{stats.totalStars}</div>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
                  <div className="text-green-400 text-sm mb-1">총 연결 수</div>
                  <div className="text-white text-3xl font-bold">{stats.totalConnections}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
                  <div className="text-purple-400 text-sm mb-1">오늘 가입</div>
                  <div className="text-white text-3xl font-bold">{stats.todayUsers}</div>
                </div>
              </div>

              {/* 서비스 이용 통계 */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-medium mb-4">서비스 이용 통계</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* 설문 페이지 접속자 수 */}
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/50 text-xs mb-1">설문 참여자 수</div>
                    <div className="text-white text-xl font-bold">
                      {stats.surveyVisits}
                      <span className="text-sm font-normal text-white/50 ml-1">명</span>
                    </div>
                  </div>

                  {/* 설문 참여율 */}
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/50 text-xs mb-1">설문 참여율</div>
                    <div className="text-white text-xl font-bold">
                      {stats.totalUsers > 0 ? Math.min(((stats.totalStars / stats.totalUsers) / 30 * 100), 100).toFixed(0) : 0}
                      <span className="text-sm font-normal text-white/50 ml-1">%</span>
                    </div>
                  </div>

                  {/* 페이지 방문자 (추후 구현) */}
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/50 text-xs mb-1">오늘 방문자</div>
                    <div className="text-white/30 text-xl font-bold">
                      -
                      <span className="text-xs font-normal ml-1">(준비중)</span>
                    </div>
                  </div>

                  {/* 주간 활성 사용자 (추후 구현) */}
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/50 text-xs mb-1">주간 활성 사용자</div>
                    <div className="text-white/30 text-xl font-bold">
                      -
                      <span className="text-xs font-normal ml-1">(준비중)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 회원관리 탭 */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-white text-xl font-bold">회원 관리</h2>
                <span className="text-white/50 text-sm">총 {users.length}명</span>
              </div>

              {/* 검색 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="닉네임 또는 이메일 검색"
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={fetchUsers}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  검색
                </button>
              </div>

              {/* 회원 목록 */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                {usersLoading ? (
                  <div className="p-8 text-center text-white/50">로딩 중...</div>
                ) : users.length === 0 ? (
                  <div className="p-8 text-center text-white/50">회원이 없습니다.</div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {users.map((u) => (
                      <div key={u.id} className="p-4 hover:bg-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium truncate">{u.nickname || '(닉네임 없음)'}</span>
                              {u.social_linked && (
                                <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded">소셜</span>
                              )}
                            </div>
                            <div className="text-white/50 text-sm truncate">{u.email}</div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="px-3 py-1 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 text-sm"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="text-white/30">
                            가입일: {new Date(u.created_at).toLocaleDateString('ko-KR')}
                          </span>
                          <span className="text-yellow-400/70">
                            별 {u.star_count || 0}개
                          </span>
                          <span className="text-purple-400/70">
                            슬롯 {u.max_sky_slots || 30}개
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 공지사항 탭 */}
          {activeTab === 'notices' && (
            <div className="space-y-4">
              <h2 className="text-white text-xl font-bold">공지사항 관리</h2>

              {/* 공지사항 작성 폼 */}
              <form onSubmit={handleSaveNotice} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 space-y-3">
                <h3 className="text-white font-medium">
                  {editingNotice ? '공지사항 수정' : '새 공지사항 작성'}
                </h3>
                <div className="flex gap-2">
                  <select
                    value={noticeForm.category}
                    onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="일반" className="bg-[#1a1a2e]">일반</option>
                    <option value="중요" className="bg-[#1a1a2e]">중요</option>
                    <option value="이벤트" className="bg-[#1a1a2e]">이벤트</option>
                  </select>
                  <input
                    type="text"
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                    placeholder="제목"
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <textarea
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  placeholder="내용"
                  rows={4}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    {editingNotice ? '수정하기' : '등록하기'}
                  </button>
                  {editingNotice && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNotice(null);
                        setNoticeForm({ title: '', content: '', category: '일반' });
                      }}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm"
                    >
                      취소
                    </button>
                  )}
                </div>
              </form>

              {/* 공지사항 목록 */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                <div className="p-3 border-b border-white/10">
                  <span className="text-white/70 text-sm">공지사항 목록 ({notices.length}개)</span>
                </div>
                {noticesLoading ? (
                  <div className="p-8 text-center text-white/50">로딩 중...</div>
                ) : notices.length === 0 ? (
                  <div className="p-8 text-center text-white/50">
                    공지사항이 없습니다.
                    <br />
                    <span className="text-xs">(notices 테이블이 필요합니다)</span>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {notices.map((notice, index) => (
                      <div key={notice.id} className="p-4 hover:bg-white/5">
                        <div className="flex items-start justify-between">
                          {/* 순서 변경 버튼 */}
                          <div className="flex flex-col gap-1 mr-3">
                            <button
                              onClick={() => handleMoveNotice(index, 'up')}
                              disabled={index === 0}
                              className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              title="위로 이동"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleMoveNotice(index, 'down')}
                              disabled={index === notices.length - 1}
                              className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              title="아래로 이동"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white/40 text-xs w-6">{index + 1}</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                notice.category === '중요' ? 'bg-red-500/20 text-red-300' :
                                notice.category === '이벤트' ? 'bg-green-500/20 text-green-300' :
                                'bg-gray-500/20 text-gray-300'
                              }`}>
                                {notice.category || '일반'}
                              </span>
                              <span className="text-white font-medium">{notice.title}</span>
                            </div>
                            <p className="text-white/60 text-sm line-clamp-2 ml-6">{notice.content}</p>
                            <div className="text-white/30 text-xs mt-1 ml-6">
                              {new Date(notice.created_at).toLocaleDateString('ko-KR')}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditNotice(notice)}
                              className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 text-sm"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteNotice(notice.id)}
                              className="px-3 py-1 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 text-sm"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 설정 탭 */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <h2 className="text-white text-xl font-bold">설정</h2>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 space-y-4">
                {/* 점검 모드 */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">점검 모드</div>
                    <div className="text-white/50 text-sm">활성화 시 일반 사용자 접근 차단</div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                    className={`w-14 h-7 rounded-full transition-colors relative ${
                      settings.maintenanceMode ? 'bg-red-500' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                      settings.maintenanceMode ? 'translate-x-8' : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>

                {/* 회원가입 허용 */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">회원가입 허용</div>
                    <div className="text-white/50 text-sm">비활성화 시 새 회원가입 차단</div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, allowSignup: !settings.allowSignup })}
                    className={`w-14 h-7 rounded-full transition-colors relative ${
                      settings.allowSignup ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                      settings.allowSignup ? 'translate-x-8' : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>
              </div>

              {/* 저장 버튼 */}
              <button
                onClick={saveSettings}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                설정 저장
              </button>
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="pb-4 px-6 text-center border-t border-white/10 pt-4">
          <p className="text-white/50 text-xs">STARRY Admin Panel v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
