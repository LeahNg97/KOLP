import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './InstructorSidebar.css';

export default function InstructorSidebar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="instructor-sidebar">
      <div className="sidebar-header">
        <h2>Instructor Panel</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <Link 
              to="/instructor/courses" 
              className={`nav-link ${isActive('/instructor/courses') ? 'active' : ''}`}
            >
              📚 My Courses
            </Link>
          </li>
          <li>
            <Link 
              to="/instructor/students" 
              className={`nav-link ${isActive('/instructor/students') ? 'active' : ''}`}
            >
              👥 All Students
            </Link>
          </li>
          <li>
            <Link 
              to="/instructor/analytics" 
              className={`nav-link ${isActive('/instructor/analytics') ? 'active' : ''}`}
            >
              📈 Analytics
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
} 