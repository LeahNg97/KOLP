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
          console.log('Refreshed lesson progress:', progressData);
          
          const completedLessonIds = progressData
            .filter(progress => progress.completed)
            .map(progress => progress.lessonId);
          
          console.log('Updated completed lesson IDs:', completedLessonIds);
          setCompletedLessons(completedLessonIds);
        } catch (err) {
          console.error('Error refreshing lesson progress:', err);
        }
      };
      
      refreshLessonProgress();
    }
  }, [courseId, enrollment]);

  // Fetch progress breakdown
  useEffect(() => {
    if (courseId && enrollment && enrollment.status === 'approved') {
      const fetchProgressBreakdown = async () => {
        try {
          const breakdown = await getCourseProgressBreakdown(courseId);
          console.log('Progress breakdown response:', breakdown);
          if (breakdown.success && breakdown.data && typeof breakdown.data === 'object' && !Array.isArray(breakdown.data)) {
            console.log('Setting progress breakdown:', breakdown.data);
            setProgressBreakdown(breakdown.data);
          } else {
            console.log('Invalid progress breakdown data:', breakdown.data);
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
      
      // Fetch course details
      const courseData = await getCourseByID(token, courseId);
      setCourse(courseData);
      
      // Fetch course syllabus
      const syllabusData = await getCourseSyllabus(token, courseId);
      
      // Transform backend data structure to match frontend expectations
      // Backend returns: [{ module: {...}, lessons: [...] }, ...]
      // Frontend expects: { sections: [...], lessons: [...] }
      let transformedSyllabus = { sections: [], lessons: [] };
      let enrollmentFromSyllabus = null;
      
      if (Array.isArray(syllabusData)) {
        // Transform modules to sections
        transformedSyllabus.sections = syllabusData.map(item => ({
          _id: item.module._id,
          title: item.module.title,
          summary: item.module.summary,
          order: item.module.order,
          lessons: item.lessons || []
        }));
        
        // Flatten all lessons into a single array
        transformedSyllabus.lessons = syllabusData.reduce((allLessons, item) => {
          const lessonsWithModuleId = (item.lessons || []).map(lesson => ({
            ...lesson,
            moduleId: item.module._id
          }));
          return allLessons.concat(lessonsWithModuleId);
        }, []);
      } else if (syllabusData && typeof syllabusData === 'object') {
        // If server returns object format with data and enrollment
        if (syllabusData.data && Array.isArray(syllabusData.data)) {
          // Transform modules to sections
          transformedSyllabus.sections = syllabusData.data.map(item => ({
            _id: item.module._id,
            title: item.module.title,
            summary: item.module.summary,
            order: item.module.order,
            lessons: item.lessons || []
          }));
          
          // Flatten all lessons into a single array
          transformedSyllabus.lessons = syllabusData.data.reduce((allLessons, item) => {
            const lessonsWithModuleId = (item.lessons || []).map(lesson => ({
              ...lesson,
              moduleId: item.module._id
            }));
            return allLessons.concat(lessonsWithModuleId);
          }, []);
          
          // Extract enrollment data if available
          if (syllabusData.enrollment) {
            enrollmentFromSyllabus = syllabusData.enrollment;
          }
        } else {
          // Use as is if it's already in the expected format
          transformedSyllabus = syllabusData;
        }
      }
      
      console.log('Transformed syllabus:', transformedSyllabus);
      console.log('Sections count:', transformedSyllabus.sections?.length || 0);
      console.log('Total lessons count:', transformedSyllabus.lessons?.length || 0);
      if (transformedSyllabus.sections?.length > 0) {
        console.log('First section:', transformedSyllabus.sections[0]);
        console.log('First section lessons count:', transformedSyllabus.sections[0].lessons?.length || 0);
      }
      setSyllabus(transformedSyllabus);
      
      // Fetch enrollment status (use syllabus enrollment if available, otherwise fetch separately)
      let enrollmentData;
      if (enrollmentFromSyllabus) {
        enrollmentData = enrollmentFromSyllabus;
      } else {
        enrollmentData = await getEnrollmentByCourseId(token, courseId);
      }
      setEnrollment(enrollmentData);
      
      // Fetch short questions
      try {
        console.log('Fetching short questions...');
        const shortQuestionsData = await shortQuestionProgressApi.getShortQuestionsByCourseId(courseId);
        console.log('Short questions data:', shortQuestionsData);
        setShortQuestions(shortQuestionsData.data || []);
        
        // Fetch short question progress for each short question
        if (shortQuestionsData.data && shortQuestionsData.data.length > 0) {
          const progressPromises = shortQuestionsData.data.map(async (shortQuestion) => {
            try {
              const progressData = await shortQuestionProgressApi.getShortQuestionProgress(shortQuestion._id);
              return {
                shortQuestionId: shortQuestion._id,
                progress: progressData.data
              };
            } catch (err) {
              console.log(`No progress found for short question ${shortQuestion._id}:`, err.message);
              return {
                shortQuestionId: shortQuestion._id,
                progress: null
              };
            }
          });
          
          const progressResults = await Promise.all(progressPromises);
          setShortQuestionProgress(progressResults);
        }
      } catch (err) {
        console.log('No short questions found or fetch failed:', err.message);
        setShortQuestions([]);
        setShortQuestionProgress([]);
      }
      
      // Fetch lesson progress for this course
      try {
        const progressData = await getLessonProgress(courseId);
        console.log('Lesson progress data from backend:', progressData);
        
        const completedLessonIds = progressData
          .filter(progress => progress.completed)
          .map(progress => progress.lessonId);
        
        console.log('Completed lesson IDs:', completedLessonIds);
        setCompletedLessons(completedLessonIds);
      } catch (err) {
        console.error('Error fetching lesson progress:', err);
        // If there's an error, start with empty completed lessons
        setCompletedLessons([]);
      }
      
      // Set initial lesson
      if (transformedSyllabus.sections && transformedSyllabus.sections.length > 0) {
        if (transformedSyllabus.sections[0].lessons && transformedSyllabus.sections[0].lessons.length > 0) {
          setCurrentLesson(transformedSyllabus.sections[0].lessons[0]);
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
        // Find the module ID for this lesson
        const currentModule = syllabus.sections.find(section => 
          section.lessons.some(lesson => lesson._id === lessonId)
        );
        
        if (currentModule) {
          await markLessonCompleted(courseId, lessonId, currentModule._id);
          setCompletedLessons([...completedLessons, lessonId]);
          
          // Update lesson access time
          await updateLessonAccess(courseId, lessonId, currentModule._id);
          
          // Refresh enrollment data to get updated progress
          try {
            const updatedEnrollment = await getEnrollmentByCourseId(localStorage.getItem('token'), courseId);
            setEnrollment(updatedEnrollment);
          } catch (err) {
            console.error('Error refreshing enrollment:', err);
          }
          
          // Refresh lesson progress to ensure consistency
          try {
            const progressData = await getLessonProgress(courseId);
            const completedLessonIds = progressData
              .filter(progress => progress.completed)
              .map(progress => progress.lessonId);
            setCompletedLessons(completedLessonIds);
            
            // Also refresh progress breakdown
            const breakdown = await getCourseProgressBreakdown(courseId);
            if (breakdown.success) {
              setProgressBreakdown(breakdown.data);
            }
          } catch (err) {
            console.error('Error refreshing lesson progress:', err);
          }
        }
      } catch (err) {
        console.error('Error marking lesson as complete:', err);
        // You might want to show an error message to the user here
      }
    }
  };

  const markLessonAsIncomplete = async (lessonId) => {
    if (completedLessons.includes(lessonId)) {
      try {
        await markLessonIncomplete(courseId, lessonId);
        setCompletedLessons(completedLessons.filter(id => id !== lessonId));
        
        // Refresh enrollment data to get updated progress
        try {
          const updatedEnrollment = await getEnrollmentByCourseId(localStorage.getItem('token'), courseId);
          setEnrollment(updatedEnrollment);
        } catch (err) {
          console.error('Error refreshing enrollment:', err);
        }
        
        // Refresh lesson progress to ensure consistency
        try {
          const progressData = await getLessonProgress(courseId);
          const completedLessonIds = progressData
            .filter(progress => progress.completed)
            .map(progress => progress.lessonId);
          setCompletedLessons(completedLessonIds);
          
          // Also refresh progress breakdown
          const breakdown = await getCourseProgressBreakdown(courseId);
          if (breakdown.success) {
            setProgressBreakdown(breakdown.data);
          }
        } catch (err) {
          console.error('Error refreshing lesson progress:', err);
        }
      } catch (err) {
        console.error('Error marking lesson as incomplete:', err);
        // You might want to show an error message to the user here
      }
    }
  };

  // Helper function to refresh lesson progress
  const refreshLessonProgress = async () => {
    if (courseId && enrollment && enrollment.status === 'approved') {
      try {
        const progressData = await getLessonProgress(courseId);
        console.log('Manual refresh - lesson progress data:', progressData);
        
        const completedLessonIds = progressData
          .filter(progress => progress.completed)
          .map(progress => progress.lessonId);
        
        console.log('Manual refresh - completed lesson IDs:', completedLessonIds);
        setCompletedLessons(completedLessonIds);
        
        // Also refresh progress breakdown
        try {
          const breakdown = await getCourseProgressBreakdown(courseId);
          if (breakdown.success) {
            setProgressBreakdown(breakdown.data);
          }
        } catch (err) {
          console.error('Error refreshing progress breakdown:', err);
        }
      } catch (err) {
        console.error('Error in manual refresh lesson progress:', err);
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
    // Use progress breakdown data if available
    if (progressBreakdown && typeof progressBreakdown.totalProgress === 'number') {
      return progressBreakdown.totalProgress;
    }
    
    // Use enrollment progress from backend if available
    if (enrollment && typeof enrollment.progress === 'number') {
      return enrollment.progress;
    }
    
    if (!syllabus || !syllabus.sections) return 0;
    
    const totalLessons = syllabus.sections.reduce((total, section) => 
      total + (section.lessons ? section.lessons.length : 0), 0
    );
    
    if (totalLessons === 0) return 0;
    
    // Calculate lesson progress (60% weight)
    const lessonProgress = Math.round((completedLessons.length / totalLessons) * 60);
    
    return lessonProgress;
  };

  const calculateProgressBreakdown = () => {
    // Use backend data if available
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
      } catch (error) {
        console.error('Error processing progress breakdown:', error);
        // Fall through to fallback
      }
    }
    
    // Fallback to local calculation if backend data not available
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
      lesson: { 
        percentage: lessonProgress, 
        completed: completedLessons.length, 
        total: totalLessons, 
        weight: 60 
      },
      quiz: { percentage: 0, passed: false, weight: 20 },
      shortQuestion: { percentage: 0, passed: false, weight: 20 },
      total: lessonProgress
    };
  };

  if (loading) {
    return (
      <div className="cdl-learning-loading">
        <div className="cdl-loading-spinner"></div>
        <p>Loading course content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cdl-learning-error">
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
      <div className="cdl-learning-error">
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
      <div className="cdl-learning-error">
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
      <div className="cdl-learning-header">
        <div className="cdl-learning-header-content">
          <button 
            className="cdl-back-btn"
            onClick={() => navigate('/student/my-courses')}
          >
            ← Back to My Courses
          </button>
          <div className="cdl-course-info">
            <h1>{course?.title}</h1>
            <p className="cdl-course-description">{course?.description}</p>
          </div>
          <div className="cdl-progress-info">
            <div className="cdl-progress-breakdown">
              {(() => {
                const breakdown = calculateProgressBreakdown();
                return (
                  <>
                    <div className="cdl-progress-item">
                      <span className="cdl-progress-label">Lessons (60%)</span>
                      <div className="cdl-progress-bar">
                        <div 
                          className="cdl-progress-fill cdl-lesson-fill"
                          style={{ width: `${breakdown.lesson.percentage}%` }}
                        ></div>
                      </div>
                      <span className="cdl-progress-text">
                        {breakdown.lesson.completed}/{breakdown.lesson.total}
                      </span>
                    </div>
                    
                    <div className="cdl-progress-item">
                      <span className="cdl-progress-label">Quiz (20%)</span>
                      <div className="cdl-progress-bar">
                        <div 
                          className="cdl-progress-fill cdl-quiz-fill"
                          style={{ width: `${breakdown.quiz.percentage}%` }}
                        ></div>
                      </div>
                      <span className="cdl-progress-text">
                        {breakdown.quiz.passed ? 'Passed' : 'Not Passed'}
                      </span>
                    </div>
                    
                    <div className="cdl-progress-item">
                      <span className="cdl-progress-label">Short Questions (20%)</span>
                      <div className="cdl-progress-bar">
                        <div 
                          className="cdl-progress-fill cdl-short-question-fill"
                          style={{ width: `${breakdown.shortQuestion.percentage}%` }}
                        ></div>
                      </div>
                      <span className="cdl-progress-text">
                        {breakdown.shortQuestion.passed ? 'Passed' : 'Not Passed'}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
            
            <div className="cdl-total-progress">
              <div className="cdl-progress-bar">
                <div 
                  className="cdl-progress-fill cdl-total-fill"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
              <span className="cdl-progress-text">{calculateProgress()}% Complete</span>
            </div>
          </div>
        </div>
      </div>

      <div className="cdl-learning-content">
        {/* Sidebar - Course Navigation */}
        <div className="cdl-learning-sidebar">
          <div className="cdl-sidebar-header">
            <h3>Course Content</h3>
            <div className="cdl-sidebar-header-controls">
              <span className="cdl-lesson-count">
                {syllabus?.sections?.reduce((total, section) => 
                  total + (section.lessons ? section.lessons.length : 0), 0
                ) || 0} Lessons
              </span>
              <button 
                className="cdl-refresh-btn"
                onClick={refreshLessonProgress}
                title="Refresh lesson progress"
              >
                🔄
              </button>
            </div>
          </div>
          
          <div className="cdl-syllabus-tree">
            {syllabus?.sections?.map((section, sectionIndex) => (
              <div key={section._id} className="cdl-syllabus-section">
                <div className="cdl-section-header">
                  <h4>{section.title}</h4>
                  <span className="cdl-section-lesson-count">
                    {section.lessons ? section.lessons.length : 0} lessons
                  </span>
                </div>
                
                {section.lessons && section.lessons.map((lesson, lessonIndex) => (
                  <div 
                    key={lesson._id} 
                    className={`cdl-lesson-item ${
                      currentSection === sectionIndex && currentLessonIndex === lessonIndex 
                        ? 'active' 
                        : ''
                    } ${
                      completedLessons.includes(lesson._id) ? 'completed' : ''
                    }`}
                    onClick={() => handleLessonSelect(sectionIndex, lessonIndex)}
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
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          {/* Quiz Progress Card */}
          <div className="cdl-quiz-section">
            <QuizProgressCard courseId={courseId} courseTitle={course?.title} />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="cdl-learning-main">
          {currentLesson ? (
            <div className="cdl-lesson-content">
              <div className="cdl-lesson-header">
                <h2>{currentLesson.title}</h2>
                <div className="cdl-lesson-meta">
                  <span className="cdl-lesson-duration">
                    Duration: {currentLesson.durationSec ? `${Math.floor(currentLesson.durationSec / 60)} minutes` : 'N/A'}
                  </span>
                  <span className="cdl-lesson-type">
                    Type: {currentLesson.contentType || 'Lesson'}
                  </span>
                </div>
              </div>

              <div className="cdl-lesson-body">
                {/* Text Content */}
                {currentLesson.contentType === 'text' && currentLesson.textContent && (
                  <div className="cdl-lesson-text-content">
                    <div className="cdl-content-type-header">
                      <h4>📝 Text Content</h4>
                    </div>
                    <div className="cdl-text-content-wrapper">
                      {currentLesson.textContent}
                    </div>
                  </div>
                )}

                {/* Video Content - YouTube Embed */}
                {currentLesson.contentType === 'video' && currentLesson.url && (
                  <div className="cdl-lesson-video">
                    <div className="cdl-content-type-header">
                      <h4>🎥 Video Content</h4>
                    </div>
                    <div className="cdl-video-wrapper">
                      {currentLesson.url.includes('youtube.com') || currentLesson.url.includes('youtu.be') ? (
                        <iframe
                          width="100%"
                          height="400"
                          src={currentLesson.url.includes('youtube.com/watch?v=') 
                            ? currentLesson.url.replace('youtube.com/watch?v=', 'youtube.com/embed/')
                            : currentLesson.url.includes('youtu.be/')
                            ? currentLesson.url.replace('youtu.be/', 'youtube.com/embed/')
                            : currentLesson.url
                          }
                          title={currentLesson.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
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
                  </div>
                )}

                {/* PDF Content */}
                {currentLesson.contentType === 'pdf' && currentLesson.url && (
                  <div className="cdl-lesson-pdf">
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
                      ></iframe>
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
                  </div>
                )}

                {/* Canva Content */}
                {currentLesson.contentType === 'canva' && currentLesson.url && (
                  <div className="cdl-lesson-canva">
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
                      ></iframe>
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
                  </div>
                )}

                {/* Fallback for other content types */}
                {currentLesson.url && !['video', 'pdf', 'canva', 'text'].includes(currentLesson.contentType) && (
                  <div className="cdl-lesson-attachments">
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
                  </div>
                )}

                {/* Description for all content types */}
                {currentLesson.description && (
                  <div className="cdl-lesson-notes">
                    <h4>📋 Description</h4>
                    <p>{currentLesson.description}</p>
                  </div>
                )}
              </div>

              {/* Lesson Navigation */}
              <div className="cdl-lesson-navigation">
                <button 
                  className="cdl-nav-btn cdl-prev-btn"
                  onClick={() => {
                    const prev = getPreviousLesson();
                    if (prev) {
                      navigateToLesson(prev.sectionIndex, prev.lessonIndex);
                    }
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
                >
                  {completedLessons.includes(currentLesson._id) ? '✓ Completed (Click to undo)' : 'Mark as Complete'}
                </button>
                
                <button 
                  className="cdl-nav-btn cdl-next-btn"
                  onClick={() => {
                    const next = getNextLesson();
                    if (next) {
                      navigateToLesson(next.sectionIndex, next.lessonIndex);
                    }
                  }}
                  disabled={!getNextLesson()}
                >
                  Next Lesson →
                </button>
              </div>
            </div>
          ) : (
            <div className="cdl-no-lesson-selected">
              <h3>Welcome to {course?.title}!</h3>
              <p>Select a lesson from the sidebar to start learning.</p>
              {syllabus?.sections?.length > 0 && (
                <div className="cdl-course-overview">
                  <h4>Course Overview</h4>
                  <p>This course contains {syllabus.sections.length} modules with a total of {syllabus.lessons?.length || 0} lessons.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Short Questions Section */}
      {shortQuestions.length > 0 && (
        <div className="cdl-learning-short-questions">
          <div className="cdl-short-questions-header">
            <h2>📝 Short Questions</h2>
            <p>Test your understanding with these short answer questions</p>
          </div>
          <div className="cdl-short-questions-list">
            {shortQuestions.map((shortQuestion) => {
              const progress = shortQuestionProgress.find(p => p.shortQuestionId === shortQuestion._id);
              const isCompleted = progress?.progress?.status === 'completed';
              const isPassed = progress?.progress?.passed || false;
              
              return (
                <div key={shortQuestion._id} className="cdl-short-question-item">
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
                      >
                        📊 View Results
                      </button>
                    ) : (
                      <button 
                        className="cdl-btn cdl-btn-primary"
                        onClick={() => navigate(`/student/courses/${courseId}/short-question/${shortQuestion._id}`)}
                      >
                        📝 Start Short Quiz
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
