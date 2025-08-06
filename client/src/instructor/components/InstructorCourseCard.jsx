import React from 'react';
import './InstructorCourseCard.css';

export default function InstructorCourseCard({ 
  course, 
  onDelete, 
  onViewStudents, 
  onManageContent, 
  onManageQuiz,
  deletingId 
}) {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      onDelete(course._id);
    }
  };

  return (
    <div className="instructor-course-card">
      <div className="course-header">
        <div className="course-status">
          <span className={`status-badge ${course.status || 'active'}`}>
            {course.status || 'active'}
          </span>
        </div>
        <div className="course-actions">
          <button
            className="action-btn delete-btn"
            onClick={handleDelete}
            disabled={deletingId === course._id}
            title="Delete Course"
          >
            {deletingId === course._id ? '🗑️...' : '🗑️'}
          </button>
        </div>
      </div>
      
      <h3 className="course-title">{course.title}</h3>
      <p className="course-description">
        {course.description || 'No description available'}
      </p>
      
      <div className="course-meta">
        <div className="meta-item">
          <span className="meta-label">Created:</span>
          <span className="meta-value">
            {new Date(course.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Content:</span>
          <span className="meta-value">
            {course.content?.length || 0} items
          </span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Students:</span>
          <span className="meta-value">
            {course.studentCount || 0} enrolled
          </span>
        </div>
      </div>

      <div className="course-footer">
        <button
          className="view-students-btn"
          onClick={() => onViewStudents(course._id)}
        >
          👥 View Students
        </button>
        <button 
          className="manage-content-btn"
          onClick={() => onManageContent(course._id)}
        >
          📝 Manage Content
        </button>
        <button 
          className="manage-quiz-btn"
          onClick={() => onManageQuiz(course._id)}
        >
          🧠 Manage Quiz
        </button>
      </div>
    </div>
  );
}
