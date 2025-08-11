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
          <span className="logo-subtitle">Online Learning Platform</span>
        </Link>
      </div>


      <div className="navbar-menu">
        {user?.role === 'admin' && (
          <>
            <Link to="/admin" className="nav-link">

              Admin Dashboard
            </Link>
            <Link to="/admin/users" className="nav-link">

              Manage Users
            </Link>
            <Link to="/admin/courses" className="nav-link">

              Manage Courses
            </Link>
            <Link to="/admin/certificates" className="nav-link">

              Certificate Management
            </Link>
            <Link to="/admin/analytics" className="nav-link">

              Quiz Results / Analytics
            </Link>

          </>
        )}


        {user?.role === 'instructor' && (
          <>
            <Link to="/instructor/courses" className="nav-link">
              My Courses
            </Link>
            <Link to="/instructor/students" className="nav-link">
              All Students
            </Link>
            <Link to="/instructor/analytics" className="nav-link">
              Analytics
            </Link>
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
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            {/* <span className="user-role">{user?.role}</span> */}
          </div>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Log Out
        </button>
      </div>


      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </nav>
  );
}





