import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getCourseById, 
  getCourseSyllabus,
  createModule, 
  updateModule, 
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson
} from '../api/courseApi';
import './CourseContentManagement.css';

export default function CourseContentManagement() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [syllabus, setSyllabus] = useState({ modules: [], lessons: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  useEffect(() => {
    console.log('CourseContentManagement loaded with courseId:', courseId);
    fetchCourseData();
  }, [courseId]);

  // Debug: Log syllabus state changes
  useEffect(() => {
    console.log('Syllabus state updated:', syllabus);
    console.log('Modules in state:', syllabus?.modules);
    console.log('Lessons in state:', syllabus?.lessons);
  }, [syllabus]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      console.log('Fetching course data for courseId:', courseId);
      
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }
      
      console.log('Token found:', token ? 'Yes' : 'No');
      console.log('Token length:', token ? token.length : 0);
      
      // Validate courseId exists and format
      if (!courseId) {
        setError('Course ID is missing from URL. Please navigate from the courses page.');
        setLoading(false);
        return;
      }
      
      if (courseId.length !== 24) {
        setError('Invalid course ID format');
        setLoading(false);
        return;
      }
      
      console.log('Making API calls with token and courseId:', { token: token ? 'exists' : 'missing', courseId });
      
      const [courseData, syllabusData] = await Promise.all([
        getCourseById(courseId),
        getCourseSyllabus(courseId)
      ]);
      
      console.log('Course data received:', courseData);
      console.log('Syllabus data received:', syllabusData);
      console.log('Syllabus data type:', typeof syllabusData);
      console.log('Is syllabusData array?', Array.isArray(syllabusData));
      
      // Ensure syllabus has the correct structure
      // Server returns: [{ module: {...}, lessons: [...] }, ...]
      // We need: { modules: [...], lessons: [...] }
      let formattedSyllabus = { modules: [], lessons: [] };
      
      if (Array.isArray(syllabusData)) {
        // Transform server response to expected format
        formattedSyllabus.modules = syllabusData.map(item => item.module);
        formattedSyllabus.lessons = syllabusData.reduce((allLessons, item) => {
          // Add moduleId to each lesson if it doesn't exist
          const lessonsWithModuleId = (item.lessons || []).map(lesson => ({
            ...lesson,
            moduleId: lesson.moduleId || item.module._id
          }));
          return allLessons.concat(lessonsWithModuleId);
        }, []);
      } else if (syllabusData && typeof syllabusData === 'object') {
        // If server returns object format
        formattedSyllabus.modules = syllabusData.modules || [];
        formattedSyllabus.lessons = syllabusData.lessons || [];
      }
      
      console.log('Formatted syllabus:', formattedSyllabus);
      console.log('Modules count:', formattedSyllabus.modules.length);
      console.log('Lessons count:', formattedSyllabus.lessons.length);
      
      // Debug: Check lesson structure
      if (formattedSyllabus.lessons.length > 0) {
        console.log('First lesson structure:', formattedSyllabus.lessons[0]);
        console.log('All lessons moduleIds:', formattedSyllabus.lessons.map(l => l.moduleId));
      }
      
      if (formattedSyllabus.modules.length > 0) {
        console.log('First module structure:', formattedSyllabus.modules[0]);
        console.log('All module IDs:', formattedSyllabus.modules.map(m => m._id));
      }
      
      setCourse(courseData);
      setSyllabus(formattedSyllabus);
    } catch (err) {
      console.error('Error fetching course data:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to view this course.');
      } else if (err.response?.status === 404) {
        setError('Course not found. Please check the course ID.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch course data');
      }
      
      // Set default empty syllabus structure on error
      setSyllabus({ modules: [], lessons: [] });
    } finally {
      setLoading(false);
    }
  };

  // Module Management
  const handleCreateModule = async (moduleData) => {
    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');
      
      await createModule(courseId, moduleData);
      // Refresh data to ensure consistency
      await fetchCourseData();
      setShowModuleForm(false);
      setSuccessMessage('Module created successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error creating module:', err);
      setError(err.response?.data?.message || 'Failed to create module. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateModule = async (moduleId, moduleData) => {
    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');
      
      await updateModule(moduleId, moduleData);
      // Refresh data to ensure consistency
      await fetchCourseData();
      setEditingModule(null);
      setSuccessMessage('Module updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating module:', err);
      setError(err.response?.data?.message || 'Failed to update module. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this module? All lessons will also be deleted.')) {
      return;
    }
    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');
      
      await deleteModule(moduleId);
      // Refresh data to ensure consistency
      await fetchCourseData();
      setSuccessMessage('Module deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting module:', err);
      setError(err.response?.data?.message || 'Failed to delete module. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Lesson Management
  const handleCreateLesson = async (lessonData) => {
    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');
      
      await createLesson({
        ...lessonData,
        courseId,
        moduleId: selectedModuleId
      });
      // Refresh data to ensure consistency
      await fetchCourseData();
      setShowLessonForm(false);
      setSelectedModuleId(null);
      setSuccessMessage('Lesson created successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error creating lesson:', err);
      setError(err.response?.data?.message || 'Failed to create lesson. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateLesson = async (lessonId, lessonData) => {
    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');
      
      await updateLesson(lessonId, lessonData);
      // Refresh data to ensure consistency
      await fetchCourseData();
      setEditingLesson(null);
      setSuccessMessage('Lesson updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating lesson:', err);
      setError(err.response?.data?.message || 'Failed to update lesson. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) {
      return;
    }
    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');
      
      await deleteLesson(lessonId);
      // Refresh data to ensure consistency
      await fetchCourseData();
      setSuccessMessage('Lesson deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting lesson:', err);
      setError(err.response?.data?.message || 'Failed to delete lesson. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getLessonsForModule = (moduleId) => {
    if (!syllabus?.lessons) {
      console.log('No lessons in syllabus');
      return [];
    }
    
    console.log(`Looking for lessons with moduleId: ${moduleId}`);
    console.log('Available lessons:', syllabus.lessons);
    console.log('Available lesson moduleIds:', syllabus.lessons.map(l => l.moduleId));
    
    // First try to find lessons by moduleId
    let moduleLessons = syllabus.lessons.filter(lesson => lesson.moduleId === moduleId);
    
    // If no lessons found by moduleId, try to find them in the original server response
    if (moduleLessons.length === 0) {
      console.log('No lessons found by moduleId, trying fallback method...');
      // This is a fallback - in case the server response structure changes
      // We can implement additional logic here if needed
    }
    
    console.log(`Lessons for module ${moduleId}:`, moduleLessons);
    return moduleLessons;
  };

  if (loading) {
    return (
      <div className="instructor-layout">
        <main className="instructor-main">
          <div className="loading">Loading course content...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="instructor-layout">
        <main className="instructor-main">
          <div className="error">Error: {error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="instructor-layout">
      <main className="instructor-main">
        <div className="content-management">
          <div className="page-header">
            <div className="header-content">
              <h1>Course Content Management</h1>
              <p>{course?.title}</p>
            </div>
            <button 
              onClick={() => navigate('/instructor/courses')}
              className="back-btn"
            >
              ← Back to Courses
            </button>
          </div>

          <div className="course-overview">
            <div className="course-info">
              <h2>{course?.title}</h2>
              {course?.subtitle && <p className="subtitle">{course.subtitle}</p>}
              <div className="course-stats">
                <span>📚 {syllabus?.modules?.length || 0} modules</span>
                <span>📖 {syllabus?.lessons?.length || 0} lessons</span>
                <span>⏱ {Math.floor((course?.stats?.totalDurationSec || 0) / 60)} min</span>
              </div>
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="error-message">
              <span>❌ {error}</span>
              <button onClick={() => setError('')} className="close-error">×</button>
            </div>
          )}
          
          {successMessage && (
            <div className="success-message">
              <span>✅ {successMessage}</span>
            </div>
          )}

          <div className="content-actions">
            <button 
              onClick={() => setShowModuleForm(true)}
              className="action-btn primary"
              disabled={actionLoading}
            >
              {actionLoading ? 'Loading...' : '+ Add Module'}
            </button>
          </div>

          <div className="modules-container">
            {!syllabus?.modules || syllabus.modules.length === 0 ? (
              <div className="no-content">
                <p>No modules yet. Start by adding your first module!</p>
              </div>
            ) : (
              <>
                {syllabus.modules.map((module, index) => (
                <div key={module._id} className="module-card">
                  <div className="module-header">
                    <div className="module-info">
                      <h3>Module {module.order}: {module.title}</h3>
                      {module.summary && <p>{module.summary}</p>}
                    </div>
                    <div className="module-actions">
                      <button 
                        onClick={() => handleDeleteModule(module._id)}
                        className="action-btn danger"
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  <div className="lessons-section">
                    <div className="lessons-header">
                      <h4>Lessons ({getLessonsForModule(module._id)?.length || 0})</h4>
                                              <button 
                          onClick={() => {
                            setSelectedModuleId(module._id);
                            setShowLessonForm(true);
                          }}
                          className="action-btn secondary"
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Loading...' : '+ Add Lesson'}
                        </button>
                    </div>

                    <div className="lessons-list">
                      {getLessonsForModule(module._id)?.map((lesson, lessonIndex) => (
                        <div key={lesson._id} className="lesson-item">
                          <div className="lesson-info">
                            <span className="lesson-order">{lesson.order}</span>
                            <div className="lesson-details">
                              <h5>{lesson.title}</h5>
                              <div className="lesson-meta">
                                <span className={`type-badge ${lesson.contentType}`}>
                                  {lesson.contentType}
                                </span>
                                {lesson.durationSec > 0 && (
                                  <span>{Math.floor(lesson.durationSec / 60)}m</span>
                                )}
                                {lesson.isPreview && <span className="preview-badge">Preview</span>}
                              </div>
                            </div>
                          </div>
                          <div className="lesson-actions">
                            <button 
                              onClick={() => setEditingLesson(lesson)}
                              className="action-btn small"
                              disabled={actionLoading}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteLesson(lesson._id)}
                              className="action-btn small danger"
                              disabled={actionLoading}
                            >
                              {actionLoading ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </>
            )}
          </div>
        </div>

        {/* Module Form Modal */}
        {showModuleForm && (
          <ModuleForm 
            onSubmit={handleCreateModule}
            onCancel={() => setShowModuleForm(false)}
            nextOrder={(syllabus?.modules?.length || 0) + 1}
            loading={actionLoading}
          />
        )}

        {/* Edit Module Modal */}
        {editingModule && (
          <ModuleForm 
            module={editingModule}
            onSubmit={(data) => handleUpdateModule(editingModule._id, data)}
            onCancel={() => setEditingModule(null)}
            isEditing={true}
            loading={actionLoading}
          />
        )}

        {/* Lesson Form Modal */}
        {showLessonForm && selectedModuleId && (
          <LessonForm 
            onSubmit={handleCreateLesson}
            onCancel={() => {
              setShowLessonForm(false);
              setSelectedModuleId(null);
            }}
            moduleId={selectedModuleId}
            nextOrder={(getLessonsForModule(selectedModuleId)?.length || 0) + 1}
            loading={actionLoading}
          />
        )}

        {/* Edit Lesson Modal */}
        {editingLesson && (
          <LessonForm 
            lesson={editingLesson}
            onSubmit={(data) => handleUpdateLesson(editingLesson._id, data)}
            onCancel={() => setEditingLesson(null)}
            isEditing={true}
            loading={actionLoading}
          />
        )}
      </main>
    </div>
  );
}

// Module Form Component
function ModuleForm({ module, onSubmit, onCancel, nextOrder, isEditing = false, loading = false }) {
  const [formData, setFormData] = useState({
    title: module?.title || '',
    summary: module?.summary || '',
    order: module?.order || nextOrder
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim()) {
      alert('Module title is required');
      return;
    }
    
    // Validate order
    if (formData.order < 1) {
      alert('Order must be at least 1');
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{isEditing ? 'Edit Module' : 'Create New Module'}</h3>
          <button onClick={onCancel} className="close-btn">×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Module Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter module title"
              required
            />
          </div>
          <div className="form-group">
            <label>Summary</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Describe what this module covers"
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Order</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
              min="1"
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Loading...' : (isEditing ? 'Update Module' : 'Create Module')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Lesson Form Component
function LessonForm({ lesson, onSubmit, onCancel, moduleId, nextOrder, isEditing = false, loading = false }) {
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    description: lesson?.description || '',
    contentType: lesson?.contentType || 'video',
    url: lesson?.url || '',
    textContent: lesson?.textContent || '',
    durationSec: lesson?.durationSec || 0,
    order: lesson?.order || nextOrder,
    isPreview: lesson?.isPreview || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim()) {
      alert('Lesson title is required');
      return;
    }
    
    // Validate content based on contentType
    if (formData.contentType === 'text') {
      if (!formData.textContent.trim()) {
        alert('Text content is required for text lessons');
        return;
      }
    } else {
      if (!formData.url.trim()) {
        alert('URL is required for non-text lessons');
        return;
      }
    }
    
    // Validate order
    if (formData.order < 1) {
      alert('Order must be at least 1');
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{isEditing ? 'Edit Lesson' : 'Create New Lesson'}</h3>
          <button onClick={onCancel} className="close-btn">×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Lesson Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter lesson title"
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this lesson covers"
              rows="2"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Content Type</label>
              <select
                value={formData.contentType}
                onChange={(e) => setFormData(prev => ({ ...prev, contentType: e.target.value }))}
              >
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
                <option value="slide">Slide</option>
                <option value="text">Text</option>
              </select>
            </div>
            <div className="form-group">
              <label>Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                min="1"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Content URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com/content"
            />
          </div>
          <div className="form-group">
            <label>Text Content</label>
            <textarea
              value={formData.textContent}
              onChange={(e) => setFormData(prev => ({ ...prev, textContent: e.target.value }))}
              placeholder="Enter text content for this lesson"
              rows="4"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Duration (hour)</label>
              <input
                type="number"
                value={formData.durationSec}
                onChange={(e) => setFormData(prev => ({ ...prev, durationSec: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isPreview}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPreview: e.target.checked }))}
                />
                {/* Preview Lesson */}
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Loading...' : (isEditing ? 'Update Lesson' : 'Create Lesson')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 