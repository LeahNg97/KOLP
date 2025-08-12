import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const paymentApi = {
  // Create payment and enroll in course
  createPayment: async (courseId, paymentMethod, amount) => {
    try {
      const response = await api.post('/payments/create', {
        courseId,
        paymentMethod,
        amount
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get student's payment history
  getPaymentHistory: async () => {
    try {
      const response = await api.get('/payments/student');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get specific payment details
  getPaymentById: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};