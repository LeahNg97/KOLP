const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: String,
  options: [String],
  answer: String
});

const quizSetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  questions: [questionSchema],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const quizSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  quizSets: [quizSetSchema]
}, { timestamps: true });

module.exports = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);
