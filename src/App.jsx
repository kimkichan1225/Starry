import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoadingPage from './pages/LoadingPage';
import SignupPage from './pages/SignupPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import StarryPage from './pages/StarryPage';
import StarsPage from './pages/StarsPage';
import HomePage from './pages/HomePage';
import StatPage from './pages/StatPage';
import UserPage from './pages/UserPage';
import NoticePage from './pages/NoticePage';
import NoticeDetailPage from './pages/NoticeDetailPage';
import SurveyStartPage from './pages/SurveyStartPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoadingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profile-setup" element={<ProfileSetupPage />} />

          {/* 네비게이션 바 페이지들 */}
          <Route path="/starry" element={<StarryPage />} />
          <Route path="/stars" element={<StarsPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/stat" element={<StatPage />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/notice" element={<NoticePage />} />
          <Route path="/notice/:id" element={<NoticeDetailPage />} />

          {/* 설문 페이지 */}
          <Route path="/survey/:userId" element={<SurveyStartPage />} />

          {/* 추후 페이지 라우트 추가 예정 */}
          {/* <Route path="/login" element={<LoginPage />} /> */}
          {/* <Route path="/u/:userId" element={<NightSkyPage />} /> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
