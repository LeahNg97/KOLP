import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyEnrollments, cancelEnrollment } from '../api/enrollmentApi';
import './StudentCourse.css';
import Footer from '../../components/Footer';


export default function StudentCourse() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, approved
  const navigate = useNavigate();


  useEffect(() => {
    fetchEnrollments();
  }, []);


  const fetchEnrollments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyEnrollments();
      setEnrollments(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load enrolled courses.');
    } finally {
      setLoading(false);
    }
  };


  const handleCancelEnrollment = async (enrollmentId) => {
    if (window.confirm('Are you sure you want to cancel this enrollment?')) {
      try {
        await cancelEnrollment(enrollmentId);
        setEnrollments(enrollments.filter(enrollment => enrollment._id !== enrollmentId));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to cancel enrollment.');
      }
    }
  };


  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: 'Pending', class: 'status-pending' },
      approved: { text: 'Approved', class: 'status-approved' }
    };
   
    const config = statusConfig[status] || { text: status, class: 'status-default' };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };


  const filteredEnrollments = enrollments.filter(enrollment => {
    if (filter === 'all') return true;
    return enrollment.status === filter;
  });


  const validEnrollments = filteredEnrollments.filter(e => e.courseId);


  const getProgressColor = (progress) => {
    if (progress >= 80) return '#28a745';
    if (progress >= 50) return '#ffc107';
    return '#dc3545';
  };


  return (
    <div className="student-course-page">
      <div className="student-course-header">
        <h1>My Enrolled Courses</h1>
        <div className="student-course-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({enrollments.length})
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({enrollments.filter(e => e.status === 'pending').length})
          </button>
          <button
            className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({enrollments.filter(e => e.status === 'approved').length})
          </button>
        </div>
      </div>


      {loading ? (
        <div className="student-course-loading">Loading your enrolled courses...</div>
      ) : error ? (
        <div className="student-course-error">{error}</div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="student-course-empty">
          <p>You haven't enrolled in any courses yet.</p>
          <button
            className="browse-courses-btn"
            onClick={() => navigate('/student')}
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="student-course-grid">
          {validEnrollments.length === 0 ? (
            <div>No valid enrollments found.</div>
          ) : (
            validEnrollments.map((enrollment) => (
              <div key={enrollment._id} className="enrollment-card">
                <div className="enrollment-header">
                  <h3 className="course-title">{enrollment.courseId.title}</h3>
                  {getStatusBadge(enrollment.status)}
                </div>
                <p className="course-description">
                  {enrollment.courseId.description}
                </p>
                <div className="enrollment-details">
                  <div className="progress-section">
                    <div className="progress-header">
                      <span>Progress</span>
                      <span className="progress-percentage">{enrollment.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${enrollment.progress}%`,
                          backgroundColor: getProgressColor(enrollment.progress)
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="enrollment-meta">
                    <div className="meta-item">
                      <span className="meta-label">Enrolled:</span>
                      <span className="meta-value">
                        {new Date(enrollment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Status:</span>
                      <span className="meta-value">{enrollment.status}</span>
                    </div>
                    {enrollment.completed && (
                      <div className="meta-item">
                        <span className="meta-label">Completed:</span>
                        <span className="meta-value">Yes</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="enrollment-actions">
                  {enrollment.status === 'approved' && (
                    <button
                      className="action-btn primary"
                      onClick={() => navigate(`/student/courses/${enrollment.courseId._id}`)}
                    >
                      Learning
                    </button>
                  )}
                  {enrollment.status === 'pending' && (
                    <button
                      className="action-btn secondary"
                      onClick={() => handleCancelEnrollment(enrollment._id)}
                    >
                      Cancel Enrollment
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <Footer />
    </div>
  );
}



