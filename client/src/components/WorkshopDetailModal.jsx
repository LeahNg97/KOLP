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
      case 'scheduled': return 'Đã lên lịch';
      case 'live': return 'Đang diễn ra';
      case 'completed': return 'Đã hoàn thành';
      case 'canceled': return 'Đã hủy';
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
        return `${days} ngày ${hours} giờ ${minutes} phút`;
      } else if (hours > 0) {
        return `${hours} giờ ${minutes} phút`;
      } else {
        return `${minutes} phút`;
      }
    } else if (now >= startTime && now <= endTime) {
      const diff = endTime - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours} giờ ${minutes} phút`;
    } else {
      return 'Đã kết thúc';
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
              <h3>Mô tả</h3>
              <p>{workshop.description}</p>
            </div>
          )}

          <div className="workshop-details-grid">
            <div className="detail-item">
              <span className="detail-label">Giảng viên</span>
              <span className="detail-value">{workshop.instructorId?.name || 'N/A'}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Thời gian bắt đầu</span>
              <span className="detail-value">{formatDate(workshop.startAt)}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Thời gian kết thúc</span>
              <span className="detail-value">{formatDate(workshop.endAt)}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Múi giờ</span>
              <span className="detail-value">{workshop.timeZone}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Nền tảng</span>
              <span className="detail-value">
                {workshop.meetingProvider === 'google_meet' && 'Google Meet'}
                {workshop.meetingProvider === 'zoom' && 'Zoom'}
                {workshop.meetingProvider === 'teams' && 'Microsoft Teams'}
                {workshop.meetingProvider === 'other' && 'Khác'}
              </span>
            </div>
            
            {workshop.maxParticipants && (
              <div className="detail-item">
                <span className="detail-label">Số lượng tối đa</span>
                <span className="detail-value">{workshop.maxParticipants} người</span>
              </div>
            )}
            
            {workshop.price > 0 && (
              <div className="detail-item">
                <span className="detail-label">Giá</span>
                <span className="detail-value price">{workshop.price} {workshop.currency}</span>
              </div>
            )}
          </div>

          {workshop.requirements && (
            <div className="workshop-requirements-section">
              <h3>Yêu cầu</h3>
              <p>{workshop.requirements}</p>
            </div>
          )}

          {workshop.materials && workshop.materials.length > 0 && (
            <div className="workshop-materials-section">
              <h3>Tài liệu</h3>
              <ul>
                {workshop.materials.map((material, index) => (
                  <li key={index}>{material}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="workshop-meeting-section">
            <h3>Tham gia workshop</h3>
            <div className="meeting-info">
              <p><strong>Link phòng họp:</strong></p>
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
            Đóng
          </button>
          {(workshop.status === 'live' || workshop.status === 'scheduled') && (
            <button className="btn btn-primary" onClick={handleJoinWorkshop}>
              {workshop.status === 'live' ? 'Tham gia ngay' : 'Tham gia khi bắt đầu'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkshopDetailModal;