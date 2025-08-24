import React from 'react';
import './InstructorCourseCard.css';

export default function InstructorCourseCard({ 
  course, 
  onDelete, 
  onViewStudents, 
  onManageContent, 
  onManageQuiz,
  onStatusUpdate,
  deletingId,
  updatingStatus
}) {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      onDelete(course._id);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'pending': return 'status-pending';
      case 'inactive': return 'status-inactive';
      case 'draft': return 'status-draft';
      default: return 'status-unknown';
    }
  };

  const getStatusBadgeText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'pending': return 'Pending Review';
      case 'inactive': return 'Inactive';
      case 'draft': return 'Draft';
      default: return 'Unknown';
    }
  };

  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 'beginner': return 'level-beginner';
      case 'intermediate': return 'level-intermediate';
      case 'advanced': return 'level-advanced';
      default: return 'level-unknown';
    }
  };

  return (
    <div className="course-card">
      <div className="course-image">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} />
        ) : (
          <div className="course-image-placeholder">
            <span>No Image</span>
          </div>
        )}
      </div>
      
      <div className="course-content">
        <div className="course-header">
          <h3>{course.title}</h3>
          <div className="course-badges">
            <span className={`status-badge ${getStatusBadgeClass(course.status)}`}>
              {getStatusBadgeText(course.status)}
            </span>
            <span className={`level-badge ${getLevelBadgeClass(course.level)}`}>
              {course.level}
            </span>
            {course.priceType === 'free' ? (
              <span className="price-badge free">Free</span>
            ) : (
              <span className="price-badge paid">
                {course.currency || 'AUD'}${course.salePrice || course.price}
              </span>
            )}
          </div>
        </div>
        
        {course.subtitle && <p className="course-subtitle">{course.subtitle}</p>}
        
        <div className="course-stats">
          <span>📚 {course.stats?.totalLessons || 0} lessons</span>
          <span>⏱ {Math.floor((course.stats?.totalDurationSec || 0) / 60)} min</span>
          <span>👥 {course.stats?.studentCount || 0} students</span>
        </div>
        
        <div className="course-actions">
          <button 
            onClick={() => {
              console.log('Manage Content clicked for course:', course._id);
              onManageContent(course._id);
            }}
            className="action-btn primary"
          >
            Manage Content
          </button>
          
          {course.status === 'draft' && (
            <button 
              onClick={() => onStatusUpdate(course._id, 'pending')}
              className="action-btn secondary"
              disabled={updatingStatus === course._id}
            >
              {updatingStatus === course._id ? 'Updating...' : 'Submit for Review'}
            </button>
          )}
          
          {course.status === 'pending' && (
            <button 
              onClick={() => onStatusUpdate(course._id, 'draft')}
              className="action-btn secondary"
              disabled={updatingStatus === course._id}
            >
              {updatingStatus === course._id ? 'Updating...' : 'Mark as Draft'}
            </button>
          )}
          
          <button 
            onClick={() => onViewStudents(course._id)}
            className="action-btn secondary"
          >
          View Students
          </button>
          
          <button 
            onClick={() => onManageQuiz(course._id)}
            className="action-btn secondary"
          >
          Quiz
          </button>
          
          <button 
            onClick={handleDelete}
            className="action-btn danger"
            disabled={deletingId === course._id}
          >
            {deletingId === course._id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
