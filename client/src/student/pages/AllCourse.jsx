import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AllCourses.css';
import Footer from '../../components/Footer';


export default function AllCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollingId, setEnrollingId] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/courses/active', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setCourses(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load courses.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);


  const handleEnroll = async (courseId) => {
    setEnrollingId(courseId);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/enrollments', { courseId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Show success message or redirect
      alert('Successfully enrolled in the course!');
      navigate('/student/my-courses');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll in course.');
    } finally {
      setEnrollingId(null);
    }
  };


  const handleViewCourse = (courseId) => {
    navigate(`/student/courses/${courseId}`);
  };


  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { text: 'Active', class: 'status-active' },
      pending: { text: 'Pending', class: 'status-pending' }
    };
   
    const config = statusConfig[status] || { text: status, class: 'status-pending' };
    return <span className={`course-status ${config.class}`}>{config.text}</span>;
  };


  return (
    <div className="all-courses-page">
      <div className="all-courses-header">
        <h1>Available Course</h1>
        <p>Explore and enroll in courses to start your learning journey</p>
      </div>


      <div className="all-courses-search">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search courses by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>


      {loading ? (
        <div className="all-courses-loading">Loading courses...</div>
      ) : error ? (
        <div className="all-courses-error">{error}</div>
      ) : filteredCourses.length === 0 ? (
        <div className="no-courses">
          <div className="no-courses-icon">📚</div>
          <h3>No courses found</h3>
          <p>
            {searchTerm ? 'No courses match your search criteria.' : 'No available courses to enroll at the moment.'}
          </p>
        </div>
      ) : (
        <div className="all-courses-grid">
          {filteredCourses.map(course => (
            <div key={course._id} className="course-card">
              <div className="course-header">
                <h3 className="course-title">{course.title}</h3>
                <p className="course-description">
                  {course.description || 'No description available'}
                </p>
              </div>
             
              <div className="course-meta">
                <div className="course-instructor">
                  <div className="instructor-avatar">
                    {course.instructorId?.name?.charAt(0).toUpperCase() || 'I'}
                  </div>
                  <span>{course.instructorId?.name || 'Unknown Instructor'}</span>
                </div>
                {getStatusBadge(course.status)}
              </div>


              <div className="course-actions">
                <button
                  className="action-btn secondary-btn"
                  onClick={() => handleViewCourse(course._id)}
                >
                  View Details
                </button>
                <button
                  className="action-btn primary-btn"
                  onClick={() => handleEnroll(course._id)}
                  disabled={enrollingId === course._id}
                >
                  {enrollingId === course._id ? 'Enrolling...' : 'Enroll Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Footer />
    </div>
  );
}



