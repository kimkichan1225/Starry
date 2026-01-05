import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoadingPage from './pages/LoadingPage';
import SignupPage from './pages/SignupPage';
import MainPage from './pages/MainPage';
import StarryPage from './pages/StarryPage';
import StarsPage from './pages/StarsPage';
import HomePage from './pages/HomePage';
import StatPage from './pages/StatPage';
import UserPage from './pages/UserPage';
import NoticePage from './pages/NoticePage';
import NoticeDetailPage from './pages/NoticeDetailPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoadingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/main" element={<MainPage />} />

        {/* 네비게이션 바 페이지들 */}
        <Route path="/starry" element={<StarryPage />} />
        <Route path="/stars" element={<StarsPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/stat" element={<StatPage />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/notice" element={<NoticePage />} />
        <Route path="/notice/:id" element={<NoticeDetailPage />} />

        {/* 추후 페이지 라우트 추가 예정 */}
        {/* <Route path="/login" element={<LoginPage />} /> */}
        {/* <Route path="/u/:userId" element={<NightSkyPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
