const Quiz = require('../models/quiz.model');
const Submission = require('../models/submission.model');
const Enrollment = require('../models/enrollment.model');


exports.submitQuiz = async (req, res) => {
    const { quizId, quizSetId, answers } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz không tồn tại' });


    let quizSet, correctAnswers, totalQuestions;


    // Handle both old format (questions) and new format (quizSets)
    if (quiz.quizSets && quiz.quizSets.length > 0) {
        // New format with quizSets
        quizSet = quiz.quizSets.find(set => set._id.toString() === quizSetId);
        if (!quizSet) return res.status(404).json({ message: 'Quiz set không tồn tại' });
        correctAnswers = quizSet.questions.map(q => q.answer);
        totalQuestions = quizSet.questions.length;
    } else if (quiz.questions && quiz.questions.length > 0) {
        // Old format - use quiz ID as quizSetId
        if (quizSetId !== quiz._id.toString()) {
            return res.status(404).json({ message: 'Quiz set không tồn tại' });
        }
        correctAnswers = quiz.questions.map(q => q.answer);
        totalQuestions = quiz.questions.length;
    } else {
        return res.status(404).json({ message: 'Quiz không có câu hỏi' });
    }


    // ❌ Không cho nộp nhiều lần cho cùng một quiz set
    const existing = await Submission.findOne({
        quizId,
        quizSetId,
        studentId: req.user.id
    });
    if (existing) {
        return res.status(400).json({ message: 'Bạn đã nộp bài cho quiz set này rồi' });
    }


    let score = 0;
    for (let i = 0; i < answers.length; i++) {
        if (answers[i] === correctAnswers[i]) score++;
    }


    const submission = await Submission.create({
        quizId,
        quizSetId,
        studentId: req.user.id,
        answers,
        score
    });


    // Calculate progress based on completed quiz sets
    const enrollment = await Enrollment.findOne({
        studentId: req.user.id,
        courseId: quiz.courseId
    });


    if (enrollment) {
        const percent = (score / totalQuestions) * 100;
        const passed = percent >= 60;


        // Always add to attempted quiz sets if not already there
        if (!enrollment.attemptedQuizSets.includes(quizSetId)) {
            enrollment.attemptedQuizSets.push(quizSetId);
        }


        if (passed) {
            // Add to completed quiz sets if not already there
            if (!enrollment.completedQuizSets.includes(quizSetId)) {
                enrollment.completedQuizSets.push(quizSetId);
            }
        }


        // Calculate progress percentage based on active quiz sets
        let activeQuizSetsCount;
        if (quiz.quizSets && quiz.quizSets.length > 0) {
            activeQuizSetsCount = quiz.quizSets.filter(set => set.isActive !== false).length;
        } else {
            // Old format - count as 1 quiz set
            activeQuizSetsCount = 1;
        }


        // Progress based on attempted quizzes (shows completion of all quizzes)
        const attemptedProgressPercentage = activeQuizSetsCount > 0
            ? Math.round((enrollment.attemptedQuizSets.length / activeQuizSetsCount) * 100)
            : 0;


        // Passed progress based on passed quizzes (shows quality of performance)
        const passedProgressPercentage = activeQuizSetsCount > 0
            ? Math.round((enrollment.completedQuizSets.length / activeQuizSetsCount) * 100)
            : 0;


        // Course is completed when all active quiz sets are attempted AND instructor approves
        const allQuizSetsAttempted = enrollment.attemptedQuizSets.length === activeQuizSetsCount;
        const courseCompleted = allQuizSetsAttempted && enrollment.instructorApproved;


        enrollment.progress = attemptedProgressPercentage; // Use attempted progress for main progress
        enrollment.completed = courseCompleted;
        await enrollment.save();
    }


    res.status(201).json({
        message: '✅ Nộp bài thành công',
        score,
        passed: (score / totalQuestions) * 100 >= 60,
        quizSetId
    });
};


// Instructor tạo quiz
exports.createQuiz = async (req, res) => {
    const { courseId, quizSets } = req.body;
   
    // Log the incoming data for debugging, in ra xem có lấy dữ liệu trên FE đúng k
    console.log('Creating quiz with data:', { courseId, quizSets });
    console.log('QuizSets type:', typeof quizSets);
    console.log('QuizSets length:', quizSets?.length);
    console.log('QuizSets content:', JSON.stringify(quizSets, null, 2));
   
    // Validate input, kiếm tra dữ liệu có hợp lệ không
    if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required' });
    }
   
    if (!quizSets || !Array.isArray(quizSets) || quizSets.length === 0) {
        return res.status(400).json({ message: 'Quiz sets are required and must be an array' });
    }
   
    // Validate each quiz set, duyệt mảng quizSets
    for (let i = 0; i < quizSets.length; i++) {
        const quizSet = quizSets[i];
        if (!quizSet.name || !quizSet.questions || !Array.isArray(quizSet.questions)) {
            return res.status(400).json({
                message: `Quiz set ${i + 1} must have name and questions array`
            });
        }
       
        if (quizSet.questions.length === 0) {
            return res.status(400).json({
                message: `Quiz set ${i + 1} must have at least one question`
            });
        }
       
        // Validate each question
        for (let j = 0; j < quizSet.questions.length; j++) {
            const question = quizSet.questions[j];
            if (!question.text || !question.options || !Array.isArray(question.options) || question.options.length < 2) {
                return res.status(400).json({
                    message: `Question ${j + 1} in quiz set ${i + 1} must have text and at least 2 options`
                });
            }
           
            if (!question.answer || !question.options.includes(question.answer)) {
                return res.status(400).json({
                    message: `Question ${j + 1} in quiz set ${i + 1} must have a valid answer from options`
                });
            }
        }
    }
   
    try {
        // Check if instructor owns this course
        const Course = require('../models/course.model');
        const course = await Course.findById(courseId);
        if (!course || course.instructorId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Bạn không có quyền tạo quiz cho khóa học này' });
        }


        console.log('Course found:', course.title);
        console.log('Instructor ID:', req.user.id);
        console.log('Course instructor ID:', course.instructorId.toString());


        const quiz = await Quiz.create({ courseId, quizSets });
        console.log('Quiz created successfully:', quiz._id);
        console.log('Created quiz data:', JSON.stringify(quiz, null, 2));
        res.status(201).json(quiz);
    } catch (err) {
        console.error('Error creating quiz:', err);
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
};


// Instructor cập nhật quiz
exports.updateQuiz = async (req, res) => {
    const { quizId } = req.params;
    const { quizSets } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz không tồn tại' });


    // Check if instructor owns this course
    const Course = require('../models/course.model');
    const course = await Course.findById(quiz.courseId);
    if (!course || course.instructorId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa quiz này' });
    }


    // Build a map of existing quiz sets by _id (as string)
    const existingSetsMap = {};
    quiz.quizSets.forEach(set => {
        if (set._id) existingSetsMap[set._id.toString()] = set;
    });


    // Build new quizSets array
    const newQuizSets = quizSets.map(set => {
        if (set._id && existingSetsMap[set._id]) {
            // Update existing set (preserve _id)
            return {
                ...existingSetsMap[set._id.toString()].toObject(),
                ...set,
                _id: existingSetsMap[set._id.toString()]._id // ensure _id is ObjectId
            };
        } else {
            // New set (no _id or not found in existing)
            return set;
        }
    });


    quiz.quizSets = newQuizSets;
    await quiz.save();
    res.json(quiz);
};


// Student lấy quiz theo course
exports.getQuizByCourse = async (req, res) => {
    const quiz = await Quiz.findOne({ courseId: req.params.courseId });
    if (!quiz) return res.status(404).json({ message: 'Chưa có quiz cho khoá học này' });


    console.log('Quiz found for course:', req.params.courseId);
    console.log('Quiz data:', JSON.stringify(quiz, null, 2));


    // Get student's enrollment to check completed quiz sets
    const enrollment = await Enrollment.findOne({
        studentId: req.user.id,
        courseId: req.params.courseId
    });
   
    console.log('Student enrollment:', enrollment);
    console.log('Enrollment status:', enrollment?.status);


    // Get all submissions for this student in this course
    const submissions = await Submission.find({
        quizId: quiz._id,
        studentId: req.user.id
    });


    let quizSetsWithStatus = [];


    // Handle both old format (questions) and new format (quizSets)
    if (quiz.quizSets && quiz.quizSets.length > 0) {
        // New format with quizSets
        quizSetsWithStatus = quiz.quizSets.map(quizSet => {
            const submission = submissions.find(sub => sub.quizSetId === quizSet._id.toString());
            const isCompleted = submission && (submission.score / quizSet.questions.length) * 100 >= 60;
           
            // Hide answers when sending to student
            const hiddenQuestions = quizSet.questions.map(q => ({
                text: q.text,
                options: q.options
            }));


            return {
                quizSetId: quizSet._id,
                name: quizSet.name,
                questions: hiddenQuestions,
                isActive: quizSet.isActive !== false, // Default to true if not set
                hasSubmitted: !!submission,
                isCompleted: isCompleted,
                submission: submission ? {
                    score: submission.score,
                    totalQuestions: quizSet.questions.length,
                    percentage: Math.round((submission.score / quizSet.questions.length) * 100),
                    passed: (submission.score / quizSet.questions.length) * 100 >= 60,
                    submittedAt: submission.createdAt
                } : null
            };
        });
    } else if (quiz.questions && quiz.questions.length > 0) {
        // Old format - convert to quizSet format
        const submission = submissions.find(sub => !sub.quizSetId); // Old submissions don't have quizSetId
        const isCompleted = submission && (submission.score / quiz.questions.length) * 100 >= 60;
       
        // Hide answers when sending to student
        const hiddenQuestions = quiz.questions.map(q => ({
            text: q.text,
            options: q.options
        }));


        quizSetsWithStatus = [{
            quizSetId: quiz._id, // Use quiz ID as quizSetId for old format
            name: 'Course Quiz',
            questions: hiddenQuestions,
            isActive: true,
            hasSubmitted: !!submission,
            isCompleted: isCompleted,
            submission: submission ? {
                score: submission.score,
                totalQuestions: quiz.questions.length,
                percentage: Math.round((submission.score / quiz.questions.length) * 100),
                passed: (submission.score / quiz.questions.length) * 100 >= 60,
                submittedAt: submission.createdAt
            } : null
        }];
    }


    const response = {
        quizId: quiz._id,
        quizSets: quizSetsWithStatus,
        totalQuizSets: quizSetsWithStatus.filter(set => set.isActive !== false).length,
        attemptedQuizSets: enrollment?.attemptedQuizSets?.length || 0,
        completedQuizSets: enrollment?.completedQuizSets?.length || 0,
        progress: enrollment?.progress || 0,
        instructorApproved: enrollment?.instructorApproved || false,
        completed: enrollment?.completed || false
    };


    res.json(response);
};


// Instructor lấy quiz theo course (có đáp án)
exports.getQuizByCourseForInstructor = async (req, res) => {
    const quiz = await Quiz.findOne({ courseId: req.params.courseId });
    if (!quiz) return res.status(404).json({ message: 'Quiz for this course is not available' });


    console.log('Instructor - Quiz found for course:', req.params.courseId);
    console.log('Instructor - Quiz data:', JSON.stringify(quiz, null, 2));


    // Check if instructor owns this course
    const Course = require('../models/course.model');
    const course = await Course.findById(req.params.courseId);
    if (!course || course.instructorId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Bạn không có quyền xem quiz này' });
    }


    let quizSets = [];
    let totalQuizSets = 0;


    // Handle both old format (questions) and new format (quizSets)
    if (quiz.quizSets && quiz.quizSets.length > 0) {
        // New format with quizSets
        quizSets = quiz.quizSets;
        totalQuizSets = quiz.quizSets.filter(set => set.isActive !== false).length;
    } else if (quiz.questions && quiz.questions.length > 0) {
        // Old format - convert to quizSet format
        quizSets = [{
            _id: quiz._id,
            name: 'Course Quiz',
            questions: quiz.questions,
            isActive: true
        }];
        totalQuizSets = 1;
    }


    // Return full quiz data with answers for instructor
    const response = {
        quizId: quiz._id,
        quizSets: quizSets,
        totalQuizSets: totalQuizSets
    };


    res.json(response);
};


// Instructor xem bài nộp theo quiz
exports.getSubmissionsByQuiz = async (req, res) => {
    const submissions = await Submission.find({ quizId: req.params.quizId })
        .populate('studentId', 'name email')
        .sort({ score: -1 });
    res.json(submissions);
};


exports.getMySubmission = async (req, res) => {
    const { quizId } = req.params;
    const submission = await Submission.findOne({
        quizId,
        studentId: req.user.id
    });


    if (!submission) return res.status(404).json({ message: 'Bạn chưa làm bài' });


    res.json(submission);
};


exports.getSummaryByCourse = async (req, res) => {
    const { courseId } = req.params;


    const quiz = await Quiz.findOne({ courseId });
    if (!quiz) return res.status(404).json({ message: 'Không có quiz' });


    const submissions = await Submission.find({ quizId: quiz._id })
        .populate('studentId', 'name email')
        .sort({ score: -1 });


    res.json({
        quizId: quiz._id,
        totalQuizSets: quiz.quizSets.length,
        submissions
    });
};


// Instructor approve course completion for a student
exports.approveCourseCompletion = async (req, res) => {
    const { courseId, studentId } = req.params;
   
    try {
        // Check if instructor owns this course
        const Course = require('../models/course.model');
        const course = await Course.findById(courseId);
        if (!course || course.instructorId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Bạn không có quyền phê duyệt khóa học này' });
        }


        const enrollment = await Enrollment.findOne({ courseId, studentId });
        if (!enrollment) {
            return res.status(404).json({ message: 'Không tìm thấy đăng ký khóa học' });
        }


        // Check if student has attempted all active quiz sets
        const quiz = await Quiz.findOne({ courseId });
        if (quiz) {
            const activeQuizSets = quiz.quizSets.filter(set => set.isActive);
            const allQuizSetsAttempted = enrollment.attemptedQuizSets.length === activeQuizSets.length;
           
            if (!allQuizSetsAttempted) {
                return res.status(400).json({
                    message: 'Học viên chưa thực hiện tất cả các bài quiz'
                });
            }
        }


        enrollment.instructorApproved = true;
        enrollment.completed = true;
        enrollment.graduatedAt = new Date();
        await enrollment.save();


        res.json({
            message: 'Phê duyệt hoàn thành khóa học thành công',
            enrollment
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
};


// Instructor fetches a student's quiz progress in a course
exports.getStudentQuizProgress = async (req, res) => {
    const { courseId, studentId } = req.params;
    try {
        const quiz = await Quiz.findOne({ courseId });
        if (!quiz) return res.status(404).json({ message: 'No quiz for this course.' });


        const enrollment = await Enrollment.findOne({ courseId, studentId });
        if (!enrollment) return res.status(404).json({ message: 'Student not enrolled.' });


        const submissions = await Submission.find({ quizId: quiz._id, studentId });


        let quizSetsWithStatus = [];
        if (quiz.quizSets && quiz.quizSets.length > 0) {
            quizSetsWithStatus = quiz.quizSets.map(quizSet => {
                const submission = submissions.find(sub => sub.quizSetId === quizSet._id.toString());
                const isCompleted = submission && (submission.score / quizSet.questions.length) * 100 >= 60;
                const hiddenQuestions = quizSet.questions.map(q => ({
                    text: q.text,
                    options: q.options
                }));
                return {
                    quizSetId: quizSet._id,
                    name: quizSet.name,
                    questions: hiddenQuestions,
                    isActive: quizSet.isActive !== false,
                    hasSubmitted: !!submission,
                    isCompleted: isCompleted,
                    submission: submission ? {
                        score: submission.score,
                        totalQuestions: quizSet.questions.length,
                        percentage: Math.round((submission.score / quizSet.questions.length) * 100),
                        passed: (submission.score / quizSet.questions.length) * 100 >= 60,
                        submittedAt: submission.createdAt
                    } : null
                };
            });
        } else if (quiz.questions && quiz.questions.length > 0) {
            const submission = submissions.find(sub => !sub.quizSetId);
            const isCompleted = submission && (submission.score / quiz.questions.length) * 100 >= 60;
            const hiddenQuestions = quiz.questions.map(q => ({
                text: q.text,
                options: q.options
            }));
            quizSetsWithStatus = [{
                quizSetId: quiz._id,
                name: 'Course Quiz',
                questions: hiddenQuestions,
                isActive: true,
                hasSubmitted: !!submission,
                isCompleted: isCompleted,
                submission: submission ? {
                    score: submission.score,
                    totalQuestions: quiz.questions.length,
                    percentage: Math.round((submission.score / quiz.questions.length) * 100),
                    passed: (submission.score / quiz.questions.length) * 100 >= 60,
                    submittedAt: submission.createdAt
                } : null
            }];
        }


        // If student has graduated, always return completed = true and progress = 100%
        const graduated = !!enrollment?.graduatedAt;
        res.json({
            quizId: quiz._id,
            quizSets: quizSetsWithStatus,
            totalQuizSets: quizSetsWithStatus.filter(set => set.isActive !== false).length,
            completedQuizSets: enrollment?.completedQuizSets?.length || 0,
            progress: graduated ? 100 : (enrollment?.progress || 0),
            instructorApproved: enrollment?.instructorApproved || false,
            completed: graduated ? true : (enrollment?.completed || false),
            graduatedAt: enrollment?.graduatedAt || null
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

// Instructor lấy toàn bộ quiz mình tạo
exports.getQuizzesByInstructor = async (req, res) => {
    try {
        // Get all courses owned by this instructor
        const Course = require('../models/course.model');
        const courses = await Course.find({ instructorId: req.user.id });
        const courseIds = courses.map(course => course._id);

        // Get all quizzes for these courses
        const quizzes = await Quiz.find({ courseId: { $in: courseIds } })
            .populate('courseId', 'title');

        res.json(quizzes);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
};



