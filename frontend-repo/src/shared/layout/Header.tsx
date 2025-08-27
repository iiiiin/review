import { useAuthStore } from '@/shared/store/authStore';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onLogoClick?: () => void;
  activeSection?: string;
}

const Header = ({ onLogoClick, activeSection }: HeaderProps) => {
  const { isLoggedIn, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === '/';

  // 'hero' 또는 'cta-section'일 때 투명 테마를 적용
  const isTransparentTheme = isLandingPage && (activeSection === 'hero' || activeSection === 'cta-section');

  const headerClasses = `
    h-16 flex items-center justify-between px-6 transition-all duration-300 ease-in-out
    ${isLandingPage
      ? `fixed top-0 left-0 right-0 z-50 ${isTransparentTheme ? 'bg-transparent' : 'bg-white shadow-md'}`
      : 'relative bg-white shadow-md'
    }
  `;

  const linkColorClasses = isTransparentTheme ? 'text-white' : 'text-gray-600';
  const hoverColorClasses = isTransparentTheme ? 'hover:text-gray-200' : 'hover:text-blue-600';
  const logoColorClasses = isTransparentTheme ? 'text-white' : 'text-blue-600';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else if (isLandingPage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleProtectedNavigation = (path: string) => {
    if (!isLoggedIn) {
      navigate('/auth/login');
    } else {
      navigate(path);
    }
  };

  return (
    <header className={headerClasses}>
      <div className="flex items-center">
        <Link to="/" onClick={handleLogoClick} className={`text-2xl font-bold ${logoColorClasses}`}>
          Re:View
        </Link>
      </div>
      <div className="flex items-center space-x-10">
        <nav className="hidden md:flex items-center space-x-10">
          <button 
            onClick={() => handleProtectedNavigation('/interview')}
            className={`${linkColorClasses} ${hoverColorClasses} cursor-pointer`}
          >
            실전 모의면접
          </button>
          <button 
            onClick={() => handleProtectedNavigation('/results')}
            className={`${linkColorClasses} ${hoverColorClasses} cursor-pointer`}
          >
            AI 피드백
          </button>
        </nav>
        <div className="flex items-center space-x-6">
          {isLoggedIn ? (
            <>
              <button 
                onClick={() => handleProtectedNavigation('/profile')}
                className={`${linkColorClasses} ${hoverColorClasses} cursor-pointer`}
              >
                마이 페이지
              </button>
              <button
                onClick={handleLogout}
                className={`px-4 py-2 rounded-md transition-colors duration-300 ${isTransparentTheme 
                  ? 'bg-white/20 border border-white hover:bg-white hover:text-gray-900 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/auth/login" className={`${linkColorClasses} ${hoverColorClasses}`}>
                로그인
              </Link>
              <Link
                to="/auth/register"
                className={`px-4 py-2 rounded-md transition-colors duration-300 ${isTransparentTheme 
                  ? 'bg-white/20 border border-white hover:bg-white hover:text-gray-900 text-white' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;