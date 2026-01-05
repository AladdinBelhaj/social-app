import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { user, profile, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          SocialApp
        </Link>
        <div className="nav-links">
          {user ? (
            <>
              <Link to="/profile" className="nav-link">
                Profile
              </Link>
              <Link to="/friends" className="nav-link">
                Friends
              </Link>
              <span className="nav-username">@{profile?.username}</span>
              <button onClick={logout} className="nav-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
