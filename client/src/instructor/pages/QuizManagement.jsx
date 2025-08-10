import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizManagement.css';

export default function QuizManagement() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' or 'results'
  const [editing, setEditing] = useState(true); // Always start in editing mode
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Question sets state
  const [questionSets, setQuestionSets] = useState([
    {
      id: 1,
      name: 'Question Set 1',
      questionsCount: 5,
      questions: []
    }
  ]);

  // Question set form state
  const [newSetName, setNewSetName] = useState('');
  const [newSetQuestionsCount, setNewSetQuestionsCount] = useState(5);
  
  // UI state for collapsible sections
  const [expandedSets, setExpandedSets] = useState(new Set()); // Start with no sets expanded

  useEffect(() => {
    fetchCourseAndQuiz();
  }, [courseId]);

  const fetchCourseAndQuiz = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch course details
      const courseRes = await axios.get(`http://localhost:8080/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourse(courseRes.data);

      // Fetch existing quiz if any
      try {
        const quizRes = await axios.get(`http://localhost:8080/api/quizzes/course/${courseId}/instructor`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuiz(quizRes.data);
          
        // Convert existing quiz sets to question sets format
        if (quizRes.data.quizSets && quizRes.data.quizSets.length > 0) {
          const convertedSets = quizRes.data.quizSets.map((quizSet, index) => ({
            id: quizSet._id || index + 1,
            name: quizSet.name,
            questionsCount: quizSet.questions.length,
            questions: quizSet.questions,
            isActive: quizSet.isActive
          }));
          setQuestionSets(convertedSets);
          // Don't auto expand sets when loading existing quiz
        }
      } catch (err) {
        // No quiz exists yet, that's okay
        console.log('No quiz found for this course');
      }

      // Fetch quiz results
      try {
        const resultsRes = await axios.get(`http://localhost:8080/api/quizzes/course/${courseId}/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubmissions(resultsRes.data.submissions || []);
      } catch (err) {
        console.log('No submissions found');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course and quiz data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestionSet = () => {
    if (!newSetName.trim()) {
      setError('Please enter a question set name');
      return;
    }
    if (newSetQuestionsCount < 1 || newSetQuestionsCount > 20) {
      setError('Question count must be between 1 and 20');
      return;
    }

    const newSetId = Date.now();
    const newSet = {
      id: newSetId,
      name: newSetName,
      questionsCount: newSetQuestionsCount,
      questions: []
    };

    setQuestionSets([...questionSets, newSet]);
    setExpandedSets(prev => new Set([...prev, newSetId])); // Auto expand new set
    setNewSetName('');
    setNewSetQuestionsCount(5);
    setError('');
  };

  const handleRemoveQuestionSet = (setId) => {
    if (questionSets.length > 1) {
      setQuestionSets(questionSets.filter(set => set.id !== setId));
      setExpandedSets(prev => {
        const newSet = new Set(prev);
        newSet.delete(setId);
        return newSet;
      });
    }
  };

  const handleGenerateQuestions = (setId) => {
    const currentSet = questionSets.find(set => set.id === setId);
    const hasQuestions = currentSet && currentSet.questions.length > 0;
    const isExpanded = expandedSets.has(setId);
    
    // If there are questions, handle show/hide
    if (hasQuestions) {
      // If hiding questions and there are unsaved changes, show alert
      if (isExpanded && hasUnsavedChanges) {
        setPendingAction(() => () => {
          setExpandedSets(prev => {
            const newSet = new Set(prev);
            newSet.delete(setId);
            return newSet;
          });
        });
        setShowSaveAlert(true);
      } else {
        // Show questions or hide without unsaved changes - no alert needed
        setExpandedSets(prev => {
          const newSet = new Set(prev);
          if (newSet.has(setId)) {
            newSet.delete(setId);
          } else {
            newSet.add(setId);
          }
          return newSet;
        });
      }
    } else {
      // Generate new questions - only show alert if there are unsaved changes
      if (hasUnsavedChanges) {
        setPendingAction(() => () => regenerateQuestions(setId));
        setShowSaveAlert(true);
      } else {
        regenerateQuestions(setId);
      }
    }
  };

  const handleSaveAndContinue = async () => {
    setShowSaveAlert(false);
    try {
      await handleSaveQuiz();
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } catch (err) {
      // Error handling is already in handleSaveQuiz
    }
  };

  const handleContinueWithoutSaving = () => {
    setShowSaveAlert(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleCancelAction = () => {
    setShowSaveAlert(false);
    setPendingAction(null);
  };

  const regenerateQuestions = (setId) => {
    const updatedSets = questionSets.map(set => {
      if (set.id === setId) {
        const generatedQuestions = [];
        for (let i = 0; i < set.questionsCount; i++) {
          generatedQuestions.push({
            text: `Question ${i + 1} for ${set.name}`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            answer: 'Option A'
          });
        }
        return { ...set, questions: generatedQuestions };
      }
      return set;
    });
    setQuestionSets(updatedSets);
    setHasUnsavedChanges(true);
    // Auto expand the set after generating questions
    setExpandedSets(prev => new Set([...prev, setId]));
  };

  const handleQuestionChange = (setId, questionIndex, field, value) => {
    const updatedSets = questionSets.map(set => {
      if (set.id === setId) {
        const updatedQuestions = [...set.questions];
        updatedQuestions[questionIndex][field] = value;
        return { ...set, questions: updatedQuestions };
      }
      return set;
    });
    setQuestionSets(updatedSets);
    setHasUnsavedChanges(true);
  };

  const handleOptionChange = (setId, questionIndex, optionIndex, value) => {
    const updatedSets = questionSets.map(set => {
      if (set.id === setId) {
        const updatedQuestions = [...set.questions];
        updatedQuestions[questionIndex].options[optionIndex] = value;
        return { ...set, questions: updatedQuestions };
      }
      return set;
    });
    setQuestionSets(updatedSets);
    setHasUnsavedChanges(true);
  };

  const handleQuestionCountChange = (setId, newCount) => {
    const updatedSets = questionSets.map(set => {
      if (set.id === setId) {
        const currentQuestions = set.questions || [];
        let newQuestions = [...currentQuestions];
        
        if (newCount > currentQuestions.length) {
          // Add more questions
          for (let i = currentQuestions.length; i < newCount; i++) {
            newQuestions.push({
              text: `Question ${i + 1} for ${set.name}`,
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              answer: 'Option A'
            });
          }
        } else if (newCount < currentQuestions.length) {
          // Remove questions from the end
          newQuestions = newQuestions.slice(0, newCount);
        }
        
        return { 
          ...set, 
          questionsCount: newCount,
          questions: newQuestions
        };
      }
      return set;
    });
    setQuestionSets(updatedSets);
    setHasUnsavedChanges(true);
  };

  const handleSaveQuiz = async () => {
    // Validate all question sets
    const allQuestions = questionSets.flatMap(set => set.questions);
    
    if (allQuestions.length === 0) {
      setError('Please generate questions for at least one question set');
      return;
    }

    if (allQuestions.some(q => !q.text || q.options.some(opt => !opt) || !q.answer)) {
      setError('Please fill in all questions, options, and select correct answers');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const token = localStorage.getItem('token');
      
      // Convert question sets to quiz sets format
      const quizSets = questionSets.map(set => ({
        name: set.name,
        questions: set.questions,
        isActive: set.isActive !== false
      }));
      
      if (quiz) {
        // Update existing quiz
        await axios.put(`http://localhost:8080/api/quizzes/${quiz.quizId || quiz._id}`, {
          quizSets: quizSets
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create new quiz
        await axios.post('http://localhost:8080/api/quizzes', {
          courseId,
          quizSets: quizSets
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setEditing(false);
      fetchCourseAndQuiz(); // Refresh data
      setHasUnsavedChanges(false); // Clear unsaved changes after saving
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    if (percentage >= 40) return '#fd7e14';
    return '#dc3545';
  };

  // Calculate total questions for stats
  const getTotalQuestions = () => {
    if (quiz) {
      if (quiz.quizSets && quiz.quizSets.length > 0) {
        return quiz.quizSets.reduce((total, set) => total + (set.questions?.length || 0), 0);
      } else if (quiz.questions && quiz.questions.length > 0) {
        return quiz.questions.length;
      }
    }
    return 1; // Default to prevent division by zero
  };

  const totalQuestionsForStats = getTotalQuestions();

  const stats = {
    totalSubmissions: submissions.length,
    averageScore: submissions.length > 0 
      ? (submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length).toFixed(1)
      : 0,
    highestScore: submissions.length > 0 ? Math.max(...submissions.map(s => s.score)) : 0,
    lowestScore: submissions.length > 0 ? Math.min(...submissions.map(s => s.score)) : 0,
    passedCount: submissions.filter(s => (s.score / totalQuestionsForStats) * 100 >= 60).length
  };

  const totalQuestions = questionSets.reduce((sum, set) => sum + set.questions.length, 0);

  if (loading) {
    return (
      <div className="instructor-layout">
        <main className="instructor-main">
          <div className="quiz-loading">
            <div className="loading-spinner"></div>
            <p>Loading quiz management...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="instructor-layout">
      <main className="instructor-main">
        <div className="quiz-management">
          <div className="quiz-header">
            <div className="header-content">
              <h1>Quiz Management 🧠</h1>
              <p>Manage quiz for: <strong>{course?.title}</strong></p>
            </div>
            <button 
              className="back-btn"
              onClick={() => navigate('/instructor/courses')}
            >
              ← Back to Courses
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="quiz-tabs">
            <button 
              className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveTab('quiz')}
            >
              📝 Quiz Editor
            </button>
            <button 
              className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
            >
              📊 Quiz Results ({submissions.length})
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Quiz Editor Tab */}
          {activeTab === 'quiz' && (
            <div className="quiz-editor">
              <div className="editor-header">
                <h2>Question Sets</h2>
                <div className="editor-actions">
                  <button 
                    className="save-btn"
                    onClick={handleSaveQuiz}
                    disabled={saving}
                  >
                    {saving ? '💾 Saving...' : hasUnsavedChanges ? '💾 Save Quiz*' : '💾 Save Quiz'}
                  </button>
                </div>
              </div>

              <div className="quiz-form">
                {/* Add New Question Set */}
                  <div className="add-set-section">
                    <h3>Add New Question Set</h3>
                    <div className="set-form">
                      <div className="form-group">
                        <label>Set Name:</label>
                        <input
                          type="text"
                          value={newSetName}
                          onChange={(e) => setNewSetName(e.target.value)}
                          placeholder="e.g., Basic Concepts, Advanced Topics"
                          className="set-name-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Number of Questions:</label>
                        <input
                          type="number"
                          value={newSetQuestionsCount}
                          onChange={(e) => setNewSetQuestionsCount(parseInt(e.target.value) || 5)}
                          min="1"
                          max="20"
                          className="set-count-input"
                        />
                      </div>
                      <button 
                        className="add-set-btn"
                        onClick={handleAddQuestionSet}
                      >
                        ➕ Add Question Set
                      </button>
                    </div>
                  </div>

                  {/* Question Sets */}
                  <div className="question-sets">
                    {questionSets.map((set, setIndex) => {
                      const isExpanded = expandedSets.has(set.id);
                      return (
                        <div key={set.id} className="question-set">
                          <div className="set-header">
                            <div className="set-header-left">
                              <button 
                                className="expand-btn"
                                onClick={() => {
                                  setExpandedSets(prev => {
                                    const newSet = new Set(prev);
                                    if (isExpanded) {
                                      newSet.delete(set.id);
                                    } else {
                                      newSet.add(set.id);
                                    }
                                    return newSet;
                                  });
                                }}
                              >
                                {isExpanded ? '▼' : '▶'} {set.name}
                              </button>
                              {set.questions.length > 0 && (
                                <span className="question-count">
                                  ({set.questions.length} questions)
                                </span>
                              )}
                              {isExpanded && (
                                <div className="question-count-control">
                                  <label>Questions:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={set.questionsCount}
                                    onChange={(e) => handleQuestionCountChange(set.id, parseInt(e.target.value) || 1)}
                                    className="question-count-input"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="set-actions">
                              <button 
                                className={`generate-btn ${set.questions.length > 0 ? 'regenerate' : ''}`}
                                onClick={() => handleGenerateQuestions(set.id)}
                              >
                                {set.questions.length === 0 
                                  ? `🎲 Generate ${set.questionsCount} Questions`
                                  : expandedSets.has(set.id) 
                                    ? `🔄 Hide Questions`
                                    : `🔄 Show Questions`
                                }
                              </button>
                              {questionSets.length > 1 && (
                                <button 
                                  className="remove-set-btn"
                                  onClick={() => handleRemoveQuestionSet(set.id)}
                                >
                                  🗑️ Remove Set
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {set.questions.length > 0 && (
                            <div className="set-questions">
                              <div className="questions-header">
                                <p className="set-info">
                                  {set.questions.length} questions in this set
                                </p>
                              </div>
                              
                              {isExpanded && (
                                <>
                                  {set.questions.map((question, questionIndex) => (
                                    <div key={questionIndex} className="question-form">
                                      <div className="question-header">
                                        <h4>Question {questionIndex + 1}</h4>
                                      </div>
                                      
                                      <div className="question-content">
                                        <label>Question Text:</label>
                                        <textarea
                                          value={question.text}
                                          onChange={(e) => handleQuestionChange(set.id, questionIndex, 'text', e.target.value)}
                                          placeholder="Enter your question here..."
                                          rows={3}
                                        />
                                        
                                        <label>Options:</label>
                                        {question.options.map((option, optionIndex) => (
                                          <div key={optionIndex} className="option-input">
                                            <input
                                              type="text"
                                              value={option}
                                              onChange={(e) => handleOptionChange(set.id, questionIndex, optionIndex, e.target.value)}
                                              placeholder={`Option ${optionIndex + 1}`}
                                            />
                                            <input
                                              type="radio"
                                              name={`correct-${set.id}-${questionIndex}`}
                                              checked={question.answer === option}
                                              onChange={() => handleQuestionChange(set.id, questionIndex, 'answer', option)}
                                            />
                                            <label>Correct Answer</label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
            </div>
          )}

          {/* Quiz Results Tab */}
          {activeTab === 'results' && (
            <div className="quiz-results">
              <div className="results-header">
                <h2>Student Quiz Results</h2>
                {quiz && (
                  <p>Total Questions: {
                    quiz.quizSets && quiz.quizSets.length > 0 
                      ? quiz.quizSets.reduce((total, set) => total + (set.questions?.length || 0), 0)
                      : quiz.questions?.length || 0
                  } | Passing Score: 60%</p>
                )}
              </div>

              {/* Statistics Cards */}
              <div className="stats-container">
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h3>{stats.totalSubmissions}</h3>
                    <p>Total Submissions</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <h3>{stats.averageScore}</h3>
                    <p>Average Score</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-content">
                    <h3>{stats.highestScore}</h3>
                    <p>Highest Score</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <h3>{stats.passedCount}</h3>
                    <p>Students Passed</p>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="results-section">
                {submissions.length === 0 ? (
                  <div className="no-results">
                    <div className="no-results-icon">📊</div>
                    <h3>No quiz submissions yet</h3>
                    <p>Students haven't taken the quiz yet.</p>
                  </div>
                ) : (
                  <div className="results-table-wrapper">
                    <table className="results-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Email</th>
                          <th>Score</th>
                          <th>Percentage</th>
                          <th>Status</th>
                          <th>Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((submission) => {
                          // Tính số câu hỏi của quiz set tương ứng với submission
                          let totalQuestions = 0;
                          let quizSet = null;
                          if (quiz && quiz.quizSets && quiz.quizSets.length > 0) {
                            // Tìm quiz set theo quizSetId (kiểu string)
                            quizSet = quiz.quizSets.find(set => {
                              // _id có thể là ObjectId hoặc string, nên so sánh string
                              return set._id?.toString() === submission.quizSetId;
                            });
                            totalQuestions = quizSet ? (quizSet.questions?.length || 0) : 0;
                          } else if (quiz && quiz.questions && quiz.questions.length > 0) {
                            // Old format: chỉ có 1 quiz set
                            totalQuestions = quiz.questions.length;
                          }
                          if (totalQuestions === 0) totalQuestions = 1; // tránh chia 0
                          const percentage = (submission.score / totalQuestions) * 100;
                          const passed = percentage >= 60;
                          return (
                            <tr key={submission._id}>
                              <td>
                                <div className="student-info">
                                  <div className="student-avatar">
                                    {submission.studentId?.name?.charAt(0).toUpperCase() || 'S'}
                                  </div>
                                  <span>{submission.studentId?.name || 'Unknown Student'}</span>
                                </div>
                              </td>
                              <td>{submission.studentId?.email || 'No email'}</td>
                              <td>
                                <span className="score-display">
                                  {submission.score}/{totalQuestions}
                                </span>
                              </td>
                              <td>
                                <div className="percentage-bar">
                                  <div 
                                    className="percentage-fill"
                                    style={{
                                      width: `${percentage}%`,
                                      backgroundColor: getScoreColor(submission.score, totalQuestions)
                                    }}
                                  ></div>
                                </div>
                                <span className="percentage-text">{percentage.toFixed(1)}%</span>
                              </td>
                              <td>
                                <span className={`status-badge ${passed ? 'passed' : 'failed'}`}>
                                  {passed ? '✅ Passed' : '❌ Failed'}
                                </span>
                              </td>
                              <td>{new Date(submission.createdAt).toLocaleDateString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Custom Save Alert Modal */}
      {showSaveAlert && (
        <div className="save-alert-overlay">
          <div className="save-alert-modal">
            <div className="alert-header">
              <div className="alert-icon">💾</div>
              <h3>Unsaved Changes</h3>
            </div>
            <div className="alert-content">
              <p>You have unsaved changes to your quiz. What would you like to do?</p>
            </div>
            <div className="alert-actions">
              <button 
                className="alert-btn primary"
                onClick={handleSaveAndContinue}
                disabled={saving}
              >
                {saving ? '💾 Saving...' : '💾 Save & Continue'}
              </button>
              <button 
                className="alert-btn secondary"
                onClick={handleContinueWithoutSaving}
                disabled={saving}
              >
                ⚠️ Continue Without Saving
              </button>
              <button 
                className="alert-btn cancel"
                onClick={handleCancelAction}
                disabled={saving}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}