import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CourseDetail.css';
import Footer from '../../components/Footer';
import { getCourseByID, getCourseSyllabus } from '../api/courseApi';
import { createEnrollment, getEnrollmentByCourseId, cancelEnrollment } from '../api/enrollmentApi';
import PaymentModal from '../components/PaymentModal';
import QuizProgressCard from '../components/QuizProgressCard';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [syllabus, setSyllabus] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to view course details');
        setLoading(false);
        return;
      }
      
      console.log('Fetching course data for courseId:', courseId);
      
      // Fetch course details
      const courseData = await getCourseByID(token, courseId);
      console.log('Course data fetched:', courseData);
      setCourse(courseData);
      
      // Fetch course syllabus
      try {
        console.log('Fetching course syllabus...');
        const syllabusData = await getCourseSyllabus(token, courseId);
        console.log('Syllabus data fetched:', syllabusData);
        console.log('Syllabus data type:', typeof syllabusData);
        console.log('Syllabus data keys:', Object.keys(syllabusData || {}));
        console.log('Syllabus.data:', syllabusData?.data);
        console.log('Syllabus.data length:', syllabusData?.data?.length);
        if (syllabusData?.data?.length > 0) {
          console.log('First module:', syllabusData.data[0]);
          console.log('First module title:', syllabusData.data[0]?.module?.title);
        }
        setSyllabus(syllabusData);
      } catch (err) {
        console.log('Failed to fetch syllabus:', err.message);
        console.log('Syllabus error details:', err);
        setSyllabus(null);
      }
      
      // Fetch enrollment status
      try {
        console.log('Checking enrollment status...');
        const enrollmentData = await getEnrollmentByCourseId(token, courseId);
        console.log('Enrollment status:', enrollmentData);
        setEnrollment(enrollmentData);
      } catch (err) {
        console.log('User not enrolled or enrollment check failed:', err.message);
        // User not enrolled, that's okay
        setEnrollment(null);
      }
      
    } catch (err) {
      console.error('Failed to load course data:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load course data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login to enroll in this course');
        return;
      }

      // Check if course is free or paid
      const isFree = course.priceType === 'free' || Number(course.price || 0) === 0;
      
      if (!isFree) {
        // For paid courses, redirect to payment or show payment modal
        alert(`This is a paid course (${course.currency || 'AUD'}${course.price}). Please complete payment before enrollment.`);
        // TODO: Redirect to payment page or open payment modal
        // navigate(`/student/payment/${courseId}`);
        setLoading(false);
        return;
      }
      
      // Only allow direct enrollment for free courses
      const enrollmentData = await createEnrollment(token, courseId);
      console.log('Enrollment successful:', enrollmentData);
      
      // Update enrollment state
      setEnrollment(enrollmentData);
      
      // Show success message
      alert('Enrollment submitted successfully! Please wait for instructor approval to access course content.');
      
    } catch (err) {
      console.error('Enrollment error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to enroll in course. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEnrollment = async () => {
    if (!window.confirm('Are you sure you want to cancel your enrollment? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login to manage your enrollment');
        return;
      }
      
      // We need to get the enrollment ID first
      if (!enrollment || !enrollment._id) {
        alert('Enrollment information not found. Please refresh the page and try again.');
        return;
      }
      
      await cancelEnrollment(enrollment._id);
      console.log('Enrollment cancelled successfully');
      
      // Update enrollment state
      setEnrollment(null);
      
      // Show success message
      alert('Enrollment cancelled successfully');
      
    } catch (err) {
      console.error('Cancel enrollment error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to cancel enrollment. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentResult) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login to complete enrollment');
        return;
      }
      
      // After successful payment, create enrollment
      const enrollmentData = await createEnrollment(token, courseId);
      console.log('Enrollment successful after payment:', enrollmentData);
      
      // Update enrollment state
      setEnrollment(enrollmentData);
      
      // Show success message
      alert('Payment successful! You are now enrolled in the course.');
      
    } catch (err) {
      console.error('Enrollment after payment error:', err);
      const errorMessage = err.response?.data?.message || 'Payment successful but enrollment failed. Please contact support.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <div className="cd-loading">
          <div className="cd-spinner"></div>
          <p>Loading course details...</p>
        </div>
      ) : error ? (
        <div className="cd-error">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      ) : !course ? (
        <div className="cd-error">
          <h2>Course Not Found</h2>
          <p>The course you're looking for doesn't exist.</p>
        </div>
      ) : (
        <div className="cd-page">
          {/* HERO */}
          <header className="cd-hero">
            <div className="cd-hero-grid">
              <figure className="cd-hero-media">
                {/* Ưu tiên image trong introductionAssets, sau đó đến thumbnailUrl */}
                {course.introductionAssets?.find(a => a.kind === 'image') ? (
                  <img
                    src={course.introductionAssets.find(a => a.kind === 'image')?.url}
                    alt={course.title}
                    className="cd-hero-img"
                  />
                ) : course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="cd-hero-img" />
                ) : (
                  <div className="cd-hero-placeholder">
                    <span>Course Preview</span>
                  </div>
                )}
                {/* Nếu có video preview */}
                {course.introductionAssets?.find(a => a.kind === 'video') && (
                  <div className="cd-hero-video">
                    <video controls className="cd-video">
                      <source
                        src={course.introductionAssets.find(a => a.kind === 'video')?.url}
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
              </figure>

              <div className="cd-hero-content">
                <h1 className="cd-title">{course.title}</h1>
                {course.subtitle && <p className="cd-subtitle">{course.subtitle}</p>}

                <div className="cd-meta">
                  {course.level && (
                    <span className={`cd-chip level-${course.level}`}>
                      {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                    </span>
                  )}
                  {course.stats?.totalLessons > 0 && (
                    <span className="cd-chip">📚 {course.stats.totalLessons} lessons</span>
                  )}
                  {course.stats?.totalDurationSec > 0 && (
                    <span className="cd-chip">⏱ {Math.floor(course.stats.totalDurationSec / 60)} min</span>
                  )}
                  {course.stats?.studentCount > 0 && (
                    <span className="cd-chip">👥 {course.stats.studentCount} students</span>
                  )}
                </div>

                <div className="cd-priceRow">
                  {course.priceType === 'free' || course.price === 0 ? (
                    <div className="cd-price free">Free</div>
                  ) : (
                    <div className="cd-price paid">
                      {course.salePrice && course.salePrice < course.price && (
                        <span className="cd-price-original">
                          {course.currency || 'AUD'}${course.price}
                        </span>
                      )}
                      <span className="cd-price-current">
                        {course.currency || 'AUD'}${course.salePrice || course.price}
                      </span>
                    </div>
                  )}
                </div>

                <div className="cd-actions">
                  {!enrollment ? (
                    <>
                      {course.priceType === 'free' || course.price === 0 ? (
                        <button 
                          className="cd-btn cd-btn-primary" 
                          onClick={handleEnroll}
                          disabled={loading}
                        >
                          {loading ? 'Processing...' : 'Enroll Now'}
                        </button>
                      ) : (
                        <>
                          <button 
                            className="cd-btn cd-btn-primary" 
                            onClick={() => {
                              // For paid courses, open payment modal
                              setShowPaymentModal(true);
                            }}
                            disabled={loading}
                          >
                            Enroll Now
                          </button>
                          <button
                            className="cd-btn cd-btn-ghost"
                            onClick={() => {
                              // Show course details
                              alert(`Course: ${course.title}\nPrice: ${course.currency || 'AUD'}${course.price}\n\nThis is a paid course. Complete payment to access all content.`);
                            }}
                            disabled={loading}
                          >
                            Learn More
                          </button>
                        </>
                      )}
                    </>
                  ) : enrollment.status === 'pending' ? (
                    <div className="cd-enrollment-pending">
                      <span className="cd-pending-badge">⏳ Pending Approval</span>
                      <p className="cd-pending-message">Your enrollment is waiting for instructor approval. You'll receive a notification once approved.</p>
                      <button 
                        className="cd-btn cd-btn-link" 
                        onClick={handleCancelEnrollment}
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : 'Cancel Enrollment'}
                      </button>
                    </div>
                  ) : enrollment.status === 'approved' ? (
                    <div className="cd-enrolled">
                      <span className="cd-enrolled-badge">✓ Enrolled & Approved</span>
                      <div className="cd-enrolled-actions">
                        <button 
                          className="cd-btn cd-btn-primary"
                          onClick={() => navigate(`/student/courses/${courseId}/learn`)}
                        >
                          🚀 Start Learning
                        </button>
                        <button 
                          className="cd-btn cd-btn-link" 
                          onClick={handleCancelEnrollment}
                          disabled={loading}
                        >
                          {loading ? 'Processing...' : 'Cancel enrollment'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="cd-enrollment-cancelled">
                      <span className="cd-cancelled-badge">❌ Enrollment Cancelled</span>
                      <button 
                        className="cd-btn cd-btn-primary" 
                        onClick={handleEnroll}
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : 'Re-enroll'}
                      </button>
                    </div>
                  )}
                </div>

                {course.instructorId && (
                  <div className="cd-instructor">
                    <span className="cd-instructor-label">Instructor</span>
                    <span className="cd-instructor-name">
                      {typeof course.instructorId === 'object'
                        ? course.instructorId.name
                        : 'Unknown'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <main className="cd-content">
            {/* About / Introduction */}
            {course.description && (
              <section className="cd-section">
                <h2 className="cd-h2">About this course</h2>
                <p className="cd-lead">{course.description}</p>
              </section>
            )}

            {/* Course Syllabus */}
            <section className="cd-section">
              <h2 className="cd-h2">Course Content</h2>
              <div className="cd-syllabus">

                
                {(syllabus && syllabus.data && syllabus.data.length > 0) || (Array.isArray(syllabus) && syllabus.length > 0) ? (
                  <>
                    <div className="cd-syllabus-summary">
                      <p className="cd-syllabus-overview">
                        This course contains <strong>{syllabus.data ? syllabus.data.length : syllabus.length} modules</strong> with a total of{' '}
                        <strong>{(syllabus.data || syllabus).reduce((total, item) => total + (item.lessons ? item.lessons.length : 0), 0)} lessons</strong>
                      </p>
                    </div>
                    
                    {(syllabus.data || syllabus).map((item, moduleIndex) => {
                      // Handle both data structures: { module: {...}, lessons: [...] } and direct module object
                      const moduleData = item.module || item;
                      const lessons = item.lessons || [];
                      
                      return (
                        <div key={moduleData._id || moduleIndex} className="cd-module">
                          <div className="cd-module-header">
                            <div className="cd-module-title-section">
                              <span className="cd-module-number">{moduleIndex + 1}</span>
                              <h3 className="cd-module-title">{moduleData.title}</h3>
                            </div>
                            <div className="cd-module-meta">
                              <span className="cd-module-lesson-count">
                                {lessons.length} lessons
                              </span>
                              {moduleData.summary && (
                                <span className="cd-module-summary">{moduleData.summary}</span>
                              )}
                            </div>
                          </div>
                          
                          {lessons.length > 0 && (
                            <div className="cd-lessons-list">
                              {lessons.map((lesson, lessonIndex) => (
                                <div key={lesson._id || lessonIndex} className="cd-lesson-item">
                                  <div className="cd-lesson-info">
                                    <span className="cd-lesson-number">{lessonIndex + 1}</span>
                                    <span className="cd-lesson-title">{lesson.title}</span>
                                    {lesson.durationSec && (
                                      <span className="cd-lesson-duration">
                                        {Math.floor(lesson.durationSec / 60)}m
                                      </span>
                                    )}
                                  </div>
                                  {lesson.contentType && (
                                    <span className="cd-lesson-type">
                                      {lesson.contentType === 'video' ? '🎥' : 
                                       lesson.contentType === 'text' ? '📝' : 
                                       lesson.contentType === 'quiz' ? '❓' : '📎'}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                ) : course.stats && course.stats.totalLessons > 0 ? (
                  <div className="cd-syllabus-placeholder">
                    <p>This course contains {course.stats.totalLessons} lessons organized into modules.</p>
                    <p>Enroll to see the complete course structure and start learning!</p>
                  </div>
                ) : (
                  <div className="cd-syllabus-placeholder">
                    <p>Course content will be available after enrollment.</p>
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          course={course}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      <Footer />
    </>
  );
} 