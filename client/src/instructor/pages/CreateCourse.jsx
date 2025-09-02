import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCourse } from '../api/courseApi';
import './CreateCourse.css';

export default function CreateCourse() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    level: 'beginner',
    priceType: 'free',
    price: 0,
    salePrice: 0,
    currency: 'AUD',
    thumbnailUrl: '',
    promoVideoUrl: '',
    introductionAssets: [],
    status: 'draft',
    modules: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Debug authentication state
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('Authentication debug:', {
      token: token ? 'Token exists' : 'No token',
      user: user ? JSON.parse(user) : 'No user data'
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log('Form field changed:', name, value);
    
    setFormData(prev => {
      let newValue = type === 'checkbox' ? checked : value;
      
      const newData = {
        ...prev,
        [name]: newValue
      };
      
      // Handle price type change
      if (name === 'priceType') {
        if (value === 'free') {
          newData.price = 0;
          newData.salePrice = 0;
        }
      }
      
      console.log('Updated form data:', newData);
      return newData;
    });
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const addModule = () => {
    const newModule = {
      title: '',
      summary: '',
      order: formData.modules.length + 1,
      lessons: []
    };
    setFormData(prev => ({
      ...prev,
      modules: [...prev.modules, newModule]
    }));
  };

  const updateModule = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((module, i) => 
        i === index ? { ...module, [field]: value } : module
      )
    }));
  };

  const removeModule = (index) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index).map((module, i) => ({
        ...module,
        order: i + 1
      }))
    }));
  };

  const addLesson = (moduleIndex) => {
    const newLesson = {
      title: '',
      description: '',
      contentType: 'video',
      url: '',
      textContent: '',
      durationSec: 0,
      order: formData.modules[moduleIndex].lessons.length + 1,
      isPreview: false
    };
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((module, i) => 
        i === moduleIndex 
          ? { ...module, lessons: [...module.lessons, newLesson] }
          : module
      )
    }));
  };

  const updateLesson = (moduleIndex, lessonIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((module, i) => 
        i === moduleIndex 
          ? {
              ...module,
              lessons: module.lessons.map((lesson, j) => 
                j === lessonIndex ? { ...lesson, [field]: value } : lesson
              )
            }
          : module
      )
    }));
  };

  const removeLesson = (moduleIndex, lessonIndex) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((module, i) => 
        i === moduleIndex 
          ? {
              ...module,
              lessons: module.lessons.filter((_, j) => j !== lessonIndex).map((lesson, j) => ({
                ...lesson,
                order: j + 1
              }))
            }
          : module
      )
    }));
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

    if (formData.priceType === 'paid') {
      if (formData.price <= 0) {
        setError('Paid courses must have a price greater than 0');
        return false;
      }
      
      if (formData.salePrice && formData.salePrice >= formData.price) {
        setError('Sale price must be less than regular price');
        return false;
      }
    }

    // Validate modules
    for (let i = 0; i < formData.modules.length; i++) {
      const module = formData.modules[i];
      if (!module.title.trim()) {
        setError(`Module ${i + 1} title is required`);
        return false;
      }
      
      // Validate lessons in each module
      for (let j = 0; j < module.lessons.length; j++) {
        const lesson = module.lessons[j];
        if (!lesson.title.trim()) {
          setError(`Lesson ${j + 1} in Module ${i + 1} title is required`);
          return false;
        }
        if (!lesson.url.trim() && !lesson.textContent.trim()) {
          setError(`Lesson ${j + 1} in Module ${i + 1} URL or text content is required`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Submitting course data:', formData);
      const result = await createCourse(formData);
      console.log('Course created successfully:', result);
      
      const statusMessage = formData.status === 'pending' 
        ? 'Course submitted for review successfully! Admin will review and approve your course.'
        : 'Course saved as draft successfully! You can edit and submit for review later.';
      
      setSuccess(statusMessage);
      setTimeout(() => {
        navigate('/instructor/courses');
      }, 3000);
      
    } catch (err) {
      console.error('Error creating course:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create course. Please try again.';
      setError(errorMessage);
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
              <p>Set up your course with basic information and organize content into sections.</p>
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
            <form 
              className="create-course-form" 
              onSubmit={(e) => {
                console.log('Form onSubmit triggered');
                handleSubmit(e);
              }}
            >
              <div className="form-section">
                <h3>Course Information</h3>
                
                <div className="form-group-cr-coure">
                  <label htmlFor="title">Course Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter course title"
                    className="form-input-cr-coure"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group-cr-coure">
                  <label htmlFor="subtitle">Course Subtitle</label>
                  <input
                    type="text"
                    id="subtitle"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleChange}
                    placeholder="Enter course subtitle"
                    className="form-input-cr-coure"
                    disabled={loading}
                  />
                </div>

                <div className="form-group-cr-coure">
                  <label htmlFor="description">Course Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what students will learn in this course"
                    className="form-textarea"
                    rows="4"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group-cr-coure">
                    <label htmlFor="level">Course Level</label>
                    <select
                      id="level"
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className="form-select-cr-coure"
                      disabled={loading}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="form-group-cr-coure">
                    <label htmlFor="priceType">Price Type</label>
                    <select
                      id="priceType"
                      name="priceType"
                      value={formData.priceType}
                      onChange={handleChange}
                      className="form-select-cr-coure"
                      disabled={loading}
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>

                  {formData.priceType === 'paid' && (
                    <>
                      <div className="form-group-cr-coure">
                        <label htmlFor="price">Course Price (AUD) *</label>
                        <input
                          type="number"
                          id="price"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="0"
                          className="form-input-cr-coure"
                          min="0.01"
                          step="0.01"
                          required
                          disabled={loading}
                        />
                      </div>

                      <div className="form-group-cr-coure">
                        <label htmlFor="salePrice">Sale Price (AUD) - Optional</label>
                        <input
                          type="number"
                          id="salePrice"
                          name="salePrice"
                          value={formData.salePrice}
                          onChange={handleChange}
                          placeholder="0"
                          className="form-input-cr-coure"
                          min="0"
                          step="0.01"
                          disabled={loading}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="form-group-cr-coure">
                  <label htmlFor="thumbnailUrl">Course Thumbnail URL</label>
                  <input
                    type="url"
                    id="thumbnailUrl"
                    name="thumbnailUrl"
                    value={formData.thumbnailUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="form-input-cr-coure"
                    disabled={loading}
                  />
                </div>

                <div className="form-group-cr-coure">
                  <label htmlFor="promoVideoUrl">Course Promo Video URL</label>
                  <input
                    type="url"
                    id="promoVideoUrl"
                    name="promoVideoUrl"
                    value={formData.promoVideoUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/video.mp4"
                    className="form-input-cr-coure"
                    disabled={loading}
                  />
                </div>

                <div className="form-group-cr-coure">
                  <label htmlFor="status">Course Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-select-cr-coure"
                    disabled={loading}
                  >
                    <option value="draft">Draft - Save as draft for later editing</option>
                    <option value="pending">Submit for Review - Ready for admin approval</option>
                  </select>
                  <small className="form-help-text">
                    Choose "Draft" to save your work, or "Submit for Review" when ready for admin approval.
                  </small>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <h3>Course Content</h3>
                  <button
                    type="button"
                    onClick={addModule}
                    className="add-section-btn"
                    disabled={loading}
                  >
                    + Add Module
                  </button>
                </div>

                {formData.modules.length === 0 && (
                  <div className="no-sections">
                    <p>No modules added yet. Click "Add Module" to start organizing your course content.</p>
                  </div>
                )}

                {formData.modules.map((module, moduleIndex) => (
                  <div key={moduleIndex} className="section-container">
                    <div className="section-header">
                      <h4>Module {module.order}</h4>
                      <button
                        type="button"
                        onClick={() => removeModule(moduleIndex)}
                        className="remove-section-btn"
                        disabled={loading}
                      >
                        Remove Module
                      </button>
                    </div>

                    <div className="form-group-cr-coure">
                      <label>Module Title *</label>
                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                        placeholder="Enter module title"
                        className="form-input-cr-coure"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group-cr-coure">
                      <label>Module Summary</label>
                      <textarea
                        value={module.summary}
                        onChange={(e) => updateModule(moduleIndex, 'summary', e.target.value)}
                        placeholder="Describe what this module covers"
                        className="form-textarea"
                        rows="2"
                        disabled={loading}
                      />
                    </div>

                    <div className="lessons-container">
                      <div className="lessons-header">
                        <h5>Lessons in this Module</h5>
                        <button
                          type="button"
                          onClick={() => addLesson(moduleIndex)}
                          className="add-lesson-btn"
                          disabled={loading}
                        >
                          + Add Lesson
                        </button>
                      </div>

                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={lessonIndex} className="lesson-container">
                          <div className="lesson-header">
                            <h6>Lesson {lesson.order}</h6>
                            <button
                              type="button"
                              onClick={() => removeLesson(moduleIndex, lessonIndex)}
                              className="remove-lesson-btn"
                              disabled={loading}
                            >
                              Remove
                            </button>
                          </div>

                          <div className="form-row">
                            <div className="form-group-cr-coure">
                              <label>Lesson Title *</label>
                              <input
                                type="text"
                                value={lesson.title}
                                onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                                placeholder="Enter lesson title"
                                className="form-input-cr-coure"
                                required
                                disabled={loading}
                              />
                            </div>

                            <div className="form-group-cr-coure">
                              <label>Lesson Type</label>
                              <select
                                value={lesson.contentType}
                                onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'contentType', e.target.value)}
                                className="form-select-cr-coure"
                                disabled={loading}
                              >
                                <option value="video">Video</option>
                                <option value="pdf">PDF</option>
                                <option value="slide">Slide</option>
                                <option value="text">Text</option>
                              </select>
                            </div>
                          </div>

                          <div className="form-group-cr-coure">
                            <label>Lesson Description</label>
                            <textarea
                              value={lesson.description}
                              onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'description', e.target.value)}
                              placeholder="Describe what this lesson covers"
                              className="form-textarea"
                              rows="2"
                              disabled={loading}
                            />
                          </div>

                          <div className="form-row">
                            <div className="form-group-cr-coure">
                              <label>Content URL</label>
                              <input
                                type="url"
                                value={lesson.url}
                                onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'url', e.target.value)}
                                placeholder="https://example.com/lesson-content"
                                className="form-input-cr-coure"
                                disabled={loading}
                              />
                            </div>

                            {/* <div className="form-group-cr-coure">
                              <label>Text Content</label>
                              <textarea
                                value={lesson.textContent}
                                onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'textContent', e.target.value)}
                                placeholder="Enter text content for this lesson"
                                className="form-textarea"
                                rows="2"
                                disabled={loading}
                              />
                            </div> */}

                            <div className="form-group-cr-coure">
                              <label>Duration (hour)</label>
                              <input
                                type="number"
                                value={lesson.durationHour}
                                onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'durationSec', parseInt(e.target.value) || 0)}
                                placeholder="0"
                                className="form-input-cr-coure"
                                min="0"
                                disabled={loading}
                              />
                            </div>
                          </div>

                          {/* <div className="form-group-cr-coure">
                            <label>Preview Lesson</label>
                            <input
                              type="checkbox"
                              checked={lesson.isPreview}
                              onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'isPreview', e.target.checked)}
                              disabled={loading}
                            />
                          </div> */}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Creating Course...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 