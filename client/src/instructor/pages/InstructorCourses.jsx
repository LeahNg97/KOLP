import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyCourses, deleteCourse, updateCourseStatus } from '../api/courseApi';
import InstructorSidebar from '../components/InstructorSidebar';
import InstructorCourseCard from '../components/InstructorCourseCard';
import './InstructorCourses.css';

export default function InstructorCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await getMyCourses();
      setCourses(coursesData);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (courseId, newStatus) => {
    setUpdatingStatus(courseId);
    try {
      await updateCourseStatus(courseId, newStatus);
      // Update local state
      setCourses(courses.map(course => 
        course._id === courseId 
          ? { ...course, status: newStatus }
          : course
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update course status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    setDeletingId(courseId);
    try {
      await deleteCourse(courseId);
      setCourses(courses.filter(course => course._id !== courseId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setDeletingId(null);
    }
  };



  if (loading) {
    return (
      <div className="instructor-layout">
        <InstructorSidebar />
        <main className="instructor-main">
          <div className="loading">Loading your courses...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="instructor-layout">
      <InstructorSidebar />
      <main className="instructor-main">
        <div className="instructor-courses">
          <div className="courses-header">
            <div className="header-content">
              <h1>My Courses</h1>
              <p>Manage and organize your course content</p>
            </div>
            <Link to="/instructor/create-course" className="create-course-btn">
              + Create New Course
            </Link>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {courses.length === 0 ? (
            <div className="no-courses">
              <div className="no-courses-icon">📚</div>
              <h2>No courses yet</h2>
              <p>Start building your first course to share your knowledge with students.</p>
              <Link to="/instructor/create-course" className="create-first-course-btn">
                Create Your First Course
              </Link>
            </div>
          ) : (
            <>
              <div className="courses-grid">
                {courses.map((course, index) => (
                  <InstructorCourseCard
                    key={course._id}
                    course={course}
                    onDelete={handleDelete}
                    onViewStudents={(id) => navigate(`/instructor/courses/${id}/students`)}
                    onManageContent={(id) => {
                      console.log('Navigating to content management for course:', id);
                      console.log('Target URL:', `/instructor/courses/${id}/content`);
                      navigate(`/instructor/courses/${id}/content`);
                    }}
                    onManageQuiz={(id) => navigate(`/instructor/courses/${id}/quiz`)}
                    onStatusUpdate={handleStatusUpdate}
                    deletingId={deletingId}
                    updatingStatus={updatingStatus}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
} 