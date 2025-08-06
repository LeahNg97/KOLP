import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import InstructorSidebar from '../components/InstructorSidebar';
import './CourseContentManagement.css';

export default function CourseContentManagement() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('introduction'); // 'introduction' or 'full'
  const [uploading, setUploading] = useState(false);
  const [contentType, setContentType] = useState('video');
  const [contentTitle, setContentTitle] = useState('');
  const [contentDescription, setContentDescription] = useState('');
  const [contentUrl, setContentUrl] = useState('');

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourse(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch course');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContent = async () => {
    if (!contentUrl.trim()) {
      setError('Please provide a content URL');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const newContent = {
        type: contentType,
        url: contentUrl,
        title: contentTitle,
        description: contentDescription
      };

      const field = activeTab === 'introduction' ? 'introductionContent' : 'content';
      
      const response = await axios.patch(`http://localhost:8080/api/courses/${courseId}`, {
        [field]: [...(course[field] || []), newContent]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCourse(response.data);
      
      // Reset form
      setContentType('video');
      setContentTitle('');
      setContentDescription('');
      setContentUrl('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add content');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteContent = async (index) => {
    if (!window.confirm('Are you sure you want to delete this content item?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const field = activeTab === 'introduction' ? 'introductionContent' : 'content';
      const updatedContent = course[field].filter((_, i) => i !== index);

      const response = await axios.patch(`http://localhost:8080/api/courses/${courseId}`, {
        [field]: updatedContent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCourse(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete content');
    }
  };

  const handleMoveContent = async (fromIndex, toIndex) => {
    try {
      const token = localStorage.getItem('token');
      const field = activeTab === 'introduction' ? 'introductionContent' : 'content';
      const content = [...course[field]];
      const [movedItem] = content.splice(fromIndex, 1);
      content.splice(toIndex, 0, movedItem);

      const response = await axios.patch(`http://localhost:8080/api/courses/${courseId}`, {
        [field]: content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCourse(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reorder content');
    }
  };

  const renderContentItem = (item, index) => {
    return (
      <div key={index} className="content-item">
        <div className="content-header">
          <div className="content-type-badge">
            {item.type === 'video' && '🎥'}
            {item.type === 'image' && '🖼️'}
            {item.type === 'pdf' && '📄'}
            {item.type === 'text' && '📝'}
            {item.type === 'slide' && '📊'}
            {item.type}
          </div>
          <div className="content-actions">
            {index > 0 && (
              <button
                className="action-btn move-btn"
                onClick={() => handleMoveContent(index, index - 1)}
                title="Move Up"
              >
                ⬆️
              </button>
            )}
            {index < (course[activeTab === 'introduction' ? 'introductionContent' : 'content']?.length - 1) && (
              <button
                className="action-btn move-btn"
                onClick={() => handleMoveContent(index, index + 1)}
                title="Move Down"
              >
                ⬇️
              </button>
            )}
            <button
              className="action-btn delete-btn"
              onClick={() => handleDeleteContent(index)}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>

        {item.title && <h4 className="content-title">{item.title}</h4>}
        {item.description && <p className="content-description">{item.description}</p>}
        
        <div className="content-preview">
          {item.type === 'video' && (
            <video controls className="content-video">
              <source src={item.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          {item.type === 'image' && (
            <img src={item.url} alt={item.title || 'Content'} className="content-image" />
          )}
          {item.type === 'pdf' && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="content-link">
              📄 {item.title || 'View PDF'}
            </a>
          )}
          {item.type === 'text' && (
            <div className="content-text">
              <p>{item.description}</p>
            </div>
          )}
          {item.type === 'slide' && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="content-link">
              📊 {item.title || 'View Slides'}
            </a>
          )}
        </div>

        <div className="content-url">
          <strong>URL:</strong> {item.url}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="instructor-layout">
        <InstructorSidebar />
        <main className="instructor-main">
          <div className="content-loading">
            <div className="loading-spinner"></div>
            <p>Loading course content...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="instructor-layout">
      <InstructorSidebar />
      <main className="instructor-main">
        <div className="content-management">
          <div className="content-header">
            <div className="header-content">
              <button 
                className="back-btn"
                onClick={() => navigate('/instructor/courses')}
              >
                ← Back to Courses
              </button>
              <h1>Manage Course Content</h1>
              {course && <p className="course-title">{course.title}</p>}
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="content-tabs">
            <button
              className={`tab-btn ${activeTab === 'introduction' ? 'active' : ''}`}
              onClick={() => setActiveTab('introduction')}
            >
              📖 Introduction Content
              <span className="content-count">
                {course?.introductionContent?.length || 0} items
              </span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'full' ? 'active' : ''}`}
              onClick={() => setActiveTab('full')}
            >
              📚 Full Course Content
              <span className="content-count">
                {course?.content?.length || 0} items
              </span>
            </button>
          </div>

          {/* Add Content Form */}
          <div className="add-content-section">
            <h3>Add New Content</h3>
            <div className="add-content-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Content Type</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="form-select"
                  >
                    <option value="video">🎥 Video</option>
                    <option value="image">🖼️ Image</option>
                    <option value="pdf">📄 PDF</option>
                    <option value="text">📝 Text</option>
                    <option value="slide">📊 Slides</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Title (Optional)</label>
                  <input
                    type="text"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                    placeholder="Enter content title"
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={contentDescription}
                  onChange={(e) => setContentDescription(e.target.value)}
                  placeholder="Enter content description"
                  className="form-textarea"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Content URL *</label>
                <input
                  type="url"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="Enter content URL (video, image, PDF, etc.)"
                  className="form-input"
                  required
                />
              </div>
              
              <button
                className="add-content-btn"
                onClick={handleAddContent}
                disabled={uploading || !contentUrl.trim()}
              >
                {uploading ? 'Adding...' : `Add to ${activeTab === 'introduction' ? 'Introduction' : 'Full Course'} Content`}
              </button>
            </div>
          </div>

          {/* Content List */}
          <div className="content-list-section">
            <h3>
              {activeTab === 'introduction' ? 'Introduction Content' : 'Full Course Content'}
              <span className="content-info">
                {activeTab === 'introduction' 
                  ? ' (Visible to all students before enrollment)' 
                  : ' (Visible only to accepted students)'}
              </span>
            </h3>
            
            {course && course[activeTab === 'introduction' ? 'introductionContent' : 'content']?.length > 0 ? (
              <div className="content-list">
                {course[activeTab === 'introduction' ? 'introductionContent' : 'content'].map((item, index) => 
                  renderContentItem(item, index)
                )}
              </div>
            ) : (
              <div className="no-content">
                <div className="no-content-icon">📝</div>
                <h4>No content yet</h4>
                <p>Add some content to get started!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 