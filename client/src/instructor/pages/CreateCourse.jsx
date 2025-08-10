import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CreateCourse.css';

export default function CreateCourse() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageIntroduction: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Course title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Course description is required');
      return false;
    }
    if (formData.title.trim().length < 3) {
      setError('Course title must be at least 3 characters long');
      return false;
    }
    if (formData.description.trim().length < 10) {
      setError('Course description must be at least 10 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/api/courses', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        imageIntroduction: formData.imageIntroduction.trim() || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Course created successfully! Redirecting to course management...');
      
      // Redirect to the new course's content management page after 2 seconds
      setTimeout(() => {
        navigate(`/instructor/courses/${response.data._id}/content`);
      }, 2000);

    } catch (err) {
      console.error('Create course error:', err);
      setError(err.response?.data?.message || 'Failed to create course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/instructor/courses');
  };

  return (
    <div className="instructor-layout">
      <main className="instructor-main">
        <div className="create-course">
          <div className="create-course-header">
            <div className="header-content">
              <button 
                className="back-btn"
                onClick={handleCancel}
              >
                ← Back to Courses
              </button>
              <h1>Create New Course</h1>
              <p>Set up your course with basic information. You can add content after creation.</p>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="create-course-form-container">
            <form className="create-course-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Course Information</h3>
                
                <div className="form-group">
                  <label htmlFor="title">Course Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter course title"
                    className="form-input"
                    required
                    disabled={loading}
                  />
                  <small>Choose a clear, descriptive title for your course</small>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Course Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what students will learn in this course"
                    className="form-textarea"
                    rows="5"
                    required
                    disabled={loading}
                  />
                  <small>Provide a detailed description of the course content and learning objectives</small>
                </div>

                <div className="form-group">
                  <label htmlFor="imageIntroduction">Course Introduction Image (Optional)</label>
                  <input
                    type="url"
                    id="imageIntroduction"
                    name="imageIntroduction"
                    value={formData.imageIntroduction}
                    onChange={handleChange}
                    placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                    className="form-input"
                    disabled={loading}
                  />
                  <small>Add an image URL to represent your course. This will be shown to students.</small>
                </div>
              </div>

              <div className="form-section">
                <h3>Course Setup Information</h3>
                <div className="info-cards">
                  <div className="info-card">
                    <div className="info-icon">📝</div>
                    <div className="info-content">
                      <h4>Content Management</h4>
                      <p>After creating the course, you'll be redirected to add introduction content and full course materials.</p>
                    </div>
                  </div>
                  
                  <div className="info-card">
                    <div className="info-icon">⏳</div>
                    <div className="info-content">
                      <h4>Approval Process</h4>
                      <p>New courses require admin approval before students can enroll. This usually takes 1-2 business days.</p>
                    </div>
                  </div>
                  
                  <div className="info-card">
                    <div className="info-icon">🎯</div>
                    <div className="info-content">
                      <h4>Two-Tier Access</h4>
                      <p>You can set up introduction content (visible to all) and full content (visible to enrolled students).</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="create-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Creating Course...
                    </>
                  ) : (
                    'Create Course'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 