import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import UserProfile from './UserProfile';
import './Navbar.css';


export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [showProfile, setShowProfile] = useState(false);


  const handleLogout = () => {
    logout();
    navigate('/');
  };


  const handleProfileClick = () => {
    setShowProfile(true);
  };


  if (!isAuthenticated()) {
    return null; // Don't show navbar for unauthenticated users
  }


  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">KOLP</span>
          <span className="logo-subtitle">Learning Platform</span>
        </Link>
      </div>


      <div className="navbar-menu">
        {user?.role === 'admin' && (
          <>
          </>
        )}


        {user?.role === 'instructor' && (
          <>
          </>
        )}


        {user?.role === 'student' && (
          <>
            <Link to="/student" className="nav-link">
              <span className="nav-icon">📚</span>
              All Courses
            </Link>
            <Link to="/student/my-courses" className="nav-link">
              <span className="nav-icon">🎓</span>
              My Courses
            </Link>
            <Link to="/student/certificates" className="nav-link">
              <span className="nav-icon">📄</span>
              Certificates
            </Link>
          </>
        )}
      </div>


      <div className="navbar-user">
        <div className="user-info" onClick={handleProfileClick}>
          <span className="user-avatar">👤</span>
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-button">
          <span className="logout-icon">🚪</span>
          Đăng xuất
        </button>
      </div>


      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </nav>
  );
}





