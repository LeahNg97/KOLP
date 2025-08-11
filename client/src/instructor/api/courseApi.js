import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Get instructor's courses
export const getMyCourses = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/courses/my-courses`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Create a new course
export const createCourse = async (courseData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_BASE_URL}/courses`, courseData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Update a course
export const updateCourse = async (courseId, courseData) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_BASE_URL}/courses/${courseId}`, courseData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Update course status
export const updateCourseStatus = async (courseId, status) => {
  const token = localStorage.getItem('token');
  const response = await axios.patch(`${API_BASE_URL}/courses/${courseId}/status`, { status }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Delete a course
export const deleteCourse = async (courseId) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_BASE_URL}/courses/${courseId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Get course by ID
export const getCourseById = async (courseId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/courses/${courseId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}; 

//Get all student enrolled in instructor's course (Instructor only)
export const getStudentsByCourse = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/enrollments/instructor-students`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

