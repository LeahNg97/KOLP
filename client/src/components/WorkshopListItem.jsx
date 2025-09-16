import React from 'react';
import './WorkshopListItem.css';

const WorkshopListItem = ({ workshop, onClick }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
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
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `Start after ${hours}h ${minutes}m`;
    } else if (now >= startTime && now <= endTime) {
      const diff = endTime - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `Remain ${hours}h ${minutes}m`;
    } else {
      return 'Finished';
    }
  };

  return (
    <div className="workshop-list-item" onClick={() => onClick(workshop)}>
      <div className="workshop-main-info">
        <div className="workshop-title-section">
          <h3 className="workshop-title">{workshop.title}</h3>
          <span 
            className="workshop-status"
            style={{ backgroundColor: getStatusColor(workshop.status) }}
          >
            {workshop.status === 'live' && <span className="live-dot">🔴</span>}
            {getStatusText(workshop.status)}
          </span>
        </div>
        
        <div className="workshop-meta">
          <div className="meta-item">
            <span className="meta-icon">👨‍🏫</span>
            <span className="meta-text">{workshop.instructorId?.name || 'N/A'}</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">📅</span>
            <span className="meta-text">{formatDate(workshop.startAt)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">⏰</span>
            <span className="meta-text">{getTimeRemaining()}</span>
          </div>
          {workshop.price > 0 && (
            <div className="meta-item">
              <span className="meta-icon">💰</span>
              <span className="meta-text">{workshop.price} {workshop.currency}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="workshop-description">
        {workshop.description && (
          <p className="description-text">{workshop.description}</p>
        )}
      </div>
      
      <div className="workshop-arrow">
        <span className="arrow-icon">→</span>
      </div>
    </div>
  );
};

export default WorkshopListItem;