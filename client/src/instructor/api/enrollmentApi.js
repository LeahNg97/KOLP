import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Test backend connectivity
export const testBackendConnection = async () => {
  try {
    console.log('API: Testing backend connection...');
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/`, {
      timeout: 5000,
      timeoutErrorMessage: 'Connection timed out. Please check your internet connection or server status.'
    });
    console.log('API: Backend connection test successful:', response.status);
    return true;
  } catch (error) {
    console.error('API: Backend connection test failed:', error.message);
    return false;
  }
};

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

// Get all students enrolled in instructor's courses
export const getInstructorStudents = async () => {
  const token = localStorage.getItem('token');
  console.log('API: Getting instructor students');
  console.log('API: Using token:', token ? 'Token exists' : 'No token');
  console.log('API: Full URL:', `${API_BASE_URL}/enrollments/instructor-students`);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/enrollments/instructor-students`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
    });
    console.log('API: Get students response status:', response.status);
    console.log('API: Get students response data length:', response.data?.length);
    return response.data;
  } catch (error) {
    console.error('API: Get students request failed:', error);
    console.error('API: Error response:', error.response);
    console.error('API: Error status:', error.response?.status);
    console.error('API: Error data:', error.response?.data);
    throw error;
  }
};

// Approve student enrollment
export const approveEnrollment = async (enrollmentId) => {
  const token = localStorage.getItem('token');
  console.log('API: Approving enrollment with ID:', enrollmentId);
  console.log('API: Using token:', token ? 'Token exists' : 'No token');
  console.log('API: Full URL:', `${API_BASE_URL}/enrollments/${enrollmentId}/approve`);
  
  try {
    const response = await axios.put(`${API_BASE_URL}/enrollments/${enrollmentId}/approve`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      },
    });
    console.log('API: Approve response status:', response.status);
    console.log('API: Approve response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Approve request failed:', error);
    console.error('API: Error response:', error.response);
    console.error('API: Error status:', error.response?.status);
    console.error('API: Error data:', error.response?.data);
    throw error;
  }
};

// Reject student enrollment (delete enrollment)
export const rejectEnrollment = async (enrollmentId) => {
  const token = localStorage.getItem('token');
  console.log('API: Rejecting enrollment with ID:', enrollmentId);
  console.log('API: Using token:', token ? 'Token exists' : 'No token');
  console.log('API: Full URL:', `${API_BASE_URL}/enrollments/${enrollmentId}/reject`);
  
  try {
    const response = await axios.delete(`${API_BASE_URL}/enrollments/${enrollmentId}/reject`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('API: Reject response status:', response.status);
    console.log('API: Reject response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Reject request failed:', error);
    console.error('API: Error response:', error.response);
    console.error('API: Error status:', error.response?.status);
    console.error('API: Error data:', error.response?.data);
    throw error;
  }
};

// Get student lesson progress for instructor
export const getStudentLessonProgress = async (courseId, studentId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/lesson-progress/course/${courseId}/student/${studentId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Get student course progress for instructor
export const getStudentCourseProgress = async (courseId, studentId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/lesson-progress/course/${courseId}/student/${studentId}/progress`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Get student quiz progress for instructor
export const getStudentQuizProgress = async (courseId, studentId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/quiz-progress/courses/${courseId}/student/${studentId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Get student short question progress for instructor
export const getStudentShortQuestionProgress = async (courseId, studentId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/short-questions/course/${courseId}/student/${studentId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}; 