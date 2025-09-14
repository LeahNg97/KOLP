import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ShortQuestionGradeForm.css';
import { shortQuestionApi } from '../api/shortQuestionApi';

export default function ShortQuestionGradeForm() {
  const { courseId, progressId } = useParams();
  const navigate = useNavigate();
  
  const [submission, setSubmission] = useState(null);
  const [gradingData, setGradingData] = useState({
    gradedAnswers: [],
    overallFeedback: '',
    instructorNotes: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSubmission();
  }, [progressId]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await shortQuestionApi.getShortQuestionProgressForGrading(progressId);
      setSubmission(response.data);
      
      // Initialize grading data
      const initialGradingData = {
        gradedAnswers: response.data.answers.map(answer => ({
          questionIndex: answer.questionIndex,
          points: answer.points || 0,
          isCorrect: answer.isCorrect || false,
          feedback: answer.feedback || ''
        })),
        overallFeedback: response.data.overallFeedback || '',
        instructorNotes: response.data.instructorNotes || ''
      };
      setGradingData(initialGradingData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerGradeChange = (questionIndex, field, value) => {
    setGradingData(prev => ({
      ...prev,
      gradedAnswers: prev.gradedAnswers.map(answer => 
        answer.questionIndex === questionIndex 
          ? { ...answer, [field]: value }
          : answer
      )
    }));
  };

  const handleOverallFeedbackChange = (field, value) => {
    setGradingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotalScore = () => {
    return gradingData.gradedAnswers.reduce((sum, answer) => sum + (answer.points || 0), 0);
  };

  const calculateTotalMaxPoints = () => {
    return gradingData.gradedAnswers.reduce((sum, answer) => {
      const originalAnswer = submission.answers.find(a => a.questionIndex === answer.questionIndex);
      return sum + (originalAnswer?.maxPoints || 0);
    }, 0);
  };

  const calculatePercentage = () => {
    const total = calculateTotalScore();
    const maxTotal = calculateTotalMaxPoints();
    return maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
  };

  const handleSaveGrading = async (finalize = false) => {
    try {
      setSaving(true);
      setError('');
      
      const gradingPayload = {
        ...gradingData,
        finalize
      };

      await shortQuestionApi.gradeShortQuestion(progressId, gradingPayload);
      
      setSuccess(finalize ? 'Grading completed and finalized!' : 'Grading saved successfully!');
      
      if (finalize) {
        setTimeout(() => {
          navigate(`/instructor/courses/${courseId}/short-question/grading`);
        }, 2000);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grade-form-container">
        <div className="loading">Loading submission for grading...</div>
      </div>
    );
  }

  if (error && !submission) {
    return (
      <div className="grade-form-container">
        <div className="error">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchSubmission} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  const totalScore = calculateTotalScore();
  const totalMaxPoints = calculateTotalMaxPoints();
  const percentage = calculatePercentage();
  const passingScore = submission.shortQuestionId.passingScore || 70;

  return (
    <div className="grade-form-container">
      <div className="grade-form-header">
        <h2>📝 Grade Short Question Submission</h2>
        <div className="submission-info">
          <div className="student-info">
            <h3>👤 {submission.studentId.firstName} {submission.studentId.lastName}</h3>
            <p>{submission.studentId.email}</p>
          </div>
          <div className="quiz-info">
            <h4>📋 {submission.shortQuestionId.title}</h4>
            <p>Submitted: {new Date(submission.submittedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          ✅ {success}
        </div>
      )}

      <div className="grading-summary">
        <div className="score-display">
          <div className="score-item">
            <span className="score-label">Current Score:</span>
            <span className="score-value">{totalScore}/{totalMaxPoints}</span>
          </div>
          <div className="score-item">
            <span className="score-label">Percentage:</span>
            <span className={`score-value ${percentage >= passingScore ? 'pass' : 'fail'}`}>
              {percentage}%
            </span>
          </div>
          <div className="score-item">
            <span className="score-label">Status:</span>
            <span className={`score-value ${percentage >= passingScore ? 'pass' : 'fail'}`}>
              {percentage >= passingScore ? '✅ Pass' : '❌ Fail'}
            </span>
          </div>
        </div>
      </div>

      <div className="questions-grading">
        <h3>📝 Question Grading</h3>
        {submission.answers.map((answer, index) => {
          const question = submission.shortQuestionId.questions[answer.questionIndex];
          const gradedAnswer = gradingData.gradedAnswers.find(ga => ga.questionIndex === answer.questionIndex);
          
          return (
            <div key={answer.questionIndex} className="question-grade-card">
              <div className="question-header">
                <h4>Question {answer.questionIndex + 1}</h4>
                <div className="question-meta">
                  <span>Max Points: {answer.maxPoints}</span>
                </div>
              </div>
              
              <div className="question-content">
                <div className="question-text">
                  <label>Question:</label>
                  <p>{question.question}</p>
                </div>
                
                <div className="student-answer">
                  <label>Student's Answer:</label>
                  <div className="answer-text">{answer.studentAnswer}</div>
                </div>
                
                <div className="correct-answer">
                  <label>Correct Answer:</label>
                  <div className="answer-text correct">{question.correctAnswer}</div>
                </div>
                
                <div className="grading-controls">
                  <div className="points-input">
                    <label htmlFor={`points-${answer.questionIndex}`}>
                      Points ({answer.maxPoints} max):
                    </label>
                    <input
                      type="number"
                      id={`points-${answer.questionIndex}`}
                      min="0"
                      max={answer.maxPoints}
                      value={gradedAnswer?.points || 0}
                      onChange={(e) => handleAnswerGradeChange(answer.questionIndex, 'points', parseInt(e.target.value) || 0)}
                      className="points-field"
                    />
                  </div>
                  
                  <div className="correct-checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={gradedAnswer?.isCorrect || false}
                        onChange={(e) => handleAnswerGradeChange(answer.questionIndex, 'isCorrect', e.target.checked)}
                      />
                      Mark as Correct
                    </label>
                  </div>
                  
                  <div className="feedback-input">
                    <label htmlFor={`feedback-${answer.questionIndex}`}>Feedback:</label>
                    <textarea
                      id={`feedback-${answer.questionIndex}`}
                      value={gradedAnswer?.feedback || ''}
                      onChange={(e) => handleAnswerGradeChange(answer.questionIndex, 'feedback', e.target.value)}
                      placeholder="Provide feedback for this answer..."
                      rows={2}
                      className="feedback-field"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Results Summary - Show after grading */}
      {submission.status === 'graded' || submission.status === 'completed' ? (
        <div className="results-summary">
          <h3>📊 Grading Results</h3>
          <div className="results-card">
            <div className="results-header">
              <div className="score-display">
                <span className="score">{submission.score || 0}</span>
                <span className="separator">/</span>
                <span className="total">{submission.totalQuestions}</span>
                <span className="percentage">({submission.percentage || 0}%)</span>
              </div>
              <div className={`status ${submission.passed ? 'passed' : 'failed'}`}>
                {submission.passed ? '✅ Passed' : '❌ Failed'}
              </div>
            </div>
            
            <div className="results-details">
              <div className="detail-item">
                <span className="label">Student:</span>
                <span className="value">{submission.studentId.firstName} {submission.studentId.lastName}</span>
              </div>
              <div className="detail-item">
                <span className="label">Email:</span>
                <span className="value">{submission.studentId.email}</span>
              </div>
              <div className="detail-item">
                <span className="label">Submitted:</span>
                <span className="value">{new Date(submission.submittedAt).toLocaleString()}</span>
              </div>
              {submission.gradedAt && (
                <div className="detail-item">
                  <span className="label">Graded:</span>
                  <span className="value">{new Date(submission.gradedAt).toLocaleString()}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="label">Status:</span>
                <span className={`value status-${submission.status}`}>{submission.status}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overall-feedback">
        <h3>📝 Overall Feedback</h3>
        <div className="feedback-section">
          <label htmlFor="overall-feedback">Overall Feedback for Student:</label>
          <textarea
            id="overall-feedback"
            value={gradingData.overallFeedback}
            onChange={(e) => handleOverallFeedbackChange('overallFeedback', e.target.value)}
            placeholder="Provide overall feedback for the student..."
            rows={4}
            className="feedback-textarea"
          />
        </div>
        
        <div className="notes-section">
          <label htmlFor="instructor-notes">Instructor Notes (Private):</label>
          <textarea
            id="instructor-notes"
            value={gradingData.instructorNotes}
            onChange={(e) => handleOverallFeedbackChange('instructorNotes', e.target.value)}
            placeholder="Private notes for your reference..."
            rows={3}
            className="notes-textarea"
          />
        </div>
      </div>

      <div className="grading-actions">
        <button
          className="save-btn"
          onClick={() => handleSaveGrading(false)}
          disabled={saving}
        >
          {saving ? '💾 Saving...' : '💾 Save Draft'}
        </button>
        
        <button
          className="finalize-btn"
          onClick={() => handleSaveGrading(true)}
          disabled={saving}
        >
          {saving ? '✅ Finalizing...' : '✅ Finalize & Complete'}
        </button>
        
        <button
          className="back-btn"
          onClick={() => navigate(`/instructor/courses/${courseId}/short-question/grading`)}
        >
          🏠 Back to Grading List
        </button>
      </div>
    </div>
  );
}
