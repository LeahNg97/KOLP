import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Quiz.css';
import { startQuiz, submitQuiz, getQuizResults, getQuizProgress } from '../api/quizProgressApi';


export default function Quiz() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState(null);
 
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);


  useEffect(() => {
    initializeQuiz();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [courseId]);


  const initializeQuiz = async () => {
    try {
      setLoading(true);
      setError('');
     
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      // First, try to get existing quiz progress
      try {
        const progressResponse = await getQuizProgress(token, courseId);
        console.log('Quiz progress response:', progressResponse);
        
        if (progressResponse.success && progressResponse.data) {
          const { quizProgress } = progressResponse.data;
          
          // Check if quiz is completed
          if (quizProgress && quizProgress.status === 'completed') {
            console.log('Quiz already completed, showing results');
            
            // Try to get detailed results
            try {
              const resultsResponse = await getQuizResults(token, courseId);
              if (resultsResponse.success && resultsResponse.data) {
                setResults(resultsResponse.data);
              } else {
                // Use progress data as fallback
                setResults({
                  score: quizProgress.score || 0,
                  totalQuestions: quizProgress.totalQuestions || 0,
                  percentage: quizProgress.percentage || 0,
                  passed: quizProgress.passed || false,
                  lessonProgress: { percentage: 0 },
                  quizProgress: { percentage: quizProgress.passed ? 20 : 0 },
                  courseProgress: 0
                });
              }
            } catch (err) {
              // Use progress data as fallback
              setResults({
                score: quizProgress.score || 0,
                totalQuestions: quizProgress.totalQuestions || 0,
                percentage: quizProgress.percentage || 0,
                passed: quizProgress.passed || false,
                lessonProgress: { percentage: 0 },
                quizProgress: { percentage: quizProgress.passed ? 20 : 0 },
                courseProgress: 0
              });
            }
            
            setQuizCompleted(true);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        // No progress found, continue to start new quiz
        console.log('No existing quiz progress found, starting new quiz:', err.message);
      }

      // Start new quiz if no results found
      const response = await startQuiz(token, courseId);
     
      if (response.success) {
        setQuizData(response.data);
        setQuizStarted(true);
        startTimeRef.current = Date.now();
       
        // Start timer
        timerRef.current = setInterval(() => {
          setTimeSpent(prev => prev + 1);
        }, 1000);
       
        // Initialize answers array
        const initialAnswers = response.data.questions.map((_, index) => ({
          questionIndex: index,
          selectedOption: -1,
          timeSpent: 0
        }));
        setAnswers(initialAnswers);
      } else {
        setError(response.message || 'Failed to start quiz');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };


  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers(prev => prev.map((answer, index) => {
      if (index === questionIndex) {
        return {
          ...answer,
          selectedOption: optionIndex,
          timeSpent: answer.timeSpent + 1
        };
      }
      return answer;
    }));
  };


  const handleNextQuestion = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };


  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };


  const handleSubmitQuiz = async () => {
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


      const response = await submitQuiz(token, courseId, quizData.attemptId, finalAnswers, totalTimeSpent);
     
      if (response.success) {
        setResults(response.data);
        setQuizCompleted(true);
       
        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      } else {
        setError(response.message || 'Failed to submit quiz');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz');
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
    if (!quizData) return 0;
    const answeredQuestions = answers.filter(a => a.selectedOption !== -1).length;
    return (answeredQuestions / quizData.questions.length) * 100;
  };


  if (loading) {
    return (
      <div className="quiz-container">
        <div className="quiz-loading">
          <div className="loading-spinner"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="quiz-container">
        <div className="quiz-error">
          <div className="error-icon">❌</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button
            className="retry-btn"
            onClick={initializeQuiz}
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


  if (quizCompleted && results) {
    return (
      <div className="quiz-container">
        <div className="quiz-results">
          <div className="results-header">
            <h2>🎯 Quiz Results</h2>
            <div className="score-display">
              <span className="score">{results.score}</span>
              <span className="separator">/</span>
              <span className="total">{results.totalQuestions}</span>
            </div>
            <div className={`result-status ${results.passed ? 'passed' : 'failed'}`}>
              {results.passed ? '✅ Passed!' : '❌ Failed'}
            </div>
            <div className="percentage">
              {results.percentage.toFixed(1)}%
            </div>
          </div>


          <div className="progress-summary">
            <h3>Course Progress</h3>
            <div className="progress-bars">
              <div className="progress-item">
                <label>Lessons: {results.lessonProgress?.percentage || 0}%</label>
                <div className="progress-bar">
                  <div
                    className="progress-fill lesson-progress"
                    style={{ width: `${results.lessonProgress?.percentage || 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="progress-item">
                <label>Quiz: {results.quizProgress?.percentage || 0}%</label>
                <div className="progress-bar">
                  <div
                    className="progress-fill quiz-progress"
                    style={{ width: `${results.quizProgress?.percentage || 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="progress-item total">
                <label>Total: {results.courseProgress || 0}%</label>
                <div className="progress-bar">
                  <div
                    className="progress-fill total-progress"
                    style={{ width: `${results.courseProgress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>


          <div className="results-actions">
            <button
              className="retake-btn"
              onClick={() => {
                // Reset state and start new quiz
                setQuizCompleted(false);
                setResults(null);
                setQuizStarted(false);
                setQuizData(null);
                setCurrentQuestion(0);
                setAnswers([]);
                setTimeSpent(0);
                initializeQuiz();
              }}
            >
              🔄 Retake Quiz
            </button>
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


  if (!quizData || !quizStarted) {
    return (
      <div className="quiz-container">
        <div className="quiz-error">
          <div className="error-icon">⚠️</div>
          <h3>Quiz Not Available</h3>
          <p>Unable to start quiz. Please try again.</p>
          <button
            className="retry-btn"
            onClick={initializeQuiz}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }


  const currentQuestionData = quizData.questions[currentQuestion];
  const progressPercentage = getProgressPercentage();


  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="quiz-info">
          <h1>🧠 {quizData.title}</h1>
          <p className="quiz-instructions">{quizData.instructions}</p>
        </div>
       
        <div className="quiz-stats">
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
            <span className="stat-value">{currentQuestion + 1}/{quizData.questions.length}</span>
          </div>
        </div>
      </div>


      <div className="quiz-progress-bar">
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
              disabled={currentQuestion === quizData.questions.length - 1}
            >
              Next →
            </button>
          </div>
        </div>


        <div className="question-content">
          <p className="question-text">{currentQuestionData.question}</p>
         
          <div className="options-list">
            {currentQuestionData.options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className={`option-item ${answers[currentQuestion]?.selectedOption === optionIndex ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion}`}
                  value={optionIndex}
                  checked={answers[currentQuestion]?.selectedOption === optionIndex}
                  onChange={() => handleAnswerSelect(currentQuestion, optionIndex)}
                />
                <span className="option-text">{option}</span>
              </label>
            ))}
          </div>
        </div>
      </div>


      <div className="quiz-actions">
        <div className="question-indicators">
          {quizData.questions.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentQuestion ? 'current' : ''} ${answers[index]?.selectedOption !== -1 ? 'answered' : ''}`}
              onClick={() => setCurrentQuestion(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>


        <button
          className="submit-btn"
          onClick={handleSubmitQuiz}
          disabled={answers.filter(a => a.selectedOption !== -1).length < quizData.questions.length}
        >
          🎯 Submit Quiz
        </button>
      </div>


      {quizData.timeLimit && (
        <div className="time-warning">
          ⏰ Time limit: {quizData.timeLimit} minutes
        </div>
      )}
    </div>
  );
}



