import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ShortQuestionGrading.css';
import { shortQuestionApi } from '../api/shortQuestionApi';

export default function ShortQuestionGrading() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [gradedSubmissions, setGradedSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'graded'

  useEffect(() => {
    fetchAllSubmissions();
  }, [courseId]);

  const fetchPendingSubmissions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching pending submissions for courseId:', courseId);
      const response = await shortQuestionApi.getPendingGradingShortQuestions(courseId);
      console.log('📊 Pending submissions response:', response);
      setPendingSubmissions(response.data || []);
    } catch (error) {
      console.error('❌ Error fetching pending submissions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGradedSubmissions = async () => {
    try {
      console.log('🔍 Fetching graded submissions for courseId:', courseId);
      const response = await shortQuestionApi.getShortQuestionResultsByCourseId(courseId);
      console.log('📊 Graded submissions response:', response);
      setGradedSubmissions(response.data || []);
    } catch (error) {
      console.error('❌ Error fetching graded submissions:', error);
    }
  };

  const fetchAllSubmissions = async () => {
    await Promise.all([
      fetchPendingSubmissions(),
      fetchGradedSubmissions()
    ]);
  };

  const handleGradeSubmission = (progressId) => {
    navigate(`/instructor/courses/${courseId}/short-question/grade/${progressId}`);
  };

  if (loading) {
    return (
      <div className="grading-container">
        <div className="loading">Loading pending submissions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grading-container">
        <div className="error">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchPendingSubmissions} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grading-container">
      <div className="grading-header">
        <h2>📝 Short Question Grading</h2>
        <p>Review and grade student submissions</p>
      </div>

      {/* Tabs */}
      <div className="grading-tabs">
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Pending ({pendingSubmissions.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'graded' ? 'active' : ''}`}
          onClick={() => setActiveTab('graded')}
        >
          ✅ Graded ({gradedSubmissions.length})
        </button>
      </div>

      {/* Pending Submissions Tab */}
      {activeTab === 'pending' && (
        <>
          {pendingSubmissions.length === 0 ? (
            <div className="no-submissions">
              <div className="no-submissions-icon">✅</div>
              <h3>No Pending Submissions</h3>
              <p>All short question submissions have been graded.</p>
            </div>
          ) : (
            <div className="submissions-list">
              <div className="submissions-header">
                <h3>Pending Submissions ({pendingSubmissions.length})</h3>
              </div>
              
              {pendingSubmissions.map((submission) => (
                <div key={submission._id} className="submission-card">
                  <div className="submission-info">
                    <div className="student-info">
                      <h4>
                        👤 {submission.studentId.firstName} {submission.studentId.lastName}
                      </h4>
                      <p className="student-email">{submission.studentId.email}</p>
                    </div>
                    
                    <div className="quiz-info">
                      <h5>📋 {submission.shortQuestionId.title}</h5>
                      <p>Questions: {submission.totalQuestions}</p>
                    </div>
                    
                    <div className="submission-meta">
                      <span className="submission-date">
                        📅 Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      </span>
                      <span className="submission-status">
                        ⏳ Status: {submission.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="submission-actions">
                    <button
                      className="grade-btn"
                      onClick={() => handleGradeSubmission(submission._id)}
                    >
                      📝 Grade Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Graded Submissions Tab */}
      {activeTab === 'graded' && (
        <>
          {gradedSubmissions.length === 0 ? (
            <div className="no-submissions">
              <div className="no-submissions-icon">📊</div>
              <h3>No Graded Submissions</h3>
              <p>No short question submissions have been graded yet.</p>
            </div>
          ) : (
            <div className="submissions-list">
              <div className="submissions-header">
                <h3>Graded Submissions ({gradedSubmissions.length})</h3>
              </div>
              
              {gradedSubmissions.map((submission) => (
                <div key={submission._id} className="submission-card graded">
                  <div className="submission-info">
                    <div className="student-info">
                      <h4>
                        👤 {submission.studentId.firstName} {submission.studentId.lastName}
                      </h4>
                      <p className="student-email">{submission.studentId.email}</p>
                    </div>
                    
                    <div className="quiz-info">
                      <h5>📋 {submission.shortQuestionId.title}</h5>
                      <p>Questions: {submission.totalQuestions}</p>
                    </div>
                    
                    <div className="submission-meta">
                      <span className="submission-date">
                        📅 Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      </span>
                      <span className="submission-status">
                        ✅ Status: {submission.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="submission-results">
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
                  
                  <div className="submission-actions">
                    <button
                      className="view-btn"
                      onClick={() => handleGradeSubmission(submission._id)}
                    >
                      👁️ View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="grading-actions">
        <button
          className="back-btn"
          onClick={() => navigate(`/instructor/courses/${courseId}/students`)}
        >
          🏠 Back to Course
        </button>
      </div>
    </div>
  );
}
