import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentManagement.css';
import { getMyCourses, getStudentsByCourse } from '../api/courseApi';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [courses, setCourses] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterCourse('all');
  };

  const hasActiveFilters = searchTerm || filterStatus !== 'all' || filterCourse !== 'all';

  const getActiveFilters = () => {
    const filters = [];
    if (searchTerm) filters.push({ type: 'search', value: searchTerm, label: `Search: "${searchTerm}"` });
    if (filterStatus !== 'all') filters.push({ type: 'status', value: filterStatus, label: `Status: ${filterStatus}` });
    if (filterCourse !== 'all') {
      const course = courses.find(c => c._id === filterCourse);
      filters.push({ type: 'course', value: filterCourse, label: `Course: ${course?.title || 'Unknown'}` });
    }
    return filters;
  };

  const removeFilter = (filterType) => {
    switch (filterType) {
      case 'search':
        setSearchTerm('');
        break;
      case 'status':
        setFilterStatus('all');
        break;
      case 'course':
        setFilterCourse('all');
        break;
      default:
        break;
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await getStudentsByCourse(token);
      setStudents(response);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await getMyCourses(token);
      setCourses(response);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: 'Pending', class: 'status-pending', icon: '⏳' },
      approved: { text: 'Approved', class: 'status-approved', icon: '✅' }
    };
    
    const config = statusConfig[status] || { text: status, class: 'status-default', icon: '❓' };
    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {config.text}
      </span>
    );
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#28a745';
    if (progress >= 60) return '#ffc107';
    if (progress >= 40) return '#fd7e14';
    return '#dc3545';
  };

  // Filter students based on search term, status, and course
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.courseId?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    const matchesCourse = filterCourse === 'all' || student.courseId?._id === filterCourse;
    
    return matchesSearch && matchesStatus && matchesCourse;
  });

  // Get unique students (in case same student is enrolled in multiple courses)
  const uniqueStudents = filteredStudents.reduce((acc, enrollment) => {
    const studentId = enrollment.studentId._id;
    if (!acc[studentId]) {
      acc[studentId] = {
        student: enrollment.studentId,
        enrollments: []
      };
    }
    acc[studentId].enrollments.push(enrollment);
    return acc;
  }, {});

  const stats = {
    totalStudents: Object.keys(uniqueStudents).length,
    pendingStudents: students.filter(s => s.status === 'pending').length,
    approvedStudents: students.filter(s => s.status === 'approved').length,
    completedStudents: students.filter(s => s.completed).length,
    totalEnrollments: students.length
  };

  // Helper to count courses by status
  const countCoursesByStatus = (enrollments, status) =>
    enrollments.filter(e => e.status === status).length;

  if (loading) {
    return (
      <div className="instructor-layout">

        <main className="instructor-main">
          <div className="students-loading">
            <div className="loading-spinner"></div>
            <p>Loading students...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="instructor-layout">

      <main className="instructor-main">
        <div className="student-management">
          <div className="students-header">
            <div className="header-content">
              <h1>Student Management 👥</h1>
              <p>View and manage all students enrolled in your courses</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>{stats.totalStudents}</h3>
                <p>Unique Students</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <h3>{stats.totalEnrollments}</h3>
                <p>Total Enrollments</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{stats.approvedStudents}</h3>
                <p>Approved Students</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎓</div>
              <div className="stat-content">
                <h3>{stats.completedStudents}</h3>
                <p>Completed Courses</p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="students-controls">
            <div className="controls-header">
              <h3>Search & Filter Students</h3>
              <p>Find specific students or filter by enrollment status and course</p>
            </div>
            
            <div className="controls-content">
              <div className="filters-section">
                <div className="filter-group">
                  <label className="filter-label">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label className="filter-label">Course</label>
                  <select
                    value={filterCourse}
                    onChange={(e) => setFilterCourse(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Courses</option>
                    {courses.map(course => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="clear-filters-btn"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="search-section">
                <label className="search-label">Search Students</label>
                <input
                  type="text"
                  placeholder="Search by name, email, or course title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            
            {hasActiveFilters && (
              <div className="active-filters">
                <span style={{ color: '#718096', fontSize: '0.9rem', fontWeight: '500' }}>
                  Active filters:
                </span>
                {getActiveFilters().map((filter, index) => (
                  <div key={index} className="filter-tag">
                    {filter.label}
                    <button
                      className="remove-btn"
                      onClick={() => removeFilter(filter.type)}
                      title={`Remove ${filter.type} filter`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Students Table */}
          <div className="students-section">
            <div className="section-header">
              <h2>Student List ({Object.keys(uniqueStudents).length})</h2>
            </div>
            {Object.keys(uniqueStudents).length === 0 ? (
              <div className="no-students">
                <div className="no-students-icon">👥</div>
                <h3>No students found</h3>
                <p>
                  {searchTerm || filterStatus !== 'all' || filterCourse !== 'all'
                    ? 'No students match your search criteria.'
                    : 'No students have enrolled in your courses yet.'}
                </p>
              </div>
            ) : (
              <div className="students-table-wrapper">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Avatar</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Learning</th>
                      <th>Pending</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(uniqueStudents).map(({ student, enrollments }) => {
                      const learningCount = countCoursesByStatus(enrollments, 'approved');
                      const pendingCount = countCoursesByStatus(enrollments, 'pending');
                      return (
                        <React.Fragment key={student._id}>
                          <tr>
                            <td>
                              <div className="student-avatar-table">
                                {student.name?.charAt(0).toUpperCase() || 'S'}
                              </div>
                            </td>
                            <td>{student.name || 'Unknown Student'}</td>
                            <td>{student.email || 'No email'}</td>
                            <td>{learningCount}</td>
                            <td>{pendingCount}</td>
                            <td>
                              <button
                                className="view-details-btn"
                                onClick={() => setExpandedStudent(expandedStudent === student._id ? null : student._id)}
                              >
                                {expandedStudent === student._id ? 'Hide' : 'View Details'}
                              </button>
                            </td>
                          </tr>
                          {expandedStudent === student._id && (
                            <tr className="student-details-row">
                              <td colSpan={6}>
                                <div className="student-details-expand">
                                  <h4>Course Enrollments ({enrollments.length})</h4>
                                  <div className="student-enrollments-table">
                                    <table>
                                      <thead>
                                        <tr>
                                          <th>Course</th>
                                          <th>Status</th>
                                          <th>Progress</th>
                                          <th>Enrolled</th>
                                          <th>Completed</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {enrollments.map((enrollment) => (
                                          <tr key={enrollment._id}>
                                            <td>{enrollment.courseId?.title || 'Unknown Course'}</td>
                                            <td>{getStatusBadge(enrollment.status)}</td>
                                            <td>
                                              <div className="progress-bar-table">
                                                <div
                                                  className="progress-fill-table"
                                                  style={{
                                                    width: `${enrollment.progress || 0}%`,
                                                    backgroundColor: getProgressColor(enrollment.progress || 0)
                                                  }}
                                                ></div>
                                              </div>
                                              <span className="progress-percentage-table">{enrollment.progress || 0}%</span>
                                            </td>
                                            <td>{new Date(enrollment.createdAt).toLocaleDateString()}</td>
                                            <td>{enrollment.completed ? 'Yes' : 'No'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 