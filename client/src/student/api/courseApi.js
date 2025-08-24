import axios from 'axios';

export async function fetchActiveCourses(token) {
  const res = await axios.get('http://localhost:8080/api/courses/active', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
}

export async function getCourseByID(token, courseId) {
  const res = await axios.get(`http://localhost:8080/api/courses/${courseId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return res.data;
}

export async function getQuizzesByCourseId(token, courseId) {
  const res = await axios.get(`http://localhost:8080/api/quizzes/course/${courseId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return res.data;
}

// Get course syllabus (sections and lessons)
export async function getCourseSyllabus(token, courseId) {
  const res = await axios.get(`http://localhost:8080/api/courses/${courseId}/syllabus`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return res.data;
}



