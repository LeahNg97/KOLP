import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getStudentsByCourse, approveEnrollment, rejectEnrollment } from '../api/enrollmentApi';
import { getCourseById } from '../api/courseApi';
import './CourseStudents.css';

export default function CourseStudents() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompletion, setFilterCompletion] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressStudent, setProgressStudent] = useState(null);
  const [progressDetails, setProgressDetails] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);

  useEffect(() => {
    fetchCourseAndStudents();
  }, [courseId]);

  const fetchCourseAndStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch course details
      const courseData = await getCourseById(courseId);
      setCourse(courseData);
      
      // Fetch students
      const studentsData = await getStudentsByCourse(courseId);
      setStudents(studentsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch course and students');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEnrollment = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to approve this student\'s enrollment?')) {
      return;
    }

    try {
      setProcessingId(enrollmentId);
      await approveEnrollment(enrollmentId);
      
      // Update local state
      setStudents(students.map(student => 
        student._id === enrollmentId 
          ? { ...student, status: 'approved' }
          : student
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve enrollment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectEnrollment = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to reject this student\'s enrollment? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessingId(enrollmentId);
      await rejectEnrollment(enrollmentId);
      
      // Remove from local state
      setStudents(students.filter(student => student._id !== enrollmentId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject enrollment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveCourseCompletion = async (studentId) => {
    if (!window.confirm('Are you sure you want to approve this student\'s course completion? This will mark the course as completed.')) {
      return;
    }

    try {
      setProcessingId(studentId);
      const token = localStorage.getItem('token');
      
      // Update enrollment to mark as instructor approved
      await axios.patch(`http://localhost:8080/api/enrollments/${courseId}/approve-completion/${studentId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setStudents(students.map(student => 
        student.studentId?._id === studentId 
          ? { ...student, instructorApproved: true, completed: true }
          : student
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve course completion');
    } finally {
      setProcessingId(null);
    }
  };

  const handleIssueCertificate = async (studentId) => {
    if (!window.confirm('Are you sure you want to issue a certificate for this student? This will create a certificate for the completed course.')) {
      return;
    }

    try {
      setProcessingId(`cert_${studentId}`);
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/certificates/issue-completed`, {
        courseId: courseId,
        studentId: studentId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Certificate issued successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue certificate');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewProgress = async (student) => {
    setShowProgressModal(true);
    setProgressStudent(student);
    setProgressDetails(null);
    setProgressLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Get lesson progress
      const lessonProgressRes = await axios.get(`http://localhost:8080/api/lesson-progress/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Get quiz progress (if available)
      let quizProgress = null;
      try {
        const quizRes = await axios.get(`http://localhost:8080/api/quizzes/course/${courseId}/student/${student.studentId._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        quizProgress = quizRes.data;
      } catch (quizErr) {
        console.log('No quiz progress available');
      }
      
      // Combine lesson and quiz progress
      const combinedProgress = {
        lessonProgress: lessonProgressRes.data,
        quizProgress: quizProgress,
        totalLessons: lessonProgressRes.data.length,
        completedLessons: lessonProgressRes.data.filter(p => p.completed).length,
        progress: student.progress || 0
      };
      
      setProgressDetails(combinedProgress);
    } catch (err) {
      setProgressDetails({ error: err.response?.data?.message || 'Failed to fetch progress.' });
    } finally {
      setProgressLoading(false);
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
    if (progress >= 50) return '#ffc107';
    return '#dc3545';
  };

  // Calculate completion statistics
  const completionStats = {
    totalStudents: students.length,
    approvedStudents: students.filter(s => s.status === 'approved').length,
    pendingStudents: students.filter(s => s.status === 'pending').length,
    completedQuizzes: students.filter(s => s.progress === 100).length,
    approvedCompletions: students.filter(s => s.instructorApproved).length,
    awaitingApproval: students.filter(s => s.progress === 100 && !s.instructorApproved).length
  };

  // Filter students based on search term, status, and completion
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    
    let matchesCompletion = true;
    if (filterCompletion === 'awaiting-approval') {
      matchesCompletion = student.progress === 100 && !student.instructorApproved;
    } else if (filterCompletion === 'completed') {
      matchesCompletion = student.instructorApproved;
    } else if (filterCompletion === 'in-progress') {
      matchesCompletion = student.progress > 0 && student.progress < 100;
    }
    
    return matchesSearch && matchesStatus && matchesCompletion;
  });

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
        <div className="course-students">
          <div className="students-header">
            <div className="header-content">
              <button 
                className="back-btn"
                onClick={() => navigate('/instructor/courses')}
              >
                ← Back to Courses
              </button>
              <h1>Course Students 👥</h1>
              {course && (
                <p className="course-title">{course.title}</p>
              )}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>{completionStats.totalStudents}</h3>
                <p>Total Students</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{completionStats.pendingStudents}</h3>
                <p>Pending Approval</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{completionStats.approvedStudents}</h3>
                <p>Approved Students</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <h3>{completionStats.completedQuizzes}</h3>
                <p>Attempted All Quizzes</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎓</div>
              <div className="stat-content">
                <h3>{completionStats.approvedCompletions}</h3>
                <p>Course Completed</p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="students-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search students by name or email..."
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
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>
            <div className="filter-container">
              <select
                value={filterCompletion}
                onChange={(e) => setFilterCompletion(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Progress</option>
                <option value="in-progress">In Progress</option>
                <option value="awaiting-approval">Awaiting Approval</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Completion Approval Notice */}
          {completionStats.awaitingApproval > 0 && (
            <div className="approval-notice">
              <div className="notice-content">
                <span className="notice-icon">🎯</span>
                <div className="notice-text">
                  <strong>{completionStats.awaitingApproval} student(s)</strong> have attempted all quizzes and are awaiting your approval for course completion.
                </div>
              </div>
              <button 
                className="notice-action-btn"
                onClick={() => setFilterCompletion('awaiting-approval')}
              >
                View Students
              </button>
            </div>
          )}

          {/* Students List */}
          <div className="students-section">
            <div className="section-header">
              <h2>Student List ({filteredStudents.length})</h2>
            </div>
            
            {filteredStudents.length === 0 ? (
              <div className="no-students">
                <div className="no-students-icon">👥</div>
                <h3>No students found</h3>
                <p>
                  {searchTerm || filterStatus !== 'all' 
                    ? 'No students match your search criteria.' 
                    : 'No students have enrolled in this course yet.'}
                </p>
              </div>
            ) : (
              <div className="students-grid">
                {filteredStudents.map(student => (
                  <div key={student._id} className="student-card">
                    <div className="student-header">
                      <div className="student-info">
                        <div className="student-avatar">
                          {student.studentId?.name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div className="student-details">
                          <h3 className="student-name">
                            {student.studentId?.name || 'Unknown Student'}
                          </h3>
                          <p className="student-email">
                            {student.studentId?.email || 'No email'}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(student.status)}
                    </div>
                    
                    <div className="student-progress">
                      <div className="progress-header">
                        <span>Course Progress</span>
                        <span className="progress-percentage">{student.progress || 0}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${student.progress || 0}%`,
                            backgroundColor: getProgressColor(student.progress || 0)
                          }}
                        ></div>
                      </div>
                      <div className="progress-details">
                        <span className="quiz-completion-info">
                          Quiz Sets: {student.attemptedQuizSets?.length || 0} attempted, {student.completedQuizSets?.length || 0} passed
                        </span>
                        {student.progress === 100 && (
                          <span className="all-quizzes-completed">
                            ✅ All quizzes attempted
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="student-meta">
                      <div className="meta-item">
                        <span className="meta-label">Enrolled:</span>
                        <span className="meta-value">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Status:</span>
                        <span className="meta-value">{student.status}</span>
                      </div>
                      {student.completed && (
                        <div className="meta-item">
                          <span className="meta-label">Completed:</span>
                          <span className="meta-value">Yes</span>
                        </div>
                      )}
                      {student.instructorApproved && (
                        <div className="meta-item">
                          <span className="meta-label">Approved by:</span>
                          <span className="meta-value">Instructor</span>
                        </div>
                      )}
                    </div>

                    <div className="student-actions">
                      {student.status === 'pending' && (
                        <>
                          <button
                            className="action-btn approve-btn"
                            onClick={() => handleApproveEnrollment(student._id)}
                            disabled={processingId === student._id}
                          >
                            {processingId === student._id ? 'Approving...' : '✅ Approve'}
                          </button>
                          <button
                            className="action-btn reject-btn"
                            onClick={() => handleRejectEnrollment(student._id)}
                            disabled={processingId === student._id}
                          >
                            {processingId === student._id ? 'Rejecting...' : '❌ Reject'}
                          </button>
                        </>
                      )}
                      {student.status === 'approved' && (
                        <>
                          <button className="action-btn view-btn" onClick={() => handleViewProgress(student)}>
                            👁️ View Progress
                          </button>
                          {student.progress === 100 && !student.instructorApproved && (
                            <div className="completion-approval-section">
                              <div className="completion-notice">
                                <span className="notice-icon">🎯</span>
                                <span className="notice-text">Student has completed all lessons (100% progress)</span>
                              </div>
                              <button
                                className="action-btn approve-completion-btn"
                                onClick={() => handleApproveCourseCompletion(student.studentId._id)}
                                disabled={processingId === student.studentId._id}
                              >
                                {processingId === student.studentId._id ? 'Approving...' : '🎓 Approve Course Completion'}
                              </button>
                            </div>
                          )}
                          {student.instructorApproved && (
                            <div className="completion-approved">
                              <span className="completion-badge">✅ Course Completed & Approved</span>
                              <span className="completion-date">
                                Approved on {new Date(student.updatedAt).toLocaleDateString()}
                              </span>
                              <button
                                className="action-btn certificate-btn"
                                onClick={() => handleIssueCertificate(student.studentId._id)}
                                disabled={processingId === `cert_${student.studentId._id}`}
                              >
                                {processingId === `cert_${student.studentId._id}` ? 'Issuing...' : '📄 Issue Certificate'}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      {showProgressModal && (
        <div className="progress-modal-overlay">
          <div className="progress-modal">
            <div className="modal-header">
              <h2>Progress for {progressStudent?.studentId?.name || 'Student'}</h2>
              <button className="modal-close-btn" onClick={() => setShowProgressModal(false)}>✕</button>
            </div>
            <div className="modal-content">
              {progressLoading ? (
                <div>Loading progress...</div>
              ) : progressDetails?.error ? (
                <div className="error-message">{progressDetails.error}</div>
              ) : progressDetails ? (
                <>
                  <div><strong>Status:</strong> {progressStudent.status}</div>
                  <div><strong>Overall Progress:</strong> {progressDetails.progress || 0}%</div>
                  
                  {/* Lesson Progress */}
                  <div className="progress-section">
                    <h4>📚 Lesson Progress</h4>
                    <div><strong>Total Lessons:</strong> {progressDetails.totalLessons || 0}</div>
                    <div><strong>Completed Lessons:</strong> {progressDetails.completedLessons || 0}</div>
                    <div><strong>Lesson Completion Rate:</strong> {progressDetails.totalLessons > 0 ? Math.round((progressDetails.completedLessons / progressDetails.totalLessons) * 100) : 0}%</div>
                  </div>
                  
                  {/* Quiz Progress (if available) */}
                  {progressDetails.quizProgress && (
                    <div className="progress-section">
                      <h4>🧠 Quiz Progress</h4>
                      <div><strong>Quiz Sets Attempted:</strong> {progressStudent.attemptedQuizSets?.length || 0}</div>
                      <div><strong>Quiz Sets Passed:</strong> {progressStudent.completedQuizSets?.length || 0}</div>
                      <div><strong>Quiz Details:</strong></div>
                      <ul>
                        {progressDetails.quizProgress.quizSets?.map((set, idx) => (
                          <li key={set.quizSetId || idx}>
                            <strong>{set.name}:</strong> {set.submission ? `${set.submission.score}/${set.submission.totalQuestions} (${set.submission.percentage}%) - ${set.submission.passed ? '✅ Passed' : '❌ Failed'}` : 'Not attempted'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Lesson Details */}
                  {progressDetails.lessonProgress && progressDetails.lessonProgress.length > 0 && (
                    <div className="progress-section">
                      <h4>📖 Lesson Details</h4>
                      <div className="lesson-progress-list">
                        {progressDetails.lessonProgress.map((lesson, idx) => (
                          <div key={lesson._id || idx} className={`lesson-progress-item ${lesson.completed ? 'completed' : 'incomplete'}`}>
                            <span className="lesson-status">{lesson.completed ? '✅' : '⏳'}</span>
                            <span className="lesson-title">{lesson.lessonTitle || `Lesson ${idx + 1}`}</span>
                            <span className="lesson-completion-date">
                              {lesson.completed ? new Date(lesson.completedAt).toLocaleDateString() : 'Not completed'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 