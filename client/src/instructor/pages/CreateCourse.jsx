import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CreateCourse.css';

export default function CreateCourse() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    imageIntroduction: '',
    sections: []
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
    const { name, value } = e.target;
    console.log('Form field changed:', name, value);
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      console.log('Updated form data:', newData);
      return newData;
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const addSection = () => {
    const newSection = {
      title: '',
      description: '',
      order: formData.sections.length + 1,
      lessons: []
    };
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const updateSection = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };

  const removeSection = (index) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index).map((section, i) => ({
        ...section,
        order: i + 1
      }))
    }));
  };

  const addLesson = (sectionIndex) => {
    const newLesson = {
      title: '',
      description: '',
      type: 'video',
      url: '',
      duration: 0,
      order: formData.sections[sectionIndex].lessons.length + 1
    };
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { ...section, lessons: [...section.lessons, newLesson] }
          : section
      )
    }));
  };

  const updateLesson = (sectionIndex, lessonIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? {
              ...section,
              lessons: section.lessons.map((lesson, j) => 
                j === lessonIndex ? { ...lesson, [field]: value } : lesson
              )
            }
          : section
      )
    }));
  };

  const removeLesson = (sectionIndex, lessonIndex) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? {
              ...section,
              lessons: section.lessons.filter((_, j) => j !== lessonIndex).map((lesson, j) => ({
                ...lesson,
                order: j + 1
              }))
            }
          : section
      )
    }));
  };

  const validateForm = () => {
    console.log('Validating form with data:', formData);
    
    if (!formData.title.trim()) {
      console.log('Title validation failed');
      setError('Course title is required');
      return false;
    }
    if (!formData.description.trim()) {
      console.log('Description validation failed');
      setError('Course description is required');
      return false;
    }
    if (formData.title.trim().length < 3) {
      console.log('Title length validation failed');
      setError('Course title must be at least 3 characters long');
      return false;
    }
    if (formData.description.trim().length < 10) {
      console.log('Description length validation failed');
      setError('Course description must be at least 10 characters long');
      return false;
    }
    if (formData.price < 0) {
      console.log('Price validation failed');
      setError('Course price cannot be negative');
      return false;
    }

    // Validate sections
    for (let i = 0; i < formData.sections.length; i++) {
      const section = formData.sections[i];
      if (!section.title.trim()) {
        setError(`Section ${i + 1} title is required`);
        return false;
      }
      
      // Validate lessons in each section
      for (let j = 0; j < section.lessons.length; j++) {
        const lesson = section.lessons[j];
        if (!lesson.title.trim()) {
          setError(`Lesson ${j + 1} in Section ${i + 1} title is required`);
          return false;
        }
        if (!lesson.url.trim()) {
          setError(`Lesson ${j + 1} in Section ${i + 1} URL is required`);
          return false;
        }
      }
    }

    console.log('Form validation passed');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Token exists' : 'No token found');
      
      const requestData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: formData.price,
        imageIntroduction: formData.imageIntroduction.trim() || undefined,
        sections: formData.sections.map(section => ({
          ...section,
          title: section.title.trim(),
          description: section.description.trim(),
          lessons: section.lessons.map(lesson => ({
            ...lesson,
            title: lesson.title.trim(),
            description: lesson.description.trim(),
            url: lesson.url.trim()
          }))
        }))
      };
      
      console.log('Sending request with data:', requestData);
      
      const response = await axios.post('http://localhost:8080/api/courses', requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Response received:', response.data);
      setSuccess('Course created successfully! Redirecting to course management...');
      
      // Redirect to the new course's content management page after 2 seconds
      setTimeout(() => {
        navigate(`/instructor/courses/${response.data._id}/content`);
      }, 2000);

    } catch (err) {
      console.error('Create course error:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
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
                  <label htmlFor="price">Course Price (Optional)</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Enter course price (e.g., 100)"
                    className="form-input"
                    disabled={loading}
                  />
                  <small>Set a price for your course if you want to monetize it.</small>
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
                <h3>Course Sections</h3>
                <p>Organize your course content into sections. Each section can contain multiple lessons.</p>
                
                {formData.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="section-container">
                    <div className="section-header">
                      <h4>Section {section.order}</h4>
                      <button
                        type="button"
                        className="remove-section-btn"
                        onClick={() => removeSection(sectionIndex)}
                        disabled={loading}
                      >
                        Remove Section
                      </button>
                    </div>
                    
                    <div className="form-group">
                      <label>Section Title *</label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                        placeholder="Enter section title"
                        className="form-input"
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Section Description</label>
                      <textarea
                        value={section.description}
                        onChange={(e) => updateSection(sectionIndex, 'description', e.target.value)}
                        placeholder="Describe what this section covers"
                        className="form-textarea"
                        rows="3"
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="lessons-container">
                      <h5>Lessons in this Section</h5>
                      {section.lessons.map((lesson, lessonIndex) => (
                        <div key={lessonIndex} className="lesson-container">
                          <div className="lesson-header">
                            <h6>Lesson {lesson.order}</h6>
                            <button
                              type="button"
                              className="remove-lesson-btn"
                              onClick={() => removeLesson(sectionIndex, lessonIndex)}
                              disabled={loading}
                            >
                              Remove Lesson
                            </button>
                          </div>
                          
                          <div className="lesson-fields">
                            <div className="form-group">
                              <label>Lesson Title *</label>
                              <input
                                type="text"
                                value={lesson.title}
                                onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'title', e.target.value)}
                                placeholder="Enter lesson title"
                                className="form-input"
                                required
                                disabled={loading}
                              />
                            </div>
                            
                            <div className="form-group">
                              <label>Lesson Description</label>
                              <textarea
                                value={lesson.description}
                                onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'description', e.target.value)}
                                placeholder="Describe this lesson"
                                className="form-textarea"
                                rows="2"
                                disabled={loading}
                              />
                            </div>
                            
                            <div className="lesson-type-duration">
                              <div className="form-group">
                                <label>Content Type *</label>
                                <select
                                  value={lesson.type}
                                  onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'type', e.target.value)}
                                  className="form-select"
                                  disabled={loading}
                                >
                                  <option value="video">Video</option>
                                  <option value="pdf">PDF</option>
                                  <option value="slide">Slide</option>
                                  <option value="text">Text</option>
                                </select>
                              </div>
                              
                              <div className="form-group">
                                <label>Duration (minutes)</label>
                                <input
                                  type="number"
                                  value={lesson.duration}
                                  onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'duration', parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                  className="form-input"
                                  min="0"
                                  disabled={loading}
                                />
                              </div>
                            </div>
                            
                            <div className="form-group">
                              <label>Content URL *</label>
                              <input
                                type="url"
                                value={lesson.url}
                                onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'url', e.target.value)}
                                placeholder="Enter content URL"
                                className="form-input"
                                required
                                disabled={loading}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        className="add-lesson-btn"
                        onClick={() => addLesson(sectionIndex)}
                        disabled={loading}
                      >
                        + Add Lesson to Section {section.order}
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="add-section-btn"
                  onClick={addSection}
                  disabled={loading}
                >
                  + Add New Section
                </button>
              </div>

              <div className="form-section">
                <h3>Course Setup Information</h3>
                <div className="info-cards">
                  <div className="info-card">
                    <div className="info-icon">📝</div>
                    <div className="info-content">
                      <h4>Content Organization</h4>
                      <p>Organize your course into logical sections. Each section can contain multiple lessons of different types.</p>
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
                      <h4>Content Types</h4>
                      <p>Support for video, PDF, slides, and text content. You can also add introduction content visible to all students.</p>
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
                  type="button"
                  className="create-btn"
                  disabled={loading}
                  onClick={() => {
                    console.log('Create Course button clicked');
                    handleSubmit({ preventDefault: () => {} });
                  }}
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