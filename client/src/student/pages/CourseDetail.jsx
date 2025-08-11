import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './CourseDetail.css';
import Footer from '../../components/Footer';


// Quiz Results Component
function QuizResults({ submission, onClose }) {
  return (
    <div className="quiz-modal-overlay">
      <div className="quiz-modal">
        <div className="quiz-result">
          <h2>Quiz Results 📊</h2>
          <div className="result-details">
            <p><strong>Score:</strong> {submission.score}/{submission.totalQuestions}</p>
            <p><strong>Percentage:</strong> {submission.percentage}%</p>
            <p><strong>Status:</strong> {submission.passed ? '✅ Passed' : '❌ Failed'}</p>
            <p><strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleDateString()}</p>
          </div>
          <button className="quiz-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


// Quiz Modal Component
function QuizModal({ quizSet, onClose, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);


  const handleAnswerSelect = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };


  const handleSubmit = async () => {
    if (answers.length !== quizSet.questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }


    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/api/quizzes/submit', {
        quizId: quizSet.quizId,
        quizSetId: quizSet.quizSetId,
        answers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });


      setResult(response.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };


  const handleNext = () => {
    if (currentQuestion < quizSet.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };


  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };


  if (result) {
    return (
      <div className="quiz-modal-overlay">
        <div className="quiz-modal">
          <div className="quiz-result">
            <h2>Quiz Complete! 🎉</h2>
            <div className="result-details">
              <p><strong>Score:</strong> {result.score}/{quizSet.questions.length}</p>
              <p><strong>Percentage:</strong> {Math.round((result.score / quizSet.questions.length) * 100)}%</p>
              <p><strong>Status:</strong> {result.passed ? '✅ Passed' : '❌ Failed'}</p>
            </div>
            <button className="quiz-close-btn" onClick={onComplete}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="quiz-modal-overlay">
      <div className="quiz-modal">
        <div className="quiz-header">
          <h2>Quiz</h2>
          <button className="quiz-close-btn" onClick={onClose}>✕</button>
        </div>
       
        <div className="quiz-progress">
          Question {currentQuestion + 1} of {quizSet.questions.length}
        </div>


        <div className="quiz-question">
          <h3>{quizSet.questions[currentQuestion].text}</h3>
          <div className="quiz-options">
            {quizSet.questions[currentQuestion].options.map((option, index) => (
              <label key={index} className="quiz-option">
                <input
                  type="radio"
                  name={`question-${currentQuestion}`}
                  value={option}
                  checked={answers[currentQuestion] === option}
                  onChange={() => handleAnswerSelect(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>


        <div className="quiz-navigation">
          <button
            className="quiz-nav-btn"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </button>
         
          {currentQuestion === quizSet.questions.length - 1 ? (
            <button
              className="quiz-submit-btn"
              onClick={handleSubmit}
              disabled={submitting || answers.length !== quizSet.questions.length}
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              className="quiz-nav-btn"
              onClick={handleNext}
              disabled={!answers[currentQuestion]}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


export default function CourseDetail() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedQuizSet, setSelectedQuizSet] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);


  const fetchCourseAndEnrollment = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      // Fetch course
      const courseRes = await axios.get(`http://localhost:8080/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourse(courseRes.data);
     
      // Fetch my enrollments
      const enrollRes = await axios.get('http://localhost:8080/api/enrollments/my-courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const found = enrollRes.data.find(e => e.courseId?._id === courseId);
      setEnrollment(found || null);


      // If student is accepted, fetch quizzes
      if (found && found.status === 'approved') {
        fetchQuizzes();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchCourseAndEnrollment();
  }, [courseId]);


  const fetchQuizzes = async () => {
    setQuizLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching quizzes for course:', courseId);
      const response = await axios.get(`http://localhost:8080/api/quizzes/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Quiz data received:', response.data);
      setQuizData(response.data);
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
      console.error('Error details:', err.response?.data);
    } finally {
      setQuizLoading(false);
    }
  };


  const handleStartQuiz = (quizSet) => {
    setSelectedQuizSet({
      ...quizSet,
      quizId: quizData.quizId
    });
    setShowQuizModal(true);
  };


  const handleViewResults = (quizSet) => {
    setSelectedQuizSet(quizSet);
    setShowResultsModal(true);
  };


  const handleQuizComplete = () => {
    setShowQuizModal(false);
    setSelectedQuizSet(null);
    // Refresh enrollment to get updated progress
    fetchCourseAndEnrollment();
  };


  const handleCloseResults = () => {
    setShowResultsModal(false);
    setSelectedQuizSet(null);
  };


  const handleRegister = async () => {
    setRegistering(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/enrollments', { courseId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refetch enrollment status
      const enrollRes = await axios.get('http://localhost:8080/api/enrollments/my-courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const found = enrollRes.data.find(e => e.courseId?._id === courseId);
      setEnrollment(found || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register.');
    } finally {
      setRegistering(false);
    }
  };


  const handleCancelRegistration = async () => {
    setCancelling(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/enrollments/${enrollment._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEnrollment(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel registration.');
    } finally {
      setCancelling(false);
    }
  };


  const renderContentItem = (item, index) => {
    switch (item.type) {
      case 'video':
        return (
          <video controls className="course-detail-video">
            <source src={item.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        );
      case 'image':
        return (
          <img src={item.url} alt={item.title || `Course content ${index + 1}`} className="course-detail-image" />
        );
      case 'pdf':
        return (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="course-detail-pdf">
            📄 {item.title || 'View PDF'}
          </a>
        );
      case 'text':
        return (
          <div className="course-detail-text">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        );
      default:
        return null;
    }
  };


  const isAccepted = enrollment && enrollment.status === 'approved';
  const isPending = enrollment && enrollment.status === 'pending';


  return (
    <div className="course-detail-page">
      {loading ? (
        <div className="course-detail-loading">Loading course...</div>
      ) : error ? (
        <div className="course-detail-error">{error}</div>
      ) : course ? (
        <div className="course-detail-content">
          <h1 className="course-detail-title">{course.title}</h1>
          <div className="course-detail-desc">{course.description}</div>
          <div className="course-detail-instructor">
            <b>Instructor:</b> {course.instructorId?.name || 'Unknown'}
          </div>


          {/* Show different content based on enrollment status */}
          {!enrollment ? (
            // Not enrolled - Show introduction content
            <div className="course-detail-intro-section">
              <div className="intro-header">
                <h2>Course Introduction</h2>
                <p>Register to access the full course content and quizzes</p>
              </div>
             
              {course.introductionContent && course.introductionContent.length > 0 ? (
                <div className="intro-content">
                  {course.introductionContent.map((item, idx) => (
                    <div key={idx} className="intro-item">
                      {renderContentItem(item, idx)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="intro-placeholder">
                  <p>No introduction content available.</p>
                </div>
              )}


              <div className="enrollment-section">
                <button className="course-detail-register-btn" onClick={handleRegister} disabled={registering}>
                  {registering ? 'Registering...' : 'Register for this Course'}
                </button>
              </div>
            </div>
          ) : isPending ? (// Enrolled but pending approval
            // Pending approval - Show introduction with pending message
            <div className="course-detail-pending-section">
              <div className="pending-message">
                <h2>⏳ Registration Pending</h2>
                <p>Your registration is waiting for instructor approval. You can view the course introduction while waiting.</p>
              </div>


              {course.introductionContent && course.introductionContent.length > 0 && (
                <div className="intro-content">
                  {course.introductionContent.map((item, idx) => (
                    <div key={idx} className="intro-item">
                      {renderContentItem(item, idx)}
                    </div>
                  ))}
                </div>
              )}


              <div className="pending-actions">
                <button
                  className="course-detail-cancel-btn"
                  onClick={handleCancelRegistration}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling..." : "Cancel Registration"}
                </button>
              </div>
            </div>
          ) : isAccepted ? (
            // Accepted - Show full course content and quizzes
            <div className="course-detail-full-section">
              <div className="progress-section">
                <h2>Course Progress</h2>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${quizData?.progress || enrollment.progress || 0}%` }}
                  ></div>
                </div>
                <span className="progress-text">
                  {quizData?.completedQuizSets || 0} of {quizData?.totalQuizSets || 0} Quiz Sets Completed
                  ({quizData?.progress || enrollment.progress || 0}%)
                </span>
                {quizData?.instructorApproved && (
                  <div className="completion-status">
                    <span className="completion-badge">✅ Course Approved by Instructor</span>
                  </div>
                )}
              </div>


              {/* Full Course Content */}
              <div className="full-content-section">
                <h2>Course Content</h2>
                {course.content && course.content.length > 0 ? (
                  <div className="course-detail-media-list">
                    {course.content.map((item, idx) => (
                      <div key={idx} className="course-detail-media">
                        {renderContentItem(item, idx)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="course-detail-no-content">No course content available.</div>
                )}
              </div>


              {/* Quizzes Section */}
              <div className="quizzes-section">
                <h2>Course Quiz Sets</h2>
                {console.log('Quiz data in render:', quizData)}
                {console.log('Quiz loading:', quizLoading)}
                {quizLoading ? (
                  <div className="quiz-loading">Loading quiz sets...</div>
                ) : quizData?.quizSets && quizData.quizSets.length > 0 ? (
                  <div className="quizzes-list">
                    {quizData.quizSets.filter(set => set.isActive).map((quizSet, idx) => (
                      <div key={quizSet.quizSetId || idx} className="quiz-item">
                        <h3>{quizSet.name}</h3>
                        <p>{quizSet.questions?.length || 0} questions</p>
                        {quizSet.hasSubmitted ? (
                          <div className="quiz-completed">
                            <div className="quiz-status">
                              <span className={`status-badge ${quizSet.submission.passed ? 'passed' : 'failed'}`}>
                                {quizSet.submission.passed ? '✅ Passed' : '❌ Failed'}
                              </span>
                              <span className="quiz-score">
                                Score: {quizSet.submission.score}/{quizSet.submission.totalQuestions} ({quizSet.submission.percentage}%)
                              </span>
                            </div>
                            <button
                              className="quiz-view-results-btn"
                              onClick={() => handleViewResults(quizSet)}
                            >
                              View Results
                            </button>
                          </div>
                        ) : (
                          <button
                            className="quiz-start-btn"
                            onClick={() => handleStartQuiz(quizSet)}
                          >
                            Start Quiz Set
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-quizzes">
                    <p>No quiz sets available for this course yet.</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}


      {/* Quiz Modal */}
      {showQuizModal && selectedQuizSet && (
        <QuizModal
          quizSet={selectedQuizSet}
          onClose={() => setShowQuizModal(false)}
          onComplete={handleQuizComplete}
        />
      )}


      {/* Quiz Results Modal */}
      {showResultsModal && selectedQuizSet && selectedQuizSet.submission && (
        <QuizResults
          submission={selectedQuizSet.submission}
          onClose={handleCloseResults}
        />
      )}


      <Footer />
    </div>
  );
}

