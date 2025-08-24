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
  
  // Transform the data to match the new server structure
  const transformedData = {
    title: courseData.title,
    subtitle: courseData.subtitle || '',
    description: courseData.description,
    level: courseData.level || 'beginner',
    priceType: courseData.price > 0 ? 'paid' : 'free',
    price: courseData.price || 0,
    salePrice: courseData.salePrice,
    currency: courseData.currency || 'AUD',
    thumbnailUrl: courseData.thumbnailUrl,
    promoVideoUrl: courseData.promoVideoUrl,
    introductionAssets: courseData.introductionAssets || [],
    status: courseData.status || 'draft',
    // Optional: seed modules and lessons if provided
    modules: courseData.modules?.map(module => ({
      title: module.title,
      summary: module.summary,
      order: module.order,
      lessons: module.lessons?.map(lesson => ({
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        contentType: lesson.contentType,
        url: lesson.url,
        textContent: lesson.textContent,
        durationSec: lesson.durationSec || 0,
        isPreview: lesson.isPreview || false
      }))
    })) || []
  };

  const response = await axios.post(`${API_BASE_URL}/courses`, transformedData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Update a course
export const updateCourse = async (courseId, courseData) => {
  const token = localStorage.getItem('token');
  
  // Transform the data to match the new server structure
  const transformedData = {
    title: courseData.title,
    subtitle: courseData.subtitle || '',
    description: courseData.description,
    level: courseData.level || 'beginner',
    priceType: courseData.price > 0 ? 'paid' : 'free',
    price: courseData.price || 0,
    salePrice: courseData.salePrice,
    currency: courseData.currency || 'AUD',
    thumbnailUrl: courseData.thumbnailUrl,
    promoVideoUrl: courseData.promoVideoUrl,
    introductionAssets: courseData.introductionAssets || [],
    isPublished: courseData.isPublished || false
  };

  const response = await axios.put(`${API_BASE_URL}/courses/${courseId}`, transformedData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Update course status (instructor only: draft, pending)
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

// Get course syllabus (modules and lessons)
export const getCourseSyllabus = async (courseId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/courses/${courseId}/syllabus`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};



// ===== MODULE MANAGEMENT =====

// Create a new module
export const createModule = async (courseId, moduleData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_BASE_URL}/modules`, {
    courseId,
    title: moduleData.title,
    summary: moduleData.summary,
    order: moduleData.order
  }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Update a module
export const updateModule = async (moduleId, moduleData) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_BASE_URL}/modules/${moduleId}`, moduleData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Delete a module
export const deleteModule = async (moduleId) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_BASE_URL}/modules/${moduleId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// ===== LESSON MANAGEMENT =====

// Create a new lesson
export const createLesson = async (lessonData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_BASE_URL}/lessons`, lessonData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Update a lesson
export const updateLesson = async (lessonId, lessonData) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_BASE_URL}/lessons/${lessonId}`, lessonData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Delete a lesson
export const deleteLesson = async (lessonId) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_BASE_URL}/lessons/${lessonId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

