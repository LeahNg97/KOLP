import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/quiz-progress';

// Get quiz progress for a course
export async function getQuizProgress(token, courseId) {
  try {
    const res = await axios.get(`${API_BASE_URL}/courses/${courseId}/progress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    console.error('Error fetching quiz progress:', error);
    throw error;
  }
}

// Get course progress summary
export async function getCourseProgress(token, courseId) {
  try {
    const res = await axios.get(`${API_BASE_URL}/courses/${courseId}/progress/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    console.error('Error fetching course progress:', error);
    throw error;
  }
}

// Start quiz attempt
export async function startQuiz(token, courseId) {
  try {
    const res = await axios.post(`${API_BASE_URL}/courses/${courseId}/start`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    console.error('Error starting quiz:', error);
    throw error;
  }
}

// Submit quiz answers
export async function submitQuiz(token, courseId, attemptId, answers, timeSpent) {
  try {
    const res = await axios.post(`${API_BASE_URL}/courses/${courseId}/submit`, {
      attemptId,
      answers,
      timeSpent
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    console.error('Error submitting quiz:', error);
    throw error;
  }
}

// Get quiz results for review
export async function getQuizResults(token, courseId) {
  try {
    const res = await axios.get(`${API_BASE_URL}/courses/${courseId}/results`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    throw error;
  }
}
