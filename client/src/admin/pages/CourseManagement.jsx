import { useEffect, useState } from 'react';
import axios from 'axios';
import './CourseManagement.css';

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPublished, setFilterPublished] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
    setSuccessMessage(''); // Clear any previous success message
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
    setSuccessMessage(''); // Clear any previous success message
    setError(''); // Clear any previous errors
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
    setSuccessMessage(''); // Clear any previous success message
    setError(''); // Clear any previous errors
    alert('Update course feature coming soon!');
  };

  const handleApprove = async (courseId) => {
    setApprovingId(courseId);
    setSuccessMessage(''); // Clear any previous success message
    setError(''); // Clear any previous errors
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:8080/api/courses/${courseId}/admin-status`, 
        { 
          status: 'active', 
          isPublished: true,
          adminNote: adminNote || 'Approved by admin' 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCourses(); // Refresh the list
      setAdminNote('');
      setShowModal(false);
      // Show success message
      setError(''); // Clear any previous errors
      setSuccessMessage('Course approved successfully! The course is now published and visible to students.');
      setTimeout(() => setSuccessMessage(''), 5000); // Auto-hide after 5 seconds
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve course.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (courseId) => {
    setRejectingId(courseId);
    setSuccessMessage(''); // Clear any previous success message
    setError(''); // Clear any previous errors
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:8080/api/courses/${courseId}/admin-status`, 
        { 
          status: 'inactive', 
          isPublished: false,
          adminNote: adminNote || 'Rejected by admin' 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCourses(); // Refresh the list
      setAdminNote('');
      setShowModal(false);
      // Show success message
      setError(''); // Clear any previous errors
      setSuccessMessage('Course rejected successfully! The course is now unpublished and hidden from students.');
      setTimeout(() => setSuccessMessage(''), 5000); // Auto-hide after 5 seconds
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
    setSuccessMessage(''); // Clear any previous success message
    setError(''); // Clear any previous errors
  };

  const openCourseDetail = (course) => {
    setSelectedCourse(course);
    setShowCourseDetail(true);
    setSuccessMessage(''); // Clear any previous success message
    setError(''); // Clear any previous errors
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(search.toLowerCase()) ||
                         course.description?.toLowerCase().includes(search.toLowerCase()) ||
                         course.instructorId?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    const matchesPublished = filterPublished === 'all' || course.isPublished === (filterPublished === 'true');
    
    return matchesSearch && matchesStatus && matchesPublished;
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
        <main className="admin-main">
          <div className="loading">Loading courses...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
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

          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}

          <div className="controls">
            <div className="search-filter">
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSuccessMessage(''); // Clear success message when searching
                  setError(''); // Clear any previous errors
                }}
                className="search-input"
              />
              
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setSuccessMessage(''); // Clear success message when filtering
                  setError(''); // Clear any previous errors
                }}
                className="filter-select"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>

              <select
                value={filterPublished}
                onChange={(e) => {
                  setFilterPublished(e.target.value);
                  setSuccessMessage(''); // Clear success message when filtering
                  setError(''); // Clear any previous errors
                }}
                className="filter-select"
              >
                <option value="all">All Published</option>
                <option value="true">Published</option>
                <option value="false">Not Published</option>
              </select>
            </div>

            <div className="course-summary-stats">
              <div className="stat-item">
                <span className="stat-number">{courses.filter(c => c.status === 'active').length}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{courses.filter(c => c.status === 'pending').length}</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{courses.filter(c => c.isPublished).length}</span>
                <span className="stat-label">Published</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{courses.filter(c => !c.isPublished).length}</span>
                <span className="stat-label">Not Published</span>
              </div>
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
                  <th>Admin Notes</th>
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
                      <div className="status-info">
                        <span className={`status-badge ${getStatusBadgeClass(course.status)}`}>
                          {getStatusBadgeText(course.status)}
                        </span>
                        {course.isPublished && (
                          <span className="published-badge">Published</span>
                        )}
                        {course.publishedAt && (
                          <small className="publish-date">
                            {new Date(course.publishedAt).toLocaleDateString()}
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      {course.adminNote ? (
                        <div className="admin-notes-display">
                          <p>{course.adminNote}</p>
                          {course.publishedAt && (
                            <small>Published on: {new Date(course.publishedAt).toLocaleDateString()}</small>
                          )}
                          {course.reviewedAt && (
                            <small>Reviewed on: {new Date(course.reviewedAt).toLocaleDateString()}</small>
                          )}
                          {course.reviewedBy && (
                            <small>by {course.reviewedBy.name}</small>
                          )}
                        </div>
                      ) : (
                        <span className="no-notes">No notes</span>
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
                      {/* Show approve/reject buttons for all courses except deleted ones */}
                      {course.status !== 'deleted' && (
                        <>
                          {course.status !== 'active' && (
                            <button
                              onClick={() => openApprovalModal(course)}
                              className="action-btn approve-btn"
                              title="Approve Course"
                            >
                              ✅
                            </button>
                          )}
                          {course.status !== 'inactive' && (
                            <button
                              onClick={() => openApprovalModal(course)}
                              className="action-btn reject-btn"
                              title="Reject Course"
                            >
                              ❌
                            </button>
                          )}
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
                <button onClick={() => {
                  setShowModal(false);
                  setSuccessMessage(''); // Clear success message when closing modal
                  setError(''); // Clear any previous errors
                }} className="close-btn">✕</button>
              </div>
              <div className="modal-subheader">
                <p><strong>Current Status:</strong> {getStatusBadgeText(selectedCourse.status)}</p>
                <p><strong>Published:</strong> {selectedCourse.isPublished ? 'Yes' : 'No'}</p>
                {selectedCourse.publishedAt && (
                  <p><strong>Published At:</strong> {new Date(selectedCourse.publishedAt).toLocaleString()}</p>
                )}
                {selectedCourse.reviewedAt && (
                  <p><strong>Last Reviewed:</strong> {new Date(selectedCourse.reviewedAt).toLocaleString()}</p>
                )}
                {selectedCourse.reviewedBy && (
                  <p><strong>Reviewed By:</strong> {selectedCourse.reviewedBy?.name || 'Admin'}</p>
                )}
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
                    {selectedCourse.adminNote && (
                      <div className="current-admin-note">
                        <strong>Current Note:</strong> {selectedCourse.adminNote}
                      </div>
                    )}
                    <textarea
                      id="adminNote"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add or update notes about this course..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => {
                  setShowModal(false);
                  setSuccessMessage(''); // Clear success message when closing modal
                }} className="cancel-btn">
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedCourse._id)}
                  className="reject-btn"
                  disabled={rejectingId === selectedCourse._id}
                >
                  {rejectingId === selectedCourse._id ? 'Rejecting...' : 
                   selectedCourse.status === 'inactive' ? 'Keep Rejected' : 'Reject'}
                </button>
                <button
                  onClick={() => handleApprove(selectedCourse._id)}
                  className="approve-btn"
                  disabled={approvingId === selectedCourse._id}
                >
                  {approvingId === selectedCourse._id ? 'Approving...' : 
                   selectedCourse.status === 'active' ? 'Keep Approved' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Course Detail Modal */}
        {showCourseDetail && selectedCourse && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="course-detail-title">
            <div className="modal large-modal">
              <header className="modal-header">
                <h2 id="course-detail-title">Course Details: {selectedCourse.title}</h2>
                <button 
                  onClick={() => {
                    setShowCourseDetail(false);
                    setSuccessMessage(''); // Clear success message when closing modal
                    setError(''); // Clear any previous errors
                  }} 
                  className="close-btn"
                  aria-label="Close course details"
                >
                  ✕
                </button>
              </header>
              <main className="modal-body">
                <article className="course-detail-view">
                  <header className="course-header">
                    {selectedCourse.thumbnailUrl && (
                      <img 
                        src={selectedCourse.thumbnailUrl} 
                        alt={`Course thumbnail for ${selectedCourse.title}`} 
                        className="course-thumbnail-large"
                        loading="lazy"
                      />
                    )}
                    <div className="course-info">
                      <h1>{selectedCourse.title}</h1>
                      {selectedCourse.subtitle && <p className="subtitle">{selectedCourse.subtitle}</p>}
                      <p className="description">{selectedCourse.description}</p>
                      
                      <div className="course-meta" role="group" aria-label="Course metadata">
                        <span className={`level-badge level-${selectedCourse.level}`} aria-label={`Course level: ${selectedCourse.level}`}>
                          {selectedCourse.level}
                        </span>
                        <span className="price-badge" aria-label={`Course price: ${selectedCourse.priceType === 'free' ? 'Free' : `$${selectedCourse.price} AUD`}`}>
                          {selectedCourse.priceType === 'free' ? 'Free' : `$${selectedCourse.price} AUD`}
                        </span>
                        <span className={`status-badge ${getStatusBadgeClass(selectedCourse.status)}`} aria-label={`Course status: ${getStatusBadgeText(selectedCourse.status)}`}>
                          {getStatusBadgeText(selectedCourse.status)}
                        </span>
                      </div>
                    </div>
                  </header>

                  <section className="course-stats" aria-labelledby="course-stats-title">
                    <h3 id="course-stats-title">Course Statistics</h3>
                    <div className="stats-grid" role="group" aria-label="Course statistics">
                      <div className="stat-item" role="article" aria-label="Total lessons">
                        <span className="stat-number" aria-label={`${selectedCourse.stats?.totalLessons || 0} total lessons`}>
                          {selectedCourse.stats?.totalLessons || 0}
                        </span>
                        <span className="stat-label">Total Lessons</span>
                      </div>
                      <div className="stat-item" role="article" aria-label="Total duration">
                        <span className="stat-number" aria-label={`${Math.floor((selectedCourse.stats?.totalDurationSec || 0) / 60)} total minutes`}>
                          {Math.floor((selectedCourse.stats?.totalDurationSec || 0) / 60)}
                        </span>
                        <span className="stat-label">Total Minutes</span>
                      </div>
                      <div className="stat-item" role="article" aria-label="Student enrollment">
                        <span className="stat-number" aria-label={`${selectedCourse.stats?.studentCount || 0} students enrolled`}>
                          {selectedCourse.stats?.studentCount || 0}
                        </span>
                        <span className="stat-label">Students Enrolled</span>
                      </div>
                      {selectedCourse.stats?.ratingCount > 0 && (
                        <div className="stat-item" role="article" aria-label="Average rating">
                          <span className="stat-number" aria-label={`${selectedCourse.stats.ratingAvg?.toFixed(1) || 0} average rating`}>
                            {selectedCourse.stats.ratingAvg?.toFixed(1) || 0}
                          </span>
                          <span className="stat-label">Average Rating</span>
                        </div>
                      )}
                    </div>
                  </section>

                  {selectedCourse.introductionAssets && selectedCourse.introductionAssets.length > 0 && (
                    <section className="course-introduction" aria-labelledby="course-introduction-title">
                      <h3 id="course-introduction-title">Introduction Content</h3>
                      <div className="introduction-list" role="list" aria-label="Introduction content items">
                        {selectedCourse.introductionAssets.map((content, index) => (
                          <article key={index} className="intro-item" role="listitem">
                            <span className="content-type" aria-label={`Content type: ${content.kind}`}>
                              {content.kind}
                            </span>
                            <h4>{content.title || `Content ${index + 1}`}</h4>
                            {content.description && <p>{content.description}</p>}
                          </article>
                        ))}
                      </div>
                    </section>
                  )}

                  {selectedCourse.sections && selectedCourse.sections.length > 0 && (
                    <section className="course-sections" aria-labelledby="course-sections-title">
                      <h3 id="course-sections-title">Course Sections ({selectedCourse.sections.length})</h3>
                      <div className="sections-list" role="list" aria-label="Course sections">
                        {selectedCourse.sections.map((section, sectionIndex) => (
                          <article key={sectionIndex} className="section-item" role="listitem">
                            <h4>Section {section.order}: {section.title}</h4>
                            {section.description && <p>{section.description}</p>}
                            
                            {section.lessons && section.lessons.length > 0 && (
                              <div className="lessons-list">
                                <h5>Lessons in this section</h5>
                                <div role="list" aria-label={`Lessons in section ${section.order}`}>
                                  {section.lessons.map((lesson, lessonIndex) => (
                                    <div key={lessonIndex} className="lesson-item" role="listitem">
                                      <span className="lesson-title">Lesson {lesson.order}: {lesson.title}</span>
                                      <span className="lesson-type" aria-label={`Lesson type: ${lesson.contentType}`}>
                                        {lesson.contentType}
                                      </span>
                                      {lesson.durationSec > 0 && (
                                        <span className="lesson-duration" aria-label={`Duration: ${Math.floor(lesson.durationSec / 60)} minutes ${lesson.durationSec % 60} seconds`}>
                                          {Math.floor(lesson.durationSec / 60)}m {lesson.durationSec % 60}s
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    </section>
                  )}

                  {selectedCourse.adminNote && (
                    <section className="admin-notes-display" aria-labelledby="admin-notes-title">
                      <h3 id="admin-notes-title">Admin Notes</h3>
                      <p>{selectedCourse.adminNote}</p>
                      {selectedCourse.reviewedAt && (
                        <small>Reviewed on: {new Date(selectedCourse.reviewedAt).toLocaleDateString()}</small>
                      )}
                    </section>
                  )}
                </article>
              </main>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 