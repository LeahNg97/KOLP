import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseByID, getCourseSyllabus } from '../api/courseApi';
import { getEnrollmentByCourseId } from '../api/enrollmentApi';
import {
  markLessonCompleted,
  markLessonIncomplete,
  getLessonProgress,
  updateLessonAccess
} from '../api/lessonProgressApi';
import { getCourseProgressBreakdown } from '../api/courseProgressApi';
import './CourseDetailLearning.css';
import Footer from '../../components/Footer';
import QuizProgressCard from '../components/QuizProgressCard';
import { shortQuestionProgressApi } from '../api/shortQuestionApi';


export default function CourseDetailLearning() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [syllabus, setSyllabus] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentLesson, setCurrentLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [shortQuestions, setShortQuestions] = useState([]);
  const [shortQuestionProgress, setShortQuestionProgress] = useState([]);
  const [progressBreakdown, setProgressBreakdown] = useState(null);


  useEffect(() => {
    fetchCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);


  // Update lesson access time when current lesson changes
  useEffect(() => {
    if (currentLesson && enrollment && enrollment.status === 'approved') {
      const currentModule = syllabus?.sections?.find(section =>
        section.lessons?.some(lesson => lesson._id === currentLesson._id)
      );
      if (currentModule) {
        updateLessonAccess(courseId, currentLesson._id, currentModule._id)
          .catch(err => console.error('Error updating lesson access:', err));
      }
    }
  }, [currentLesson, courseId, enrollment, syllabus]);


  // Refresh lesson progress when component mounts or courseId changes
  useEffect(() => {
    if (courseId && enrollment && enrollment.status === 'approved') {
      const refreshLessonProgress = async () => {
        try {
          const progressData = await getLessonProgress(courseId);
          const completedLessonIds = progressData
            .filter(progress => progress.completed)
            .map(progress => progress.lessonId);
          setCompletedLessons(completedLessonIds);
        } catch (err) {
          console.error('Error refreshing lesson progress:', err);
        }
      };
      refreshLessonProgress();
    }
  }, [courseId, enrollment]);


  // Refresh short question progress when component mounts or courseId changes
  useEffect(() => {
    if (courseId && enrollment && enrollment.status === 'approved' && shortQuestions.length > 0) {
      refreshShortQuestionProgress();
    }
  }, [courseId, enrollment, shortQuestions.length]);


  // Refresh progress when window regains focus (e.g., returning from short quiz)
  useEffect(() => {
    const handleFocus = () => {
      if (courseId && enrollment && enrollment.status === 'approved') {
        refreshLessonProgress();
        if (shortQuestions.length > 0) {
          refreshShortQuestionProgress();
        }
      }
    };


    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [courseId, enrollment, shortQuestions.length]);


  // Fetch progress breakdown
  useEffect(() => {
    if (courseId && enrollment && enrollment.status === 'approved') {
      const fetchProgressBreakdown = async () => {
        try {
          const breakdown = await getCourseProgressBreakdown(courseId);
          if (breakdown.success && breakdown.data && typeof breakdown.data === 'object' && !Array.isArray(breakdown.data)) {
            setProgressBreakdown(breakdown.data);
          } else {
            setProgressBreakdown(null);
          }
        } catch (err) {
          console.error('Error fetching progress breakdown:', err);
        }
      };
      fetchProgressBreakdown();
    }
  }, [courseId, enrollment]);


  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
     
      // Course details
      const courseData = await getCourseByID(token, courseId);
      setCourse(courseData);
     
      // Syllabus (transform)
      const syllabusData = await getCourseSyllabus(token, courseId);
      let transformedSyllabus = { sections: [], lessons: [] };
      let enrollmentFromSyllabus = null;


      if (Array.isArray(syllabusData)) {
        transformedSyllabus.sections = syllabusData.map(item => ({
          _id: item.module._id,
          title: item.module.title,
          summary: item.module.summary,
          order: item.module.order,
          lessons: item.lessons || []
        }));
        transformedSyllabus.lessons = syllabusData.reduce((all, item) => {
          const lessonsWithModuleId = (item.lessons || []).map(lesson => ({
            ...lesson,
            moduleId: item.module._id
          }));
          return all.concat(lessonsWithModuleId);
        }, []);
      } else if (syllabusData && typeof syllabusData === 'object') {
        if (syllabusData.data && Array.isArray(syllabusData.data)) {
          transformedSyllabus.sections = syllabusData.data.map(item => ({
            _id: item.module._id,
            title: item.module.title,
            summary: item.module.summary,
            order: item.module.order,
            lessons: item.lessons || []
          }));
          transformedSyllabus.lessons = syllabusData.data.reduce((all, item) => {
            const lessonsWithModuleId = (item.lessons || []).map(lesson => ({
              ...lesson,
              moduleId: item.module._id
            }));
            return all.concat(lessonsWithModuleId);
          }, []);
          if (syllabusData.enrollment) {
            enrollmentFromSyllabus = syllabusData.enrollment;
          }
        } else {
          transformedSyllabus = syllabusData;
        }
      }
      setSyllabus(transformedSyllabus);


      // Enrollment
      const enrollmentData = enrollmentFromSyllabus
        ? enrollmentFromSyllabus
        : await getEnrollmentByCourseId(token, courseId);
      setEnrollment(enrollmentData);


      // Short questions + progress
      try {
        const shortQuestionsData = await shortQuestionProgressApi.getShortQuestionsByCourseId(courseId);
        console.log('Short Questions Data:', shortQuestionsData.data); // Debug log
        // Chỉ lấy short question đầu tiên nếu có nhiều hơn 1
        const shortQuestionsToShow = shortQuestionsData.data && shortQuestionsData.data.length > 0
          ? [shortQuestionsData.data[0]]
          : [];
        setShortQuestions(shortQuestionsToShow);
        if (shortQuestionsToShow.length > 0) {
          const progressPromises = shortQuestionsToShow.map(async (sq) => {
            try {
              const progressData = await shortQuestionProgressApi.getShortQuestionProgress(sq._id);
              // The API returns { success: true, data: progress } or { success: true, data: null }
              return { shortQuestionId: sq._id, progress: progressData.data };
            } catch (err) {
              console.log('No progress found for short question:', sq._id);
              return { shortQuestionId: sq._id, progress: null };
            }
          });
          const progressResults = await Promise.all(progressPromises);
          setShortQuestionProgress(progressResults);
        }
      } catch (err) {
        console.error('Error fetching short questions:', err);
        setShortQuestions([]);
        setShortQuestionProgress([]);
      }


      // Lesson progress
      try {
        const progressData = await getLessonProgress(courseId);
        const completedLessonIds = progressData
          .filter(progress => progress.completed)
          .map(progress => progress.lessonId);
        setCompletedLessons(completedLessonIds);
      } catch (err) {
        setCompletedLessons([]);
      }


      // Initial lesson
      if (transformedSyllabus.sections?.length > 0) {
        const firstSec = transformedSyllabus.sections[0];
        if (firstSec.lessons?.length > 0) {
          setCurrentLesson(firstSec.lessons[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching course data:', err);
      setError(err.response?.data?.message || 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  };


  const handleLessonSelect = (sectionIndex, lessonIndex) => {
    setCurrentSection(sectionIndex);
    setCurrentLessonIndex(lessonIndex);
    setCurrentLesson(syllabus.sections[sectionIndex].lessons[lessonIndex]);
  };


  const markLessonAsComplete = async (lessonId) => {
    if (!completedLessons.includes(lessonId)) {
      try {
        const currentModule = syllabus.sections.find(section =>
          section.lessons.some(lesson => lesson._id === lessonId)
        );
        if (currentModule) {
          await markLessonCompleted(courseId, lessonId, currentModule._id);
          setCompletedLessons(prev => [...prev, lessonId]);


          await updateLessonAccess(courseId, lessonId, currentModule._id);


          try {
            const updatedEnrollment = await getEnrollmentByCourseId(localStorage.getItem('token'), courseId);
            setEnrollment(updatedEnrollment);
          } catch (err) {
            console.error('Error refreshing enrollment:', err);
          }


          try {
            const progressData = await getLessonProgress(courseId);
            const completedIds = progressData
              .filter(p => p.completed)
              .map(p => p.lessonId);
            setCompletedLessons(completedIds);


            const breakdown = await getCourseProgressBreakdown(courseId);
            if (breakdown.success) setProgressBreakdown(breakdown.data);
          } catch (err) {
            console.error('Error refreshing lesson progress:', err);
          }
        }
      } catch (err) {
        console.error('Error marking lesson as complete:', err);
      }
    }
  };


  const markLessonAsIncomplete = async (lessonId) => {
    if (completedLessons.includes(lessonId)) {
      try {
        await markLessonIncomplete(courseId, lessonId);
        setCompletedLessons(prev => prev.filter(id => id !== lessonId));


        try {
          const updatedEnrollment = await getEnrollmentByCourseId(localStorage.getItem('token'), courseId);
          setEnrollment(updatedEnrollment);
        } catch (err) {
          console.error('Error refreshing enrollment:', err);
        }


        try {
          const progressData = await getLessonProgress(courseId);
          const completedIds = progressData
            .filter(p => p.completed)
            .map(p => p.lessonId);
          setCompletedLessons(completedIds);


          const breakdown = await getCourseProgressBreakdown(courseId);
          if (breakdown.success) setProgressBreakdown(breakdown.data);
        } catch (err) {
          console.error('Error refreshing lesson progress:', err);
        }
      } catch (err) {
        console.error('Error marking lesson as incomplete:', err);
      }
    }
  };


  const refreshLessonProgress = async () => {
    if (courseId && enrollment && enrollment.status === 'approved') {
      try {
        const progressData = await getLessonProgress(courseId);
        const completedIds = progressData
          .filter(p => p.completed)
          .map(p => p.lessonId);
        setCompletedLessons(completedIds);
        try {
          const breakdown = await getCourseProgressBreakdown(courseId);
          if (breakdown.success) setProgressBreakdown(breakdown.data);
        } catch (err) {
          console.error('Error refreshing progress breakdown:', err);
        }
      } catch (err) {
        console.error('Error in manual refresh lesson progress:', err);
      }
    }
  };


  const refreshShortQuestionProgress = async () => {
    if (courseId && enrollment && enrollment.status === 'approved' && shortQuestions.length > 0) {
      try {
        const progressPromises = shortQuestions.map(async (sq) => {
          try {
            const progressData = await shortQuestionProgressApi.getShortQuestionProgress(sq._id);
            return { shortQuestionId: sq._id, progress: progressData.data };
          } catch (err) {
            console.log('No progress found for short question:', sq._id);
            return { shortQuestionId: sq._id, progress: null };
          }
        });
        const progressResults = await Promise.all(progressPromises);
        setShortQuestionProgress(progressResults);
      } catch (err) {
        console.error('Error refreshing short question progress:', err);
      }
    }
  };


  const getNextLesson = () => {
    if (!syllabus || !syllabus.sections) return null;
    let nextSection = currentSection;
    let nextLessonIndex = currentLessonIndex + 1;
    if (nextLessonIndex >= syllabus.sections[currentSection].lessons.length) {
      nextSection = currentSection + 1;
      nextLessonIndex = 0;
    }
    if (nextSection < syllabus.sections.length) {
      return { sectionIndex: nextSection, lessonIndex: nextLessonIndex };
    }
    return null;
  };


  const getPreviousLesson = () => {
    if (!syllabus || !syllabus.sections) return null;
    let prevSection = currentSection;
    let prevLessonIndex = currentLessonIndex - 1;
    if (prevLessonIndex < 0) {
      prevSection = currentSection - 1;
      if (prevSection >= 0) {
        prevLessonIndex = syllabus.sections[prevSection].lessons.length - 1;
      }
    }
    if (prevSection >= 0) {
      return { sectionIndex: prevSection, lessonIndex: prevLessonIndex };
    }
    return null;
  };


  const navigateToLesson = (sectionIndex, lessonIndex) => {
    setCurrentSection(sectionIndex);
    setCurrentLessonIndex(lessonIndex);
    setCurrentLesson(syllabus.sections[sectionIndex].lessons[lessonIndex]);
  };


  const calculateProgress = () => {
    if (progressBreakdown && typeof progressBreakdown.totalProgress === 'number') {
      return progressBreakdown.totalProgress;
    }
    if (enrollment && typeof enrollment.progress === 'number') {
      return enrollment.progress;
    }
    if (!syllabus || !syllabus.sections) return 0;
    const totalLessons = syllabus.sections.reduce((total, section) =>
      total + (section.lessons ? section.lessons.length : 0), 0
    );
    if (totalLessons === 0) return 0;
    const lessonProgress = Math.round((completedLessons.length / totalLessons) * 60);
    return lessonProgress;
  };


  const calculateProgressBreakdown = () => {
    if (progressBreakdown && typeof progressBreakdown === 'object' && !Array.isArray(progressBreakdown)) {
      try {
        return {
          lesson: {
            percentage: Number(progressBreakdown.lessonProgress?.percentage) || 0,
            completed: Number(progressBreakdown.lessonProgress?.completed) || 0,
            total: Number(progressBreakdown.lessonProgress?.total) || 0,
            weight: 60
          },
          quiz: {
            percentage: Number(progressBreakdown.quizProgress?.percentage) || 0,
            passed: Boolean(progressBreakdown.quizProgress?.passed) || false,
            weight: 20
          },
          shortQuestion: {
            percentage: Number(progressBreakdown.shortQuestionProgress?.percentage) || 0,
            passed: Boolean(progressBreakdown.shortQuestionProgress?.passed) || false,
            weight: 20
          },
          total: Number(progressBreakdown.totalProgress) || 0
        };
      } catch {
        // fallthrough
      }
    }
    if (!syllabus || !syllabus.sections) {
      return {
        lesson: { percentage: 0, completed: 0, total: 0, weight: 60 },
        quiz: { percentage: 0, passed: false, weight: 20 },
        shortQuestion: { percentage: 0, passed: false, weight: 20 },
        total: 0
      };
    }
    const totalLessons = syllabus.sections.reduce((total, section) =>
      total + (section.lessons ? section.lessons.length : 0), 0
    );
    const lessonProgress = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 60) : 0;
    return {
      lesson: { percentage: lessonProgress, completed: completedLessons.length, total: totalLessons, weight: 60 },
      quiz: { percentage: 0, passed: false, weight: 20 },
      shortQuestion: { percentage: 0, passed: false, weight: 20 },
      total: lessonProgress
    };
  };


  /* ========== RENDER ========== */
  if (loading) {
    return (
      <div className="cdl-learning-loading" role="status" aria-live="polite">
        <div className="cdl-loading-spinner" />
        <p>Loading course content...</p>
      </div>
    );
  }


  if (error) {
    return (
      <div className="cdl-learning-error" role="alert">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/student/my-courses')}>
          Back to My Courses
        </button>
      </div>
    );
  }


  if (!enrollment || enrollment.status !== 'approved') {
    return (
      <div className="cdl-learning-error" role="alert">
        <h2>Access Denied</h2>
        <p>You need to be approved for this course to access the learning content.</p>
        <button onClick={() => navigate('/student/my-courses')}>
          Back to My Courses
        </button>
      </div>
    );
  }


  if (!syllabus || !syllabus.sections || syllabus.sections.length === 0) {
    return (
      <div className="cdl-learning-error" role="status" aria-live="polite">
        <h2>No Content Available</h2>
        <p>This course doesn't have any modules or lessons yet.</p>
        <button onClick={() => navigate('/student/my-courses')}>
          Back to My Courses
        </button>
      </div>
    );
  }


  return (
    <div className="cdl-learning-container">
      {/* Header */}
      <header className="cdl-learning-header" role="banner">
        <div className="cdl-learning-header-content">
          <button
            className="cdl-back-btn"
            onClick={() => navigate('/student/my-courses')}
            aria-label="Back to My Courses"
          >
            ← Back to My Courses
          </button>


          <div className="cdl-course-info">
            <h1>{course?.title}</h1>
            <p className="cdl-course-description">{course?.description}</p>
          </div>


          <div className="cdl-progress-info" aria-label="Course progress">
            <div className="cdl-total-progress" aria-label="Total progress">
              <div className="cdl-progress-bar" aria-hidden="true">
                <div
                  className="cdl-progress-fill cdl-total-fill"
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
              <span className="cdl-progress-text">{calculateProgress()}% Complete</span>
            </div>
          </div>
        </div>
      </header>


      {/* Learning Section - Phần học tập ở trên */}
      <section className="cdl-learning-section" role="region" aria-label="Learning section">
        <div className="cdl-learning-content">
          {/* Sidebar - Course Navigation */}
          <aside className="cdl-learning-sidebar" aria-label="Course content navigation">
            <div className="cdl-sidebar-header">
              <h3>📚 Course Content</h3>
              <div className="cdl-sidebar-header-controls">
                <span className="cdl-lesson-count">
                  {syllabus?.sections?.reduce((total, section) => total + (section.lessons ? section.lessons.length : 0), 0) || 0} Lessons
                </span>
              </div>
            </div>


            <nav className="cdl-syllabus-tree" aria-label="Syllabus">
              {syllabus?.sections?.map((section, sectionIndex) => (
                <div key={section._id} className="cdl-syllabus-section">
                  <div className="cdl-section-header">
                    <h4>{section.title}</h4>
                    <span className="cdl-section-lesson-count">
                      {section.lessons ? section.lessons.length : 0} lessons
                    </span>
                  </div>


                  {section.lessons && section.lessons.map((lesson, lessonIndex) => (
                    <button
                      key={lesson._id}
                      type="button"
                      className={`cdl-lesson-item ${
                        currentSection === sectionIndex && currentLessonIndex === lessonIndex ? 'active' : ''
                      } ${completedLessons.includes(lesson._id) ? 'completed' : ''}`}
                      onClick={() => handleLessonSelect(sectionIndex, lessonIndex)}
                      aria-current={currentSection === sectionIndex && currentLessonIndex === lessonIndex ? 'true' : 'false'}
                      aria-label={`Lesson: ${lesson.title}`}
                    >
                      <div className="cdl-lesson-status">
                        {completedLessons.includes(lesson._id) ? '✓' : '○'}
                      </div>
                      <div className="cdl-lesson-info">
                        <span className="cdl-lesson-title">{lesson.title}</span>
                        <span className="cdl-lesson-duration">
                          {lesson.durationSec ? `${Math.floor(lesson.durationSec / 60)}m` : 'N/A'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </aside>


          {/* Main Content Area */}
          <main className="cdl-learning-main" id="lesson-main" role="main">
            {currentLesson ? (
              <article className="cdl-lesson-content" aria-labelledby="lesson-title">
                <header className="cdl-lesson-header">
                  <h2 id="lesson-title">{currentLesson.title}</h2>
                  <div className="cdl-lesson-meta" aria-label="Lesson meta">
                    <span className="cdl-lesson-duration">
                      Duration: {currentLesson.durationSec ? `${Math.floor(currentLesson.durationSec / 60)} minutes` : 'N/A'}
                    </span>
                    <span className="cdl-lesson-type">
                      Type: {currentLesson.contentType || 'Lesson'}
                    </span>
                  </div>
                </header>


                <div className="cdl-lesson-body">
                  {/* Text Content */}
                  {currentLesson.contentType === 'text' && currentLesson.textContent && (
                    <section className="cdl-lesson-text-content" aria-label="Text content">
                      <div className="cdl-content-type-header">
                        <h4>📝 Text Content</h4>
                      </div>
                      <div className="cdl-text-content-wrapper">
                        {currentLesson.textContent}
                      </div>
                    </section>
                  )}


                  {/* Video Content - YouTube Embed */}
                  {currentLesson.contentType === 'video' && currentLesson.url && (
                    <section className="cdl-lesson-video" aria-label="Video content">
                      <div className="cdl-content-type-header">
                        <h4>🎥 Video Content</h4>
                      </div>
                      <div className="cdl-video-wrapper">
                        {currentLesson.url.includes('youtube.com') || currentLesson.url.includes('youtu.be') ? (
                          <iframe
                            width="100%"
                            height="400"
                            src={
                              currentLesson.url.includes('youtube.com/watch?v=')
                                ? currentLesson.url.replace('youtube.com/watch?v=', 'youtube.com/embed/')
                                : currentLesson.url.includes('youtu.be/')
                                ? currentLesson.url.replace('youtu.be/', 'youtube.com/embed/')
                                : currentLesson.url
                            }
                            title={currentLesson.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            controls
                            width="100%"
                            src={currentLesson.url}
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                    </section>
                  )}


                  {/* PDF Content */}
                  {currentLesson.contentType === 'pdf' && currentLesson.url && (
                    <section className="cdl-lesson-pdf" aria-label="PDF document">
                      <div className="cdl-content-type-header">
                        <h4>📄 PDF Document</h4>
                      </div>
                      <div className="cdl-pdf-wrapper">
                        <iframe
                          width="100%"
                          height="600"
                          src={currentLesson.url}
                          title={currentLesson.title}
                          frameBorder="0"
                        />
                        <div className="cdl-pdf-actions">
                          <a
                            href={currentLesson.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cdl-pdf-download-btn"
                          >
                            📥 Download PDF
                          </a>
                        </div>
                      </div>
                    </section>
                  )}


                  {/* Canva Content */}
                  {currentLesson.contentType === 'canva' && currentLesson.url && (
                    <section className="cdl-lesson-canva" aria-label="Canva presentation">
                      <div className="cdl-content-type-header">
                        <h4>🎨 Canva Presentation</h4>
                      </div>
                      <div className="cdl-canva-wrapper">
                        <iframe
                          width="100%"
                          height="600"
                          src={currentLesson.url}
                          title={currentLesson.title}
                          frameBorder="0"
                          allow="fullscreen"
                        />
                        <div className="cdl-canva-actions">
                          <a
                            href={currentLesson.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cdl-canva-open-btn"
                          >
                            🎨 Open in Canva
                          </a>
                        </div>
                      </div>
                    </section>
                  )}


                  {/* Fallback for other content types */}
                  {currentLesson.url && !['video', 'pdf', 'canva', 'text'].includes(currentLesson.contentType) && (
                    <section className="cdl-lesson-attachments" aria-label="Attachment">
                      <div className="cdl-content-type-header">
                        <h4>📎 Attachment</h4>
                      </div>
                      <div className="cdl-attachments-list">
                        <a
                          href={currentLesson.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cdl-attachment-item"
                        >
                          📎 {currentLesson.title} ({currentLesson.contentType})
                        </a>
                      </div>
                    </section>
                  )}


                  {/* Description */}
                  {currentLesson.description && (
                    <section className="cdl-lesson-notes" aria-label="Description">
                      <h4>📋 Description</h4>
                      <p>{currentLesson.description}</p>
                    </section>
                  )}
                </div>


                {/* Lesson Navigation */}
                <nav className="cdl-lesson-navigation" aria-label="Lesson navigation">
                  <button
                    className="cdl-nav-btn cdl-prev-btn"
                    onClick={() => {
                      const prev = getPreviousLesson();
                      if (prev) navigateToLesson(prev.sectionIndex, prev.lessonIndex);
                    }}
                    disabled={!getPreviousLesson()}
                  >
                    ← Previous Lesson
                  </button>
                 
                  <button
                    className="cdl-nav-btn cdl-complete-btn"
                    onClick={() => {
                      if (completedLessons.includes(currentLesson._id)) {
                        markLessonAsIncomplete(currentLesson._id);
                      } else {
                        markLessonAsComplete(currentLesson._id);
                      }
                    }}
                    aria-pressed={completedLessons.includes(currentLesson._id)}
                  >
                    {completedLessons.includes(currentLesson._id) ? '✓ Completed (Click to undo)' : 'Mark as Complete'}
                  </button>
                 
                  <button
                    className="cdl-nav-btn cdl-next-btn"
                    onClick={() => {
                      const next = getNextLesson();
                      if (next) navigateToLesson(next.sectionIndex, next.lessonIndex);
                    }}
                    disabled={!getNextLesson()}
                  >
                    Next Lesson →
                  </button>
                </nav>
              </article>
            ) : (
              <section className="cdl-no-lesson-selected" aria-label="No lesson selected">
                <h3>Welcome to {course?.title}!</h3>
                <p>Select a lesson from the sidebar to start learning.</p>
                {syllabus?.sections?.length > 0 && (
                  <div className="cdl-course-overview">
                    <h4>Course Overview</h4>
                    <p>
                      This course contains {syllabus.sections.length} modules with a total of {syllabus.lessons?.length || 0} lessons.
                    </p>
                  </div>
                )}
              </section>
            )}
          </main>
        </div>
      </section>


      {/* Quiz Section - Phần Quiz ở dưới */}
      <section className="cdl-quiz-section" aria-labelledby="quiz-title">
        <div className="cdl-quiz-container">
          <div className="cdl-quiz-header">
            <h2 id="quiz-title">🧠 Quiz & Assessment</h2>
            <p>Test your knowledge and track your progress</p>
          </div>
          <div className="cdl-quiz-content">
            <QuizProgressCard courseId={courseId} courseTitle={course?.title} />
          </div>
        </div>
      </section>


      {/* Short Questions Section - Phần Short Quiz ở dưới */}
      {shortQuestions.length > 0 && (
        <section className="cdl-short-questions-section" aria-labelledby="short-questions-title">
          <div className="cdl-short-questions-container">
            <div className="cdl-short-questions-header">
              <h2 id="short-questions-title">📝 Short Questions</h2>
              <p>Test your understanding with these short answer questions</p>
            </div>
            <div className="cdl-short-questions-list">
              {shortQuestions.map((shortQuestion) => {
                const progress = shortQuestionProgress.find(p => p.shortQuestionId === shortQuestion._id);
                const isCompleted = progress?.progress?.status === 'completed';
                const isPassed = progress?.progress?.passed || false;
               
                return (
                  <article key={shortQuestion._id} className="cdl-short-question-item" aria-label={`Short question: ${shortQuestion.title}`}>
                    <div className="cdl-short-question-info">
                      <h3 className="cdl-short-question-title">{shortQuestion.title}</h3>
                      {shortQuestion.description && (
                        <p className="cdl-short-question-description">{shortQuestion.description}</p>
                      )}
                      <div className="cdl-short-question-meta">
                        <span className="cdl-short-question-count">
                          {shortQuestion.questions?.length || 0} questions
                        </span>
                        {shortQuestion.timeLimit && (
                          <span className="cdl-short-question-time">
                            ⏱️ {shortQuestion.timeLimit} min
                          </span>
                        )}
                        <span className="cdl-short-question-passing">
                          Passing: {shortQuestion.passingScore}%
                        </span>
                        {isCompleted && (
                          <span className={`cdl-short-question-status ${isPassed ? 'passed' : 'failed'}`}>
                            {isPassed ? '✅ Passed' : '❌ Failed'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="cdl-short-question-actions">
                      {isCompleted ? (
                        <button
                          className="cdl-btn cdl-btn-success"
                          onClick={() => navigate(`/student/courses/${courseId}/short-question/${shortQuestion._id}/results`)}
                          aria-label={`View results for ${shortQuestion.title}`}
                        >
                          📊 View Results
                        </button>
                      ) : (
                        <button
                          className="cdl-btn cdl-btn-primary"
                          onClick={() => navigate(`/student/courses/${courseId}/short-question/${shortQuestion._id}`)}
                          aria-label={`Start short quiz ${shortQuestion.title}`}
                        >
                          📝 Start Short Quiz
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}


      <Footer />
    </div>
  );
}





