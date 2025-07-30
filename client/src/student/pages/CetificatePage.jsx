import React, { useEffect, useState } from 'react';
import { getMyCertificates } from '../api/certificateApi';
import Footer from '../../components/Footer';
// import './CertificatePage.css'; 
import { Link } from 'react-router-dom';


export default function CertificatePage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    const fetchCertificates = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getMyCertificates();
        setCertificates(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load certificates.');
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);


  return (
    <div className="student-course-page">
      <div className="student-course-header">
        <h1>My Certificates</h1>
      </div>
      {loading ? (
        <div className="student-course-loading">Loading your certificates...</div>
      ) : error ? (
        <div className="student-course-error">{error}</div>
      ) : certificates.length === 0 ? (
        <div className="student-course-empty">
          <p>You have not received any certificates yet.</p>
        </div>
      ) : (
        <div className="certificates-list">
          <table className="cert-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Issued At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map(cert => (
                <tr key={cert._id}>
                  <td>{cert.courseId?.title || 'N/A'}</td>
                  <td>{cert.issuedAt ? new Date(cert.issuedAt).toLocaleString() : 'Not issued'}</td>
                  <td>
                    <Link to={`/student/certificates/${cert._id}`} className="view-cert-btn">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Footer />
    </div>
  );
}



