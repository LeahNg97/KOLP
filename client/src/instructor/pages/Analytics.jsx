import React, { useEffect, useState } from 'react';
import './Analytics.css';
import axios from 'axios';

export default function InstructorAnalytics() {
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalSubmissions: 0,
    averageScore: 0,
    passRate: '0%',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        // Fetch all quizzes created by this instructor
        const quizzesRes = await axios.get('http://localhost:8080/api/quizzes/instructor', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const quizzes = quizzesRes.data || [];
        let totalSubmissions = 0;
        let totalScore = 0;
        let totalQuestions = 0;
        let passCount = 0;
        let submissionCount = 0;

        // For each quiz, fetch its submissions
        for (const quiz of quizzes) {
          const submissionsRes = await axios.get(`http://localhost:8080/api/quizzes/${quiz._id}/submissions`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const submissions = submissionsRes.data || [];
          totalSubmissions += submissions.length;
          // Calculate stats
          for (const sub of submissions) {
            let quizSet = null;
            let numQuestions = 0;
            if (quiz.quizSets && quiz.quizSets.length > 0 && sub.quizSetId) {
              quizSet = quiz.quizSets.find(set => set._id?.toString() === sub.quizSetId);
              numQuestions = quizSet ? (quizSet.questions?.length || 0) : 0;
            } else if (quiz.questions && quiz.questions.length > 0) {
              numQuestions = quiz.questions.length;
            }
            if (numQuestions === 0) numQuestions = 1;
            totalScore += sub.score;
            totalQuestions += numQuestions;
            submissionCount++;
            const percent = (sub.score / numQuestions) * 100;
            if (percent >= 60) passCount++;
          }
        }
        setStats({
          totalQuizzes: quizzes.length,
          totalSubmissions,
          averageScore: submissionCount > 0 ? (totalScore / submissionCount).toFixed(2) : 0,
          passRate: submissionCount > 0 ? `${Math.round((passCount / submissionCount) * 100)}%` : '0%',
        });
      } catch (err) {
        setError('Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="instructor-layout">
      <main className="instructor-main">
        <div className="analytics-page">
          <h1>📈 Instructor Analytics</h1>
          {loading ? (
            <div style={{padding: '40px', textAlign: 'center'}}>Loading analytics...</div>
          ) : error ? (
            <div style={{color: 'red', padding: '20px'}}>{error}</div>
          ) : (
            <>
              <div className="analytics-cards">
                <div className="analytics-card">
                  <div className="card-title">Total Quizzes</div>
                  <div className="card-value">{stats.totalQuizzes}</div>
                </div>
                <div className="analytics-card">
                  <div className="card-title">Total Submissions</div>
                  <div className="card-value">{stats.totalSubmissions}</div>
                </div>
                <div className="analytics-card">
                  <div className="card-title">Average Score</div>
                  <div className="card-value">{stats.averageScore}</div>
                </div>
                <div className="analytics-card">
                  <div className="card-title">Pass Rate</div>
                  <div className="card-value">{stats.passRate}</div>
                </div>
              </div>
              <div className="analytics-section">
                <h2>Performance Trends (Coming Soon)</h2>
                <div className="analytics-chart-placeholder">
                  {/* Chart.js or Recharts can be integrated here */}
                  <p>Charts and deeper analytics will appear here.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
} 