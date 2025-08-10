import { NavLink } from 'react-router-dom';
import './AdminSidebar.css';

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <h2 className="admin-sidebar-title">Admin Panel</h2>
      <nav className="admin-sidebar-nav">
        <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : ''}>
          🏠 Dashboard
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>
          👥 User Management
        </NavLink>
        <NavLink to="/admin/courses" className={({ isActive }) => isActive ? 'active' : ''}>
          📚 Course Management
        </NavLink>
        <NavLink to="/admin/certificates" className={({ isActive }) => isActive ? 'active' : ''}>
          🎓 Certificate Management
        </NavLink>
        <NavLink to="/admin/analytics" className={({ isActive }) => isActive ? 'active' : ''}>
          📊 Quiz Results / Analytics
        </NavLink>
      </nav>
    </aside>
  );
} 