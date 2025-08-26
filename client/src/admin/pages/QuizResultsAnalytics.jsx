import { useEffect, useState } from 'react';
import axios from 'axios';
import './QuizResultsAnalytics.css';

export default function QuizResultsAnalytics() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError('');
      try {
        // Assume you have an endpoint for admin to get all quiz submissions
        const res = await axios.get('http://localhost:8080/api/quizzes/submissions');
        setSubmissions(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load quiz results.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  // Analytics
  const total = submissions.length;
  const avgScore = total ? (submissions.reduce((sum, s) => sum + (s.score || 0), 0) / total).toFixed(2) : 0;
  const best = total ? Math.max(...submissions.map(s => s.score || 0)) : 0;
  const worst = total ? Math.min(...submissions.map(s => s.score || 0)) : 0;

  return (
    <div className="admin-layout">
      <main className="admin-main">
        <h1>Quiz Results / Analytics</h1>
        <div className="quiz-analytics-bar">
          <div className="quiz-analytics-card">Total Submissions: <b>{total}</b></div>
          <div className="quiz-analytics-card">Average Score: <b>{avgScore}</b></div>
          <div className="quiz-analytics-card">Best Score: <b>{best}</b></div>
          <div className="quiz-analytics-card">Lowest Score: <b>{worst}</b></div>
        </div>
        {loading ? (
          <div className="quiz-loading">Loading quiz results...</div>
        ) : error ? (
          <div className="quiz-error">{error}</div>
        ) : (
          <div className="quiz-table-wrapper">
            <table className="quiz-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Quiz</th>
                  <th>Course</th>
                  <th>Score</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr key={sub._id}>
                    <td>{sub.studentId?.name || sub.studentId?.email || 'N/A'}</td>
                    <td>{sub.quizId?.questions?.length ? `${sub.quizId.questions.length} Qs` : 'N/A'}</td>
                    <td>{sub.quizId?.courseId?.title || 'N/A'}</td>
                    <td>{sub.score}</td>
                    <td>{new Date(sub.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
} 