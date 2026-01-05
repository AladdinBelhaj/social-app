import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Home() {
  const { user } = useAuth();

  return (
    <div className="home-container">
      <div className="hero">
        <h1>Welcome to SocialApp</h1>
        <p>Connect with friends and build your social network</p>
        {!user ? (
          <div className="hero-actions">
            <Link to="/register" className="btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn-secondary">
              Login
            </Link>
          </div>
        ) : (
          <div className="hero-actions">
            <Link to="/profile" className="btn-primary">
              View Profile
            </Link>
            <Link to="/friends" className="btn-secondary">
              Find Friends
            </Link>
          </div>
        )}
      </div>
      <div className="features">
        <div className="feature">
          <h3>Create Your Profile</h3>
          <p>Set up your profile with a bio and avatar</p>
        </div>
        <div className="feature">
          <h3>Connect with Friends</h3>
          <p>Send and accept friend requests</p>
        </div>
        <div className="feature">
          <h3>Build Your Network</h3>
          <p>Grow your social circle and stay connected</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
