import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './auth/Login';
import Register from './auth/Register';

// tạo nội dung chính của ứng dụng
function AppContent() {
  const location = useLocation();
  const hideNavbar = ['/login', '/register', '/'].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Admin routes */}
        {/* <Route path="/admin" element={<AdminDashboard />} /> */}
        {/* Instructor routes */}
        {/* <Route path="/instructor/courses" element={<InstructorCourses />} /> */}
        {/* Student routes */}
        {/* <Route path="/student" element={<StudentDashboard />} /> */}
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>// context provider để quản lý trạng thái xác thực người dùng, người dùng là ai
      <BrowserRouter>// Router để quản lý các route trong ứng dụng, các đường dẫn URL
        <AppContent />// Component chính của ứng dụng, nơi chứa các route và nội dung chính
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;