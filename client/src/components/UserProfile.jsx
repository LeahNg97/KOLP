import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser, updateUserProfile } from '../auth/api/authApi';
import './UserProfile.css';

export default function UserProfile({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchProfileData();
      setEditForm({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [isOpen, user]);

  const fetchProfileData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getCurrentUser();
      setProfileData(response.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: user.name || '',
      email: user.email || ''
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await updateUserProfile({ name: editForm.name });
      updateUser(response.user);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <h2>User Profile</h2>
          <button className="profile-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading && !profileData ? (
          <div className="profile-loading">Loading profile...</div>
        ) : error ? (
          <div className="profile-error">{error}</div>
        ) : (
          <div className="profile-content">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="profile-role-badge">
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User'}
              </div>
            </div>

            {isEditing ? (
              <div className="profile-edit-form">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    className="profile-input"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                    className="profile-input"
                    disabled
                  />
                  <small>Email cannot be changed</small>
                </div>
                <div className="profile-actions">
                  <button 
                    className="profile-btn profile-btn-save" 
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    className="profile-btn profile-btn-cancel" 
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-info">
                <div className="profile-field">
                  <label>Name</label>
                  <span>{user?.name || 'Not provided'}</span>
                </div>
                <div className="profile-field">
                  <label>Email</label>
                  <span>{user?.email || 'Not provided'}</span>
                </div>
                <div className="profile-field">
                  <label>Role</label>
                  <span>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User'}</span>
                </div>
                <div className="profile-field">
                  <label>Member Since</label>
                  <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
                </div>
                
                <div className="profile-actions">
                  <button 
                    className="profile-btn profile-btn-edit" 
                    onClick={handleEdit}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 