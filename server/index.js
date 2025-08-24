require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./configs/db');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const courseRoutes = require('./routes/course.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const quizRoutes = require('./routes/quiz.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const certRoutes = require('./routes/certificate.routes');
const paymentRoutes = require('./routes/payment.routes');
const notificationRoutes = require('./routes/notification.routes');
const moduleRoutes = require('./routes/module.routes');
const lessonRoutes = require('./routes/lesson.routes');
const lessonProgressRoutes = require('./routes/lessonProgress.routes');
const quizProgressRoutes = require('./routes/quizProgress.routes');
const app = express();
app.use(cors());
app.use(express.json());


// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.send('KOLP Backend is running'));

app.use('/api/user', userRoutes);

app.use('/api/courses', courseRoutes);

app.use('/api/enrollments', enrollmentRoutes);

app.use('/api/quizzes', quizRoutes);

app.use('/api/certificates', certRoutes);

app.use('/api/dashboard', dashboardRoutes);

app.use('/api/payments', paymentRoutes);

app.use('/api/notifications', notificationRoutes);

app.use('/api/modules', moduleRoutes);

app.use('/api/lessons', lessonRoutes);

app.use('/api/lesson-progress', lessonProgressRoutes);
app.use('/api/quiz-progress', quizProgressRoutes);

app.use('/api/users', userRoutes);
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});