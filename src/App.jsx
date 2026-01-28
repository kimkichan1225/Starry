import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoadingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/find-email" element={<FindEmailPage />} />
          <Route path="/find-password" element={<FindPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profile-setup" element={<ProfileSetupPage />} />
          <Route path="/admin" element={<AdminPage />} />

          {/* 네비게이션 바 페이지들 */}
          <Route path="/starry" element={<StarryPage />} />
          <Route path="/stars" element={<StarsPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/stat" element={<StatPage />} />
          <Route path="/stat/detail" element={<StatDetailPage />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/notice" element={<NoticePage />} />
          <Route path="/notice/:id" element={<NoticeDetailPage />} />

          {/* 설문 페이지 */}
          <Route path="/survey/:userId" element={<SurveyStartPage />} />
          <Route path="/survey/:userId/questions" element={<SurveyQuestionPage />} />

          {/* 3D 밤하늘 데모 */}
          <Route path="/sky-demo" element={<SkyDemoPage />} />

          {/* 추후 페이지 라우트 추가 예정 */}
          {/* <Route path="/login" element={<LoginPage />} /> */}
          {/* <Route path="/u/:userId" element={<NightSkyPage />} /> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
