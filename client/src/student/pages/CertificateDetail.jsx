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
            <div className="background-icon">📜</div>
            <div className="logo">KOLP <span className="logo-academy">Lerning Platform</span></div>
            <div className="title">COMPLETION</div>
            <div className="subtitle">CERTIFICATE</div>
            <div className="subtitle">THIS CERTIFICATE IS PRESENTED TO</div>

            <div className="recipient">
              {certificate.studentId?.name || certificate.studentId?.email}
            </div>

            <div className="description">
              Who has successfully completed the<br/>
              <strong>{certificate.courseId?.title}</strong>
            </div>

            <div className="footer">
              <div className="signature">
                <strong>SKILL ACADEMY</strong>
                Director
              </div>
              <div className="medal">🏅</div>
              <div className="signature">
                <strong>DATE OF ISSUE</strong>
                {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <Footer />
    </div>
  );
} 