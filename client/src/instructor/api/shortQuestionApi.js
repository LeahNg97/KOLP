import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Short Question API functions
export const shortQuestionApi = {
  // Create new short question
  createShortQuestion: async (shortQuestionData) => {
    try {
      const response = await api.post('/short-questions', shortQuestionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create short question');
    }
  },

  // Get short questions by course ID
  getShortQuestionsByCourseId: async (courseId) => {
    try {
      const response = await api.get(`/short-questions/course/${courseId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch short questions');
    }
  },

  // Get short question by ID
  getShortQuestionById: async (shortQuestionId) => {
    try {
      const response = await api.get(`/short-questions/${shortQuestionId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch short question');
    }
  },

  // Update short question
  updateShortQuestion: async (shortQuestionId, updateData) => {
    try {
      const response = await api.put(`/short-questions/${shortQuestionId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update short question');
    }
  },

  // Delete short question
  deleteShortQuestion: async (shortQuestionId) => {
    try {
      const response = await api.delete(`/short-questions/${shortQuestionId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete short question');
    }
  },

  // Get short question results by course ID
  getShortQuestionResultsByCourseId: async (courseId) => {
    try {
      const response = await api.get(`/short-questions/course/${courseId}/results`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch short question results');
    }
  }
};

export default shortQuestionApi;
