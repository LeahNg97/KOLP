import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CourseContentManagement.css';

export default function CourseContentManagement() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('introduction'); // 'introduction' or 'sections'
  const [uploading, setUploading] = useState(false);
  
  // Introduction content form
  const [introContentType, setIntroContentType] = useState('video');
  const [introContentTitle, setIntroContentTitle] = useState('');
  const [introContentDescription, setIntroContentDescription] = useState('');
  const [introContentUrl, setIntroContentUrl] = useState('');
  
  // Section form
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  
  // Lesson form
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonType, setLessonType] = useState('video');
  const [lessonUrl, setLessonUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState(0);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(null);

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

  const handleAddIntroContent = async () => {
    if (!introContentUrl.trim()) {
      setError('Please provide a content URL');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const newContent = {
        type: introContentType,
        url: introContentUrl,
        title: introContentTitle,
        description: introContentDescription
      };

      const response = await axios.patch(`http://localhost:8080/api/courses/${courseId}`, {
        introductionContent: [...(course.introductionContent || []), newContent]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCourse(response.data);
      
      // Reset form
      setIntroContentType('video');
      setIntroContentTitle('');
      setIntroContentDescription('');
      setIntroContentUrl('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add content');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteIntroContent = async (index) => {
    if (!window.confirm('Are you sure you want to delete this content item?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const updatedContent = course.introductionContent.filter((_, i) => i !== index);

      const response = await axios.patch(`http://localhost:8080/api/courses/${courseId}`, {
        introductionContent: updatedContent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCourse(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete content');
    }
  };

  const handleAddSection = async () => {
    if (!sectionTitle.trim()) {
      setError('Please provide a section title');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const newSection = {
        title: sectionTitle,
        description: sectionDescription,
        order: (course.sections?.length || 0) + 1,
        lessons: []
      };

      const response = await axios.patch(`http://localhost:8080/api/courses/${courseId}`, {
        sections: [...(course.sections || []), newSection]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCourse(response.data);
      
      // Reset form
      setSectionTitle('');
      setSectionDescription('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add section');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSection = async (sectionIndex) => {
    if (!window.confirm('Are you sure you want to delete this section? All lessons in this section will also be deleted.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const updatedSections = course.sections.filter((_, i) => i !== sectionIndex)
        .map((section, i) => ({ ...section, order: i + 1 }));

      const response = await axios.patch(`http://localhost:8080/api/courses/${courseId}`, {
        sections: updatedSections
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCourse(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete section');
    }
  };

  const handleAddLesson = async (sectionIndex) => {
    if (!lessonTitle.trim() || !lessonUrl.trim()) {
      setError('Please provide lesson title and URL');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const newLesson = {
        title: lessonTitle,
        description: lessonDescription,
        type: lessonType,
        url: lessonUrl,
        duration: lessonDuration,
        order: (course.sections[sectionIndex].lessons?.length || 0) + 1
      };

      const updatedSections = [...course.sections];
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        lessons: [...(updatedSections[sectionIndex].lessons || []), newLesson]
      };

      const response = await axios.patch(`http://localhost:8080/api/courses/${courseId}`, {
        sections: updatedSections
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCourse(response.data);
      
      // Reset form
      setLessonTitle('');
      setLessonDescription('');
      setLessonType('video');
      setLessonUrl('');
      setLessonDuration(0);
      setSelectedSectionIndex(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add lesson');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLesson = async (sectionIndex, lessonIndex) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const updatedSections = [...course.sections];
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        lessons: updatedSections[sectionIndex].lessons.filter((_, i) => i !== lessonIndex)
          .map((lesson, i) => ({ ...lesson, order: i + 1 }))
      };

      const response = await axios.patch(`http://localhost:8080/api/courses/${courseId}`, {
        sections: updatedSections
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCourse(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete lesson');
    }
  };

  const renderIntroContentItem = (item, index) => {
    return (
      <div key={index} className="content-item">
        <div className="content-header">
          <div className="content-type-badge">
            {item.type === 'video'}
            {item.type === 'image'}
            {item.type === 'text'}
            {item.type}
          </div>
          <div className="content-actions">
            <button
              className="action-btn delete-btn"
              onClick={() => handleDeleteIntroContent(index)}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>

        {item.title && <h4 className="content-title">{item.title}</h4>}
        {item.description && <p className="content-description">{item.description}</p>}
       
      </div>
    );
  };

  const renderSection = (section, sectionIndex) => {
    return (
      <div key={sectionIndex} className="section-container">
        <div className="section-header">
          <div className="section-info">
            <h3>Section {section.order}: {section.title}</h3>
            {section.description && <p className="section-description">{section.description}</p>}
          </div>
          <button
            className="delete-section-btn"
            onClick={() => handleDeleteSection(sectionIndex)}
            title="Delete Section"
          >
            Delete Section
          </button>
        </div>

        <div className="lessons-container">
          <h4>Lessons ({section.lessons?.length || 0})</h4>
          
          {section.lessons?.map((lesson, lessonIndex) => (
            <div key={lessonIndex} className="lesson-item">
              <div className="lesson-header">
                <div className="lesson-info">
                  <h5>Lesson {lesson.order}: {lesson.title}</h5>
                  {lesson.description && <p className="lesson-description">{lesson.description}</p>}
                </div>
                <button
                  className="delete-lesson-btn"
                  onClick={() => handleDeleteLesson(sectionIndex, lessonIndex)}
                  title="Delete Lesson"
                >
                  🗑️
                </button>
              </div>
              
              <div className="lesson-details">
                <div className="lesson-type-badge">
                  {lesson.type === 'video' }
                  {lesson.type === 'pdf' }
                  {lesson.type === 'slide' }
                  {lesson.type === 'text' }
                  {lesson.type}
                </div>
                {lesson.duration > 0 && (
                  <span className="lesson-duration">⏱️ {lesson.duration} min</span>
                )}
              </div>
              
              <div className="lesson-url">
                <strong>URL:</strong> {lesson.url}
              </div>
            </div>
          ))}
          
          <button
            className="add-lesson-btn"
            onClick={() => setSelectedSectionIndex(sectionIndex)}
          >
            + Add Lesson to Section {section.order}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="instructor-layout">
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
              className={`tab-btn ${activeTab === 'sections' ? 'active' : ''}`}
              onClick={() => setActiveTab('sections')}
            >
              📚 Course Sections
              <span className="content-count">
                {course?.sections?.length || 0} sections
              </span>
            </button>
          </div>

          {/* Introduction Content Tab */}
          {activeTab === 'introduction' && (
            <>
              {/* Add Introduction Content Form */}
              <div className="add-content-section">
                <h3>Add Introduction Content</h3>
                <div className="add-content-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Content Type</label>
                      <select
                        value={introContentType}
                        onChange={(e) => setIntroContentType(e.target.value)}
                        className="form-select"
                      >
                        <option value="video">🎥 Video</option>
                        <option value="image">🖼️ Image</option>
                        <option value="text">📝 Text</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Title (Optional)</label>
                      <input
                        type="text"
                        value={introContentTitle}
                        onChange={(e) => setIntroContentTitle(e.target.value)}
                        placeholder="Enter content title"
                        className="form-input"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Description (Optional)</label>
                    <textarea
                      value={introContentDescription}
                      onChange={(e) => setIntroContentDescription(e.target.value)}
                      placeholder="Enter content description"
                      className="form-textarea"
                      rows="3"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Content URL *</label>
                    <input
                      type="url"
                      value={introContentUrl}
                      onChange={(e) => setIntroContentUrl(e.target.value)}
                      placeholder="Enter content URL"
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <button
                    className="add-content-btn"
                    onClick={handleAddIntroContent}
                    disabled={uploading || !introContentUrl.trim()}
                  >
                    {uploading ? 'Adding...' : 'Add Introduction Content'}
                  </button>
                </div>
              </div>

              {/* Introduction Content List */}
              <div className="content-list-section">
                <h3>
                  Introduction Content
                  <span className="content-info">
                    (Visible to all students before enrollment)
                  </span>
                </h3>
                
                {course && course.introductionContent?.length > 0 ? (
                  <div className="content-list">
                    {course.introductionContent.map((item, index) => 
                      renderIntroContentItem(item, index)
                    )}
                  </div>
                ) : (
                  <div className="no-content">
                    <div className="no-content-icon">📝</div>
                    <h4>No introduction content yet</h4>
                    <p>Add some introduction content to get started!</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Sections Tab */}
          {activeTab === 'sections' && (
            <>
              {/* Add Section Form */}
              <div className="add-content-section">
                <h3>Add New Section</h3>
                <div className="add-content-form">
                  <div className="form-group">
                    <label>Section Title *</label>
                    <input
                      type="text"
                      value={sectionTitle}
                      onChange={(e) => setSectionTitle(e.target.value)}
                      placeholder="Enter section title"
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Section Description (Optional)</label>
                    <textarea
                      value={sectionDescription}
                      onChange={(e) => setSectionDescription(e.target.value)}
                      placeholder="Describe what this section covers"
                      className="form-textarea"
                      rows="3"
                    />
                  </div>
                  
                  <button
                    className="add-content-btn"
                    onClick={handleAddSection}
                    disabled={uploading || !sectionTitle.trim()}
                  >
                    {uploading ? 'Adding...' : 'Add Section'}
                  </button>
                </div>
              </div>

              {/* Add Lesson Form */}
              {selectedSectionIndex !== null && (
                <div className="add-content-section">
                  <h3>Add Lesson to Section {course.sections[selectedSectionIndex].order}</h3>
                  <div className="add-content-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Lesson Title *</label>
                        <input
                          type="text"
                          value={lessonTitle}
                          onChange={(e) => setLessonTitle(e.target.value)}
                          placeholder="Enter lesson title"
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Content Type *</label>
                        <select
                          value={lessonType}
                          onChange={(e) => setLessonType(e.target.value)}
                          className="form-select"
                        >
                          <option value="video">🎥 Video</option>
                          <option value="pdf">📄 PDF</option>
                          <option value="slide">📊 Slides</option>
                          <option value="text">📝 Text</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Lesson Description (Optional)</label>
                      <textarea
                        value={lessonDescription}
                        onChange={(e) => setLessonDescription(e.target.value)}
                        placeholder="Describe this lesson"
                        className="form-textarea"
                        rows="3"
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Content URL *</label>
                        <input
                          type="url"
                          value={lessonUrl}
                          onChange={(e) => setLessonUrl(e.target.value)}
                          placeholder="Enter content URL"
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Duration (minutes)</label>
                        <input
                          type="number"
                          value={lessonDuration}
                          onChange={(e) => setLessonDuration(parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="form-input"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button
                        className="cancel-btn"
                        onClick={() => {
                          setSelectedSectionIndex(null);
                          setLessonTitle('');
                          setLessonDescription('');
                          setLessonType('video');
                          setLessonUrl('');
                          setLessonDuration(0);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="add-content-btn"
                        onClick={() => handleAddLesson(selectedSectionIndex)}
                        disabled={uploading || !lessonTitle.trim() || !lessonUrl.trim()}
                      >
                        {uploading ? 'Adding...' : 'Add Lesson'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sections List */}
              <div className="content-list-section">
                <h3>
                  Course Sections
                  <span className="content-info">
                    (Organized course content for enrolled students)
                  </span>
                </h3>
                
                {course && course.sections?.length > 0 ? (
                  <div className="sections-list">
                    {course.sections.map((section, index) => 
                      renderSection(section, index)
                    )}
                  </div>
                ) : (
                  <div className="no-content">
                    <div className="no-content-icon">📚</div>
                    <h4>No sections yet</h4>
                    <p>Add some sections to organize your course content!</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
} 