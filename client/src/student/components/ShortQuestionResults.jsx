import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ShortQuestionResults.css';
import { shortQuestionProgressApi } from '../api/shortQuestionApi';

export default function ShortQuestionResults() {
  const { courseId, shortQuestionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [shortQuestionId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await shortQuestionProgressApi.getShortQuestionResults(shortQuestionId);
      
      if (response.success) {
        setResults(response.data);
      } else {
        setError(response.message || 'Failed to fetch results');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="short-question-results-container">
        <div className="short-question-results-loading">
          <div className="loading-spinner"></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="short-question-results-container">
        <div className="short-question-results-error">
          <div className="error-icon">❌</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={fetchResults}
          >
            🔄 Retry
          </button>
          <button 
            className="back-btn"
            onClick={() => navigate(`/student/courses/${courseId}/learning`)}
          >
            ← Back to Course
          </button>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="short-question-results-container">
        <div className="short-question-results-error">
          <div className="error-icon">⚠️</div>
          <h3>No Results Found</h3>
          <p>No results found for this short question.</p>
          <button 
            className="back-btn"
            onClick={() => navigate(`/student/courses/${courseId}/learning`)}
          >
            ← Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="short-question-results-container">
      <div className="short-question-results">
        <div className="results-header">
          <h2>📊 Short Quiz Results</h2>
          <div className="score-display">
            <span className="score">{results.score}</span>
            <span className="separator">/</span>
            <span className="total">{results.totalQuestions}</span>
            <span className="percentage">({results.percentage}%)</span>
          </div>
          <div className={`status ${results.passed ? 'passed' : 'failed'}`}>
            {results.passed ? '✅ Passed' : '❌ Failed'}
          </div>
        </div>

        <div className="results-summary">
          <div className="summary-item">
            <span className="label">Time Spent:</span>
            <span className="value">{Math.floor(results.timeSpent / 60)}m {results.timeSpent % 60}s</span>
          </div>
          <div className="summary-item">
            <span className="label">Attempt Number:</span>
            <span className="value">{results.attemptNumber}</span>
          </div>
          <div className="summary-item">
            <span className="label">Submitted:</span>
            <span className="value">{new Date(results.submittedAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="answers-section">
          <h3>Your Answers</h3>
          <div className="answers-list">
            {results.answers.map((answer, index) => (
              <div key={index} className="answer-item">
                <div className="answer-header">
                  <h4>Question {answer.questionIndex + 1}</h4>
                  <div className={`answer-status ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                    {answer.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                  </div>
                </div>
                <div className="answer-content">
                  <div className="answer-field">
                    <label>Your Answer:</label>
                    <div className="answer-text">{answer.studentAnswer || 'No answer provided'}</div>
                  </div>
                  <div className="answer-field">
                    <label>Correct Answer:</label>
                    <div className="answer-text correct-answer">{answer.correctAnswer}</div>
                  </div>
                  {answer.explanation && (
                    <div className="answer-field">
                      <label>Explanation:</label>
                      <div className="answer-text explanation">{answer.explanation}</div>
                    </div>
                  )}
                  <div className="answer-meta">
                    <span>Points: {answer.points}/{answer.maxPoints}</span>
                    {answer.similarity && (
                      <span>Similarity: {Math.round(answer.similarity * 100)}%</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="results-actions">
          <button 
            className="course-btn"
            onClick={() => navigate(`/student/courses/${courseId}/learning`)}
          >
            🏠 Back to Course
          </button>
        </div>
      </div>
    </div>
  );
}
