import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { fetchActiveCourses } from '../api/courseApi';
import './StudentDashboard.css';
import CourseCard from '../components/CourseCard';
import Footer from '../../components/Footer';

const COURSES_PER_PAGE = 12;

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // useEffect(() => {
  //   const fetchCourses = async () => {
  //     setLoading(true);
  //     setError('');
  //     try {
  //       const token = localStorage.getItem('token');
  //       const res = await axios.get('http://localhost:8080/api/courses/active', {
  //         headers: {
  //           Authorization: `Bearer ${token}`
  //         }
  //       });
  //       setCourses(res.data);
  //     } catch (err) {
  //       setError(err.response?.data?.message || 'Failed to load courses.');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchCourses();
  // }, []);
  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        
       
        
        const data = await fetchActiveCourses(token);
        setCourses(data);
      } catch (err) {
        console.error('Error loading courses:', err);
        setError(err.response?.data?.message || 'Failed to load courses.');
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, []);

  // Filter courses by search
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
  const paginatedCourses = filteredCourses.slice(
    (page - 1) * COURSES_PER_PAGE,
    page * COURSES_PER_PAGE
  );



  return (
    <div className="student-dashboard">
      <h1>Available Courses</h1>
      <div className="student-search-bar">
        <input
          type="text"
          placeholder="Search available courses by title..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="student-search-input"
        />
      </div>
      {loading ? (
        <div className="student-loading">Loading courses...</div>
      ) : error ? (
        <div className="student-error">{error}</div>
      ) : (
        <>
          <div className="student-courses-grid">
            {paginatedCourses.map(course => (
              <CourseCard
                key={course._id}
                course={course}
                onClick={() => navigate(`/student/courses/${course._id}`)}
              />
            ))}
          </div>
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="student-pagination">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="student-pagination-btn"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`student-pagination-btn${page === i + 1 ? ' active' : ''}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="student-pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      <Footer />
    </div>
  );
}
  