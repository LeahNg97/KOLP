import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './auth/Login';
import Register from './auth/Register';
import StudentDashboard from './student/pages/StudentDashboard';
import StudentCourse from './student/pages/StudentCourse';
import CourseDetail from './student/pages/CourseDetail';
import CertificatePage from './student/pages/CetificatePage';
import CertificateDetail from './student/pages/CetificateDetail';

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
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/my-courses" element={<StudentCourse />} />
        <Route path="/student/courses/:courseId" element={<CourseDetail />} />
        <Route path="/student/certificates" element={<CertificatePage />} />
        <Route path="/student/certificates/:certificateId" element={<CertificateDetail />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
       {/* // context provider để quản lý trạng thái xác thực người dùng, người dùng là ai */}
      <BrowserRouter> 
      {/* // Router để quản lý các route trong ứng dụng, các đường dẫn URL */}
        <AppContent /> 
        {/* // Component chính của ứng dụng, nơi chứa các route và nội dung chính */}
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;