import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../../components/Footer';
import './CertificateDetail.css';
import { getCertificateById } from '../api/certificateApi';

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
        const res = await getCertificateById(token, certificateId);
        setCertificate(res);
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
          <div className="certificate">
            {/* Decorative corner elements */}
            <div className="corner-decoration top-left"></div>
            <div className="corner-decoration top-right"></div>
            <div className="corner-decoration bottom-left"></div>
            <div className="corner-decoration bottom-right"></div>
            
            {/* Background pattern */}
            <div className="background-pattern"></div>
            
            {/* Header with university-style design */}
            <div className="certificate-header">
              <div className="university-seal">
                <div className="seal-inner">
                  <div className="seal-text">KOLP</div>
                  <div className="seal-subtext">ACADEMY</div>
                </div>
              </div>
              <div className="university-name">KOLP LEARNING PLATFORM</div>
              <div className="university-motto">Excellence in Education</div>
            </div>

            {/* Main certificate content */}
            <div className="certificate-body">
              <div className="certificate-title">CERTIFICATE OF ACHIEVEMENT</div>
              <div className="certificate-subtitle">THE FOLLOWING AWARD IS GIVEN TO</div>
              
              <div className="recipient-name">
                {certificate.studentId?.name || certificate.studentId?.email}
              </div>
              
              <div className="achievement-description">
                Who has successfully completed the course of study in<br/>
                <span className="course-title">{certificate.courseId?.title}</span>
                and has demonstrated exceptional proficiency and dedication<br/>
                in the pursuit of knowledge and academic excellence.
              </div>
            </div>

            {/* Footer with signatures and date */}
            <div className="certificate-footer">
              <div className="signature-section">
                <div className="signature-line"></div>
                <div className="signature-label">Head of Academy</div>
              </div>
              
              <div className="official-seal">
                <div className="seal-ring">
                  <div className="seal-center">
                    <div className="seal-symbol">⚜</div>
                  </div>
                </div>
              </div>
              
              <div className="date-section">
                <div className="date-line"></div>
                <div className="date-label">Date of Issue</div>
                <div className="issue-date">
                  {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <Footer />
    </div>
  );
} 