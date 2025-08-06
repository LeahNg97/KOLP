import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Get students enrolled in a specific course
export const getStudentsByCourse = async (courseId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/enrollments/by-course/${courseId}/students`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Approve student enrollment
export const approveEnrollment = async (enrollmentId) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_BASE_URL}/enrollments/${enrollmentId}/approve`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Reject student enrollment (delete enrollment)
export const rejectEnrollment = async (enrollmentId) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_BASE_URL}/enrollments/${enrollmentId}/reject`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}; 