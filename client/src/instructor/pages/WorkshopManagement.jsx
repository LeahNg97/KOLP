import React, { useState, useEffect } from 'react';
import WorkshopCard from '../../components/WorkshopCard';
import { getMyWorkshops, createWorkshop, updateWorkshop, deleteWorkshop, updateWorkshopStatus } from '../api/workshopApi';
import './WorkshopManagement.css';

const WorkshopManagement = () => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);

  useEffect(() => {
    // Debug user data
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    console.log('User data from localStorage:', userData);
    console.log('Token from localStorage:', token ? 'exists' : 'missing');
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('Parsed user:', user);
        console.log('User role:', user.role);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    loadWorkshops();
  }, []);

  const loadWorkshops = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyWorkshops();
      setWorkshops(data);
    } catch (err) {
      console.error('Error loading workshops:', err);
      if (err.message === 'User ID not found') {
        setError('Cannot find user ID. Please log in again.');
      } else if (err.response?.status === 400) {
        setError('ID invalid or missing. Please log in again.');
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Unable to load workshops. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkshop = async (workshopData) => {
    try {
      const newWorkshop = await createWorkshop(workshopData);
      setWorkshops(prev => [newWorkshop, ...prev]);
      setShowCreateForm(false);
    } catch (err) {
      console.error('Error creating workshop:', err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to create workshops. Please check your access rights.');
      } else if (err.response?.status === 400) {
        setError(err.response.data.message || 'Invalid data. Please check again.');
      } else {
        setError('Unable to create workshop. Please try again later.');
      }
    }
  };

  const handleUpdateWorkshop = async (workshopId, workshopData) => {
    try {
      const updatedWorkshop = await updateWorkshop(workshopId, workshopData);
      setWorkshops(prev => prev.map(w => w._id === workshopId ? updatedWorkshop : w));
      setEditingWorkshop(null);
    } catch (err) {
      setError('Unable to update workshop');
      console.error('Error updating workshop:', err);
    }
  };

  const handleDeleteWorkshop = async (workshop) => {
    if (window.confirm(`Are you sure you want to delete the workshop "${workshop.title}"?`)) {
      try {
        await deleteWorkshop(workshop._id);
        setWorkshops(prev => prev.filter(w => w._id !== workshop._id));
      } catch (err) {
        setError('Unable to delete workshop');
        console.error('Error deleting workshop:', err);
      }
    }
  };

  const handleStatusChange = async (workshopId, newStatus) => {
    try {
      const updatedWorkshop = await updateWorkshopStatus(workshopId, newStatus);
      setWorkshops(prev => prev.map(w => w._id === workshopId ? updatedWorkshop : w));
    } catch (err) {
      setError('Unable to update workshop status');
      console.error('Error updating workshop status:', err);
    }
  };

  const handleEditWorkshop = (workshop) => {
    setEditingWorkshop(workshop);
  };

  if (loading) {
    return (
      <div className="workshop-management-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="workshop-management-container">
      <div className="workshop-header">
        <h1>Workshop Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          Create New Workshop
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showCreateForm && (
        <WorkshopForm
          onSubmit={handleCreateWorkshop}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingWorkshop && (
        <WorkshopForm
          workshop={editingWorkshop}
          onSubmit={(data) => handleUpdateWorkshop(editingWorkshop._id, data)}
          onCancel={() => setEditingWorkshop(null)}
        />
      )}

      <div className="workshop-stats">
        <div className="stat-item">
          <span className="stat-number">{workshops.length}</span>
          <span className="stat-label">Total workshops</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{workshops.filter(w => w.isPublished).length}</span>
          <span className="stat-label">Published</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{workshops.filter(w => w.status === 'scheduled').length}</span>
          <span className="stat-label">Scheduled</span>
        </div>
      </div>

      <div className="workshop-grid">
        {workshops.length === 0 ? (
          <div className="no-workshops">
            <p>You have no workshops yet</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              Create Your First Workshop
            </button>
          </div>
        ) : (
          workshops.map(workshop => (
            <WorkshopCard
              key={workshop._id}
              workshop={workshop}
              onEdit={handleEditWorkshop}
              onDelete={handleDeleteWorkshop}
              showActions={true}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Workshop Form Component
const WorkshopForm = ({ workshop, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: workshop?.title || '',
    description: workshop?.description || '',
    startAt: workshop?.startAt ? new Date(workshop.startAt).toISOString().slice(0, 16) : '',
    endAt: workshop?.endAt ? new Date(workshop.endAt).toISOString().slice(0, 16) : '',
    timeZone: workshop?.timeZone || 'Asia/Bangkok',
    meetingUrl: workshop?.meetingUrl || '',
    meetingProvider: workshop?.meetingProvider || 'google_meet',
    maxParticipants: workshop?.maxParticipants || 50,
    registrationRequired: true, // Always require registration
    registrationDeadline: workshop?.registrationDeadline ? new Date(workshop.registrationDeadline).toISOString().slice(0, 16) : '',
    price: workshop?.price || 0,
    currency: workshop?.currency || 'AUD',
    requirements: workshop?.requirements || '',
    materials: workshop?.materials || [],
    isPublished: true // Automatically publish
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="workshop-form-overlay">
      <div className="workshop-form">
        <h2>{workshop ? 'Edit Workshop' : 'Create New Workshop'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Workshop Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Time *</label>
              <input
                type="datetime-local"
                name="startAt"
                value={formData.startAt}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>End Time *</label>
              <input
                type="datetime-local"
                name="endAt"
                value={formData.endAt}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Meeting URL *</label>
            <input
              type="url"
              name="meetingUrl"
              value={formData.meetingUrl}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Platform</label>
              <select
                name="meetingProvider"
                value={formData.meetingProvider}
                onChange={handleChange}
              >
                <option value="google_meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="teams">Microsoft Teams</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Max Participants</label>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleChange}
                min="1"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (AUD)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                <option value="AUD">AUD</option>
                {/* <option value="USD">USD</option>
                <option value="VND">VND</option> */}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Requirements</label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows="2"
              placeholder="Requirements for participants..."
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {workshop ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkshopManagement;
