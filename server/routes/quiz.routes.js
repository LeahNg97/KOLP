const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getQuizByCourse,
  getQuizByCourseForInstructor,
  submitQuiz,
  getSubmissionsByQuiz,
  getSummaryByCourse,
  updateQuiz,
  approveCourseCompletion,
  getStudentQuizProgress,
  getQuizzesByInstructor
} = require('../controllers/quiz.controller');

const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/quizzes:
 *   post:
 *     summary: Create a new quiz (Instructor/Admin only)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - title
 *               - questions
 *             properties:
 *               courseId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - question
 *                     - options
 *                     - correctAnswer
 *                   properties:
 *                     question:
 *                       type: string
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                     correctAnswer:
 *                       type: number
 *               timeLimit:
 *                 type: number
 *               passingScore:
 *                 type: number
 *     responses:
 *       201:
 *         description: Quiz created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quiz'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post('/', verifyToken, authorizeRole('instructor', 'admin'), createQuiz);

/**
 * @swagger
 * /api/quizzes/{quizId}:
 *   put:
 *     summary: Update quiz (Instructor/Admin only)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               questions:
 *                 type: array
 *               timeLimit:
 *                 type: number
 *               passingScore:
 *                 type: number
 *     responses:
 *       200:
 *         description: Quiz updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Quiz not found
 */
router.put('/:quizId', verifyToken, authorizeRole('instructor', 'admin'), updateQuiz);

/**
 * @swagger
 * /api/quizzes/course/{courseId}:
 *   get:
 *     summary: Get quiz for a course (Student only)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Quiz details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quiz'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Quiz not found
 */
router.get('/course/:courseId', verifyToken, authorizeRole('student'), getQuizByCourse);

/**
 * @swagger
 * /api/quizzes/course/{courseId}/instructor:
 *   get:
 *     summary: Get quiz for instructor view (Instructor/Admin only)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Quiz details with answers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quiz'
 *       401:
 *         description: Unauthorized
 */
router.get('/course/:courseId/instructor', verifyToken, authorizeRole('instructor', 'admin'), getQuizByCourseForInstructor);

/**
 * @swagger
 * /api/quizzes/instructor:
 *   get:
 *     summary: Get all quizzes by current instructor
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of instructor's quizzes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Quiz'
 *       401:
 *         description: Unauthorized
 */
router.get('/instructor', verifyToken, authorizeRole('instructor', 'admin'), getQuizzesByInstructor);

/**
 * @swagger
 * /api/quizzes/submit:
 *   post:
 *     summary: Submit quiz answers (Student only)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quizId
 *               - answers
 *             properties:
 *               quizId:
 *                 type: string
 *               answers:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       200:
 *         description: Quiz submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: number
 *                 passed:
 *                   type: boolean
 *                 totalQuestions:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post('/submit', verifyToken, authorizeRole('student'), submitQuiz);

/**
 * @swagger
 * /api/quizzes/{quizId}/submissions:
 *   get:
 *     summary: Get quiz submissions (Instructor/Admin only)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: List of quiz submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   studentId:
 *                     type: string
 *                   score:
 *                     type: number
 *                   passed:
 *                     type: boolean
 *                   submittedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/:quizId/submissions', verifyToken, authorizeRole('instructor', 'admin'), getSubmissionsByQuiz);

/**
 * @swagger
 * /api/quizzes/course/{courseId}/summary:
 *   get:
 *     summary: Get quiz summary for a course (Instructor/Admin only)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Quiz summary statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSubmissions:
 *                   type: number
 *                 averageScore:
 *                   type: number
 *                 passRate:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/course/:courseId/summary', verifyToken, authorizeRole('instructor', 'admin'), getSummaryByCourse);

/**
 * @swagger
 * /api/quizzes/course/{courseId}/approve/{studentId}:
 *   post:
 *     summary: Approve course completion for student (Instructor/Admin only)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Course completion approved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course or student not found
 */
router.post('/course/:courseId/approve/:studentId', verifyToken, authorizeRole('instructor', 'admin'), approveCourseCompletion);

/**
 * @swagger
 * /api/quizzes/course/{courseId}/student/{studentId}:
 *   get:
 *     summary: Get student's quiz progress in a course (Instructor/Admin only)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student's quiz progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasSubmitted:
 *                   type: boolean
 *                 score:
 *                   type: number
 *                 passed:
 *                   type: boolean
 *                 submittedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course or student not found
 */
router.get('/course/:courseId/student/:studentId', verifyToken, authorizeRole('instructor', 'admin'), getStudentQuizProgress);

module.exports = router;
