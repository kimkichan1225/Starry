import { useNavigate, useLocation } from 'react-router-dom';

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 1, name: '스타리', path: '/starry', icon: 'Btn_1Starry' },
    { id: 2, name: '별 보관함', path: '/stars', icon: 'Btn_2Stars' },
    { id: 3, name: '내 밤하늘', path: '/home', icon: 'Btn_3Home' },
    { id: 4, name: '통계 통계', path: '/stat', icon: 'Btn_4Stat' },
    { id: 5, name: '마이페이지', path: '/user', icon: 'Btn_5User' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#030025] z-50">
      <div className="flex justify-center items-center gap-6 py-3 max-w-screen-xl mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const iconSrc = isActive
            ? `/${item.icon}_On.png`
            : `/${item.icon}_Off.png`;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 transition-all px-1 ${
                isActive ? 'drop-shadow-[0_0_16px_rgba(97,85,245,1)]' : ''
              }`}
            >
              <img
                src={iconSrc}
                alt={item.name}
                className="h-9 w-auto object-contain"
              />
              <span className={`text-[8px] ${isActive ? 'text-white' : 'text-gray-400'}`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default NavBar;
