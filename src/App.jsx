import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoadingPage from './pages/LoadingPage';
import SignupPage from './pages/SignupPage';
import MainPage from './pages/MainPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoadingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/main" element={<MainPage />} />
        {/* 추후 페이지 라우트 추가 예정 */}
        {/* <Route path="/login" element={<LoginPage />} /> */}
        {/* <Route path="/u/:userId" element={<NightSkyPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
