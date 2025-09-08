import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuizProgress } from '../api/quizProgressApi';
import './QuizProgressCard.css';

export default function QuizProgressCard({ courseId, courseTitle }) {
  const navigate = useNavigate();
  const [quizProgress, setQuizProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuizProgress();
  }, [courseId]);

  const fetchQuizProgress = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await getQuizProgress(token, courseId);
      
      if (response.success) {
        setQuizProgress(response.data);
      } else {
        setError(response.message || 'Failed to fetch quiz progress');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch quiz progress');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    navigate(`/student/courses/${courseId}/quiz`);
  };

  const handleViewResults = () => {
    navigate(`/student/courses/${courseId}/quiz/results`);
  };

  if (loading) {
    return (
      <div className="quiz-progress-card">
        <div className="loading-spinner"></div>
        <p>Loading quiz progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-progress-card error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={fetchQuizProgress} className="retry-btn">
          🔄 Retry
        </button>
      </div>
    );
  }

  if (!quizProgress || !quizProgress.hasQuiz) {
    return null; // Don't show if no quiz
  }

  const { quiz, quizProgress: progress, canTakeQuiz, completedLessons, totalLessons } = quizProgress;

  return (
    <div className="quiz-progress-card">
      <div className="quiz-header">
        <h3>🧠 Course Quiz</h3>
        <div className="quiz-status">
          {progress.status === 'completed' && progress.passed ? (
            <span className="status-badge passed">✅ Passed</span>
          ) : progress.status === 'completed' && !progress.passed ? (
            <span className="status-badge failed">❌ Failed</span>
          ) : progress.status === 'in_progress' ? (
            <span className="status-badge in-progress">🔄 In Progress</span>
          ) : (
            <span className="status-badge not-started">⏳ Not Started</span>
          )}
        </div>
      </div>

      <div className="quiz-info">
        <h4>{quiz.title}</h4>
        <p>{quiz.description}</p>
        <div className="quiz-details">
          <span>📝 {quiz.totalQuestions} questions</span>
          <span>🎯 {quiz.passingScore}% to pass</span>
          {quiz.timeLimit && <span>⏰ {quiz.timeLimit} min limit</span>}
        </div>
      </div>

      <div className="progress-section">
        <div className="lesson-progress">
          <label>Lessons Progress (60%)</label>
          <div className="progress-bar">
            <div 
              className="progress-fill lesson-fill"
              style={{ width: `${(completedLessons / totalLessons) * 60}%` }}
            ></div>
          </div>
          <span className="progress-text">{completedLessons}/{totalLessons} lessons</span>
        </div>

        <div className="quiz-progress">
          <label>Quiz Progress (20%)</label>
          <div className="progress-bar">
            <div 
              className="progress-fill quiz-fill"
              style={{ width: progress.passed ? '20%' : '0%' }}
            ></div>
          </div>
          <span className="progress-text">
            {progress.passed ? '20% (Passed)' : '0% (Not passed)'}
          </span>
        </div>

        <div className="short-question-progress">
          <label>Short Questions (20%)</label>
          <div className="progress-bar">
            <div 
              className="progress-fill short-question-fill"
              style={{ width: '0%' }}
            ></div>
          </div>
          <span className="progress-text">0% (Not available)</span>
        </div>

        <div className="total-progress">
          <label>Total Course Progress</label>
          <div className="progress-bar">
            <div 
              className="progress-fill total-fill"
              style={{ 
                width: `${Math.min(
                  (completedLessons / totalLessons) * 60 + (progress.passed ? 20 : 0), 
                  100
                )}%` 
              }}
            ></div>
          </div>
          <span className="progress-text">
            {Math.round(Math.min(
              (completedLessons / totalLessons) * 60 + (progress.passed ? 20 : 0), 
              100
            ))}%
          </span>
        </div>
      </div>

      <div className="quiz-actions">
        {!canTakeQuiz ? (
          <div className="quiz-locked">
            <div className="lock-icon">🔒</div>
            <p>Complete all {totalLessons} lessons to unlock the quiz</p>
            <div className="lesson-count">
              {completedLessons} of {totalLessons} lessons completed
            </div>
          </div>
        ) : progress.status === 'not_started' ? (
          <button 
            className="start-quiz-btn"
            onClick={handleStartQuiz}
          >
            🚀 Start Quiz
          </button>
        ) : progress.status === 'in_progress' ? (
          <button 
            className="continue-quiz-btn"
            onClick={handleStartQuiz}
          >
            🔄 Continue Quiz
          </button>
        ) : progress.status === 'completed' ? (
          <div className="quiz-completed">
            <div className="score-display">
              <span className="score">{progress.score}</span>
              <span className="separator">/</span>
              <span className="total">{progress.totalQuestions}</span>
            </div>
            <div className="percentage">{progress.percentage.toFixed(1)}%</div>
            <button 
              className="view-results-btn"
              onClick={handleViewResults}
            >
              📊 View Results
            </button>
            {!progress.passed && progress.attemptCount < progress.maxAttempts && (
              <button 
                className="retake-quiz-btn"
                onClick={handleStartQuiz}
              >
                🔄 Retake Quiz
              </button>
            )}
          </div>
        ) : null}
      </div>

      {progress.status === 'completed' && (
        <div className="quiz-summary">
          <div className="summary-item">
            <span className="label">Attempts:</span>
            <span className="value">{progress.attemptCount}/{progress.maxAttempts}</span>
          </div>
          <div className="summary-item">
            <span className="label">Time Spent:</span>
            <span className="value">
              {Math.floor(progress.timeSpent / 60)}m {progress.timeSpent % 60}s
            </span>
          </div>
          <div className="summary-item">
            <span className="label">Completed:</span>
            <span className="value">
              {new Date(progress.completedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
