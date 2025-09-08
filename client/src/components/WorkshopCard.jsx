import React from 'react';
import './WorkshopCard.css';

const WorkshopCard = ({ workshop, onView, onEdit, onDelete, showActions = false }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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
      case 'completed': return 'Completed';
      case 'canceled': return 'Canceled';
      default: return status;
    }
  };

  return (
    <div className="workshop-card">
      <div className="workshop-header">
        <h3 className="workshop-title">{workshop.title}</h3>
        <span 
          className="workshop-status"
          style={{ backgroundColor: getStatusColor(workshop.status) }}
        >
          {getStatusText(workshop.status)}
        </span>
      </div>
      
      {workshop.description && (
        <p className="workshop-description">{workshop.description}</p>
      )}
      
      <div className="workshop-info">
        <div className="info-item">
          <strong>Instructor:</strong> {workshop.instructorId?.name || 'N/A'}
        </div>
        <div className="info-item">
          <strong>Time:</strong> {formatDate(workshop.startAt)} - {formatDate(workshop.endAt)}
        </div>
        <div className="info-item">
          <strong>Meeting:</strong> {workshop.meetingProvider} - {workshop.meetingUrl}
        </div>
        {workshop.maxParticipants && (
          <div className="info-item">
            <strong>Participants:</strong> {workshop.currentParticipants || 0}/{workshop.maxParticipants}
          </div>
        )}
        {workshop.price > 0 && (
          <div className="info-item">
            <strong>Price:</strong> {workshop.price} {workshop.currency}
          </div>
        )}
      </div>
      
      {workshop.requirements && (
        <div className="workshop-requirements">
          <strong>Requirements:</strong> {workshop.requirements}
        </div>
      )}
      
      {showActions && (
        <div className="workshop-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => onEdit(workshop)}
          >
            Edit
          </button>
          <button 
            className="btn btn-danger"
            onClick={() => onDelete(workshop)}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkshopCard;
