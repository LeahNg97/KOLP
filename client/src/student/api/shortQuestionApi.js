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

// Short Question Progress API functions
export const shortQuestionProgressApi = {
  // Start short question
  startShortQuestion: async (shortQuestionId) => {
    try {
      const response = await api.post(`/short-questions/${shortQuestionId}/start`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to start short question');
    }
  },

  // Submit short question
  submitShortQuestion: async (shortQuestionId, attemptId, answers, timeSpent) => {
    try {
      const response = await api.post(`/short-questions/${shortQuestionId}/submit`, {
        attemptId,
        answers,
        timeSpent
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit short question');
    }
  },

  // Get short question results
  getShortQuestionResults: async (shortQuestionId, attemptId = null) => {
    try {
      const url = attemptId 
        ? `/short-questions/${shortQuestionId}/results/${attemptId}`
        : `/short-questions/${shortQuestionId}/results`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch short question results');
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
  }
};

export default shortQuestionProgressApi;
