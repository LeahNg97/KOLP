import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../../components/Footer';
import './CetificateDetail.css'; 


export default function CertificateDetail() {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();


  useEffect(() => {
    const fetchCertificate = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:8080/api/certificates/${certificateId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCertificate(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load certificate.');
      } finally {
        setLoading(false);
      }
    };
    fetchCertificate();
  }, [certificateId]);


  return (
    <div className="certificate-detail-page">
      <div className="certificate-detail-container">
        <button className="back-btn" onClick={() => navigate(-1)}>&larr; Back</button>
        {loading ? (
          <div className="cert-loading">Loading certificate...</div>
        ) : error ? (
          <div className="cert-error">{error}</div>
        ) : certificate ? (
          <div className="certificate-card">
            <div className="certificate-header">
              <h1>Certificate of Completion</h1>
              <span className="certificate-icon">📜</span>
            </div>
            <div className="certificate-body">
              <div className="cert-row">
                <span className="cert-label">Student:</span>
                <span className="cert-value">{certificate.studentId?.name || certificate.studentId?.email}</span>
              </div>
              <div className="cert-row">
                <span className="cert-label">Course:</span>
                <span className="cert-value">{certificate.courseId?.title}</span>
              </div>
              <div className="cert-row">
                <span className="cert-label">Issued At:</span>
                <span className="cert-value">{certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
            <div className="certificate-footer">
              <span className="footer-text">Congratulations on your achievement!</span>
            </div>
          </div>
        ) : null}
      </div>
      <Footer />
    </div>
  );
}



