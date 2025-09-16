import React, { useState, useEffect } from 'react';
import WorkshopListItem from '../../components/WorkshopListItem';
import WorkshopDetailModal from '../../components/WorkshopDetailModal';
import { getAllWorkshops, deleteWorkshop } from '../api/workshopApi';
import './WorkshopManagement.css';

const AdminWorkshopManagement = () => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [instructorFilter, setInstructorFilter] = useState('');

  useEffect(() => {
    loadWorkshops();
  }, []);

  const loadWorkshops = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllWorkshops();
      setWorkshops(data);
    } catch (err) {
      setError('Cannot load workshops');
      console.error('Error loading workshops:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkshopClick = (workshop) => {
    setSelectedWorkshop(workshop);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWorkshop(null);
  };

  const handleDeleteWorkshop = async (workshop) => {
    if (window.confirm(`are you sure deleting this workshop? "${workshop.title}"?`)) {
      try {
        await deleteWorkshop(workshop._id);
        setWorkshops(prev => prev.filter(w => w._id !== workshop._id));
        setError(null);
      } catch (err) {
        setError('can delete workshop');
        console.error('Error deleting workshop:', err);
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by filtering workshops in state
  };

  // Filter workshops based on search and filters
  const filteredWorkshops = workshops.filter(workshop => {
    const matchesSearch = !searchQuery || 
      workshop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workshop.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workshop.instructorId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || workshop.status === statusFilter;
    const matchesInstructor = !instructorFilter || workshop.instructorId?._id === instructorFilter;
    
    return matchesSearch && matchesStatus && matchesInstructor;
  });

  // Get unique instructors for filter dropdown
  const instructors = [...new Set(workshops.map(w => w.instructorId).filter(Boolean))]
    .map(instructor => ({
      _id: instructor._id,
      name: instructor.name
    }));

  if (loading) {
    return (
      <div className="admin-workshop-management">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-workshop-management">
      <div className="page-header">
        <h1>Workshop Management</h1>
        <p>View and manage all workshops</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="workshop-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="search workshop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            Search
          </button>
        </form>

        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Finished</option>
            <option value="canceled">Canceled</option>
          </select>

          <select
            value={instructorFilter}
            onChange={(e) => setInstructorFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All instructor</option>
            {instructors.map(instructor => (
              <option key={instructor._id} value={instructor._id}>
                {instructor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="workshop-stats">
        <div className="stat-item">
          <span className="stat-number">{workshops.length}</span>
          <span className="stat-label">Number of workshop</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{workshops.filter(w => w.isPublished).length}</span>
          <span className="stat-label">Published</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{workshops.filter(w => w.status === 'scheduled').length}</span>
          <span className="stat-label">Scheduled</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{workshops.filter(w => w.status === 'live').length}</span>
          <span className="stat-label">Live</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{workshops.filter(w => w.status === 'completed').length}</span>
          <span className="stat-label">Finished</span>
        </div>
      </div>

      <div className="workshop-list">
        {filteredWorkshops.length === 0 ? (
          <div className="no-workshops">
            <p>Cannot fine workshop</p>
          </div>
        ) : (
          filteredWorkshops.map(workshop => (
            <div key={workshop._id} className="workshop-item-with-actions">
              <WorkshopListItem
                workshop={workshop}
                onClick={handleWorkshopClick}
              />
              <div className="workshop-actions">
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteWorkshop(workshop)}
                  title="Delete workshop"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredWorkshops.length > 0 && (
        <div className="workshop-stats-footer">
          <p>Showing {filteredWorkshops.length} out of {workshops.length} workshop</p>
        </div>
      )}

      <WorkshopDetailModal
        workshop={selectedWorkshop}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default AdminWorkshopManagement;