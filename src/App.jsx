import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StarsProvider } from './contexts/StarsContext';
import { LanguageProvider } from './contexts/LanguageContext';
import LoadingPage from './pages/LoadingPage';
import SignupPage from './pages/SignupPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import AdminPage from './pages/AdminPage';
import StarryPage from './pages/StarryPage';
import StarsPage from './pages/StarsPage';
import HomePage from './pages/HomePage';
import StatPage from './pages/StatPage';
import StatDetailPage from './pages/StatDetailPage';
import UserPage from './pages/UserPage';
import NoticePage from './pages/NoticePage';
import NoticeDetailPage from './pages/NoticeDetailPage';
import SurveyStartPage from './pages/SurveyStartPage';
import SurveyQuestionPage from './pages/SurveyQuestionPage';
import FindEmailPage from './pages/FindEmailPage';
import FindPasswordPage from './pages/FindPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SkyDemoPage from './pages/SkyDemoPage';
import SkyPage from './pages/SkyPage';
import WarehousePage from './pages/WarehousePage';
import WelcomePage from './pages/WelcomePage';

// 로그인 필요 라우트 가드 (미인증 시 로그인 화면으로)
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

// 관리자 전용 라우트 가드
function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return children;
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <StarsProvider>
          <Router>
        <div className="mx-auto max-w-[430px] min-h-screen relative" style={{ boxShadow: '0 0 30px rgba(0,0,0,0.3)' }}>
        <Routes>
          <Route path="/" element={<LoadingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/find-email" element={<FindEmailPage />} />
          <Route path="/find-password" element={<FindPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profile-setup" element={<ProfileSetupPage />} />
          <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />

          {/* 네비게이션 바 페이지들 (로그인 필요) */}
          <Route path="/starry" element={<RequireAuth><StarryPage /></RequireAuth>} />
          <Route path="/stars" element={<RequireAuth><StarsPage /></RequireAuth>} />
          <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
          <Route path="/warehouse" element={<RequireAuth><WarehousePage /></RequireAuth>} />
          <Route path="/stat" element={<RequireAuth><StatPage /></RequireAuth>} />
          <Route path="/stat/detail" element={<RequireAuth><StatDetailPage /></RequireAuth>} />
          <Route path="/user" element={<RequireAuth><UserPage /></RequireAuth>} />
          <Route path="/notice" element={<RequireAuth><NoticePage /></RequireAuth>} />
          <Route path="/notice/:id" element={<RequireAuth><NoticeDetailPage /></RequireAuth>} />

          {/* 웰컴(마케팅) 페이지 */}
          <Route path="/welcome" element={<WelcomePage />} />

          {/* 설문 페이지 */}
          <Route path="/survey/:userId" element={<SurveyStartPage />} />
          <Route path="/survey/:userId/questions" element={<SurveyQuestionPage />} />

          {/* 3D 밤하늘 */}
          <Route path="/sky" element={<RequireAuth><SkyPage /></RequireAuth>} />
          <Route path="/sky-demo" element={<SkyDemoPage />} />

          {/* 추후 페이지 라우트 추가 예정 */}
          {/* <Route path="/login" element={<LoginPage />} /> */}
          {/* <Route path="/u/:userId" element={<NightSkyPage />} /> */}
        </Routes>
        </div>
          </Router>
        </StarsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
