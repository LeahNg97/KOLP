import React from 'react';
import './WorkshopDetailModal.css';

const WorkshopDetailModal = ({ workshop, isOpen, onClose }) => {
  if (!isOpen || !workshop) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#2196F3';
      case 'live': return '#4CAF50';
      case 'completed': return '#9E9E9E';
      case 'canceled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'live': return 'Live';
      case 'completed': return 'Finished';
      case 'canceled': return 'Canceled';
      default: return status;
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const startTime = new Date(workshop.startAt);
    const endTime = new Date(workshop.endAt);
    
    if (now < startTime) {
      const diff = startTime - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        return `${days} days ${hours} hours ${minutes} minutes`;
      } else if (hours > 0) {
        return `${hours} hours ${minutes} minutes`;
      } else {
        return `${minutes} minutes`;
      }
    } else if (now >= startTime && now <= endTime) {
      const diff = endTime - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours} hours ${minutes} minutes remaining`;
    } else {
      return 'Finished';
    }
  };

  const handleJoinWorkshop = () => {
    if (workshop.meetingUrl) {
      window.open(workshop.meetingUrl, '_blank');
    }
  };

  return (
    <div className="workshop-modal-overlay" onClick={onClose}>
      <div className="workshop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{workshop.title}</h2>
          <button className="close-button" onClick={onClose}>
            <span className="close-icon">×</span>
          </button>
        </div>

        <div className="modal-content">
          <div className="workshop-status-section">
            <span 
              className="workshop-status-badge"
              style={{ backgroundColor: getStatusColor(workshop.status) }}
            >
              {workshop.status === 'live' && <span className="live-dot">🔴</span>}
              {getStatusText(workshop.status)}
            </span>
            <span className="time-remaining">{getTimeRemaining()}</span>
          </div>

          {workshop.description && (
            <div className="workshop-description-section">
              <h3>Description</h3>
              <p>{workshop.description}</p>
            </div>
          )}

          <div className="workshop-details-grid">
            <div className="detail-item">
              <span className="detail-label">Instructor</span>
              <span className="detail-value">{workshop.instructorId?.name || 'N/A'}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Start Time</span>
              <span className="detail-value">{formatDate(workshop.startAt)}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">End Time</span>
              <span className="detail-value">{formatDate(workshop.endAt)}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">TimeZone</span>
              <span className="detail-value">{workshop.timeZone}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Platform</span>
              <span className="detail-value">
                {workshop.meetingProvider === 'google_meet' && 'Google Meet'}
                {workshop.meetingProvider === 'zoom' && 'Zoom'}
                {workshop.meetingProvider === 'teams' && 'Microsoft Teams'}
                {workshop.meetingProvider === 'other' && 'Khác'}
              </span>
            </div>
            
            {workshop.maxParticipants && (
              <div className="detail-item">
                <span className="detail-label">Max Participants</span>
                <span className="detail-value">{workshop.maxParticipants} người</span>
              </div>
            )}
            
            {workshop.price > 0 && (
              <div className="detail-item">
                <span className="detail-label">Price</span>
                <span className="detail-value price">{workshop.price} {workshop.currency}</span>
              </div>
            )}
          </div>

          {workshop.requirements && (
            <div className="workshop-requirements-section">
              <h3>Requirement</h3>
              <p>{workshop.requirements}</p>
            </div>
          )}

          {workshop.materials && workshop.materials.length > 0 && (
            <div className="workshop-materials-section">
              <h3>Materials</h3>
              <ul>
                {workshop.materials.map((material, index) => (
                  <li key={index}>{material}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="workshop-meeting-section">
            <h3>Join workshop</h3>
            <div className="meeting-info">
              <p><strong>Meeting Link:</strong></p>
              <a 
                href={workshop.meetingUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="meeting-link"
              >
                {workshop.meetingUrl}
              </a>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {(workshop.status === 'live' || workshop.status === 'scheduled') && (
            <button className="btn btn-primary" onClick={handleJoinWorkshop}>
              {workshop.status === 'live' ? 'Join Now' : 'Join when started'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkshopDetailModal;