import React, { useState, useEffect } from 'react';
import WorkshopListItem from '../../components/WorkshopListItem';
import WorkshopDetailModal from '../../components/WorkshopDetailModal';
import { getPublishedWorkshops, searchWorkshops } from '../api/workshopApi';
import './WorkshopList.css';

const WorkshopList = () => {
  const [workshops, setWorkshops] = useState([]);
  const [allWorkshops, setAllWorkshops] = useState([]); // Store all workshops before filtering
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    upcoming: false
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadWorkshops();
  }, [filters]);

  // Update current time every minute to check for live workshops
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Update workshop status when current time changes
  useEffect(() => {
    if (allWorkshops.length > 0) {
      const updatedWorkshops = allWorkshops.map(updateWorkshopStatus);
      
      // Store updated workshops
      setAllWorkshops(updatedWorkshops);
      
      // Re-apply filters after status update
      let filteredWorkshops = updatedWorkshops;
      
      if (filters.status) {
        filteredWorkshops = filteredWorkshops.filter(w => w.status === filters.status);
      }
      
      if (filters.upcoming) {
        filteredWorkshops = filteredWorkshops.filter(w => w.startAt > new Date());
      }
      
      setWorkshops(filteredWorkshops);
    }
  }, [currentTime]);

  // Function to determine workshop status based on current time
  const getWorkshopStatus = (workshop) => {
    const now = currentTime;
    const startTime = new Date(workshop.startAt);
    const endTime = new Date(workshop.endAt);
    
    if (now < startTime) {
      return 'scheduled';
    } else if (now >= startTime && now <= endTime) {
      return 'live';
    } else {
      return 'completed';
    }
  };

  // Function to update workshop status based on current time
  const updateWorkshopStatus = (workshop) => {
    const realTimeStatus = getWorkshopStatus(workshop);
    return {
      ...workshop,
      status: realTimeStatus,
      isLive: realTimeStatus === 'live'
    };
  };

  const loadWorkshops = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Always get all published workshops first
      let data;
      if (searchQuery.trim()) {
        data = await searchWorkshops(searchQuery, {});
      } else {
        data = await getPublishedWorkshops({});
      }
      
      // Update workshop status based on current time
      const updatedWorkshops = data.map(updateWorkshopStatus);
      
      // Store all workshops before filtering
      setAllWorkshops(updatedWorkshops);
      
      // Apply filters after updating status
      let filteredWorkshops = updatedWorkshops;
      
      if (filters.status) {
        filteredWorkshops = filteredWorkshops.filter(w => w.status === filters.status);
      }
      
      if (filters.upcoming) {
        filteredWorkshops = filteredWorkshops.filter(w => w.startAt > new Date());
      }
      
      setWorkshops(filteredWorkshops);
    } catch (err) {
      setError('Cannot load workshop list');
      console.error('Error loading workshops:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadWorkshops();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleWorkshopClick = (workshop) => {
    setSelectedWorkshop(workshop);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWorkshop(null);
  };

  const handleViewWorkshop = (workshop) => {
    // Navigate to workshop detail page
    console.log('View workshop:', workshop);
    // You can implement navigation here
  };

  if (loading) {
    return (
      <div className="workshop-list-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="workshop-list-container">
      <div className="workshop-header">
        <h1>Workshop List</h1>
        <p>Learn about and join useful workshops</p>
      </div>

      <div className="workshop-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search for workshop..."
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
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Finished</option>
          </select>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.upcoming}
              onChange={(e) => handleFilterChange('upcoming', e.target.checked)}
            />
            Show upcoming workshops only
          </label>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Live Workshops Section */}
      {workshops.filter(w => w.isLive).length > 0 && (
        <div className="live-workshops-section">
          <h2 className="section-title">
            <span className="live-indicator">🔴</span>
            Live Workshops
          </h2>
          <div className="workshop-list">
            {workshops.filter(w => w.isLive).map(workshop => (
              <WorkshopListItem
                key={workshop._id}
                workshop={workshop}
                onClick={handleWorkshopClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Workshops Section */}
      <div className="all-workshops-section">
        <h2 className="section-title">All Workshop</h2>
        <div className="workshop-list">
        {workshops.length === 0 ? (
          <div className="no-workshops">
            <p>No workshops found</p>
          </div>
        ) : (
          workshops.map(workshop => (
            <WorkshopListItem
              key={workshop._id}
              workshop={workshop}
              onClick={handleWorkshopClick}
            />
          ))
        )}
        </div>
      </div>

      {/* Workshop Detail Modal */}
      <WorkshopDetailModal
        workshop={selectedWorkshop}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {workshops.length > 0 && (
        <div className="workshop-stats">
          <p>Found {workshops.length} workshop</p>
          {workshops.filter(w => w.isLive).length > 0 && (
            <p className="live-count">
              {workshops.filter(w => w.isLive).length} workshop(s) currently live
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkshopList;