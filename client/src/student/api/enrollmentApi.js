import axios from 'axios';


const API_BASE_URL = 'http://localhost:8080/api';// Adjust the base URL as needed


// Get student's enrolled courses
export const getMyEnrollments = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/enrollments/my-courses`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};


// Cancel enrollment
export const cancelEnrollment = async (enrollmentId) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_BASE_URL}/enrollments/${enrollmentId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};


// Enroll in a course
export const enrollCourse = async (courseId) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_BASE_URL}/enrollments`,
    { courseId },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

