import axios from "axios";

export async function getQuizByCourseId(token, courseId) {
    const res = await axios.get(`http://localhost:8080/api/quizzes/course/${courseId}/instructor`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
}

export async function getQuizResultsByCourseId(token, courseId) {
    const res = await axios.get(`http://localhost:8080/api/quizzes/course/${courseId}/summary`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
}

