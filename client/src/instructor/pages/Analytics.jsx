import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Analytics.css';

// Simple SEO component if react-helmet is not available
const SEOHead = ({ title, description, keywords }) => {
  useEffect(() => {
    document.title = title;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', description);
      document.head.appendChild(metaDescription);
    }

    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    } else {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      metaKeywords.setAttribute('content', keywords);
      document.head.appendChild(metaKeywords);
    }

    // Cleanup on unmount
    return () => {
      document.title = 'KOLP Learning Platform';
    };
  }, [title, description, keywords]);

  return null;
};

export default function Analytics() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    completedCourses: 0,
    totalQuizzes: 0,
    totalSubmissions: 0,
    averageScore: 0,
    passRate: '0%',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to view analytics');
        return;
      }

      // Fetch detailed instructor analytics
      const analyticsRes = await axios.get('http://localhost:8080/api/dashboard/instructor/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (analyticsRes.data?.success) {
        setStats(analyticsRes.data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to access this page.');
      } else {
        setError('Failed to load analytics data. Please try again later.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  return (
    <>
      <SEOHead 
        title="Teaching Analytics - KOLP Learning Platform"
        description="View detailed analytics about your courses, students and quiz results on KOLP learning platform"
        keywords="teaching analytics, course analytics, student performance, quiz results, learning platform"
      />
      
      <div className="instructor-layout">
        <main className="instructor-main">
          <div className="analytics-page">
            <header className="analytics-header">
              <div className="header-content">
                <h1 className="analytics-title">
                  <span className="title-icon">📊</span>
                  Teaching Analytics
                </h1>
                <p className="analytics-subtitle">
                  Track course performance and student learning outcomes
                </p>
              </div>
              <button 
                className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
                onClick={handleRefresh}
                disabled={loading || refreshing}
                aria-label="Refresh data"
              >
                <span className="refresh-icon">🔄</span>
                {refreshing ? 'Loading...' : 'Refresh'}
              </button>
            </header>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading analytics data...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <div className="error-icon">⚠️</div>
                <h3 className="error-title">Failed to load data</h3>
                <p className="error-message">{error}</p>
                <button className="retry-btn" onClick={handleRefresh}>
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <section className="analytics-overview" aria-label="Overview statistics">
                  <h2 className="section-title">Overview</h2>
                  <div className="analytics-cards">
                    <article className="analytics-card courses-card">
                      <div className="card-icon">📚</div>
                      <div className="card-content">
                        <h3 className="card-title">Total Courses</h3>
                        <div className="card-value">{stats.totalCourses}</div>
                        <p className="card-description">Courses created</p>
                      </div>
                    </article>

                    <article className="analytics-card students-card">
                      <div className="card-icon">👥</div>
                      <div className="card-content">
                        <h3 className="card-title">Students</h3>
                        <div className="card-value">{stats.totalStudents}</div>
                        <p className="card-description">Total students</p>
                      </div>
                    </article>

                    <article className="analytics-card enrollments-card">
                      <div className="card-icon">📝</div>
                      <div className="card-content">
                        <h3 className="card-title">Enrollments</h3>
                        <div className="card-value">{stats.totalEnrollments}</div>
                        <p className="card-description">Total enrollments</p>
                      </div>
                    </article>

                    <article className="analytics-card completed-card">
                      <div className="card-icon">✅</div>
                      <div className="card-content">
                        <h3 className="card-title">Completed</h3>
                        <div className="card-value">{stats.completedCourses}</div>
                        <p className="card-description">Courses completed</p>
                      </div>
                    </article>
                  </div>
                </section>

                <section className="analytics-quiz" aria-label="Quiz statistics">
                  <h2 className="section-title">Quiz Statistics</h2>
                  <div className="analytics-cards">
                    <article className="analytics-card quizzes-card">
                      <div className="card-icon">❓</div>
                      <div className="card-content">
                        <h3 className="card-title">Total Quizzes</h3>
                        <div className="card-value">{stats.totalQuizzes}</div>
                        <p className="card-description">Quizzes created</p>
                      </div>
                    </article>

                    <article className="analytics-card submissions-card">
                      <div className="card-icon">📊</div>
                      <div className="card-content">
                        <h3 className="card-title">Submissions</h3>
                        <div className="card-value">{stats.totalSubmissions}</div>
                        <p className="card-description">Total quiz attempts</p>
                      </div>
                    </article>

                    <article className="analytics-card score-card">
                      <div className="card-icon">🎯</div>
                      <div className="card-content">
                        <h3 className="card-title">Average Score</h3>
                        <div className="card-value">{stats.averageScore}</div>
                        <p className="card-description">Student average score</p>
                      </div>
                    </article>

                    <article className="analytics-card pass-rate-card">
                      <div className="card-icon">🏆</div>
                      <div className="card-content">
                        <h3 className="card-title">Pass Rate</h3>
                        <div className="card-value">{stats.passRate}</div>
                        <p className="card-description">Students meeting requirements</p>
                      </div>
                    </article>
                  </div>
                </section>

                <section className="analytics-insights" aria-label="Detailed insights">
                  <h2 className="section-title">Detailed Insights</h2>
                  <div className="insights-grid">
                    <div className="insight-card">
                      <h3 className="insight-title">Course Performance</h3>
                      <div className="insight-content">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${stats.totalCourses > 0 ? (stats.completedCourses / stats.totalCourses) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <p className="progress-text">
                          {stats.totalCourses > 0 
                            ? `${Math.round((stats.completedCourses / stats.totalCourses) * 100)}% students completed courses`
                            : 'No data available'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="insight-card">
                      <h3 className="insight-title">Quiz Engagement</h3>
                      <div className="insight-content">
                        <div className="metric-row">
                          <span className="metric-label">Average attempts per quiz:</span>
                          <span className="metric-value">
                            {stats.totalQuizzes > 0 
                              ? Math.round(stats.totalSubmissions / stats.totalQuizzes) 
                              : 0
                            }
                          </span>
                        </div>
                        <div className="metric-row">
                          <span className="metric-label">Participation rate:</span>
                          <span className="metric-value">
                            {stats.totalStudents > 0 
                              ? `${Math.round((stats.totalSubmissions / stats.totalStudents) * 100)}%`
                              : '0%'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="analytics-charts" aria-label="Analytics charts">
                  <h2 className="section-title">Analytics Charts</h2>
                  <div className="chart-placeholder">
                    <div className="chart-icon">📈</div>
                    <h3 className="chart-title">Trend Charts</h3>
                    <p className="chart-description">
                      Detailed charts about learning trends and performance will be displayed here
                    </p>
                    <div className="chart-features">
                      <span className="feature-tag">📊 Score Charts</span>
                      <span className="feature-tag">📅 Time-based Trends</span>
                      <span className="feature-tag">🎯 Performance Analysis</span>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
} 