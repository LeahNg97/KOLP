import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Login user, lúc đăng nhập sẽ nhận token từ server
export const loginUser = async (credentials) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);// Authenticate user and receive JWT token
  return response.data;
};

// Register user
export const registerUser = async (userData) => {
  const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);// Register a new user
  return response.data;
};

// Change password (if implemented in backend)
export const changePassword = async (passwordData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_BASE_URL}/auth/change-password`, passwordData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Get current user profile, đế lấy thông tin người dùng đã đăng nhập
export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Logout (client-side only, no API call needed)
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
};