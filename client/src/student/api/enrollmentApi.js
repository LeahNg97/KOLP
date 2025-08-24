import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Get student's enrolled courses
export const getMyEnrollments = async (token) => {
  const authToken = token || localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/enrollments/my-courses`, {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });
  return response.data;
};




// Cancel enrollment
export const cancelEnrollment = async (enrollmentId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    if (!enrollmentId) {
      throw new Error('Enrollment ID is required');
    }
    
    const response = await axios.delete(`${API_BASE_URL}/enrollments/${enrollmentId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Cancel enrollment response:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('Cancel enrollment API error:', error);
    throw error;
  }
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

export async function getEnrollmentByCourseId(token, courseId) {
  try {
    const authToken = token || localStorage.getItem('token');
    
    if (!authToken) {
      throw new Error('No authentication token found');
    }
    
    if (!courseId) {
      throw new Error('Course ID is required');
    }
    
    const res = await axios.get(`http://localhost:8080/api/enrollments/my-courses`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Filter the results to find enrollment for the specific course
    const enrollments = res.data;
    const enrollment = enrollments.find(enrollment => 
      enrollment.courseId?._id === courseId || enrollment.courseId === courseId
    );
    
    console.log('Found enrollment:', enrollment);
    return enrollment || null; // Return null if no enrollment found
    
  } catch (error) {
    console.error('Get enrollment by course ID error:', error);
    // Return null if there's an error (user not enrolled)
    return null;
  }
}

export async function createEnrollment(token, courseId) {
  try {
    const authToken = token || localStorage.getItem('token');
    
    if (!authToken) {
      throw new Error('No authentication token found');
    }
    
    if (!courseId) {
      throw new Error('Course ID is required');
    }
    
    console.log('Creating enrollment for course:', courseId);
    
    const res = await axios.post(`${API_BASE_URL}/enrollments`, { courseId }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('Enrollment created successfully:', res.data);
    return res.data;
    
  } catch (error) {
    console.error('Create enrollment error:', error);
    throw error;
  }
}

export async function enrollInCourse(token, courseId) {
  const authToken = token || localStorage.getItem('token');
  const res = await axios.post('http://localhost:8080/api/enrollments', { courseId }, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  return res.data;
}