import React, { useState, useEffect } from 'react';
import { getMyCourses, deleteCourse } from '../api/courseApi';
import InstructorCourseCard from '../components/InstructorCourseCard';
import './InstructorCourses.css';

export default function InstructorCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getMyCourses();
      setCourses(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      setDeletingId(courseId);
      await deleteCourse(courseId);
      setCourses(courses.filter(course => course._id !== courseId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditCourse = (courseId) => {
    // TODO: Navigate to edit course page
    console.log('Edit course:', courseId);
  };

  const handleViewStudents = (courseId) => {
    // Navigate to view students page
    window.location.href = `/instructor/courses/${courseId}/students`;
  };

  const handleManageContent = (courseId) => {
    // Navigate to manage content page
    window.location.href = `/instructor/courses/${courseId}/content`;
  };

  const handleManageQuiz = (courseId) => {
    // Navigate to quiz management page
    window.location.href = `/instructor/courses/${courseId}/quiz`;
  };

  const handleCreateCourse = () => {
    // Navigate to create course page
    window.location.href = '/instructor/courses/create';
  };

  // Note: Course status management is admin-only functionality
  // Instructors can only view the status, not change it

  // Filter courses based on search term and status
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalCourses: courses.length,
    approvedCourses: courses.filter(c => c.status === 'active').length,
    pendingCourses: courses.filter(c => c.status === 'pending').length,
    totalStudents: courses.reduce((sum, course) => sum + (course.studentCount || 0), 0)
  };

  if (loading) {
    return (
      <div className="instructor-layout">
        <main className="instructor-main">
          <div className="courses-loading">
            <div className="loading-spinner"></div>
            <p>Loading your courses...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="instructor-layout">
      <main className="instructor-main">
        <div className="instructor-courses">
          <div className="courses-header">
            <div className="header-content">
              <h1>My Courses 📚</h1>
              <p>Manage and organize all your courses in one place</p>
              <p className="status-note">💡 Course approval status is managed by administrators</p>
            </div>
            <button className="create-course-btn" onClick={handleCreateCourse}>
              + Create New Course
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-icon">📖</div>
              <div className="stat-content">
                <h3>{stats.totalCourses}</h3>
                <p>Total Courses</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{stats.approvedCourses}</h3>
                <p>Approved Courses</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{stats.pendingCourses}</h3>
                <p>Pending Approval</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>{stats.totalStudents}</h3>
                <p>Total Students</p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="courses-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search courses by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-container">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Courses</option>
                <option value="active">Approved</option>
                <option value="pending">Pending Approval</option>
              </select>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Courses List */}
          <div className="courses-section">
            <div className="section-header">
              <h2>Course List ({filteredCourses.length})</h2>
            </div>
            
            {filteredCourses.length === 0 ? (
              <div className="no-courses">
                <div className="no-courses-icon">📚</div>
                <h3>No courses found</h3>
                <p>
                  {searchTerm || filterStatus !== 'all' 
                    ? 'No courses match your search criteria.' 
                    : 'You haven\'t created any courses yet.'}
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <button className="create-course-btn" onClick={handleCreateCourse}>
                    Create Your First Course
                  </button>
                )}
              </div>
            ) : (
              <div className="courses-grid">
                {filteredCourses.map(course => (
                  <InstructorCourseCard
                    key={course._id}
                    course={course}
                    onDelete={handleDeleteCourse}
                    onViewStudents={handleViewStudents}
                    onManageContent={handleManageContent}
                    onManageQuiz={handleManageQuiz}
                    deletingId={deletingId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 