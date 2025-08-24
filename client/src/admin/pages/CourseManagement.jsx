import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminSidebar from '../components/AdminSidebar';
import './CourseManagement.css';

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCourseDetail, setShowCourseDetail] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:8080/api/courses');
      setCourses(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    setDeletingId(id);
    try {
      await axios.delete(`http://localhost:8080/api/courses/${id}`);
      setCourses(courses.filter(c => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete course.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = (id) => {
    // You can implement a modal or redirect to an edit page
    alert('Update course feature coming soon!');
  };

  const handleApprove = async (courseId) => {
    setApprovingId(courseId);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:8080/api/courses/${courseId}/admin-status`, 
        { status: 'active', adminNote: adminNote || 'Approved by admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCourses(); // Refresh the list
      setAdminNote('');
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve course.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (courseId) => {
    setRejectingId(courseId);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:8080/api/courses/${courseId}/admin-status`, 
        { status: 'inactive', adminNote: adminNote || 'Rejected by admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCourses(); // Refresh the list
      setAdminNote('');
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject course.');
    } finally {
      setRejectingId(null);
    }
  };

  const openApprovalModal = (course) => {
    setSelectedCourse(course);
    setAdminNote('');
    setShowModal(true);
  };

  const openCourseDetail = (course) => {
    setSelectedCourse(course);
    setShowCourseDetail(true);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(search.toLowerCase()) ||
                         course.description?.toLowerCase().includes(search.toLowerCase()) ||
                         course.instructorId?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'pending': return 'status-pending';
      case 'inactive': return 'status-inactive';
      case 'draft': return 'status-draft';
      default: return 'status-unknown';
    }
  };

  const getStatusBadgeText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'pending': return 'Pending Review';
      case 'inactive': return 'Inactive';
      case 'draft': return 'Draft';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-main">
          <div className="loading">Loading courses...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="course-management">
          <div className="page-header">
            <h1>Course Management</h1>
            <p>Manage and review all courses in the system</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="controls">
            <div className="search-filter">
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="courses-table-container">
            <table className="courses-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Instructor</th>
                  <th>Level</th>
                  <th>Price</th>
                  <th>Content</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map(course => (
                  <tr key={course._id}>
                    <td className="course-info">
                      <div className="course-title">
                        {course.thumbnailUrl && (
                          <img 
                            src={course.thumbnailUrl} 
                            alt={course.title} 
                            className="course-thumbnail"
                          />
                        )}
                        <div>
                          <h4>{course.title}</h4>
                          {course.subtitle && <p className="course-subtitle">{course.subtitle}</p>}
                          <p className="course-description">{course.description}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {course.instructorId?.name || 'Unknown'}
                      <br />
                      <small>{course.instructorId?.email}</small>
                    </td>
                    <td>
                      <span className={`level-badge level-${course.level}`}>
                        {course.level}
                      </span>
                    </td>
                    <td>
                      <div className="price-info">
                        {course.priceType === 'free' ? (
                          <span className="price-free">Free</span>
                        ) : (
                          <>
                            <span className="price-paid">${course.price} AUD</span>
                            {course.salePrice && course.salePrice < course.price && (
                              <span className="price-sale">${course.salePrice} AUD</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="content-stats">
                        <span className="stat-item">
                          <strong>{course.stats?.totalLessons || 0}</strong> lessons
                        </span>
                        <span className="stat-item">
                          <strong>{Math.floor((course.stats?.totalDurationSec || 0) / 60)}</strong> min
                        </span>
                        <span className="stat-item">
                          <strong>{course.sections?.length || 0}</strong> sections
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(course.status)}`}>
                        {getStatusBadgeText(course.status)}
                      </span>
                      {course.isPublished && (
                        <span className="published-badge">Published</span>
                      )}
                    </td>
                    <td className="actions">
                      <button
                        onClick={() => openCourseDetail(course)}
                        className="action-btn view-btn"
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleUpdate(course._id)}
                        className="action-btn edit-btn"
                        title="Edit Course"
                      >
                        ✏️
                      </button>
                      {course.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openApprovalModal(course)}
                            className="action-btn approve-btn"
                            title="Approve Course"
                          >
                            ✅
                          </button>
                          <button
                            onClick={() => openApprovalModal(course)}
                            className="action-btn reject-btn"
                            title="Reject Course"
                          >
                            ❌
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(course._id)}
                        className="action-btn delete-btn"
                        title="Delete Course"
                        disabled={deletingId === course._id}
                      >
                        {deletingId === course._id ? '🗑️...' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCourses.length === 0 && (
              <div className="no-courses">
                <p>No courses found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Approval Modal */}
        {showModal && selectedCourse && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Review Course: {selectedCourse.title}</h3>
                <button onClick={() => setShowModal(false)} className="close-btn">✕</button>
              </div>
              <div className="modal-body">
                <div className="course-review">
                  <div className="course-summary">
                    <p><strong>Instructor:</strong> {selectedCourse.instructorId?.name}</p>
                    <p><strong>Level:</strong> {selectedCourse.level}</p>
                    <p><strong>Price:</strong> {selectedCourse.priceType === 'free' ? 'Free' : `$${selectedCourse.price} AUD`}</p>
                    <p><strong>Content:</strong> {selectedCourse.stats?.totalLessons || 0} lessons, {Math.floor((selectedCourse.stats?.totalDurationSec || 0) / 60)} minutes</p>
                  </div>
                  
                  <div className="admin-notes">
                    <label htmlFor="adminNote">Admin Notes:</label>
                    <textarea
                      id="adminNote"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add notes about this course..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedCourse._id)}
                  className="reject-btn"
                  disabled={rejectingId === selectedCourse._id}
                >
                  {rejectingId === selectedCourse._id ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleApprove(selectedCourse._id)}
                  className="approve-btn"
                  disabled={approvingId === selectedCourse._id}
                >
                  {approvingId === selectedCourse._id ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Course Detail Modal */}
        {showCourseDetail && selectedCourse && (
          <div className="modal-overlay">
            <div className="modal large-modal">
              <div className="modal-header">
                <h3>Course Details: {selectedCourse.title}</h3>
                <button onClick={() => setShowCourseDetail(false)} className="close-btn">✕</button>
              </div>
              <div className="modal-body">
                <div className="course-detail-view">
                  <div className="course-header">
                    {selectedCourse.thumbnailUrl && (
                      <img src={selectedCourse.thumbnailUrl} alt={selectedCourse.title} className="course-thumbnail-large" />
                    )}
                    <div className="course-info">
                      <h4>{selectedCourse.title}</h4>
                      {selectedCourse.subtitle && <p className="subtitle">{selectedCourse.subtitle}</p>}
                      <p className="description">{selectedCourse.description}</p>
                      
                      <div className="course-meta">
                        <span className="level-badge level-{selectedCourse.level}">{selectedCourse.level}</span>
                        <span className="price-badge">
                          {selectedCourse.priceType === 'free' ? 'Free' : `$${selectedCourse.price} AUD`}
                        </span>
                        <span className="status-badge {getStatusBadgeClass(selectedCourse.status)}">
                          {getStatusBadgeText(selectedCourse.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="course-stats">
                    <h5>Course Statistics</h5>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-number">{selectedCourse.stats?.totalLessons || 0}</span>
                        <span className="stat-label">Total Lessons</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{Math.floor((selectedCourse.stats?.totalDurationSec || 0) / 60)}</span>
                        <span className="stat-label">Total Minutes</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{selectedCourse.stats?.studentCount || 0}</span>
                        <span className="stat-label">Students Enrolled</span>
                      </div>
                      {selectedCourse.stats?.ratingCount > 0 && (
                        <div className="stat-item">
                          <span className="stat-number">{selectedCourse.stats.ratingAvg?.toFixed(1) || 0}</span>
                          <span className="stat-label">Average Rating</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedCourse.introductionAssets && selectedCourse.introductionAssets.length > 0 && (
                    <div className="course-introduction">
                      <h5>Introduction Content</h5>
                      <div className="introduction-list">
                        {selectedCourse.introductionAssets.map((content, index) => (
                          <div key={index} className="intro-item">
                            <span className="content-type">{content.kind}</span>
                            <h6>{content.title || `Content ${index + 1}`}</h6>
                            {content.description && <p>{content.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCourse.sections && selectedCourse.sections.length > 0 && (
                    <div className="course-sections">
                      <h5>Course Sections ({selectedCourse.sections.length})</h5>
                      <div className="sections-list">
                        {selectedCourse.sections.map((section, sectionIndex) => (
                          <div key={sectionIndex} className="section-item">
                            <h6>Section {section.order}: {section.title}</h6>
                            {section.description && <p>{section.description}</p>}
                            
                            {section.lessons && section.lessons.length > 0 && (
                              <div className="lessons-list">
                                {section.lessons.map((lesson, lessonIndex) => (
                                  <div key={lessonIndex} className="lesson-item">
                                    <span className="lesson-title">Lesson {lesson.order}: {lesson.title}</span>
                                    <span className="lesson-type">{lesson.contentType}</span>
                                    {lesson.durationSec > 0 && (
                                      <span className="lesson-duration">
                                        {Math.floor(lesson.durationSec / 60)}m {lesson.durationSec % 60}s
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCourse.adminNote && (
                    <div className="admin-notes-display">
                      <h5>Admin Notes</h5>
                      <p>{selectedCourse.adminNote}</p>
                      {selectedCourse.reviewedAt && (
                        <small>Reviewed on: {new Date(selectedCourse.reviewedAt).toLocaleDateString()}</small>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 