import { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import AdminSidebar from '../components/AdminSidebar';
import './AdminDashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeFilter, setTimeFilter] = useState('weekly'); // weekly, monthly, yearly

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('http://localhost:8080/api/dashboard/admin');
        setStats(res.data);
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load dashboard stats.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getTimeFilterData = () => {
    if (!stats) return {};
    
    switch (timeFilter) {
      case 'weekly':
        return stats.weekly;
      case 'monthly':
        return stats.monthly;
      case 'yearly':
        return stats.yearly;
      default:
        return stats.weekly;
    }
  };

  const pieChartData = {
    labels: ['Students', 'Instructors', 'Courses'],
    datasets: [
      {
        data: [
          getTimeFilterData().students || 0,
          getTimeFilterData().instructors || 0,
          getTimeFilterData().courses || 0,
        ],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
        ],
        borderColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
        ],
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: `${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} Statistics`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
  };

  const lineChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'New Users',
        data: [12, 19, 15, 25],
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
      },
      {
        label: 'New Courses',
        data: [5, 8, 12, 10],
        borderColor: '#764ba2',
        backgroundColor: 'rgba(118, 75, 162, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Growth Trends',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-main">
          <div className="dashboard-loading">Loading dashboard...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-main">
          <div className="dashboard-error">{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="dashboard-header">
          <h1 className="admin-dashboard-title">Admin Dashboard</h1>
          <div className="time-filter">
            <button 
              className={`filter-btn ${timeFilter === 'weekly' ? 'active' : ''}`}
              onClick={() => setTimeFilter('weekly')}
            >
              Week
            </button>
            <button 
              className={`filter-btn ${timeFilter === 'monthly' ? 'active' : ''}`}
              onClick={() => setTimeFilter('monthly')}
            >
              Month
            </button>
            <button 
              className={`filter-btn ${timeFilter === 'yearly' ? 'active' : ''}`}
              onClick={() => setTimeFilter('yearly')}
            >
              Year
            </button>
          </div>
        </div>

        {/* Top 4 Cards */}
        <div className="stats-cards">
          <div className="stat-card students">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.totalStudents || 0}</div>
              <div className="stat-label">Students</div>
              <div className="stat-trend">
                <span className="trend-value">+{getTimeFilterData().students || 0}</span>
                <span className="trend-period">this {timeFilter.slice(0, -2)}</span>
              </div>
            </div>
          </div>

          <div className="stat-card instructors">
            <div className="stat-icon">👨‍🏫</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.totalInstructors || 0}</div>
              <div className="stat-label">Instructors</div>
              <div className="stat-trend">
                <span className="trend-value">+{getTimeFilterData().instructors || 0}</span>
                <span className="trend-period">this {timeFilter.slice(0, -2)}</span>
              </div>
            </div>
          </div>

          <div className="stat-card courses">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.totalCourses || 0}</div>
              <div className="stat-label">Courses</div>
              <div className="stat-trend">
                <span className="trend-value">+{getTimeFilterData().courses || 0}</span>
                <span className="trend-period">this {timeFilter.slice(0, -2)}</span>
              </div>
            </div>
          </div>

          <div className="stat-card certificates">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.totalCertificates || 0}</div>
              <div className="stat-label">Certificates</div>
              <div className="stat-trend">
                <span className="trend-value">+{getTimeFilterData().certificates || 0}</span>
                <span className="trend-period">this {timeFilter.slice(0, -2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-container">
            <div className="pie-chart">
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </div>
          
          <div className="chart-container">
            <div className="line-chart">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
