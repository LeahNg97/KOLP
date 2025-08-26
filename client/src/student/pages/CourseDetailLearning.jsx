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
import './CourseDetailLearning.css';
import Footer from '../../components/Footer';
import QuizProgressCard from '../components/QuizProgressCard';

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
    // Use enrollment progress from backend if available, otherwise calculate from local state
    if (enrollment && typeof enrollment.progress === 'number') {
      return enrollment.progress;
    }
    
    if (!syllabus || !syllabus.sections) return 0;
    
    const totalLessons = syllabus.sections.reduce((total, section) => 
      total + (section.lessons ? section.lessons.length : 0), 0
    );
    
    if (totalLessons === 0) return 0;
    
    return Math.round((completedLessons.length / totalLessons) * 100);
  };

  if (loading) {
    return (
      <div className="learning-loading">
        <div className="loading-spinner"></div>
        <p>Loading course content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="learning-error">
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
      <div className="learning-error">
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
      <div className="learning-error">
        <h2>No Content Available</h2>
        <p>This course doesn't have any modules or lessons yet.</p>
        <button onClick={() => navigate('/student/my-courses')}>
          Back to My Courses
        </button>
      </div>
    );
  }

  return (
    <div className="learning-container">
      {/* Header */}
      <div className="learning-header">
        <div className="learning-header-content">
          <button 
            className="back-btn"
            onClick={() => navigate('/student/my-courses')}
          >
            ← Back to My Courses
          </button>
          <div className="course-info">
            <h1>{course?.title}</h1>
            <p className="course-description">{course?.description}</p>
          </div>
          <div className="progress-info">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
            <span className="progress-text">{calculateProgress()}% Complete</span>
          </div>
        </div>
      </div>

      <div className="learning-content">
        {/* Sidebar - Course Navigation */}
        <div className="learning-sidebar">
          <div className="sidebar-header">
            <h3>Course Content</h3>
            <div className="sidebar-header-controls">
              <span className="lesson-count">
                {syllabus?.sections?.reduce((total, section) => 
                  total + (section.lessons ? section.lessons.length : 0), 0
                ) || 0} Lessons
              </span>
              <button 
                className="refresh-btn"
                onClick={refreshLessonProgress}
                title="Refresh lesson progress"
              >
                🔄
              </button>
            </div>
          </div>
          
          <div className="syllabus-tree">
            {syllabus?.sections?.map((section, sectionIndex) => (
              <div key={section._id} className="syllabus-section">
                <div className="section-header">
                  <h4>{section.title}</h4>
                  <span className="section-lesson-count">
                    {section.lessons ? section.lessons.length : 0} lessons
                  </span>
                </div>
                
                {section.lessons && section.lessons.map((lesson, lessonIndex) => (
                  <div 
                    key={lesson._id} 
                    className={`lesson-item ${
                      currentSection === sectionIndex && currentLessonIndex === lessonIndex 
                        ? 'active' 
                        : ''
                    } ${
                      completedLessons.includes(lesson._id) ? 'completed' : ''
                    }`}
                    onClick={() => handleLessonSelect(sectionIndex, lessonIndex)}
                  >
                    <div className="lesson-status">
                      {completedLessons.includes(lesson._id) ? '✓' : '○'}
                    </div>
                    <div className="lesson-info">
                      <span className="lesson-title">{lesson.title}</span>
                      <span className="lesson-duration">
                        {lesson.durationSec ? `${Math.floor(lesson.durationSec / 60)}m` : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          {/* Quiz Progress Card */}
          <div className="quiz-section">
            <QuizProgressCard courseId={courseId} courseTitle={course?.title} />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="learning-main">
          {currentLesson ? (
            <div className="lesson-content">
              <div className="lesson-header">
                <h2>{currentLesson.title}</h2>
                <div className="lesson-meta">
                  <span className="lesson-duration">
                    Duration: {currentLesson.durationSec ? `${Math.floor(currentLesson.durationSec / 60)} minutes` : 'N/A'}
                  </span>
                  <span className="lesson-type">
                    Type: {currentLesson.contentType || 'Lesson'}
                  </span>
                </div>
              </div>

              <div className="lesson-body">
                {currentLesson.textContent && (
                  <div className="lesson-text-content">
                    {currentLesson.textContent}
                  </div>
                )}
                
                {currentLesson.url && currentLesson.contentType === 'video' && (
                  <div className="lesson-video">
                    <video 
                      controls 
                      width="100%"
                      src={currentLesson.url}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {currentLesson.url && currentLesson.contentType !== 'video' && (
                  <div className="lesson-attachments">
                    <h4>Content</h4>
                    <div className="attachments-list">
                      <a 
                        href={currentLesson.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="attachment-item"
                      >
                        📎 {currentLesson.title} ({currentLesson.contentType})
                      </a>
                    </div>
                  </div>
                )}

                {currentLesson.description && (
                  <div className="lesson-notes">
                    <h4>Description</h4>
                    <p>{currentLesson.description}</p>
                  </div>
                )}
              </div>

              {/* Lesson Navigation */}
              <div className="lesson-navigation">
                <button 
                  className="nav-btn prev-btn"
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
                  className="nav-btn complete-btn"
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
                  className="nav-btn next-btn"
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
            <div className="no-lesson-selected">
              <h3>Welcome to {course?.title}!</h3>
              <p>Select a lesson from the sidebar to start learning.</p>
              {syllabus?.sections?.length > 0 && (
                <div className="course-overview">
                  <h4>Course Overview</h4>
                  <p>This course contains {syllabus.sections.length} modules with a total of {syllabus.lessons?.length || 0} lessons.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
