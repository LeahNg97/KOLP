const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Get detailed course progress breakdown
export const getCourseProgressBreakdown = async (courseId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/course-progress/${courseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching course progress breakdown:', error);
    throw error;
  }
};

// Update course progress
export const updateCourseProgress = async (courseId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/course-progress/${courseId}/update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating course progress:', error);
    throw error;
  }
};
