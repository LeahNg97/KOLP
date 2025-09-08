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
      setError('Không thể tải danh sách workshop');
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
    if (window.confirm(`Bạn có chắc chắn muốn xóa workshop "${workshop.title}"?`)) {
      try {
        await deleteWorkshop(workshop._id);
        setWorkshops(prev => prev.filter(w => w._id !== workshop._id));
        setError(null);
      } catch (err) {
        setError('Không thể xóa workshop');
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
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="admin-workshop-management">
      <div className="page-header">
        <h1>Quản lý Workshop</h1>
        <p>Xem và quản lý tất cả workshop trong hệ thống</p>
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
            placeholder="Tìm kiếm workshop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            Tìm kiếm
          </button>
        </form>

        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="scheduled">Đã lên lịch</option>
            <option value="live">Đang diễn ra</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="canceled">Đã hủy</option>
          </select>

          <select
            value={instructorFilter}
            onChange={(e) => setInstructorFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả giảng viên</option>
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
          <span className="stat-label">Tổng số workshop</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{workshops.filter(w => w.isPublished).length}</span>
          <span className="stat-label">Đã xuất bản</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{workshops.filter(w => w.status === 'scheduled').length}</span>
          <span className="stat-label">Đã lên lịch</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{workshops.filter(w => w.status === 'live').length}</span>
          <span className="stat-label">Đang diễn ra</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{workshops.filter(w => w.status === 'completed').length}</span>
          <span className="stat-label">Đã hoàn thành</span>
        </div>
      </div>

      <div className="workshop-list">
        {filteredWorkshops.length === 0 ? (
          <div className="no-workshops">
            <p>Không tìm thấy workshop nào</p>
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
                  title="Xóa workshop"
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredWorkshops.length > 0 && (
        <div className="workshop-stats-footer">
          <p>Hiển thị {filteredWorkshops.length} trong tổng số {workshops.length} workshop</p>
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