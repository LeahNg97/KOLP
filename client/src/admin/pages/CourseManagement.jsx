import { useEffect, useState } from 'react';
import axios from 'axios';
import './CourseManagement.css';
import CourseLearningView from '../components/CourseLearningView';

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
  const [courseDetails, setCourseDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  // Cleanup modal-open class when component unmounts
  useEffect(() => {
    return () => {
      document.body.classList.remove('modal-open');
    };
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

  const openCourseDetail = async (course, isForApproval = false) => {
    setSelectedCourse(course);
    setShowCourseDetail(true);
    setSuccessMessage(''); // Clear any previous success message
    setError(''); // Clear any previous errors
    setLoadingDetails(true);
    
    // Store if this is for approval or just viewing
    setSelectedCourse({...course, isForApproval});
    
    // Add modal-open class to body
    document.body.classList.add('modal-open');
    
    try {
      // Fetch detailed course information including modules, lessons, quizzes
      const response = await axios.get(`http://localhost:8080/api/courses/${course._id}/details`);
      setCourseDetails(response.data);
    } catch (err) {
      console.error('Failed to fetch course details:', err);
      // Fallback to basic course info if detailed fetch fails
      setCourseDetails(course);
    } finally {
      setLoadingDetails(false);
    }
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
                        onClick={() => openCourseDetail(course, false)}
                        className="action-btn view-btn"
                        title="View Details"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleUpdate(course._id)}
                        className="action-btn edit-btn"
                        title="Edit Course"
                      >
                        Edit
                      </button>
                      {/* Show approve/reject buttons for all courses except deleted ones */}
                      {course.status !== 'deleted' && (
                        <>
                          {course.status !== 'active' && (
                            <button
                              onClick={() => openCourseDetail(course, true)}
                              className="action-btn approve-btn"
                              title="View Course Details for Approval"
                            >
                              Approve
                            </button>
                          )}
                          {course.status !== 'inactive' && (
                            <button
                              onClick={() => openApprovalModal(course)}
                              className="action-btn reject-btn"
                              title="Reject Course"
                            >
                              Reject
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
                        {deletingId === course._id ? 'Delete...' : 'Delete'}
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

        {/* Course Learning View Modal */}
        {showCourseDetail && selectedCourse && (
          <div className="modal-overlay fullscreen-overlay" role="dialog" aria-modal="true">
            <div className="modal fullscreen-modal">
              <CourseLearningView
                course={selectedCourse}
                isForApproval={selectedCourse?.isForApproval || false}
                onClose={() => {
                  setShowCourseDetail(false);
                  setCourseDetails(null);
                  setAdminNote('');
                  setSuccessMessage('');
                  setError('');
                  // Remove modal-open class from body
                  document.body.classList.remove('modal-open');
                }}
                onApprove={handleApprove}
                onReject={handleReject}
                adminNote={adminNote}
                setAdminNote={setAdminNote}
                approvingId={approvingId}
                rejectingId={rejectingId}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 