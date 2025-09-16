import { useEffect, useState } from 'react';
import axios from 'axios';
import './UserManagement.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    
    name: '',
    email: '',
    role: 'student'
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:8080/api/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setDeletingId(id);
    try {
      await axios.delete(`http://localhost:8080/api/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = (user) => {
    setSelectedUser(user);
    setUpdateForm({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      // Chỉ gửi tên để cập nhật
      await axios.put(`http://localhost:8080/api/users/${selectedUser._id}`, {
        name: updateForm.name
      });
      // Cập nhật danh sách users
      setUsers(users.map(user => 
        user._id === selectedUser._id 
          ? { ...user, name: updateForm.name }
          : user
      ));
      setShowUpdateModal(false);
      setSelectedUser(null);
      alert('User updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdateCancel = () => {
    setShowUpdateModal(false);
    setSelectedUser(null);
    setUpdateForm({
      name: '',
      email: '',
      role: 'student'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const filteredUsers = users.filter(user => {
  const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="admin-layout">
      <main className="admin-main">
        <h1>User Management</h1>
          {/* Search and Filter Controls */}
        <div className="user-filters" style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="user-search-input"
          />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="user-role-filter"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {loading ? (
          <div className="user-loading">Loading users...</div>
        ) : error ? (
          <div className="user-error">{error}</div>
        ) : (
          <div className="user-table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{new Date(user.createdAt).toLocaleString()}</td>
                    <td>
                      <button className="user-btn user-update" onClick={() => handleUpdate(user)}>
                        Update
                      </button>
                      <button
                        className="user-btn user-delete"
                        onClick={() => handleDelete(user._id)}
                        disabled={deletingId === user._id}
                      >
                        {deletingId === user._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Update User Modal */}
      {showUpdateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Update User</h2>
              <button className="modal-close" onClick={handleUpdateCancel}>
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="update-form">
              <div className="form-group">
                <label htmlFor="name">Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={updateForm.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <div className="readonly-field">
                  {updateForm.email}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="role">Role:</label>
                <div className="readonly-field">
                  {updateForm.role.charAt(0).toUpperCase() + updateForm.role.slice(1)}
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleUpdateCancel}
                  disabled={updateLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-update"
                  disabled={updateLoading}
                >
                  {updateLoading ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 