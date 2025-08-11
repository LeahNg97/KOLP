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
import InstructorCourses from './instructor/pages/InstructorCourses'; 
import CourseStudents from './instructor/pages/CourseStudents';
import CourseContentManagement from './instructor/pages/CourseContentManagement';
import CreateCourse from './instructor/pages/CreateCourse';
import QuizManagement from './instructor/pages/QuizManagement';
import StudentManagement from './instructor/pages/StudentManagement';
import InstructorAnalytics from './instructor/pages/Analytics';
import AdminDashboard from './admin/pages/AdminDashboard';
import UserManagement from './admin/pages/UserManagement';
import CourseManagement from './admin/pages/CourseManagement';
import CertificateManagement from './admin/pages/CertificateManagement';
import QuizResultsAnalytics from './admin/pages/QuizResultsAnalytics';

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
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/courses" element={<CourseManagement />} />
        <Route path="/admin/certificates" element={<CertificateManagement />} />
        <Route path="/admin/analytics" element={<QuizResultsAnalytics />} />
        
        {/* Instructor routes */}
        <Route path="/instructor/courses" element={<InstructorCourses />} />
        <Route path="/instructor/courses/create" element={<CreateCourse />} />
        <Route path="/instructor/courses/:courseId/students" element={<CourseStudents />} />
        <Route path="/instructor/courses/:courseId/content" element={<CourseContentManagement />} />
        <Route path="/instructor/courses/:courseId/quiz" element={<QuizManagement />} />
        <Route path="/instructor/students" element={<StudentManagement />} />
        <Route path="/instructor/analytics" element={<InstructorAnalytics />} />
       

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