import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ShortQuestion.css';
import { shortQuestionProgressApi } from '../api/shortQuestionApi';

export default function ShortQuestion() {
  const { courseId, shortQuestionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shortQuestionData, setShortQuestionData] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [shortQuestionStarted, setShortQuestionStarted] = useState(false);
  const [shortQuestionCompleted, setShortQuestionCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    initializeShortQuestion();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [shortQuestionId]);

  const initializeShortQuestion = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await shortQuestionProgressApi.startShortQuestion(shortQuestionId);
      
      if (response.success) {
        console.log('Short question started successfully:', response.data);
        setShortQuestionData(response.data.shortQuestion);
        setAttemptId(response.data.attemptId);
        setShortQuestionStarted(true);
        startTimeRef.current = Date.now();
        
        // Start timer
        timerRef.current = setInterval(() => {
          setTimeSpent(prev => prev + 1);
        }, 1000);
        
        // Initialize answers array
        const initialAnswers = response.data.shortQuestion.questions.map((_, index) => ({
          questionIndex: index,
          studentAnswer: '',
          timeSpent: 0
        }));
        setAnswers(initialAnswers);
      } else {
        // Check if it's because already completed
        if (response.message && response.message.includes('already completed')) {
          setAlreadyCompleted(true);
          setError('You have already completed this short question. You can only attempt it once.');
        } else {
          setError(response.message || 'Failed to start short question');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start short question');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers(prev => prev.map((answer, index) => {
      if (index === questionIndex) {
        return {
          ...answer,
          studentAnswer: value,
          timeSpent: answer.timeSpent + 1
        };
      }
      return answer;
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < shortQuestionData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitShortQuestion = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Calculate total time spent
      const totalTimeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      // Update answers with final time spent
      const finalAnswers = answers.map(answer => ({
        ...answer,
        timeSpent: answer.timeSpent + 1
      }));

      console.log('Submitting short question:', {
        shortQuestionId,
        attemptId,
        finalAnswers,
        totalTimeSpent
      });

      const response = await shortQuestionProgressApi.submitShortQuestion(
        shortQuestionId, 
        attemptId, 
        finalAnswers, 
        totalTimeSpent
      );
      
      if (response.success) {
        setResults(response.data);
        setShortQuestionCompleted(true);
        
        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      } else {
        setError(response.message || 'Failed to submit short question');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit short question');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!shortQuestionData) return 0;
    const answeredQuestions = answers.filter(a => a.studentAnswer.trim() !== '').length;
    return (answeredQuestions / shortQuestionData.questions.length) * 100;
  };

  if (loading) {
    return (
      <div className="short-question-container">
        <div className="short-question-loading">
          <div className="loading-spinner"></div>
          <p>Loading short question...</p>
        </div>
      </div>
    );
  }

  if (alreadyCompleted) {
    return (
      <div className="short-question-container">
        <div className="short-question-completed">
          <div className="completed-icon">✅</div>
          <h3>Short Quiz Already Completed</h3>
          <p>You have already completed this Short Quiz. You can only attempt it once.</p>
          <div className="completed-actions">
            <button 
              className="course-btn"
              onClick={() => navigate(`/student/courses/${courseId}/learn`)}
            >
              🏠 Back to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="short-question-container">
        <div className="short-question-error">
          <div className="error-icon">❌</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={initializeShortQuestion}
          >
            🔄 Retry
          </button>
          <button 
            className="back-btn"
            onClick={() => navigate(`/student/courses/${courseId}/learn`)}
          >
            ← Back to Course
          </button>
        </div>
      </div>
    );
  }

  if (shortQuestionCompleted && results) {
    return (
      <div className="short-question-container">
        <div className="short-question-results">
          <div className="results-header">
            <h2>📝 Short Question Submitted</h2>
            <div className="submission-status">
              <div className="status-icon">⏳</div>
              <h3>Waiting for Instructor Review</h3>
              <p>Your short question has been submitted and is waiting for instructor grading.</p>
            </div>
            <div className="submission-details">
              <div className="detail-item">
                <span className="detail-label">Submitted:</span>
                <span className="detail-value">{new Date(results.submittedAt).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Questions:</span>
                <span className="detail-value">{results.totalQuestions}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value">{results.status}</span>
              </div>
            </div>
          </div>

          <div className="progress-summary">
            <h3>Course Progress</h3>
            <div className="progress-bars">
              <div className="progress-item">
                <label>Lessons: {results.courseProgress.lessonProgress?.percentage || 0}%</label>
                <div className="progress-bar">
                  <div 
                    className="progress-fill lesson-progress"
                    style={{ width: `${results.courseProgress.lessonProgress?.percentage || 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="progress-item">
                <label>Short Questions: {results.courseProgress.shortQuestionProgress?.percentage || 0}%</label>
                <div className="progress-bar">
                  <div 
                    className="progress-fill short-question-progress"
                    style={{ width: `${results.courseProgress.shortQuestionProgress?.percentage || 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="progress-item total">
                <label>Total: {results.courseProgress.courseProgress || 0}%</label>
                <div className="progress-bar">
                  <div 
                    className="progress-fill total-progress"
                    style={{ width: `${results.courseProgress.courseProgress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="results-actions">
            <button 
              className="course-btn"
              onClick={() => navigate(`/student/courses/${courseId}/learn`)}
            >
              🏠 Back to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!shortQuestionData || !shortQuestionStarted) {
    return (
      <div className="short-question-container">
        <div className="short-question-error">
          <div className="error-icon">⚠️</div>
          <h3>Short Question Not Available</h3>
          <p>Unable to start short question. Please try again.</p>
          <button 
            className="retry-btn"
            onClick={initializeShortQuestion}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  const currentQuestionData = shortQuestionData.questions[currentQuestion];
  const progressPercentage = getProgressPercentage();

  return (
    <div className="short-question-container">
      <div className="short-question-header">
        <div className="short-question-info">
          <h1>📝 {shortQuestionData.title}</h1>
          <p className="short-question-instructions">{shortQuestionData.instructions}</p>
        </div>
        
        <div className="short-question-stats">
          <div className="stat-item">
            <span className="stat-label">Time:</span>
            <span className="stat-value">{formatTime(timeSpent)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Progress:</span>
            <span className="stat-value">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Question:</span>
            <span className="stat-value">{currentQuestion + 1}/{shortQuestionData.questions.length}</span>
          </div>
        </div>
      </div>

      <div className="short-question-progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <div className="question-container">
        <div className="question-header">
          <h2>Question {currentQuestion + 1}</h2>
          <div className="question-navigation">
            <button 
              className="nav-btn"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
            >
              ← Previous
            </button>
            <button 
              className="nav-btn"
              onClick={handleNextQuestion}
              disabled={currentQuestion === shortQuestionData.questions.length - 1}
            >
              Next →
            </button>
          </div>
        </div>

        <div className="question-content">
          <p className="question-text">{currentQuestionData.question}</p>
          
          <div className="answer-input-container">
            <label htmlFor={`answer-${currentQuestion}`} className="answer-label">
              Your Answer:
            </label>
            <textarea
              id={`answer-${currentQuestion}`}
              className="answer-textarea"
              value={answers[currentQuestion]?.studentAnswer || ''}
              onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
              placeholder="Type your answer here..."
              rows={6}
              maxLength={currentQuestionData.maxLength || 500}
            />
            <div className="answer-info">
              <span className="character-count">
                {answers[currentQuestion]?.studentAnswer?.length || 0} / {currentQuestionData.maxLength || 500} characters
              </span>
              {currentQuestionData.minLength && (
                <span className="min-length">
                  Minimum {currentQuestionData.minLength} characters required
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="short-question-actions">
        <div className="question-indicators">
          {shortQuestionData.questions.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentQuestion ? 'current' : ''} ${answers[index]?.studentAnswer?.trim() ? 'answered' : ''}`}
              onClick={() => setCurrentQuestion(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <button 
          className="submit-btn"
          onClick={handleSubmitShortQuestion}
          disabled={answers.filter(a => a.studentAnswer.trim() !== '').length < shortQuestionData.questions.length}
        >
          📝 Submit Short Question
        </button>
      </div>

      {shortQuestionData.timeLimit && (
        <div className="time-warning">
          ⏰ Time limit: {shortQuestionData.timeLimit} minutes
        </div>
      )}
    </div>
  );
}
