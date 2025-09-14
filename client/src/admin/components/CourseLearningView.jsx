import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CourseLearningView.css';

export default function CourseLearningView({ course, isForApproval = false, onClose, onApprove, onReject, adminNote, setAdminNote, approvingId, rejectingId }) {
  const [syllabus, setSyllabus] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (course) {
      fetchCourseSyllabus();
    }
  }, [course]);

  const fetchCourseSyllabus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch course syllabus
      const response = await axios.get(`http://localhost:8080/api/courses/${course._id}/syllabus`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let transformedSyllabus = { sections: [], lessons: [] };

      if (Array.isArray(response.data)) {
        transformedSyllabus.sections = response.data.map(item => ({
          _id: item.module._id,
          title: item.module.title,
          summary: item.module.summary,
          order: item.module.order,
          lessons: item.lessons || []
        }));
        transformedSyllabus.lessons = response.data.reduce((all, item) => {
          const lessonsWithModuleId = (item.lessons || []).map(lesson => ({
            ...lesson,
            moduleId: item.module._id
          }));
          return all.concat(lessonsWithModuleId);
        }, []);
      }

      setSyllabus(transformedSyllabus);
      
      // Set first lesson as current if available
      if (transformedSyllabus.lessons.length > 0) {
        setCurrentLesson(transformedSyllabus.lessons[0]);
      }
    } catch (err) {
      console.error('Failed to fetch course syllabus:', err);
      setError('Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lesson) => {
    setCurrentLesson(lesson);
    
    // Find which section this lesson belongs to
    const sectionIndex = syllabus.sections.findIndex(section => 
      section.lessons.some(l => l._id === lesson._id)
    );
    if (sectionIndex !== -1) {
      setCurrentSection(sectionIndex);
    }
    
    // Find lesson index within the section
    const lessonIndex = syllabus.sections[sectionIndex]?.lessons.findIndex(l => l._id === lesson._id);
    if (lessonIndex !== -1) {
      setCurrentLessonIndex(lessonIndex);
    }
  };

  const handleNextLesson = () => {
    if (syllabus && currentLesson) {
      const currentIndex = syllabus.lessons.findIndex(l => l._id === currentLesson._id);
      if (currentIndex < syllabus.lessons.length - 1) {
        const nextLesson = syllabus.lessons[currentIndex + 1];
        handleLessonClick(nextLesson);
      }
    }
  };

  const handlePrevLesson = () => {
    if (syllabus && currentLesson) {
      const currentIndex = syllabus.lessons.findIndex(l => l._id === currentLesson._id);
      if (currentIndex > 0) {
        const prevLesson = syllabus.lessons[currentIndex - 1];
        handleLessonClick(prevLesson);
      }
    }
  };

  if (loading) {
    return (
      <div className="clv-container">
        <header className="clv-header">
          <div className="clv-course-info">
            <h1>{course?.title}</h1>
            <p className="clv-course-description">{course?.description}</p>
          </div>
          <button 
            className="clv-close-header-btn"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </header>
        <div className="clv-loading">
          <div className="clv-loading-spinner"></div>
          <p>Loading course content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clv-container">
        <header className="clv-header">
          <div className="clv-course-info">
            <h1>{course?.title}</h1>
            <p className="clv-course-description">{course?.description}</p>
          </div>
          <button 
            className="clv-close-header-btn"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </header>
        <div className="clv-error">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!syllabus || !syllabus.sections || syllabus.sections.length === 0) {
    return (
      <div className="clv-container">
        <header className="clv-header">
          <div className="clv-course-info">
            <h1>{course?.title}</h1>
            <p className="clv-course-description">{course?.description}</p>
          </div>
          <button 
            className="clv-close-header-btn"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </header>
        <div className="clv-error">
          <h3>No Content Available</h3>
          <p>This course doesn't have any modules or lessons yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clv-container">
      {/* Header */}
      <header className="clv-header">
        <div className="clv-course-info">
          <h1>{course?.title}</h1>
          <p className="clv-course-description">{course?.description}</p>
        </div>
        <button 
          className="clv-close-header-btn"
          onClick={onClose}
          title="Close"
        >
          ✕
        </button>
      </header>

      <div className="clv-content">
        {/* Sidebar */}
        <aside className="clv-sidebar">
          <nav className="clv-sections-nav">
            <h3>Course Content</h3>
            {syllabus.sections.map((section, sectionIndex) => (
              <div key={section._id} className="clv-section">
                <h4 className="clv-section-title">
                  Module {section.order}: {section.title}
                </h4>
                {section.summary && (
                  <p className="clv-section-summary">{section.summary}</p>
                )}
                
                {section.lessons && section.lessons.length > 0 && (
                  <ul className="clv-lessons-list">
                    {section.lessons.map((lesson, lessonIndex) => (
                      <li key={lesson._id} className="clv-lesson-item">
                        <button
                          className={`clv-lesson-btn ${currentLesson?._id === lesson._id ? 'active' : ''}`}
                          onClick={() => handleLessonClick(lesson)}
                        >
                          <span className="clv-lesson-title">
                            {lesson.title}
                          </span>
                          <div className="clv-lesson-meta">
                            <span className="clv-lesson-type">{lesson.contentType}</span>
                            {lesson.durationSec > 0 && (
                              <span className="clv-lesson-duration">
                                {Math.floor(lesson.durationSec / 60)}m
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="clv-main">
          {currentLesson ? (
            <article className="clv-lesson-content">
              <header className="clv-lesson-header">
                <h2>{currentLesson.title}</h2>
                <div className="clv-lesson-meta">
                  <span className="clv-lesson-duration">
                    Duration: {currentLesson.durationSec ? `${Math.floor(currentLesson.durationSec / 60)} minutes` : 'N/A'}
                  </span>
                  <span className="clv-lesson-type">
                    Type: {currentLesson.contentType || 'Lesson'}
                  </span>
                </div>
              </header>

              <div className="clv-lesson-body">
                {/* Text Content */}
                {currentLesson.contentType === 'text' && currentLesson.textContent && (
                  <section className="clv-text-content">
                    <div className="clv-content-type-header">
                      <h4>📝 Text Content</h4>
                    </div>
                    <div className="clv-text-content-wrapper">
                      <div dangerouslySetInnerHTML={{ __html: currentLesson.textContent }} />
                    </div>
                  </section>
                )}

                {/* Video Content */}
                {currentLesson.contentType === 'video' && currentLesson.videoUrl && (
                  <section className="clv-video-content">
                    <div className="clv-content-type-header">
                      <h4>🎥 Video Content</h4>
                    </div>
                    <div className="clv-video-wrapper">
                      <iframe
                        src={currentLesson.videoUrl}
                        title={currentLesson.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </section>
                )}

                {/* Audio Content */}
                {currentLesson.contentType === 'audio' && currentLesson.audioUrl && (
                  <section className="clv-audio-content">
                    <div className="clv-content-type-header">
                      <h4>🎵 Audio Content</h4>
                    </div>
                    <div className="clv-audio-wrapper">
                      <audio controls className="clv-audio-player">
                        <source src={currentLesson.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </section>
                )}

                {/* PDF Content */}
                {currentLesson.contentType === 'pdf' && currentLesson.pdfUrl && (
                  <section className="clv-pdf-content">
                    <div className="clv-content-type-header">
                      <h4>📄 PDF Content</h4>
                    </div>
                    <div className="clv-pdf-wrapper">
                      <iframe
                        src={currentLesson.pdfUrl}
                        title={currentLesson.title}
                        className="clv-pdf-viewer"
                      ></iframe>
                    </div>
                  </section>
                )}

                {/* Lesson Description */}
                {currentLesson.description && (
                  <section className="clv-lesson-description">
                    <h4>Description</h4>
                    <p>{currentLesson.description}</p>
                  </section>
                )}
              </div>

              {/* Navigation */}
              <nav className="clv-lesson-nav">
                <button
                  className="clv-nav-btn clv-prev-btn"
                  onClick={handlePrevLesson}
                  disabled={syllabus.lessons.findIndex(l => l._id === currentLesson._id) === 0}
                >
                  ← Previous
                </button>
                <button
                  className="clv-nav-btn clv-next-btn"
                  onClick={handleNextLesson}
                  disabled={syllabus.lessons.findIndex(l => l._id === currentLesson._id) === syllabus.lessons.length - 1}
                >
                  Next →
                </button>
              </nav>
            </article>
          ) : (
            <section className="clv-no-lesson">
              <h3>Welcome to {course?.title}!</h3>
              <p>Select a lesson from the sidebar to start viewing.</p>
              <div className="clv-course-overview">
                <h4>Course Overview</h4>
                <p>
                  This course contains {syllabus.sections.length} modules with a total of {syllabus.lessons?.length || 0} lessons.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Footer with Action Buttons */}
      <footer className="clv-footer">
        {isForApproval ? (
          <div className="clv-approval-actions">
            <div className="clv-admin-notes">
              <label htmlFor="adminNoteDetail">Admin Notes:</label>
              <textarea
                id="adminNoteDetail"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add notes about this course review..."
                rows="3"
              />
            </div>
            <div className="clv-action-buttons">
              <button
                onClick={onClose}
                className="clv-btn clv-cancel-btn"
              >
                Close
              </button>
              <button
                onClick={() => onReject(course._id)}
                className="clv-btn clv-reject-btn"
                disabled={rejectingId === course._id}
              >
                {rejectingId === course._id ? 'Rejecting...' : 'Reject Course'}
              </button>
              <button
                onClick={() => onApprove(course._id)}
                className="clv-btn clv-approve-btn"
                disabled={approvingId === course._id}
              >
                {approvingId === course._id ? 'Approving...' : 'Approve Course'}
              </button>
            </div>
          </div>
        ) : (
          <div className="clv-view-actions">
            <button
              onClick={onClose}
              className="clv-btn clv-close-btn"
            >
              Close
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}
