import { useEffect, useState } from 'react';
import axios from 'axios';
import './CertificateManagement.css';

export default function CertificateManagement() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  const fetchCertificates = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:8080/api/certificates/all');
      setCertificates(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load certificates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleIssue = async (studentId, courseId) => {
    setActionId(`${studentId}_${courseId}`);
    try {
      await axios.post('http://localhost:8080/api/certificates/issue', { 
        studentId, 
        courseId 
      });
      fetchCertificates(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue certificate.');
    } finally {
      setActionId(null);
    }
  };

  const handleRevoke = async (certId) => {
    if (!window.confirm('Are you sure you want to revoke this certificate?')) return;
    setActionId(certId);
    try {
      await axios.delete(`http://localhost:8080/api/certificates/${certId}`);
      setCertificates(certificates.filter(c => c._id !== certId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke certificate.');
    } finally {
      setActionId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not issued';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-layout">
      <main className="admin-main">
        <div className="cert-header">
          <h1>Certificate Management</h1>
          <div className="cert-stats">
            <span className="stat-item">
              <strong>{certificates.length}</strong> Total Certificates
            </span>
            <span className="stat-item">
              <strong>{certificates.filter(c => c.issuedAt).length}</strong> Issued
            </span>
            <span className="stat-item">
              <strong>{certificates.filter(c => !c.issuedAt).length}</strong> Pending
            </span>
          </div>
        </div>

        {loading ? (
          <div className="cert-loading">Loading certificates...</div>
        ) : error ? (
          <div className="cert-error">{error}</div>
        ) : certificates.length === 0 ? (
          <div className="cert-empty">
            <div className="empty-icon">🏆</div>
            <h3>No Certificates Found</h3>
            <p>Certificates will appear here once they are issued to students.</p>
          </div>
        ) : (
          <div className="cert-table-wrapper">
            <table className="cert-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Issued At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map(cert => (
                  <tr key={cert._id}>
                    <td>
                      <div className="student-info">
                        <span className="student-name">
                          {cert.studentId?.name || 'Unknown Student'}
                        </span>
                      </div>
                    </td>
                    <td>{cert.studentId?.email || 'N/A'}</td>
                    <td>
                      <div className="course-info">
                        <span className="course-title">
                          {cert.courseId?.title || 'Unknown Course'}
                        </span>
                      </div>
                    </td>
                    <td>{formatDate(cert.issuedAt)}</td>
                    <td>
                      <span className={`status-badge ${cert.issuedAt ? 'issued' : 'pending'}`}>
                        {cert.issuedAt ? 'Issued' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="cert-actions">
                        {cert.issuedAt ? (
                          <button
                            className="cert-btn cert-revoke"
                            onClick={() => handleRevoke(cert._id)}
                            disabled={actionId === cert._id}
                            title="Revoke Certificate"
                          >
                            {actionId === cert._id ? 'Revoking...' : 'Revoke'}
                          </button>
                        ) : (
                          <button
                            className="cert-btn cert-issue"
                            onClick={() => handleIssue(cert.studentId?._id, cert.courseId?._id)}
                            disabled={actionId === `${cert.studentId?._id}_${cert.courseId?._id}`}
                            title="Issue Certificate"
                          >
                            {actionId === `${cert.studentId?._id}_${cert.courseId?._id}` ? 'Issuing...' : 'Issue'}
                          </button>
                        )}
                      </div>
                    </td>
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