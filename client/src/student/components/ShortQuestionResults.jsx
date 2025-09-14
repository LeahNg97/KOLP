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
            onClick={() => navigate(`/student/courses/${courseId}/learn`)}
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
            onClick={() => navigate(`/student/courses/${courseId}/learn`)}
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
          
          {results.status === 'completed' ? (
            // Show full results if completed
            <>
              <div className="score-display">
                <span className="score">{results.score}</span>
                <span className="separator">/</span>
                <span className="total">{results.totalQuestions}</span>
                <span className="percentage">({results.percentage}%)</span>
              </div>
              <div className={`status ${results.passed ? 'passed' : 'failed'}`}>
                {results.passed ? '✅ Passed' : '❌ Failed'}
              </div>
            </>
          ) : results.status === 'graded' ? (
            // Show graded status if graded but not finalized
            <>
              <div className="score-display">
                <span className="score">{results.score}</span>
                <span className="separator">/</span>
                <span className="total">{results.totalQuestions}</span>
                <span className="percentage">({results.percentage}%)</span>
              </div>
              <div className="status graded">
                ✅ Graded (Awaiting Finalization)
              </div>
            </>
          ) : (
            // Show submitted status if not yet graded
            <div className="submission-status">
              <div className="status-icon">⏳</div>
              <h3>Waiting for Instructor Review</h3>
              <p>Your short question has been submitted and is waiting for instructor grading.</p>
            </div>
          )}
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
          {results.gradedAt && (
            <div className="summary-item">
              <span className="label">Graded:</span>
              <span className="value">{new Date(results.gradedAt).toLocaleString()}</span>
            </div>
          )}
          <div className="summary-item">
            <span className="label">Status:</span>
            <span className="value">{results.status}</span>
          </div>
        </div>

        {results.status === 'completed' && (
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
                    {answer.feedback && (
                      <div className="answer-field">
                        <label>Instructor Feedback:</label>
                        <div className="answer-text feedback">{answer.feedback}</div>
                      </div>
                    )}
                    {answer.explanation && (
                      <div className="answer-field">
                        <label>Explanation:</label>
                        <div className="answer-text explanation">{answer.explanation}</div>
                      </div>
                    )}
                    <div className="answer-meta">
                      <span>Points: {answer.points}/{answer.maxPoints}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {results.overallFeedback && (
              <div className="overall-feedback">
                <h4>Overall Feedback</h4>
                <div className="feedback-content">{results.overallFeedback}</div>
              </div>
            )}
          </div>
        )}

        {results.status !== 'completed' && (
          <div className="waiting-message">
            <div className="waiting-icon">📝</div>
            <h3>Results Not Available Yet</h3>
            <p>
              {results.status === 'submitted' 
                ? 'Your submission is being reviewed by your instructor. Results will be available once grading is complete.'
                : 'Your submission has been graded but is awaiting finalization. Results will be available soon.'
              }
            </p>
          </div>
        )}

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
