import axios from "axios";

export async function getQuizByCourseId(token, courseId) {
    try {
        // This route is public, so we don't need to send the token
        const res = await axios.get(`http://localhost:8080/api/quizzes/courses/${courseId}/quizzes`);
        console.log('🔍 Raw API response:', res.data);
        // Return the data array directly from the response
        return res.data.data || [];
    } catch (error) {
        console.error('Error fetching quiz by course ID:', error);
        // Return empty array instead of throwing error for better UX
        return [];
    }
}

export async function getQuizResultsByCourseId(token, courseId) {
    try {
        // For now, return empty submissions since we don't have a submissions endpoint yet
        return { submissions: [] };
    } catch (error) {
        console.error('Error fetching quiz results by course ID:', error);
        throw error;
    }
}

export async function createQuiz(token, quizData) {
    try {
        const res = await axios.post('http://localhost:8080/api/quizzes', quizData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    } catch (error) {
        console.error('Error creating quiz:', error);
        throw error;
    }
}

export async function updateQuiz(token, quizId, quizData) {
    try {
        const res = await axios.put(`http://localhost:8080/api/quizzes/${quizId}`, quizData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    } catch (error) {
        console.error('Error updating quiz:', error);
        throw error;
    }
}

