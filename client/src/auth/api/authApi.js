import axios from 'axios';


const API_BASE_URL = 'http://localhost:8080/api';


// Login user
export const loginUser = async (credentials) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
  return response.data;
};


// Register user
export const registerUser = async (userData) => {
  const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
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


// Get current user profile
export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};


// Update user profile
export const updateUserProfile = async (profileData) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_BASE_URL}/auth/profile`, profileData, {
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





