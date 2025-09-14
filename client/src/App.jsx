import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './auth/Login';
import Register from './auth/Register';


import AdminDashboard from './admin/pages/AdminDashboard';
import UserManagement from './admin/pages/UserManagement';
import CourseManagement from './admin/pages/CourseManagement';
import AdminWorkshopManagement from './admin/pages/WorkshopManagement';
import CertificateManagement from './admin/pages/CertificateManagement';
import QuizResultsAnalytics from './admin/pages/QuizResultsAnalytics';

import InstructorCourses from './instructor/pages/InstructorCourses';
import CourseStudents from './instructor/pages/CourseStudents';
import CourseContentManagement from './instructor/pages/CourseContentManagement';
import CreateCourse from './instructor/pages/CreateCourse';
import QuizManagement from './instructor/pages/QuizManagement';
import ShortQuestionManagement from './instructor/pages/ShortQuestionManagement';
import ShortQuestionGrading from './instructor/components/ShortQuestionGrading';
import ShortQuestionGradeForm from './instructor/components/ShortQuestionGradeForm';
import StudentManagement from './instructor/pages/StudentManagement';
import InstructorAnalytics from './instructor/pages/Analytics';
import WorkshopManagement from './instructor/pages/WorkshopManagement';


import StudentDashboard from './student/pages/StudentDashboard';
import StudentCourse from './student/pages/StudentCourse';
import CourseDetail from './student/pages/CourseDetail';
import CourseDetailLearning from './student/pages/CourseDetailLearning';
import CertificatePage from './student/pages/CertificatePage';
import CertificateDetail from './student/pages/CertificateDetail';
import Quiz from './student/components/Quiz';
import ShortQuestion from './student/components/ShortQuestion';
import ShortQuestionResults from './student/components/ShortQuestionResults';
import QuizProgressCard from './student/components/QuizProgressCard';
import WorkshopList from './student/pages/WorkshopList';

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
        <Route path="/admin/workshops" element={<AdminWorkshopManagement />} />
        <Route path="/admin/certificates" element={<CertificateManagement />} />
        <Route path="/admin/analytics" element={<QuizResultsAnalytics />} />
        {/* Instructor routes */}
        <Route path="/instructor/courses" element={<InstructorCourses />} />
        <Route path="/instructor/workshops" element={<WorkshopManagement />} />
        <Route path="/instructor/create-course" element={<CreateCourse />} />
        <Route path="/instructor/courses/:courseId/students" element={<CourseStudents />} />
        <Route path="/instructor/courses/:courseId/content" element={<CourseContentManagement />} />
        <Route path="/instructor/courses/:courseId/quiz" element={<QuizManagement />} />
        <Route path="/instructor/courses/:courseId/short-questions" element={<ShortQuestionManagement />} />
        <Route path="/instructor/courses/:courseId/short-question/grading" element={<ShortQuestionGrading />} />
        <Route path="/instructor/courses/:courseId/short-question/grade/:progressId" element={<ShortQuestionGradeForm />} />
        <Route path="/instructor/students" element={<StudentManagement />} />
        <Route path="/instructor/analytics" element={<InstructorAnalytics />} />
        {/* Student routes */}
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/my-courses" element={<StudentCourse />} />
        <Route path="/student/workshops" element={<WorkshopList />} />
        <Route path="/student/courses/:courseId" element={<CourseDetail />} />
        <Route path="/student/courses/:courseId/learn" element={<CourseDetailLearning />} />
        <Route path="/student/courses/:courseId/quiz" element={<Quiz />} />
        <Route path="/student/courses/:courseId/short-question/:shortQuestionId" element={<ShortQuestion />} />
        <Route path="/student/courses/:courseId/short-question/:shortQuestionId/results" element={<ShortQuestionResults />} />
        <Route path="/student/certificates" element={<CertificatePage />} />
        <Route path="/student/certificates/:certificateId" element={<CertificateDetail />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
