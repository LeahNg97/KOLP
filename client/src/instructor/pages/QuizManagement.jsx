import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizManagement.css';
import { getCourseById } from '../api/courseApi';
import { getQuizByCourseId, getQuizResultsByCourseId, createQuiz, updateQuiz } from '../api/quizApi';

export default function QuizManagement() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' or 'results'
  const [editing, setEditing] = useState(true); // Always start in editing mode
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Quiz form state
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    instructions: '',
    passingScore: 70,
    timeLimit: null,
    questions: []
  });

  // Question form state
  const [newQuestionCount, setNewQuestionCount] = useState(5);
  
  // UI state for collapsible sections
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  useEffect(() => {
    fetchCourseAndQuiz();
  }, [courseId]);

  // Auto-refresh quiz data when quiz state changes
  useEffect(() => {
    if (quiz && quiz.data && quiz.data.length > 0) {
      console.log('🔄 Quiz state changed, ensuring data consistency...');
      console.log('🔄 Current quiz data length:', quiz.data.length);
      // Small delay to ensure backend has processed the changes
      const timer = setTimeout(() => {
        console.log('🔄 Executing auto-refresh...');
        refreshQuizData();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [quiz?.data?.length]);

  const fetchCourseAndQuiz = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      // Validate courseId exists and format
      if (!courseId) {
        setError('Course ID is missing from URL. Please navigate from the courses page.');
        setLoading(false);
        return;
      }
      
      if (courseId.length !== 24) {
        setError('Invalid course ID format');
        setLoading(false);
        return;
      }
      
      // Fetch course details
      try {
        const courseRes = await getCourseById(courseId);
        setCourse(courseRes);
      } catch (err) {
        console.error('Error fetching course:', err);
        if (err.response?.status === 401) {
          setError('Authentication failed. Please login again.');
        } else if (err.response?.status === 403) {
          setError('Access denied. You may not have permission to view this course.');
        } else if (err.response?.status === 404) {
          setError('Course not found. Please check the course ID.');
        } else {
          setError('Failed to load course data. Please check your connection and try again.');
        }
        setLoading(false);
        return;
      }

      // Fetch existing quiz if any
      try {
        console.log('🔍 Fetching quiz for courseId:', courseId);
        const quizRes = await getQuizByCourseId(token, courseId);
        console.log('📊 Quiz API response:', quizRes);
        console.log('📊 Quiz response type:', typeof quizRes);
        console.log('📊 Quiz response length:', Array.isArray(quizRes) ? quizRes.length : 'Not an array');
        
        if (quizRes && Array.isArray(quizRes) && quizRes.length > 0) {
          // Get the first quiz (assuming one quiz per course for now)
          const existingQuiz = quizRes[0];
          console.log('✅ Loading existing quiz:', existingQuiz);
          console.log('✅ Quiz ID:', existingQuiz._id);
          console.log('✅ Quiz title:', existingQuiz.title);
          console.log('✅ Quiz questions count:', existingQuiz.questions ? existingQuiz.questions.length : 0);
          console.log('✅ Quiz questions:', existingQuiz.questions);
          
          setQuiz({ data: quizRes }); // Keep the old structure for compatibility
          
          // Convert existing quiz to form format
          setQuizData({
            title: existingQuiz.title || '',
            description: existingQuiz.description || '',
            instructions: existingQuiz.instructions || '',
            passingScore: existingQuiz.passingScore || 70,
            timeLimit: existingQuiz.timeLimit || null,
            questions: existingQuiz.questions || []
          });
          
          // Auto expand questions if they exist
          if (existingQuiz.questions && existingQuiz.questions.length > 0) {
            setExpandedQuestions(new Set(existingQuiz.questions.map((_, index) => index)));
          }
        } else {
          console.log('❌ No existing quiz found for this course');
          console.log('❌ Quiz response was:', quizRes);
          // No quiz exists yet, reset to empty state
          setQuiz(null);
          setQuizData({
            title: '',
            description: '',
            instructions: '',
            passingScore: 70,
            timeLimit: null,
            questions: []
          });
        }
      } catch (err) {
        // No quiz exists yet, that's okay
        console.log('❌ Error fetching quiz:', err.message);
        console.log('❌ Error details:', err);
        setQuiz(null);
        setQuizData({
          title: '',
          description: '',
          instructions: '',
          passingScore: 70,
          timeLimit: null,
            questions: []
        });
      }

      // Fetch quiz results
      try {
        const resultsRes = await getQuizResultsByCourseId(token, courseId);
        setSubmissions(resultsRes.submissions || []);
      } catch (err) {
        console.log('No submissions found:', err.message);
      }

    } catch (err) {
      console.error('Unexpected error in fetchCourseAndQuiz:', err);
      setError(err.response?.data?.message || 'Failed to load course and quiz data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh only quiz data (without loading state)
  const refreshQuizData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch existing quiz if any
      const quizRes = await getQuizByCourseId(token, courseId);
      console.log('🔄 Refreshing quiz data:', quizRes);
      
      if (quizRes && Array.isArray(quizRes) && quizRes.length > 0) {
        const existingQuiz = quizRes[0];
        console.log('✅ Refreshed quiz data:', existingQuiz);
        
        // Validate and clean quiz data before setting
        const validatedQuiz = {
          ...existingQuiz,
          questions: existingQuiz.questions?.filter(q => q && q.question && q.question.trim()) || []
        };
        
        console.log('🧹 Validated quiz data:', validatedQuiz);
        
        setQuiz({ data: [validatedQuiz] });
        
        // Update quizData with fresh data from server
        setQuizData({
          title: validatedQuiz.title || '',
          description: validatedQuiz.description || '',
          instructions: validatedQuiz.instructions || '',
          passingScore: validatedQuiz.passingScore || 70,
          timeLimit: validatedQuiz.timeLimit || null,
          questions: validatedQuiz.questions || []
        });
        
        // Auto expand questions if they exist
        if (validatedQuiz.questions && validatedQuiz.questions.length > 0) {
          setExpandedQuestions(new Set(validatedQuiz.questions.map((_, index) => index)));
        }
        
        // Clear any error messages
        setError('');
      } else {
        console.log('❌ No quiz found after refresh');
        setQuiz(null);
        setQuizData({
          title: '',
          description: '',
          instructions: '',
          passingScore: 70,
          timeLimit: null,
          questions: []
        });
      }
    } catch (err) {
      console.error('Error refreshing quiz data:', err);
      setError('Failed to refresh quiz data. Please try again.');
    }
  };

  const handleQuizDataChange = (field, value) => {
    setQuizData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleGenerateQuestions = () => {
    if (newQuestionCount < 1 || newQuestionCount > 20) {
      setError('Question count must be between 1 and 20');
      return;
    }

    // If there are unsaved changes, show alert
    if (hasUnsavedChanges) {
      setPendingAction(() => () => regenerateQuestions());
      setShowSaveAlert(true);
    } else {
      regenerateQuestions();
    }
  };

  const regenerateQuestions = () => {
    const generatedQuestions = [];
    for (let i = 0; i < newQuestionCount; i++) {
      generatedQuestions.push({
        question: `Question ${i + 1}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: 0,
        explanation: '',
        points: 1
      });
    }
    
    // Clean up any existing questions and replace with new ones
    setQuizData(prev => ({ 
      ...prev, 
      questions: generatedQuestions,
      title: prev.title || 'New Quiz',
      description: prev.description || 'Quiz description',
      instructions: prev.instructions || 'Quiz instructions'
    }));
    setHasUnsavedChanges(true);
    
    // Auto expand all questions
    setExpandedQuestions(new Set(generatedQuestions.map((_, index) => index)));
    
    // Show success message
    setError('');
    setSuccessMessage(`✅ Generated ${newQuestionCount} questions. Don't forget to save!`);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
    
    console.log(`Generated ${newQuestionCount} questions. Don't forget to save!`);
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[questionIndex][field] = value;
    
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
    setHasUnsavedChanges(true);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
    setHasUnsavedChanges(true);
  };

  const handleQuestionCountChange = (newCount) => {
    if (newCount < 1 || newCount > 20) return;
    
    setNewQuestionCount(newCount);
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

  const handleSaveQuiz = async () => {
    // Validate quiz data
    if (!quizData.title.trim()) {
      setError('Please enter a quiz title');
      return;
    }

    if (quizData.questions.length === 0) {
      setError('Please generate questions for the quiz');
      return;
    }

    // Filter out empty questions and validate
    const validQuestions = quizData.questions.filter(q => q && q.question && q.question.trim());
    if (validQuestions.length === 0) {
      setError('Please generate and fill in questions for the quiz');
      return;
    }

    // Validate each question has valid options and correct answer
    for (let i = 0; i < validQuestions.length; i++) {
      const question = validQuestions[i];
      if (!question.options || question.options.length < 2) {
        setError(`Question ${i + 1} must have at least 2 options`);
        return;
      }
      
      const validOptions = question.options.filter(opt => opt && opt.trim());
      if (validOptions.length < 2) {
        setError(`Question ${i + 1} must have at least 2 valid options`);
        return;
      }
      
      if (question.correctIndex < 0 || question.correctIndex >= validOptions.length) {
        setError(`Question ${i + 1} has invalid correct answer selection`);
        return;
      }
    }

    // Update quizData with only valid questions
    const cleanedQuizData = {
      ...quizData,
      questions: validQuestions
    };
    
    console.log('🧹 Cleaned quiz data for saving:', cleanedQuizData);

    try {
      setSaving(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (quiz && quiz.data && quiz.data.length > 0) {
        // Update existing quiz
        const existingQuiz = quiz.data[0];
        console.log('🔄 Updating existing quiz with ID:', existingQuiz._id);
        console.log('🔄 Update data:', cleanedQuizData);
        const updateResponse = await updateQuiz(token, existingQuiz._id, cleanedQuizData);
        console.log('✅ Update response:', updateResponse);
        
        // Refresh quiz data from server to ensure consistency
        await refreshQuizData();
      } else {
        // Create new quiz
        console.log('🆕 Creating new quiz with data:', { ...cleanedQuizData, courseId });
        const newQuizResponse = await createQuiz(token, {
          ...cleanedQuizData,
          courseId
        });
        console.log('🆕 Create response:', newQuizResponse);
        
        // Get the actual quiz ID from the response
        // Backend returns: { success: true, data: quiz }
        const newQuiz = newQuizResponse.data || newQuizResponse;
        const newQuizId = newQuiz._id || newQuiz.id;
        console.log('🆕 New quiz ID:', newQuizId);
        console.log('🆕 New quiz data:', newQuiz);
        
        // Update local quiz state with the real ID
        const newQuizData = {
          _id: newQuizId,
          ...quizData,
          courseId
        };
        setQuiz({
          data: [newQuizData]
        });
        
        // Also update quizData to ensure consistency
        setQuizData(prev => ({
          ...prev,
          _id: newQuizId
        }));
        
        // Refresh quiz data from server to ensure consistency
        await refreshQuizData();
      }

      // Clear unsaved changes after saving
      setHasUnsavedChanges(false);
      
      // Show success message
      setError('');
      setSuccessMessage('✅ Quiz saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      // Force refresh to ensure data consistency
      setTimeout(() => {
        refreshQuizData();
      }, 1000);
      
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
    return quizData.questions.filter(q => q && q.question && q.question.trim()).length || 1; // Prevent division by zero
  };

  const totalQuestionsForStats = getTotalQuestions();

  const stats = {
    totalSubmissions: submissions.length,
    averageScore: submissions.length > 0 
      ? (submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length).toFixed(1)
      : 0,
    highestScore: submissions.length > 0 ? Math.max(...submissions.map(s => s.score || 0)) : 0,
    lowestScore: submissions.length > 0 ? Math.min(...submissions.map(s => s.score || 0)) : 0,
    passedCount: submissions.filter(s => ((s.score || 0) / totalQuestionsForStats) * 100 >= quizData.passingScore).length
  };

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
          
          {/* Success Message */}
          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}

          {/* Quiz Editor Tab */}
          {activeTab === 'quiz' && (
            <div className="quiz-editor">
              <div className="editor-header">
                <h2>Quiz Settings</h2>
                <div className="editor-actions">
                  {quiz && quiz.data && quiz.data.length > 0 ? (
                    <div className="quiz-status">
                      📝 Quiz ID: {quiz.data[0]._id} | Questions: {quizData.questions.filter(q => q && q.question && q.question.trim()).length}
                    </div>
                  ) : (
                    <div className="quiz-status">
                      📝 No quiz created yet | Form Questions: {quizData.questions.filter(q => q && q.question && q.question.trim()).length}
                    </div>
                  )}
                  {hasUnsavedChanges && (
                    <div className="save-reminder">
                      ⚠️ You have unsaved changes!
                    </div>
                  )}
                  <button 
                    className="save-btn"
                    onClick={handleSaveQuiz}
                    disabled={saving}
                  >
                    {saving ? '💾 Saving...' : hasUnsavedChanges ? '💾 Save Quiz*' : '💾 Save Quiz'}
                  </button>
                  <button 
                    className="test-btn"
                    onClick={() => {
                      console.log('🧪 Current quiz state:', quiz);
                      console.log('🧪 Current quizData:', quizData);
                      console.log('🧪 Has unsaved changes:', hasUnsavedChanges);
                    }}
                    title="Test current state"
                  >
                    🧪 Test
                  </button>
                  <button 
                    className="refresh-btn"
                    onClick={refreshQuizData}
                    title="Refresh quiz data from server"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              <div className="quiz-form">
                {/* Quiz Basic Settings */}
                <div className="quiz-settings-section">
                  <h3>Basic Settings</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Quiz Title:</label>
                      <input
                        type="text"
                        value={quizData.title}
                        onChange={(e) => handleQuizDataChange('title', e.target.value)}
                        placeholder="Enter quiz title..."
                        className="quiz-title-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Description:</label>
                      <textarea
                        value={quizData.description}
                        onChange={(e) => handleQuizDataChange('description', e.target.value)}
                        placeholder="Enter quiz description..."
                        rows={2}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Instructions:</label>
                      <textarea
                        value={quizData.instructions}
                        onChange={(e) => handleQuizDataChange('instructions', e.target.value)}
                        placeholder="Enter instructions for students..."
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Passing Score (%):</label>
                      <input
                        type="number"
                        value={quizData.passingScore}
                        onChange={(e) => handleQuizDataChange('passingScore', parseInt(e.target.value) || 70)}
                        min="0"
                        max="100"
                        className="passing-score-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Time Limit (minutes):</label>
                      <input
                        type="number"
                        value={quizData.timeLimit || ''}
                        onChange={(e) => handleQuizDataChange('timeLimit', e.target.value ? parseInt(e.target.value) : null)}
                        min="1"
                        placeholder="No limit"
                        className="time-limit-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Questions Section */}
                <div className="questions-section">
                  <div className="questions-header">
                    <h3>Questions</h3>
                    <div className="questions-controls">
                      <div className="question-count-control">
                        <label>Number of Questions:</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={newQuestionCount}
                          onChange={(e) => handleQuestionCountChange(parseInt(e.target.value) || 5)}
                          className="question-count-input"
                        />
                      </div>
                      <button 
                        className="generate-btn"
                        onClick={handleGenerateQuestions}
                      >
                        🎲 Generate Questions
                      </button>
                    </div>
                    {hasUnsavedChanges && (
                      <div className="generate-notice">
                        📝 Questions generated! Click "💾 Save Quiz" above to save your changes.
                      </div>
                    )}
                  </div>

                  {quizData.questions.filter(q => q && q.question && q.question.trim()).length > 0 && (
                    <div className="questions-list">
                      <p className="questions-info">
                        {quizData.questions.filter(q => q && q.question && q.question.trim()).length} questions in this quiz
                        {hasUnsavedChanges && (
                          <span className="unsaved-notice"> ⚠️ Unsaved changes - Click "Save Quiz" to save!</span>
                        )}
                      </p>
                      
                      {quizData.questions.filter(q => q && q.question && q.question.trim()).map((question, questionIndex) => {
                        const isExpanded = expandedQuestions.has(questionIndex);
                        return (
                          <div key={questionIndex} className="question-form">
                           <div className="question-header">
                             <button 
                               className="expand-btn"
                               onClick={() => {
                                 setExpandedQuestions(prev => {
                                   const newSet = new Set(prev);
                                   if (isExpanded) {
                                     newSet.delete(questionIndex);
                                   } else {
                                     newSet.add(questionIndex);
                                   }
                                   return newSet;
                                 });
                               }}
                             >
                               {isExpanded ? '▼' : '▶'} Question {questionIndex + 1}
                             </button>
                           </div>
                           
                           {isExpanded && (
                             <div className="question-content">
                               <div className="form-group">
                                 <label>Question Text:</label>
                                 <textarea
                                   value={question.question || ''}
                                   onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                                   placeholder="Enter your question here..."
                                   rows={3}
                                 />
                               </div>
                               
                               <div className="form-group">
                                 <label>Options:</label>
                                 {question.options.filter(opt => opt).map((option, optionIndex) => (
                                   <div key={optionIndex} className="option-input">
                                     <input
                                       type="text"
                                       value={option || ''}
                                       onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                                       placeholder={`Option ${optionIndex + 1}`}
                                     />
                                     <input
                                       type="radio"
                                       name={`correct-${questionIndex}`}
                                       checked={question.correctIndex === optionIndex}
                                       onChange={() => handleQuestionChange(questionIndex, 'correctIndex', optionIndex)}
                                     />
                                     <label>Correct Answer</label>
                                   </div>
                                 ))}
                               </div>

                               <div className="form-row">
                                 <div className="form-group">
                                   <label>Explanation:</label>
                                   <textarea
                                     value={question.explanation || ''}
                                     onChange={(e) => handleQuestionChange(questionIndex, 'explanation', e.target.value)}
                                     placeholder="Explain why this is the correct answer..."
                                     rows={2}
                                   />
                                 </div>
                                 <div className="form-group">
                                   <label>Points:</label>
                                   <input
                                     type="number"
                                     value={question.points || 1}
                                     onChange={(e) => handleQuestionChange(questionIndex, 'points', parseInt(e.target.value) || 1)}
                                     min="1"
                                     max="10"
                                     className="points-input"
                                   />
                                 </div>
                               </div>
                             </div>
                           )}
                         </div>
                       );
                     })}
                   </div>
                 )}
               </div>
             </div>
           </div>
         )}

         {/* Quiz Results Tab */}
         {activeTab === 'results' && (
           <div className="quiz-results">
             <div className="results-header">
               <h2>Student Quiz Results</h2>
               {quizData.questions.filter(q => q && q.question && q.question.trim()).length > 0 && (
                 <p>Total Questions: {quizData.questions.filter(q => q && q.question && q.question.trim()).length} | Passing Score: {quizData.passingScore}%</p>
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
                         const totalQuestions = quizData.questions.filter(q => q).length || 1;
                         const score = submission.score || 0;
                         const percentage = (score / totalQuestions) * 100;
                         const passed = percentage >= quizData.passingScore;
                        return (
                          <tr key={submission._id || Math.random()}>
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
                                {score}/{totalQuestions}
                              </span>
                            </td>
                            <td>
                              <div className="percentage-bar">
                                <div 
                                  className="percentage-fill"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: getScoreColor(score, totalQuestions)
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
                            <td>{new Date(submission.createdAt || Date.now()).toLocaleDateString()}</td>
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