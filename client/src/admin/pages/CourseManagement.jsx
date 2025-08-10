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

  // Filter courses by search and status
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: 'Pending', class: 'status-pending' },
      active: { text: 'Active', class: 'status-active' },
      inactive: { text: 'Inactive', class: 'status-inactive' },
      draft: { text: 'Draft', class: 'status-draft' }
    };
    
    const config = statusConfig[status] || { text: status, class: 'status-default' };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <h1>Course Management</h1>
        <div className="course-controls">
          <div className="course-search-bar">
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="course-search-input"
            />
          </div>
          <div className="course-filter">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="course-filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="course-loading">Loading courses...</div>
        ) : error ? (
          <div className="course-error">{error}</div>
        ) : (
          <div className="course-table-wrapper">
            <table className="course-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Instructor</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map(course => (
                  <tr key={course._id}>
                    <td>{course.title}</td>
                    <td>{course.instructorId?.name || 'N/A'}</td>
                    <td>{getStatusBadge(course.status)}</td>
                    <td>{new Date(course.createdAt).toLocaleString()}</td>
                    <td>
                      <button 
                        className="course-btn course-view"  
                        onClick={() => openCourseDetail(course)}
                      >
                        View
                      </button>
                      {course.status === 'pending' && (
                        <button 
                          className="course-btn course-approve" 
                          onClick={() => openApprovalModal(course)}
                        >
                          Review
                        </button>
                      )}
                      <button className="course-btn course-update" onClick={() => handleUpdate(course._id)}>
                        Update
                      </button>
                      <button
                        className="course-btn course-delete"
                        onClick={() => handleDelete(course._id)}
                        disabled={deletingId === course._id}
                      >
                        {deletingId === course._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Approval Modal */}
        {showModal && selectedCourse && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Review Course: {selectedCourse.title}</h2>
              <div className="course-details">
                <p><strong>Instructor:</strong> {selectedCourse.instructorId?.name || 'N/A'}</p>
                <p><strong>Description:</strong> {selectedCourse.description || 'No description'}</p>
                <p><strong>Created:</strong> {new Date(selectedCourse.createdAt).toLocaleString()}</p>
              </div>
              <div className="admin-note-section">
                <label htmlFor="adminNote">Admin Note (optional):</label>
                <textarea
                  id="adminNote"
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Add a note about your decision..."
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button
                  className="course-btn course-approve"
                  onClick={() => handleApprove(selectedCourse._id)}
                  disabled={approvingId === selectedCourse._id}
                >
                  {approvingId === selectedCourse._id ? 'Approving...' : 'Approve'}
                </button>
                <button
                  className="course-btn course-reject"
                  onClick={() => handleReject(selectedCourse._id)}
                  disabled={rejectingId === selectedCourse._id}
                >
                  {rejectingId === selectedCourse._id ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  className="course-btn course-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Course Detail Modal */}
        {showCourseDetail && selectedCourse && (
          <div className="modal-overlay">
            <div className="modal-content course-detail-modal">
              <div className="modal-header">
                <h2>{selectedCourse.title}</h2>
                <button 
                  className="modal-close-btn"
                  onClick={() => setShowCourseDetail(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="course-detail-content">
                <div className="course-info">
                  <p><strong>Instructor:</strong> {selectedCourse.instructorId?.name || 'N/A'}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedCourse.status)}</p>
                  <p><strong>Created:</strong> {new Date(selectedCourse.createdAt).toLocaleString()}</p>
                  {selectedCourse.reviewedAt && (
                    <p><strong>Reviewed:</strong> {new Date(selectedCourse.reviewedAt).toLocaleString()}</p>
                  )}
                  {selectedCourse.adminNote && (
                    <p><strong>Admin Note:</strong> {selectedCourse.adminNote}</p>
                  )}
                </div>

                <div className="course-description">
                  <h3>Description</h3>
                  <p>{selectedCourse.description || 'No description available'}</p>
                </div>

                <div className="course-content">
                  <h3>Course Sections ({selectedCourse.sections?.length || 0} sections)</h3>
                  {selectedCourse.sections && selectedCourse.sections.length > 0 ? (
                    <div className="sections-list">
                      {selectedCourse.sections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="section-item">
                          <div className="section-header">
                            <h4>Section {section.order}: {section.title}</h4>
                            {section.description && (
                              <p className="section-description">{section.description}</p>
                            )}
                          </div>
                          
                          {section.lessons && section.lessons.length > 0 ? (
                            <div className="lessons-list">
                              <h5>Lessons ({section.lessons.length})</h5>
                              {section.lessons.map((lesson, lessonIndex) => (
                                <div key={lessonIndex} className="lesson-item">
                                  <div className="lesson-type">
                                    {lesson.type === 'video' && '🎥'}
                                    {lesson.type === 'pdf' && '📄'}
                                    {lesson.type === 'slide' && '📊'}
                                    {lesson.type === 'text' && '📝'}
                                    <span className="lesson-type-text">{lesson.type.toUpperCase()}</span>
                                  </div>
                                  <div className="lesson-info">
                                    <span className="lesson-title">Lesson {lesson.order}: {lesson.title}</span>
                                    {lesson.duration > 0 && (
                                      <span className="lesson-duration">⏱️ {lesson.duration} min</span>
                                    )}
                                  </div>
                                  <div className="lesson-url">
                                    <a 
                                      href={lesson.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="content-link"
                                    >
                                      {lesson.url}
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="no-lessons">No lessons in this section.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-content">No sections available for this course.</p>
                  )}
                </div>

                {selectedCourse.imageIntroduction && (
                  <div className="course-intro-image">
                    <h3>Introduction Image</h3>
                    <img 
                      src={selectedCourse.imageIntroduction} 
                      alt="Course introduction" 
                      className="intro-image"
                    />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                {selectedCourse.status === 'pending' && (
                  <button
                    className="course-btn course-approve"
                    onClick={() => {
                      setShowCourseDetail(false);
                      openApprovalModal(selectedCourse);
                    }}
                  >
                    Review & Approve
                  </button>
                )}
                <button
                  className="course-btn course-cancel"
                  onClick={() => setShowCourseDetail(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 