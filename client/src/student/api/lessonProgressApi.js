import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Mark lesson as completed
export const markLessonCompleted = async (courseId, lessonId, moduleId) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_BASE_URL}/lesson-progress/complete`,
    {
      courseId,
      lessonId,
      moduleId
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// Mark lesson as incomplete
export const markLessonIncomplete = async (courseId, lessonId) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_BASE_URL}/lesson-progress/incomplete`,
    {
      courseId,
      lessonId
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// Get lesson progress for a course
export const getLessonProgress = async (courseId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_BASE_URL}/lesson-progress/course/${courseId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// Get overall course progress
export const getCourseProgress = async (courseId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_BASE_URL}/lesson-progress/course/${courseId}/progress`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// Update lesson access time
export const updateLessonAccess = async (courseId, lessonId, moduleId, timeSpent = 0) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_BASE_URL}/lesson-progress/access`,
    {
      courseId,
      lessonId,
      moduleId,
      timeSpent
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};
